/**
 * The old email triggers (Settings → Emails → Triggers) under the client's
 * settings, until they move into automatic reminders: email only if the
 * client left that kind on, after their quiet hours, or in their daily
 * summary; a lesson reminder is never emailed after the lesson starts. Each
 * one is written to the send log.
 *
 * Server only. Never throws.
 */

import Handlebars from 'handlebars';
import { createAdminClient } from '@/lib/supabase/server';
import { ensureHandlebarsHelpers } from '@/lib/email/handlebarsHelpers';
import { decideEmail, loadSchool, logExternalSend, type RecipientPrefs } from './deliver';
import { toMinutes } from './sendWindow';
import type { MessageCategory } from './categories';

ensureHandlebarsHelpers();

export type TriggerEmailPlan =
  | { kind: 'send'; at: Date | null }
  | { kind: 'digest' }
  | { kind: 'none'; reason: string };

export async function planTriggerEmail(args: {
  tenantId: string;
  userId: string;
  category: MessageCategory;
  /** When the trigger wants it sent; null = now. */
  at: Date | null;
  timeSensitiveUntil: Date | null;
}): Promise<TriggerEmailPlan> {
  try {
    const db = createAdminClient();
    const [{ data: u }, { data: p }, school] = await Promise.all([
      db.from('users').select('timezone').eq('id', args.userId).maybeSingle(),
      db
        .from('notification_preferences')
        .select('email_enabled, category_preferences, quiet_hours_start, quiet_hours_end, quiet_hours_timezone, digest_mode')
        .eq('user_id', args.userId)
        .maybeSingle(),
      loadSchool(db, args.tenantId),
    ]);
    const prefs = (p as RecipientPrefs) ?? null;
    const savedTz = prefs?.quiet_hours_timezone && prefs.quiet_hours_timezone !== 'UTC' ? prefs.quiet_hours_timezone : null;
    const from = args.at && args.at.getTime() > Date.now() ? args.at : new Date();
    const d = decideEmail({
      wantEmail: true,
      always: false,
      category: args.category,
      prefs,
      now: from,
      timeSensitiveUntil: args.timeSensitiveUntil,
      rules: {
        clientTimezone: savedTz || u?.timezone || school.timezone,
        quietStart: toMinutes(prefs?.quiet_hours_start),
        quietEnd: toMinutes(prefs?.quiet_hours_end),
        schoolTimezone: school.timezone,
        sendFrom: null,
        sendUntil: null,
        skipShabbat: false,
      },
    });
    if (d.kind === 'send') return { kind: 'send', at: d.delayedBy || args.at ? d.at : null };
    return d;
  } catch (error) {
    console.error('[messaging] planTriggerEmail failed; sending as before', error);
    return { kind: 'send', at: args.at };
  }
}

/** After the trigger queued its email: log it, and hold it back when the plan says so. */
export async function finishTriggerEmail(args: {
  tenantId: string;
  userId: string;
  queueId: string;
  category: MessageCategory;
  plan: TriggerEmailPlan;
  actionUrl: string | null;
  /** Where it came from, for the send log. Default: an old email trigger. */
  source?: 'trigger' | 'scheduled';
  /** The bell already got it (a message from the team). */
  notificationId?: string | null;
}): Promise<void> {
  try {
    const db = createAdminClient();
    const { data: row } = await db
      .from('email_queue')
      .select('to_email, subject, body_text, template_variables, language_code, scheduled_for')
      .eq('id', args.queueId)
      .maybeSingle();
    if (!row) return;
    const vars = { ...(row.template_variables || {}), language: row.language_code || 'en' };
    const render = (t: string | null) => {
      try {
        return Handlebars.compile(t || '')(vars);
      } catch {
        return t || '';
      }
    };
    const title = render(row.subject).trim() || 'Update';
    const { plan } = args;

    if (plan.kind === 'send') {
      const later = row.scheduled_for ? new Date(row.scheduled_for) : null;
      const logId = await logExternalSend(
        {
          tenantId: args.tenantId,
          userId: args.userId,
          toEmail: row.to_email,
          source: args.source ?? 'trigger',
          category: args.category,
          title,
          notificationId: args.notificationId ?? null,
          outcome: later && later.getTime() > Date.now() + 60_000 ? 'waiting' : args.notificationId ? 'email_and_bell' : 'email_only',
          reason: later && later.getTime() > Date.now() + 60_000 ? 'scheduled' : null,
          emailQueueId: args.queueId,
          sendAt: later,
        },
        db,
      );
      if (logId) await db.from('email_queue').update({ message_log_id: logId }).eq('id', args.queueId);
      return;
    }

    // Into the summary first: if that can't be saved, the email simply goes.
    let digestId: string | null = null;
    if (plan.kind === 'digest') {
      const text = render(row.body_text).trim();
      const { data: item, error } = await db
        .from('digest_items')
        .insert({
          tenant_id: args.tenantId,
          user_id: args.userId,
          category: args.category,
          title,
          body: text.length > 600 ? `${text.slice(0, 600).trimEnd()}…` : text,
          action_url: args.actionUrl,
        })
        .select('id')
        .single();
      if (error || !item) return;
      digestId = item.id;
    }

    await db
      .from('email_queue')
      .update({ status: 'cancelled', error_message: plan.kind === 'digest' ? 'In the daily summary' : `Client settings: ${plan.reason}` })
      .eq('id', args.queueId);
    const logId = await logExternalSend(
      {
        tenantId: args.tenantId,
        userId: args.userId,
        toEmail: row.to_email,
        source: args.source ?? 'trigger',
        category: args.category,
        title,
        notificationId: args.notificationId ?? null,
        outcome: plan.kind === 'digest' ? 'in_digest' : args.notificationId ? 'bell_only' : 'stopped',
        reason: plan.kind === 'digest' ? 'digest' : plan.reason,
        emailQueueId: args.queueId,
      },
      db,
    );
    if (digestId && logId) await db.from('digest_items').update({ message_log_id: logId }).eq('id', digestId);
  } catch (error) {
    console.error('[messaging] finishTriggerEmail failed', error);
  }
}

/**
 * An email already in the queue to go now (a scheduled email, a message
 * from the team): the client's settings decide whether it goes, waits for
 * their quiet hours, joins their daily summary, or is held back. Logged.
 */
export async function settleQueuedEmail(args: {
  tenantId: string;
  userId: string | null | undefined;
  queueId: string;
  category: MessageCategory;
  source: 'trigger' | 'scheduled';
  actionUrl?: string | null;
  notificationId?: string | null;
}): Promise<'send' | 'later' | 'digest' | 'held'> {
  if (!args.userId) return 'send';
  const plan = await planTriggerEmail({ tenantId: args.tenantId, userId: args.userId, category: args.category, at: null, timeSensitiveUntil: null });
  if (plan.kind === 'send' && plan.at) {
    await createAdminClient().from('email_queue').update({ scheduled_for: plan.at.toISOString() }).eq('id', args.queueId);
  }
  await finishTriggerEmail({
    tenantId: args.tenantId,
    userId: args.userId,
    queueId: args.queueId,
    category: args.category,
    plan,
    actionUrl: args.actionUrl ?? null,
    source: args.source,
    notificationId: args.notificationId,
  });
  return plan.kind === 'send' ? (plan.at ? 'later' : 'send') : plan.kind === 'digest' ? 'digest' : 'held';
}
