/**
 * A contract's signature status, and the team alert when a client signs or
 * declines. Three paths learn the status (DocuSign's webhook, and the two
 * checks the enrollment page runs); the status changes in one conditional
 * update, so only the path that changed it tells the team, once.
 *
 * Server only. Never throws.
 */

import { createAdminClient } from '@/lib/supabase/server';
import { notifyTeam } from './teamAlerts';

type Db = ReturnType<typeof createAdminClient>;

/**
 * Sets the enrollment's signature status if it isn't already that. Returns
 * true when this call changed it. Signed or declined tells every admin.
 */
export async function setSignatureStatus(
  db: Db,
  enrollmentId: string,
  status: string,
  details: { declinedReason?: string | null } = {},
): Promise<boolean> {
  try {
    const { data, error } = await db
      .from('enrollments')
      .update({ signature_status: status, updated_at: new Date().toISOString() })
      .eq('id', enrollmentId)
      .or(`signature_status.is.null,signature_status.neq.${status}`)
      .select('id, tenant_id, user_id, product_id');
    if (error) {
      console.error('[contract] signature status update failed', error.message);
      return false;
    }
    const row = data?.[0];
    if (!row) return false;
    if (status === 'completed' || status === 'declined') {
      await alertTeam(db, row, status, details.declinedReason ?? null);
    }
    return true;
  } catch (error) {
    console.error('[contract] setSignatureStatus failed', error);
    return false;
  }
}

async function alertTeam(
  db: Db,
  e: { id: string; tenant_id: string; user_id: string | null; product_id: string | null },
  status: 'completed' | 'declined',
  reason: string | null,
) {
  const [{ data: u }, { data: p }] = await Promise.all([
    e.user_id ? db.from('users').select('first_name, last_name, email').eq('id', e.user_id).maybeSingle() : Promise.resolve({ data: null }),
    e.product_id ? db.from('products').select('title').eq('id', e.product_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const who = `${u?.first_name ?? ''} ${u?.last_name ?? ''}`.trim() || u?.email || '';
  const what = p?.title ?? '';
  const signed = status === 'completed';
  await notifyTeam({
    tenantId: e.tenant_id,
    kind: signed ? 'contract_signed' : 'contract_declined',
    eventKey: 'team.contract',
    actionUrl: `/admin/enrollments?enrollment=${e.id}`,
    he: {
      title: signed ? `החוזה${who ? ` של ${who}` : ''} נחתם` : `החוזה${who ? ` של ${who}` : ''} נדחה`,
      body: [
        what ? `ההרשמה: ${what}.` : '',
        signed ? 'אפשר להמשיך בהרשמה.' : reason ? `הסיבה שנכתבה: ${reason}` : 'לא נכתבה סיבה.',
      ]
        .filter(Boolean)
        .join('\n\n'),
      actionLabel: 'להרשמה',
    },
    en: {
      title: signed ? `${who || 'A client'} signed the contract` : `${who || 'A client'} declined the contract`,
      body: [
        what ? `Enrollment: ${what}.` : '',
        signed ? 'The enrollment can go ahead.' : reason ? `Reason given: ${reason}` : 'No reason given.',
      ]
        .filter(Boolean)
        .join('\n\n'),
      actionLabel: 'Open enrollment',
    },
    metadata: { enrollment_id: e.id },
  });
}
