/**
 * Team alerts: things someone in the school needs to deal with (a refund, a
 * client disputing a charge, a contract signed or declined). They go to
 * every admin of the school, by role, so a new admin gets them without any
 * setup. Email right away, plus the bell.
 *
 * Server only. Never throws.
 */

import { createAdminClient } from '@/lib/supabase/server';
import { filterEligibleRecipientIds } from '@/lib/users/communication-eligible';
import { deliverMessage } from './deliver';
import { chaserForEvent } from './store';

export const ADMIN_ROLES = ['admin', 'super_admin'] as const;

export type TeamAlertKind = 'refund' | 'dispute' | 'contract_signed' | 'contract_declined' | 'reminder_copy' | 'enrollment_cancelled_by_client';

export interface TeamAlert {
  tenantId: string;
  kind: TeamAlertKind;
  /** Words in both languages; each admin gets their own. */
  he: { title: string; body: string; actionLabel?: string };
  en: { title: string; body: string; actionLabel?: string };
  /** Admin path, e.g. "/admin/payments/disputes". */
  actionUrl?: string | null;
  urgent?: boolean;
  metadata?: Record<string, unknown>;
  /** The reminder row on the screen that controls it (on/off, email). */
  eventKey?: 'team.payment' | 'team.contract';
  /**
   * Only these admins (e.g. whoever created the enrollment). When none of
   * them is still an active admin, every admin gets it, as usual.
   */
  onlyAdminIds?: string[];
}

/** Every active admin of the school, with their language. */
export async function schoolAdmins(tenantId: string): Promise<{ id: string; lang: 'he' | 'en' }[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from('users')
    .select('id, preferred_language')
    .eq('tenant_id', tenantId)
    .in('role', ADMIN_ROLES as unknown as string[]);
  if (error) {
    console.error('[team alerts] admin lookup failed', error.message);
    return [];
  }
  const rows = (data ?? []) as { id: string; preferred_language: string | null }[];
  const eligible = new Set(await filterEligibleRecipientIds(db as any, rows.map((u) => u.id)));
  return rows.filter((u) => eligible.has(u.id)).map((u) => ({ id: u.id, lang: u.preferred_language === 'en' ? 'en' : 'he' }));
}

/** Sends the alert to every admin. Returns how many admins it reached. */
export async function notifyTeam(alert: TeamAlert): Promise<number> {
  try {
    const db = createAdminClient();
    let email = true;
    if (alert.eventKey) {
      const row = await chaserForEvent(db, alert.tenantId, alert.eventKey);
      if (row !== 'missing' && row) {
        if (row.status !== 'active') return 0;
        email = row.steps[0]?.send_email ?? true;
      }
    }
    const everyAdmin = await schoolAdmins(alert.tenantId);
    const chosen = alert.onlyAdminIds?.length ? everyAdmin.filter((a) => alert.onlyAdminIds!.includes(a.id)) : [];
    const admins = chosen.length ? chosen : everyAdmin;
    let reached = 0;
    for (const { id: userId, lang } of admins) {
      const words = alert[lang];
      const r = await deliverMessage(
        {
          tenantId: alert.tenantId,
          userId,
          source: 'team_alert',
          category: 'system',
          always: true,
          email,
          title: words.title,
          body: words.body,
          actionUrl: alert.actionUrl ?? null,
          actionLabel: words.actionLabel ?? null,
          priority: alert.urgent ? 'urgent' : 'high',
          metadata: { ...(alert.metadata ?? {}), kind: `team_${alert.kind}` },
        },
        db,
      );
      if (r.notificationId || r.emailQueueId) reached++;
    }
    return reached;
  } catch (error) {
    console.error('[team alerts] notifyTeam failed', error);
    return 0;
  }
}
