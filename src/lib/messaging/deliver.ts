/**
 * The one way an automatic message reaches a client.
 *
 *   1. The bell in the portal always gets it.
 *   2. Email only if the client left that settings group on.
 *   3. During the client's quiet hours (in their time zone) the email waits;
 *      reminders also wait for the school's sending hours, Shabbat and holidays.
 *   4. Clients who chose one email a day get it in their daily summary.
 *   5. A message tied to a time ("starts in 30 minutes") is never emailed
 *      late: if it would be, it stays in the bell only.
 *   System messages (invitation, enrollment link, password reset) always go
 *   by email. Every message is written to message_log, which the admin's
 *   send log reads.
 *
 * Server only (service role).
 */

import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { isEmailDeliverable } from '@/lib/email/blocklist';
import { isUserEligibleForCommunication } from '@/lib/users/communication-eligible';
import { DEFAULT_FALLBACK_TIMEZONE } from '@/lib/datetime/timezone';
import { nextOpenSlot, toMinutes, type BlockReason, type WindowRules } from './sendWindow';
import { buildStandardEmail } from './emailLook';
import type { MessageCategory } from './categories';

type Db = ReturnType<typeof createAdminClient>;

export type MessageSource = 'reminder' | 'trigger' | 'coaching' | 'team_alert' | 'system' | 'manual' | 'price_change' | 'scheduled' | 'contact';
export type Outcome = 'email_and_bell' | 'bell_only' | 'email_only' | 'waiting' | 'in_digest' | 'stopped' | 'email_failed';

export interface MessageInput {
  tenantId: string;
  userId: string;
  source: MessageSource;
  category: MessageCategory;
  /** Bell title and email subject, already in the client's language. */
  title: string;
  /** Plain text; blank lines separate paragraphs. The bell shows this. */
  body: string;
  /** The email's own words as simple HTML (a reminder step); replaces `body` in the email. */
  bodyHtml?: string | null;
  /** Portal path ("/billing") or full URL. */
  actionUrl?: string | null;
  actionLabel?: string | null;
  /** Try email too (the client's settings still decide). Default true. */
  email?: boolean;
  /** Put it in the bell. Default true. */
  bell?: boolean;
  /** System messages: email regardless of the client's settings. */
  always?: boolean;
  /** Must reach the client before this moment, or it stays in the bell only. */
  timeSensitiveUntil?: Date | null;
  /** Reminders wait for sending hours; immediate confirmations don't. */
  useSendHours?: boolean;
  /** This reminder's own sending hours ("HH:MM"), instead of the school's. */
  sendFrom?: string | null;
  sendUntil?: string | null;
  /** This reminder's own Shabbat rule; null = the school's. */
  skipShabbat?: boolean | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  displayStyle?: 'list' | 'toast' | 'top_bar' | 'home_card' | 'modal';
  metadata?: Record<string, unknown>;
  chaser?: { chaserId: string; stepId: string; runId: string | null };
  createdBy?: string | null;
  /** A ready email instead of the standard one built from title and body. */
  emailContent?: { subject: string; html: string; text: string };
}

export interface DeliveryResult {
  outcome: Outcome;
  reason: string | null;
  logId: string | null;
  notificationId: string | null;
  emailQueueId: string | null;
  sendAt: Date | null;
}

export interface RecipientPrefs {
  email_enabled?: boolean | null;
  category_preferences?: Record<string, { email?: boolean } | undefined> | null;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  quiet_hours_timezone?: string | null;
  digest_mode?: boolean | null;
}

export type EmailDecision =
  | { kind: 'send'; at: Date; delayedBy: BlockReason | null }
  | { kind: 'digest' }
  | { kind: 'none'; reason: string };

/**
 * The client-settings decision on its own, without the database. Exported
 * so the rules can be tested and the wizard can explain them.
 */
export function decideEmail(args: {
  wantEmail: boolean;
  always: boolean;
  category: MessageCategory;
  prefs: RecipientPrefs | null;
  now: Date;
  rules: WindowRules;
  timeSensitiveUntil?: Date | null;
}): EmailDecision {
  const { wantEmail, always, category, prefs, now, rules, timeSensitiveUntil } = args;
  if (!wantEmail) return { kind: 'none', reason: 'bell_step' };
  if (always || category === 'system') return { kind: 'send', at: now, delayedBy: null };

  // Missing settings = the portal's defaults: every group on.
  if (prefs?.email_enabled === false) return { kind: 'none', reason: 'email_off' };
  if (prefs?.category_preferences?.[category]?.email === false) return { kind: 'none', reason: 'email_off' };

  if (prefs?.digest_mode) {
    // A message tied to a time doesn't wait for the evening summary.
    return timeSensitiveUntil ? { kind: 'none', reason: 'digest' } : { kind: 'digest' };
  }

  const slot = nextOpenSlot(now, rules);
  if (!slot) return { kind: 'none', reason: 'quiet_hours' };
  if (timeSensitiveUntil && slot.at.getTime() > timeSensitiveUntil.getTime()) {
    return { kind: 'none', reason: slot.reason === 'quiet_hours' || !slot.reason ? 'time_sensitive' : slot.reason };
  }
  return { kind: 'send', at: slot.at, delayedBy: slot.reason };
}

