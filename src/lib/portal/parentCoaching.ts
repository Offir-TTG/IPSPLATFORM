import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';
import { getPackage } from '@/lib/family/coachingPackages';
import { intakeStatusFor } from '@/lib/family/intake';
import { money } from './membership';

/**
 * The client's own coaching (parent coaching: a coaching package with no
 * child), shaped for the portal (Hebrew only). A package shows once the
 * client has finished enrolling; before that it is under "to complete".
 * Approved portal mockup "4 · ליווי הורי".
 */

const TZ = 'Asia/Jerusalem';
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('he-IL', { timeZone: TZ, ...o }).format(new Date(iso));
const dayDate = (iso: string) => `${fmt(iso, { weekday: 'short' })} ${fmt(iso, { day: 'numeric', month: 'numeric' })}`;

export type ParentCoachingView = {
  id: string;
  title: string;
  coach: { name: string; avatarUrl: string | null; bio: string | null } | null;
  used: number;
  total: number;
  pricePerSession: string;
  chargedTotal: string;
  free: boolean;
  card: string | null;
  intakeStatus: 'missing' | 'submitted' | 'locked' | 'not_needed';
  contractSigned: boolean;
  hasContract: boolean;
  sessions: { id: string; number: number; date: string; status: string }[];
  payments: { id: string; label: string; amount: string; state: 'paid' | 'failed' | 'processing' | 'gift' }[];
  offer: { id: string; sessions: number; price: string; message: string | null; from: number; to: number } | null;
  ended: boolean;
};

const plain = (html: string | null | undefined) => (html ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || null : null);

export async function loadParentCoaching(userId: string): Promise<ParentCoachingView[]> {
  const db = createAdminClient();
  const { data: user } = await db.from('users').select('tenant_id').eq('id', userId).maybeSingle();
  if (!user?.tenant_id) return [];
  const { data: rows } = await db
    .from('enrollments')
    .select('id, tenant_id, product_id, status, child_id, payment_metadata, product:products!enrollments_product_id_fkey(type)')
    .eq('user_id', userId)
    .is('child_id', null)
    .in('status', ['active', 'suspended', 'completed'])
    .order('created_at', { ascending: false });
  const mine = (rows ?? []).filter((e: any) => {
    const p = Array.isArray(e.product) ? e.product[0] : e.product;
    return p?.type === 'session_pack' && !e.payment_metadata?.pending_child;
  });

  const out: ParentCoachingView[] = [];
  for (const e of mine) {
    const pack: any = await getPackage(user.tenant_id, e.id);
    if (!pack.ok) continue;
    const [coach, intakeStatus] = await Promise.all([
      pack.coach_id ? db.from('users').select('first_name, last_name, avatar_url, bio').eq('id', pack.coach_id).maybeSingle() : Promise.resolve({ data: null }),
      intakeStatusFor({ id: e.id, tenant_id: e.tenant_id, product_id: e.product_id }),
    ]);
    const c: any = coach.data;
    const m = (n: number) => money(n, pack.currency);
    const held = [...(pack.sessions ?? [])].reverse();
    out.push({
      id: e.id,
      title: pack.product_title,
      coach: c ? { name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(), avatarUrl: c.avatar_url ?? null, bio: plain(c.bio) } : null,
      used: pack.sessions_used,
      total: pack.sessions_total,
      pricePerSession: m(pack.price_per_session),
      chargedTotal: m(pack.charged_total),
      free: pack.free,
      card: pack.card ? `${pack.card.brand ? pack.card.brand[0].toUpperCase() + pack.card.brand.slice(1) : ''} ••${pack.card.last4 ?? ''}`.trim() : null,
      intakeStatus: intakeStatus as ParentCoachingView['intakeStatus'],
      contractSigned: pack.signed,
      hasContract: pack.has_contract,
      sessions: held.map((s: any) => ({ id: s.id, number: s.number, date: dayDate(s.held_at), status: s.status })),
      payments: held
        .filter((s: any) => s.charge || s.status === 'done')
        .map((s: any) => ({
          id: s.id,
          label: `מפגש ${s.number} · ${fmt(s.held_at, { day: 'numeric', month: 'numeric' })}`,
          amount: s.charge ? m(s.charge.amount) : '',
          state: !s.charge ? 'gift' : s.charge.status === 'paid' ? 'paid' : ['failed', 'overdue'].includes(s.charge.status) ? 'failed' : 'processing',
        })),
      offer: pack.pending_offer
        ? {
            id: pack.pending_offer.id,
            sessions: pack.pending_offer.sessions,
            price: m(pack.pending_offer.session_amount),
            message: pack.pending_offer.message,
            from: pack.sessions_total,
            to: pack.sessions_total + pack.pending_offer.sessions,
          }
        : null,
      ended: e.status === 'completed',
    });
  }
  return out;
}
