import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';
import { enrollmentsWithMoney } from './openEnrollment';

export type EnrollmentToComplete = {
  id: string;
  title: string;
  /** The enrollment link (/enroll/<token>), with a fresh expiry. */
  url: string;
  /** Nothing paid in it, so the client may cancel it ("ביטול ההרשמה"). */
  canCancel: boolean;
};

/**
 * Enrollments the team opened for this client that they haven't finished
 * (draft: link not sent; pending: sent, not completed). The portal shows them
 * so the client can finish without the email. An expired link is renewed for
 * 7 days. Coaching packages are included (parent coaching has no child
 * page); a child's package names the child.
 */
export async function loadEnrollmentsToComplete(userId: string): Promise<EnrollmentToComplete[]> {
  const db = createAdminClient();
  const { data: rows } = await db
    .from('enrollments')
    .select('id, status, is_parent, enrollment_token, token_expires_at, created_at, child_id, payment_metadata, product:products!enrollments_product_id_fkey(title, type)')
    .eq('user_id', userId)
    .in('status', ['draft', 'pending'])
    .order('created_at', { ascending: false });

  const childIds = [...new Set((rows ?? []).map((e: any) => e.child_id).filter(Boolean))] as string[];
  const { data: children } = childIds.length ? await db.from('children').select('id, first_name').in('id', childIds) : { data: [] as any[] };
  const childName = (e: any) => (children ?? []).find((c: any) => c.id === e.child_id)?.first_name ?? e.payment_metadata?.pending_child?.first_name ?? null;

  const paid = await enrollmentsWithMoney(db, (rows ?? []).map((e: any) => e.id));

  const out: EnrollmentToComplete[] = [];
  for (const e of rows ?? []) {
    const product: any = Array.isArray(e.product) ? e.product[0] : e.product;
    if (!product || !e.enrollment_token) continue;

    const expires = e.token_expires_at ? new Date(e.token_expires_at) : null;
    if (!expires || expires < new Date()) {
      const fresh = new Date();
      fresh.setDate(fresh.getDate() + 7);
      await db.from('enrollments').update({ token_expires_at: fresh.toISOString() }).eq('id', e.id);
    }
    const child = product.type === 'session_pack' ? childName(e) : null;
    out.push({ id: e.id, title: child ? `${product.title ?? ''} · ${child}` : product.title ?? '', url: `/enroll/${e.enrollment_token}`, canCancel: !paid.has(e.id) });
  }
  return out;
}