// ---------------------------------------------------------------------------

interface SchoolInfo {
  timezone: string;
  name: string;
  primaryColor?: string;
  buttonColor?: string;
  logoUrl?: string;
  headerStyle?: 'logo' | 'text' | 'none';
  footerNote?: string;
  portalBase: string;
  sendFrom: number;
  sendUntil: number;
  skipShabbat: boolean;
}

const schoolCache = new Map<string, { at: number; info: SchoolInfo }>();

export async function loadSchool(db: Db, tenantId: string): Promise<SchoolInfo> {
  const hit = schoolCache.get(tenantId);
  if (hit && Date.now() - hit.at < 60_000) return hit.info;
  const [{ data: t }, { data: s }] = await Promise.all([
    db
      .from('tenants')
      .select('name, timezone, primary_color, email_primary_color, email_button_color, email_logo_url, logo_url, email_header_style, email_footer_text, portal_url')
      .eq('id', tenantId)
      .maybeSingle(),
    db.from('message_settings').select('send_from, send_until, skip_shabbat').eq('tenant_id', tenantId).maybeSingle(),
  ]);
  const info: SchoolInfo = {
    timezone: t?.timezone || DEFAULT_FALLBACK_TIMEZONE,
    name: t?.name || 'IPS Platform',
    primaryColor: t?.email_primary_color || t?.primary_color || undefined,
    buttonColor: t?.email_button_color || t?.email_primary_color || t?.primary_color || undefined,
    logoUrl: t?.email_logo_url || t?.logo_url || undefined,
    headerStyle: (t?.email_header_style as SchoolInfo['headerStyle']) || undefined,
    footerNote: t?.email_footer_text || undefined,
    portalBase: (t?.portal_url || process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, ''),
    sendFrom: toMinutes(s?.send_from) ?? 9 * 60,
    sendUntil: toMinutes(s?.send_until) ?? 20 * 60,
    skipShabbat: s?.skip_shabbat ?? true,
  };
  schoolCache.set(tenantId, { at: Date.now(), info });
  return info;
}

export function clearSchoolCache(tenantId?: string) {
  if (tenantId) schoolCache.delete(tenantId);
  else schoolCache.clear();
}

function absoluteUrl(base: string, url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}


/** The queue runs Handlebars over every email; text we already filled in must not be read as a placeholder. */
function noHandlebars(s: string): string {
  return s.replace(/\{\{/g, '&#123;&#123;').replace(/\}\}/g, '&#125;&#125;');
}

export { buildStandardEmail } from './emailLook';

interface Recipient {
  id: string;
  email: string | null;
  firstName: string;
  name: string;
  lang: 'he' | 'en';
  timezone: string | null;
  prefs: RecipientPrefs | null;
}

