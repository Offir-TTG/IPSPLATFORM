/**
 * Messages from the team (Communications > Messages): the bell is the
 * notification itself; the email copy goes by the client's settings, like
 * every other message: only if they left that kind on, after their quiet
 * hours, or in their daily summary. Each recipient gets a row in the send
 * log, linked to the email in the queue so it shows once.
 *
 * Server only. Never throws.
 */

import { createAdminClient } from '@/lib/supabase/server';
import { isClientCategory, type MessageCategory } from './categories';
import { logExternalSend } from './deliver';
import { planTriggerEmail } from './triggerEmails';

export type TeamEmailDecision =
  | { kind: 'send'; at: Date | null }
  | { kind: 'digest' }
  | { kind: 'none'; reason: string };

/** The notification's kind → the client's settings group. */
export function messageCategory(category: string | null | undefined): MessageCategory {
  return isClientCategory(category) ? category : 'announcement';
}

/** What the client's settings say about emailing this message. */
export async function decideTeamEmail(tenantId: string, userId: string, category: string | null | undefined): Promise<TeamEmailDecision> {
  const plan = await planTriggerEmail({ tenantId, userId, category: messageCategory(category), at: null, timeSensitiveUntil: null });
  return plan;
}

/** Logs the outcome for one recipient and links the queued email to it. */
export async function logTeamMessage(args: {
  tenantId: string;
  userId: string;
  toEmail: string | null;
  notificationId: string | null;
  category: string | null | undefined;
  title: string;
  body: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
  decision: TeamEmailDecision;
  /** For an email that was sent or queued: its queue id or Resend id, and whether it worked. */
  email?: { queueId?: string | null; providerId?: string | null; ok: boolean; error?: string | null };
}): Promise<void> {
  try {
    const db = createAdminClient();
    const category = messageCategory(args.category);
    const d = args.decision;

    if (d.kind === 'digest') {
      const logId = await logExternalSend(
        { tenantId: args.tenantId, userId: args.userId, toEmail: args.toEmail, source: 'manual', category, title: args.title, outcome: 'in_digest', reason: 'digest', notificationId: args.notificationId },
        db,
      );
      await db.from('digest_items').insert({
        tenant_id: args.tenantId,
        user_id: args.userId,
        category,
        title: args.title,
        body: args.body,
        action_url: args.actionUrl ?? null,
        action_label: args.actionLabel ?? null,
        message_log_id: logId,
      });
      return;
    }
    if (d.kind === 'none') {
      await logExternalSend(
        { tenantId: args.tenantId, userId: args.userId, toEmail: args.toEmail, source: 'manual', category, title: args.title, outcome: 'bell_only', reason: d.reason, notificationId: args.notificationId },
        db,
      );
      return;
    }

    // Find the queue row of the email that was sent or queued.
    let queueId = args.email?.queueId ?? null;
    if (!queueId && args.email?.providerId) {
      const { data } = await db.from('email_queue').select('id').eq('smtp_message_id', args.email.providerId).maybeSingle();
      queueId = data?.id ?? null;
    }
    const waiting = !!d.at && d.at.getTime() > Date.now() + 60_000;
    const logId = await logExternalSend(
      {
        tenantId: args.tenantId,
        userId: args.userId,
        toEmail: args.toEmail,
        source: 'manual',
        category,
        title: args.title,
        outcome: !args.email?.ok ? 'email_failed' : waiting ? 'waiting' : 'email_and_bell',
        reason: !args.email?.ok ? 'send_error' : waiting ? 'quiet_hours' : null,
        notificationId: args.notificationId,
        emailQueueId: queueId,
        sendAt: waiting ? d.at : null,
      },
      db,
    );
    if (logId && queueId) await db.from('email_queue').update({ message_log_id: logId }).eq('id', queueId);
  } catch (error) {
    console.error('[messaging] logTeamMessage failed', error);
  }
}