async function loadRecipient(db: Db, userId: string): Promise<Recipient | null> {
  const [{ data: u }, { data: p }] = await Promise.all([
    db.from('users').select('id, email, first_name, last_name, preferred_language, timezone').eq('id', userId).maybeSingle(),
    db
      .from('notification_preferences')
      .select('email_enabled, category_preferences, quiet_hours_start, quiet_hours_end, quiet_hours_timezone, digest_mode')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);
  if (!u) return null;
  return {
    id: u.id,
    email: u.email || null,
    firstName: (u.first_name || '').trim(),
    name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || '',
    lang: u.preferred_language === 'en' ? 'en' : 'he',
    timezone: u.timezone || null,
    prefs: (p as RecipientPrefs) ?? null,
  };
}

/** The client's zone for quiet hours: the one saved with them, else the client's, else the school's. */
function clientTimezone(r: Recipient, school: SchoolInfo): string {
  const saved = r.prefs?.quiet_hours_timezone;
  if (saved && saved !== 'UTC') return saved;
  return r.timezone || school.timezone;
}

function outcomeFor(decision: EmailDecision, bell: boolean): { outcome: Outcome; reason: string | null } {
  if (decision.kind === 'send') {
    if (decision.delayedBy) return { outcome: 'waiting', reason: decision.delayedBy };
    return { outcome: bell ? 'email_and_bell' : 'email_only', reason: null };
  }
  if (decision.kind === 'digest') return { outcome: 'in_digest', reason: 'digest' };
  return { outcome: bell ? 'bell_only' : 'stopped', reason: decision.reason };
}

/** Delivers one message to one client. Never throws: a failure is logged and returned. */
export async function deliverMessage(input: MessageInput, dbArg?: Db): Promise<DeliveryResult> {
  const empty: DeliveryResult = { outcome: 'stopped', reason: null, logId: null, notificationId: null, emailQueueId: null, sendAt: null };
  try {
    const db = dbArg ?? createAdminClient();
    const [recipient, school] = await Promise.all([loadRecipient(db, input.userId), loadSchool(db, input.tenantId)]);
    if (!recipient) return { ...empty, reason: 'no_user' };

    const bell = input.bell !== false;
    const logId = randomUUID();

    if (!(await isUserEligibleForCommunication(db as any, recipient.id))) {
      await writeLog(db, input, recipient, logId, { outcome: 'stopped', reason: 'inactive' }, null, null, null);
      return { ...empty, reason: 'inactive', logId };
    }

    // 1. Bell.
    let notificationId: string | null = null;
    if (bell) {
      notificationId = randomUUID();
      const { error } = await db.from('notifications').insert({
        id: notificationId,
        tenant_id: input.tenantId,
        scope: 'individual',
        target_user_id: recipient.id,
        category: input.category === 'system' ? 'system' : input.category,
        priority: input.priority ?? 'medium',
        display_style: input.displayStyle ?? 'list',
        title: input.title,
        message: input.body,
        action_url: input.actionUrl ?? null,
        action_label: input.actionLabel ?? null,
        metadata: { ...(input.metadata ?? {}), source: input.source, message_log_id: logId },
        created_by: input.createdBy ?? null,
      });
      if (error) {
        console.error('[messaging] bell insert failed', error.message);
        notificationId = null;
      }
    }

    // 2–5. Email, by the client's settings.
    const wantEmail = input.email !== false;
    let decision: EmailDecision;
    if (wantEmail && !recipient.email) decision = { kind: 'none', reason: 'no_email' };
    else if (wantEmail && !(await isEmailDeliverable(db as any, recipient.email!))) decision = { kind: 'none', reason: 'bounced' };
    else {
      const useHours = input.useSendHours && !input.timeSensitiveUntil;
      decision = decideEmail({
        wantEmail,
        always: !!input.always,
        category: input.category,
        prefs: recipient.prefs,
        now: new Date(),
        timeSensitiveUntil: input.timeSensitiveUntil ?? null,
        rules: {
          clientTimezone: clientTimezone(recipient, school),
          quietStart: toMinutes(recipient.prefs?.quiet_hours_start),
          quietEnd: toMinutes(recipient.prefs?.quiet_hours_end),
          schoolTimezone: school.timezone,
          sendFrom: useHours ? toMinutes(input.sendFrom) ?? school.sendFrom : null,
          sendUntil: useHours ? toMinutes(input.sendUntil) ?? school.sendUntil : null,
          skipShabbat: !input.always && !!input.useSendHours && (input.skipShabbat ?? school.skipShabbat),
        },
      });
    }

    const actionAbs = absoluteUrl(school.portalBase, input.actionUrl);
    let emailQueueId: string | null = null;
    let sendAt: Date | null = null;

    // Into the daily summary. If that can't be saved, the email goes now.
    if (decision.kind === 'digest') {
      const { error } = await db.from('digest_items').insert({
        tenant_id: input.tenantId,
        user_id: recipient.id,
        category: input.category,
        title: input.title,
        body: input.body,
        action_url: actionAbs,
        action_label: input.actionLabel ?? null,
        message_log_id: null,
      });
      if (error) {
        console.error('[messaging] digest item insert failed; emailing instead', error.message);
        decision = { kind: 'send', at: new Date(), delayedBy: null };
      }
    }
    const { outcome, reason } = outcomeFor(decision, !!notificationId);

    if (decision.kind === 'send') {
      const settingsUrl = input.always || input.source === 'team_alert' ? null : absoluteUrl(school.portalBase, '/profile?tab=notify');
      const mail =
        input.emailContent ??
        buildStandardEmail({
          lang: recipient.lang,
          firstName: recipient.firstName,
          title: input.title,
          body: input.body,
          bodyHtml: input.bodyHtml ?? null,
          actionUrl: actionAbs,
          actionLabel: input.actionLabel ?? null,
          settingsUrl,
          school,
        });
      emailQueueId = randomUUID();
      sendAt = decision.at;
      const row: Record<string, unknown> = {
        id: emailQueueId,
        tenant_id: input.tenantId,
        to_email: recipient.email,
        to_name: recipient.name,
        user_id: recipient.id,
        language_code: recipient.lang,
        subject: noHandlebars(mail.subject),
        body_html: noHandlebars(mail.html),
        body_text: noHandlebars(mail.text),
        template_variables: {},
        priority: input.priority === 'urgent' ? 'urgent' : input.priority === 'high' ? 'high' : 'normal',
        scheduled_for: decision.delayedBy ? decision.at.toISOString() : null,
        status: 'pending',
        trigger_type: 'automated',
        trigger_event: input.source,
        message_log_id: logId,
      };
      let { error } = await db.from('email_queue').insert(row);
      if (error && /message_log_id/.test(error.message)) {
        // The reminders migration isn't run yet: send without the link to the log.
        delete row.message_log_id;
        ({ error } = await db.from('email_queue').insert(row));
      }
      if (error) {
        console.error('[messaging] email queue insert failed', error.message);
        emailQueueId = null;
        await writeLog(db, input, recipient, logId, { outcome: notificationId ? 'bell_only' : 'stopped', reason: 'queue_error' }, notificationId, null, null);
        return { outcome: notificationId ? 'bell_only' : 'stopped', reason: 'queue_error', logId, notificationId, emailQueueId: null, sendAt: null };
      }
    }

    await writeLog(db, input, recipient, logId, { outcome, reason }, notificationId, emailQueueId, sendAt);

    return { outcome, reason, logId, notificationId, emailQueueId, sendAt };
  } catch (error) {
    console.error('[messaging] deliverMessage failed', error);
    return { ...empty, reason: 'error' };
  }
}

async function writeLog(
  db: Db,
  input: MessageInput,
  recipient: Recipient,
  logId: string,
  r: { outcome: Outcome; reason: string | null },
  notificationId: string | null,
  emailQueueId: string | null,
  sendAt: Date | null,
) {
  const { error } = await db.from('message_log').insert({
    id: logId,
    tenant_id: input.tenantId,
    user_id: recipient.id,
    to_email: recipient.email,
    source: input.source,
    chaser_id: input.chaser?.chaserId ?? null,
    step_id: input.chaser?.stepId ?? null,
    run_id: input.chaser?.runId ?? null,
    category: input.category,
    title: input.title,
    outcome: r.outcome,
    reason: r.reason,
    notification_id: notificationId,
    email_queue_id: emailQueueId,
    send_at: sendAt && sendAt.getTime() > Date.now() + 60_000 ? sendAt.toISOString() : null,
  });
  // The log is how the team sees what happened, but a missing table (the
  // migration not run yet) must never stop the message itself.
  if (error) console.error('[messaging] message_log insert failed', error.message);
}

/**
 * Logs a message that was sent another way (an old trigger email, a system
 * email), so the send log shows everything. Never throws.
 */
export async function logExternalSend(args: {
  tenantId: string;
  userId?: string | null;
  toEmail?: string | null;
  source: MessageSource;
  category: MessageCategory | null;
  title: string;
  outcome: Outcome;
  reason?: string | null;
  emailQueueId?: string | null;
  notificationId?: string | null;
  sendAt?: Date | null;
  chaser?: { chaserId: string; stepId: string | null; runId: string | null };
}, dbArg?: Db): Promise<string | null> {
  try {
    const db = dbArg ?? createAdminClient();
    const id = randomUUID();
    const { error } = await db.from('message_log').insert({
      id,
      tenant_id: args.tenantId,
      user_id: args.userId ?? null,
      to_email: args.toEmail ?? null,
      source: args.source,
      category: args.category,
      title: args.title,
      outcome: args.outcome,
      reason: args.reason ?? null,
      email_queue_id: args.emailQueueId ?? null,
      notification_id: args.notificationId ?? null,
      chaser_id: args.chaser?.chaserId ?? null,
      step_id: args.chaser?.stepId ?? null,
      run_id: args.chaser?.runId ?? null,
      send_at: args.sendAt && args.sendAt.getTime() > Date.now() + 60_000 ? args.sendAt.toISOString() : null,
    });
    if (error) {
      console.error('[messaging] message_log insert failed', error.message);
      return null;
    }
    return id;
  } catch (error) {
    console.error('[messaging] logExternalSend failed', error);
    return null;
  }
}

/**
 * An email sent straight away, outside the queue (portal invitation,
 * password reset, the website contact form): written to the send log so it
 * shows with everything else. System emails go regardless of the client's
 * settings, because the client asked for them. Never throws.
 */
export async function logDirectEmail(args: {
  tenantId: string;
  userId?: string | null;
  toEmail: string;
  title: string;
  ok: boolean;
  error?: string | null;
  source?: 'system' | 'contact';
}): Promise<void> {
  await logExternalSend({
    tenantId: args.tenantId,
    userId: args.userId ?? null,
    toEmail: args.toEmail,
    source: args.source ?? 'system',
    category: 'system',
    title: args.title,
    outcome: args.ok ? 'email_only' : 'email_failed',
    reason: args.ok ? null : 'send_error',
  });
}
