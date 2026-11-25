/**
 * What the admin screen "Automatic reminders" reads and changes: the list
 * with this month's numbers, one reminder for its drawer, saving from the
 * wizard, the send log, the sending settings, and "Needs attention".
 *
 * Server only. Every function takes the tenant from the signed-in admin.
 */

import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import { CATALOG, CATALOG_BY_KEY, sampleValues, fillPlaceholders, type CatalogEvent } from './catalog';
import { CLIENT_CATEGORIES, type ClientCategory } from './categories';
import { buildStandardEmail, clearSchoolCache, loadSchool } from './deliver';
import { isBlankHtml, htmlToText, sanitizeMessageHtml } from './html';
import { SOURCES } from './sources';
import { createFromCatalog, ensureSeeded, loadChaser, loadChasers, type Chaser } from './store';
import { actionPath } from './context';
import { schoolAdmins } from './teamAlerts';
import { deliverMessage } from './deliver';
import { stopRunManually } from './engine';

type Db = ReturnType<typeof createAdminClient>;
type Fail = { ok: false; status: number; error: string; field?: string };

const DAY_MS = 24 * 60 * 60 * 1000;
const DELIVERED = ['email_and_bell', 'email_only', 'bell_only', 'waiting', 'in_digest', 'email_failed'];

function monthStart(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

function one<T>(x: T | T[] | null | undefined): T | null {
  if (!x) return null;
  return Array.isArray(x) ? (x[0] ?? null) : x;
}

/** Reads every row of a query in pages of 1,000 (PostgREST's cap). */
async function allRows<T>(make: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await make(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

// --- the list ---------------------------------------------------------------

export interface ReminderRow {
  id: string;
  event_key: string;
  name: string;
  status: Chaser['status'];
  is_system: boolean;
  locked: boolean;
  steps: { position: number; offset: number; title: string }[];
  /** This month: how it reached people. */
  month: { email: number; bellOnly: number; digest: number; waiting: number; failed: number; total: number };
  running: number;
  /** Not sent by the system before automatic reminders existed. */
  isNew: boolean;
}

/** Events that the system already sent before this screen. */
const EXISTING_TODAY = new Set([
  'lesson.before',
  'lesson.recording',
  'coaching.changed',
  'coaching.offer',
  'price.changing',
  'price.cancelled',
  'team.payment',
  'team.contract',
  'system.invitation',
  'system.enrollment_link',
  'system.password_reset',
]);

/** The reminders tables aren't in the database yet (the SQL file wasn't run). */
function needsMigration(e: unknown): Fail | null {
  const msg = e instanceof Error ? e.message : String(e);
  return /schema cache|does not exist/i.test(msg) ? { ok: false, status: 503, error: 'needs_migration' } : null;
}

export async function listReminders(tenantId: string) {
  const db = createAdminClient();
  try {
    await ensureSeeded(db, tenantId);
  } catch (e) {
    const m = needsMigration(e);
    if (m) return m;
    throw e;
  }
  const chasers = await loadChasers(db, tenantId);
  const since = monthStart();
  const [logs, runs, attention] = await Promise.all([
    allRows<{ chaser_id: string | null; outcome: string; source: string; category: string | null }>((a, b) =>
      db.from('message_log').select('chaser_id, outcome, source, category').eq('tenant_id', tenantId).gte('created_at', since).range(a, b),
    ),
    allRows<{ chaser_id: string }>((a, b) => db.from('chaser_runs').select('chaser_id').eq('tenant_id', tenantId).eq('status', 'active').range(a, b)),
    attentionCount(db, tenantId),
  ]);

  const month = new Map<string, ReminderRow['month']>();
  let sentMonth = 0;
  let bellOnlyMonth = 0;
  for (const l of logs) {
    if (DELIVERED.includes(l.outcome)) sentMonth++;
    if (l.outcome === 'bell_only' && l.source !== 'team_alert') bellOnlyMonth++;
    if (!l.chaser_id) continue;
    const m = month.get(l.chaser_id) ?? { email: 0, bellOnly: 0, digest: 0, waiting: 0, failed: 0, total: 0 };
    if (l.outcome === 'email_and_bell' || l.outcome === 'email_only') m.email++;
    else if (l.outcome === 'bell_only') m.bellOnly++;
    else if (l.outcome === 'in_digest') m.digest++;
    else if (l.outcome === 'waiting') m.waiting++;
    else if (l.outcome === 'email_failed') m.failed++;
    if (DELIVERED.includes(l.outcome)) m.total++;
    month.set(l.chaser_id, m);
  }
  const running = new Map<string, number>();
  for (const r of runs) running.set(r.chaser_id, (running.get(r.chaser_id) ?? 0) + 1);

  const rows: ReminderRow[] = chasers.map((c) => {
    const ev = CATALOG_BY_KEY[c.event_key];
    return {
      id: c.id,
      event_key: c.event_key,
      name: c.name,
      status: c.status,
      is_system: c.is_system,
      locked: !!ev?.locked,
      steps: c.steps.map((s) => ({ position: s.position, offset: s.offset_minutes, title: s.title_he })),
      month: month.get(c.id) ?? { email: 0, bellOnly: 0, digest: 0, waiting: 0, failed: 0, total: 0 },
      running: running.get(c.id) ?? 0,
      isNew: !EXISTING_TODAY.has(c.event_key),
    };
  });
  return {
    reminders: rows,
    kpis: {
      active: rows.filter((r) => r.status === 'active').length,
      sentMonth,
      bellOnlyMonth,
      attention,
    },
  };
}

// --- one reminder (drawer and wizard) ---------------------------------------

export async function getReminder(tenantId: string, id: string) {
  const db = createAdminClient();
  const chaser = await loadChaser(db, tenantId, id);
  if (!chaser) return { ok: false, status: 404, error: 'Not found' } as Fail;
  const since = monthStart();
  const [{ data: logs }, { data: runs }, { data: paidRuns }] = await Promise.all([
    db
      .from('message_log')
      .select('id, user_id, title, outcome, reason, created_at, step_id, users(first_name, last_name, email)')
      .eq('chaser_id', id)
      .order('created_at', { ascending: false })
      .limit(12),
    db
      .from('chaser_runs')
      .select('id, user_id, subject_type, subject_id, next_position, next_at, anchor_at, context, users(first_name, last_name, email)')
      .eq('chaser_id', id)
      .eq('status', 'active')
      .order('next_at', { ascending: true })
      .limit(50),
    db.from('chaser_runs').select('context').eq('chaser_id', id).eq('stop_reason', 'paid').gte('updated_at', since),
  ]);
  const { count: sentMonth } = await db
    .from('message_log')
    .select('id', { count: 'exact', head: true })
    .eq('chaser_id', id)
    .in('outcome', DELIVERED)
    .gte('created_at', since);
  const paidAfter = (paidRuns ?? []).reduce((sum: number, r: any) => sum + (Number(r.context?.amount) || 0), 0);

  // Who among the running clients turned email off for this group.
  const ev = CATALOG_BY_KEY[chaser.event_key];
  const userIds = [...new Set((runs ?? []).map((r: any) => r.user_id).filter(Boolean))] as string[];
  const { data: prefs } = userIds.length
    ? await db.from('notification_preferences').select('user_id, email_enabled, category_preferences, digest_mode').in('user_id', userIds)
    : { data: [] as any[] };
  const emailOff = new Set(
    (prefs ?? [])
      .filter((p: any) => p.email_enabled === false || (ev && p.category_preferences?.[ev.category]?.email === false))
      .map((p: any) => p.user_id),
  );

  const name = (u: any) => (u ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || '' : '');
  return {
    reminder: chaser,
    stats: { sentMonth: sentMonth ?? 0, paidAfter, running: runs?.length ?? 0 },
    running: (runs ?? []).map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      name: name(one(r.users)),
      sentSteps: Math.max(0, r.next_position - 1),
      nextAt: r.next_at,
      emailOff: emailOff.has(r.user_id),
      subjectType: r.subject_type,
      subjectId: r.subject_id,
      product: r.context?.product ?? null,
    })),
    activity: (logs ?? []).map((l: any) => ({
      id: l.id,
      name: name(one(l.users)),
      title: l.title,
      outcome: l.outcome,
      reason: l.reason,
      at: l.created_at,
      stepPosition: chaser.steps.find((s) => s.id === l.step_id)?.position ?? null,
    })),
  };
}

// --- saving -----------------------------------------------------------------

export interface StepInput {
  offset_minutes: number;
  send_email: boolean;
  admin_copy: boolean;
  action_key: string | null;
  title_he: string;
  body_he: string;
  title_en?: string | null;
  body_en?: string | null;
}

export interface ReminderInput {
  event_key: string;
  name: string;
  status: Chaser['status'];
  applies_to: 'new' | 'all';
  admin_copy: boolean;
  stop_on: string[];
  product_ids: string[] | null;
  send_from: string | null;
  send_until: string | null;
  skip_shabbat: boolean | null;
  steps: StepInput[];
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function validate(input: ReminderInput, ev: CatalogEvent | undefined): Fail | null {
  if (!ev) return { ok: false, status: 400, error: 'Choose what starts the reminder.', field: 'event_key' };
  if (!input.name?.trim()) return { ok: false, status: 400, error: 'Give the reminder a name.', field: 'name' };
  if (!['active', 'draft', 'off'].includes(input.status)) return { ok: false, status: 400, error: 'Unknown status.' };
  if (input.send_from && !TIME.test(input.send_from)) return { ok: false, status: 400, error: 'Sending hours: use a time like 09:00.', field: 'send_from' };
  if (input.send_until && !TIME.test(input.send_until)) return { ok: false, status: 400, error: 'Sending hours: use a time like 20:00.', field: 'send_until' };
  if (input.send_from && input.send_until && input.send_from >= input.send_until) {
    return { ok: false, status: 400, error: 'Sending hours: the end must be after the start.', field: 'send_until' };
  }
  if (!ev.locked) {
    if (!input.steps?.length) return { ok: false, status: 400, error: 'Add at least one message.', field: 'steps' };
    for (const [i, s] of input.steps.entries()) {
      if (!s.title_he?.trim()) return { ok: false, status: 400, error: `Message ${i + 1}: write a subject.`, field: `steps.${i}.title_he` };
      if (isBlankHtml(s.body_he)) return { ok: false, status: 400, error: `Message ${i + 1}: write the message.`, field: `steps.${i}.body_he` };
      if (!Number.isFinite(s.offset_minutes) || Math.abs(s.offset_minutes) > 366 * 24 * 60) {
        return { ok: false, status: 400, error: `Message ${i + 1}: choose when it goes out.`, field: `steps.${i}.offset_minutes` };
      }
      if (s.action_key && !ev.actions.some((a) => a.key === s.action_key)) return { ok: false, status: 400, error: `Message ${i + 1}: unknown button.` };
    }
  }
  return null;
}

/** Turning a reminder on switches off the old email trigger it replaces, so nobody gets two. */
async function retireOldTrigger(db: Db, tenantId: string, ev: CatalogEvent | undefined) {
  if (!ev?.replacesTrigger) return;
  await db.from('email_triggers').update({ is_active: false, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('trigger_event', ev.replacesTrigger).eq('is_active', true);
}

export async function saveReminder(tenantId: string, adminId: string, id: string | null, input: ReminderInput) {
  const db = createAdminClient();
  const ev = CATALOG_BY_KEY[input.event_key];
  const bad = validate(input, ev);
  if (bad) return bad;
  const existing = id ? await loadChaser(db, tenantId, id) : null;
  if (id && !existing) return { ok: false, status: 404, error: 'Not found' } as Fail;
  if (existing && existing.event_key !== input.event_key && existing.is_system) {
    return { ok: false, status: 400, error: "A built-in reminder's starting event can't change. Create a new reminder instead." } as Fail;
  }

  const now = new Date().toISOString();
  const allowedStops = new Set(ev!.stops.map((s) => s.key));
  const stopOn = [...new Set([...input.stop_on.filter((s) => allowedStops.has(s)), ...ev!.stops.filter((s) => s.locked).map((s) => s.key)])];
  const turningOn = input.status === 'active' && existing?.status !== 'active';
  const fields = {
    event_key: input.event_key,
    name: input.name.trim(),
    status: input.status,
    applies_to: input.applies_to === 'all' ? 'all' : 'new',
    admin_copy: !!input.admin_copy,
    stop_on: stopOn,
    product_ids: input.product_ids?.length ? input.product_ids : null,
    send_from: input.send_from || null,
    send_until: input.send_until || null,
    skip_shabbat: input.skip_shabbat,
    updated_at: now,
    ...(turningOn ? { activated_at: now } : {}),
  };

  let chaserId = id;
  if (existing) {
    const { error } = await db.from('chasers').update(fields).eq('id', existing.id).eq('tenant_id', tenantId);
    if (error) return { ok: false, status: 500, error: error.message } as Fail;
  } else {
    const { data, error } = await db.from('chasers').insert({ ...fields, tenant_id: tenantId, is_system: false, created_by: adminId }).select('id').single();
    if (error || !data) return { ok: false, status: 500, error: error?.message ?? 'Could not save' } as Fail;
    chaserId = data.id;
  }

  // Steps: kept in time order. Locked rows (team and system) keep their own.
  if (!ev!.locked || input.steps?.length) {
    const ordered = [...input.steps].sort((a, b) => a.offset_minutes - b.offset_minutes);
    await db.from('chaser_steps').delete().eq('chaser_id', chaserId!);
    if (ordered.length) {
      const { error } = await db.from('chaser_steps').insert(
        ordered.map((s, i) => ({
          tenant_id: tenantId,
          chaser_id: chaserId,
          position: i + 1,
          offset_minutes: Math.round(s.offset_minutes),
          send_email: !!s.send_email,
          admin_copy: !!s.admin_copy,
          action_key: s.action_key || null,
          title_he: s.title_he.trim(),
          body_he: sanitizeMessageHtml(s.body_he),
          title_en: s.title_en?.trim() || null,
          body_en: s.body_en && !isBlankHtml(s.body_en) ? sanitizeMessageHtml(s.body_en) : null,
        })),
      );
      if (error) return { ok: false, status: 500, error: error.message } as Fail;
    }
  }

  if (input.status === 'active') await retireOldTrigger(db, tenantId, ev);
  // A reminder turned off: its clients get no more steps.
  if (input.status !== 'active' && existing?.status === 'active') {
    await db.from('chaser_runs').update({ status: 'stopped', stop_reason: 'reminder_off', next_at: null, updated_at: now }).eq('chaser_id', chaserId!).eq('status', 'active');
  }
  return { ok: true as const, id: chaserId };
}

export async function setReminderStatus(tenantId: string, id: string, status: Chaser['status']) {
  const db = createAdminClient();
  const c = await loadChaser(db, tenantId, id);
  if (!c) return { ok: false, status: 404, error: 'Not found' } as Fail;
  if (!['active', 'draft', 'off'].includes(status)) return { ok: false, status: 400, error: 'Unknown status.' } as Fail;
  const ev = CATALOG_BY_KEY[c.event_key];
  if (ev?.area === 'system') return { ok: false, status: 400, error: 'System messages are always sent.' } as Fail;
  if (status === 'active' && !ev?.locked && !c.steps.length) return { ok: false, status: 400, error: 'Add at least one message first.' } as Fail;
  const now = new Date().toISOString();
  await db
    .from('chasers')
    .update({ status, updated_at: now, ...(status === 'active' && c.status !== 'active' ? { activated_at: now } : {}) })
    .eq('id', id)
    .eq('tenant_id', tenantId);
  if (status === 'active') await retireOldTrigger(db, tenantId, ev);
  else await db.from('chaser_runs').update({ status: 'stopped', stop_reason: 'reminder_off', next_at: null, updated_at: now }).eq('chaser_id', id).eq('status', 'active');
  return { ok: true as const };
}

export async function deleteReminder(tenantId: string, id: string) {
  const db = createAdminClient();
  const c = await loadChaser(db, tenantId, id);
  if (!c) return { ok: false, status: 404, error: 'Not found' } as Fail;
  if (c.is_system) return { ok: false, status: 400, error: "Built-in reminders can't be deleted. Turn it off instead." } as Fail;
  const { error } = await db.from('chasers').delete().eq('id', id).eq('tenant_id', tenantId);
  if (error) return { ok: false, status: 500, error: error.message } as Fail;
  return { ok: true as const };
}

export async function duplicateReminder(tenantId: string, adminId: string, id: string) {
  const db = createAdminClient();
  const c = await loadChaser(db, tenantId, id);
  if (!c) return { ok: false, status: 404, error: 'Not found' } as Fail;
  const ev = CATALOG_BY_KEY[c.event_key];
  if (!ev || ev.locked) return { ok: false, status: 400, error: "This reminder can't be copied." } as Fail;
  return saveReminder(tenantId, adminId, null, {
    event_key: c.event_key,
    name: `${c.name} (עותק)`,
    status: 'draft',
    applies_to: c.applies_to,
    admin_copy: c.admin_copy,
    stop_on: c.stop_on,
    product_ids: c.product_ids,
    send_from: c.send_from?.slice(0, 5) ?? null,
    send_until: c.send_until?.slice(0, 5) ?? null,
    skip_shabbat: c.skip_shabbat,
    steps: c.steps.map((s) => ({ ...s })),
  });
}

/** A reminder that starts from the catalogue's defaults (the wizard's starting point). */
export function blankFromCatalog(eventKey: string) {
  const ev = CATALOG_BY_KEY[eventKey];
  if (!ev) return null;
  return {
    event_key: ev.key,
    name: ev.name.he,
    status: 'draft' as const,
    applies_to: 'new' as const,
    admin_copy: false,
    stop_on: ev.stops.map((s) => s.key),
    product_ids: null,
    send_from: null,
    send_until: null,
    skip_shabbat: null,
    steps: ev.steps.map((s) => ({
      offset_minutes: s.offset,
      send_email: s.sendEmail ?? true,
      admin_copy: s.adminCopy ?? false,
      action_key: s.action ?? null,
      title_he: s.title.he,
      body_he: s.body.he,
      title_en: s.title.en,
      body_en: s.body.en,
    })),
  };
}

export { createFromCatalog };

// --- what the clients chose (wizard aside, settings table) -----------------

export async function audience(tenantId: string) {
  const db = createAdminClient();
  const clients = await allRows<{ id: string }>((a, b) => db.from('users').select('id').eq('tenant_id', tenantId).eq('role', 'client').range(a, b));
  const ids = clients.map((c) => c.id);
  const prefs: any[] = [];
  for (let i = 0; i < ids.length; i += 300) {
    const { data } = await db
      .from('notification_preferences')
      .select('user_id, email_enabled, category_preferences, digest_mode, quiet_hours_start, quiet_hours_end')
      .in('user_id', ids.slice(i, i + 300));
    prefs.push(...(data ?? []));
  }
  const emailOff = Object.fromEntries(CLIENT_CATEGORIES.map((c) => [c, 0])) as Record<ClientCategory, number>;
  let digest = 0;
  let quiet = 0;
  for (const p of prefs) {
    for (const c of CLIENT_CATEGORIES) if (p.email_enabled === false || p.category_preferences?.[c]?.email === false) emailOff[c]++;
    if (p.digest_mode) digest++;
    if (p.quiet_hours_start && p.quiet_hours_end) quiet++;
  }
  return { clients: ids.length, emailOff, digest, quiet };
}

/** Cases already open for an event (Review step: "there are already 2 clients…"). */
export async function existingCases(tenantId: string, eventKey: string) {
  const ev = CATALOG_BY_KEY[eventKey];
  const src = ev?.source === 'poll' ? SOURCES[eventKey] : undefined;
  if (!src || ev?.timing === 'before') return { count: 0, names: [] as string[] };
  const db = createAdminClient();
  const now = new Date();
  const cases = await src.find({ db, tenantId, now, since: new Date(now.getTime() - 30 * DAY_MS), until: now });
  const userIds = [...new Set(cases.map((c) => c.userId))];
  const { data: users } = userIds.length ? await db.from('users').select('id, first_name, last_name').in('id', userIds.slice(0, 5)) : { data: [] as any[] };
  return {
    count: userIds.length,
    names: (users ?? []).map((u: any) => `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()).filter(Boolean),
  };
}

// --- test sends -------------------------------------------------------------

/** Sends the steps to the admin themselves, with sample details. */
export async function sendTest(tenantId: string, adminId: string, eventKey: string, steps: StepInput[]) {
  const db = createAdminClient();
  const ev = CATALOG_BY_KEY[eventKey];
  if (!ev) return { ok: false, status: 400, error: 'Choose what starts the reminder.' } as Fail;
  const { data: me } = await db.from('users').select('email, first_name').eq('id', adminId).maybeSingle();
  if (!me?.email) return { ok: false, status: 400, error: 'Your user has no email address.' } as Fail;
  const school = await loadSchool(db, tenantId);
  let sent = 0;
  for (const [i, s] of steps.entries()) {
    const values = { ...sampleValues(ev, 'he'), name: me.first_name || sampleValues(ev, 'he').name };
    const title = `[בדיקה ${i + 1}/${steps.length}] ${fillPlaceholders(s.title_he, ev, values)}`;
    const html = fillPlaceholders(s.body_he, ev, values);
    const path = actionPath(s.action_key, {});
    const mail = buildStandardEmail({
      lang: 'he',
      firstName: me.first_name || '',
      title,
      body: htmlToText(html),
      bodyHtml: html,
      actionUrl: path ? `${school.portalBase}${path}` : null,
      actionLabel: ev.actions.find((a) => a.key === s.action_key)?.he ?? null,
      settingsUrl: null,
      school,
    });
    const r = await sendEmail({ to: me.email, subject: mail.subject, html: mail.html, text: mail.text, tenantId });
    if (r.success) sent++;
  }
  return { ok: true as const, sent, to: me.email };
}

// --- send log ---------------------------------------------------------------

export async function sendLog(tenantId: string, opts: { outcome?: string; q?: string; today?: boolean; page?: number }) {
  const db = createAdminClient();
  const pageSize = 25;
  const page = Math.max(1, opts.page ?? 1);
  let userIds: string[] | null = null;
  if (opts.q?.trim()) {
    const term = opts.q.trim().replace(/[%,()]/g, ' ');
    const { data: users } = await db
      .from('users')
      .select('id')
      .eq('tenant_id', tenantId)
      .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`)
      .limit(200);
    userIds = (users ?? []).map((u: any) => u.id);
  }
  let q = db
    .from('message_log')
    .select('id, user_id, to_email, source, chaser_id, step_id, category, title, outcome, reason, send_at, created_at, users(first_name, last_name, email), chasers(name, event_key)', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  if (opts.outcome === 'sent') q = q.in('outcome', ['email_and_bell', 'email_only']);
  else if (opts.outcome === 'failed') q = q.eq('outcome', 'email_failed');
  else if (opts.outcome) q = q.eq('outcome', opts.outcome);
  if (opts.today) q = q.gte('created_at', new Date(Date.now() - DAY_MS).toISOString());
  if (userIds) {
    const term = opts.q!.trim();
    q = userIds.length ? q.or(`user_id.in.(${userIds.join(',')}),title.ilike.%${term.replace(/[%,()]/g, ' ')}%`) : q.ilike('title', `%${term.replace(/[%,()]/g, ' ')}%`);
  }
  const { data, error, count } = await q.range((page - 1) * pageSize, page * pageSize - 1);
  if (error) return { ok: false, status: 500, error: error.message } as Fail;
  const stepIds = [...new Set((data ?? []).map((r: any) => r.step_id).filter(Boolean))];
  const { data: steps } = stepIds.length ? await db.from('chaser_steps').select('id, position').in('id', stepIds) : { data: [] as any[] };
  const pos = new Map((steps ?? []).map((s: any) => [s.id, s.position]));
  return {
    rows: (data ?? []).map((r: any) => {
      const u = one<any>(r.users);
      const c = one<any>(r.chasers);
      return {
        id: r.id,
        userId: r.user_id,
        client: u ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email : r.to_email,
        source: r.source,
        reminder: c?.name ?? null,
        eventKey: c?.event_key ?? null,
        step: r.step_id ? pos.get(r.step_id) ?? null : null,
        category: r.category,
        title: r.title,
        outcome: r.outcome,
        reason: r.reason,
        sendAt: r.send_at,
        at: r.created_at,
      };
    }),
    total: count ?? 0,
    page,
    pageSize,
  };
}

// --- sending settings -------------------------------------------------------

export async function getSettings(tenantId: string) {
  const db = createAdminClient();
  const [{ data: s }, aud, admins] = await Promise.all([
    db.from('message_settings').select('send_from, send_until, skip_shabbat, digest_time').eq('tenant_id', tenantId).maybeSingle(),
    audience(tenantId),
    schoolAdmins(tenantId),
  ]);
  return {
    settings: {
      send_from: (s?.send_from ?? '09:00').slice(0, 5),
      send_until: (s?.send_until ?? '20:00').slice(0, 5),
      skip_shabbat: s?.skip_shabbat ?? true,
      digest_time: (s?.digest_time ?? '18:00').slice(0, 5),
    },
    audience: aud,
    admins: admins.length,
  };
}

export async function saveSettings(tenantId: string, adminId: string, input: { send_from: string; send_until: string; skip_shabbat: boolean; digest_time: string }) {
  for (const [field, v] of [['send_from', input.send_from], ['send_until', input.send_until], ['digest_time', input.digest_time]] as const) {
    if (!TIME.test(v ?? '')) return { ok: false, status: 400, error: 'Use a time like 09:00.', field } as Fail;
  }
  if (input.send_from >= input.send_until) return { ok: false, status: 400, error: 'The end of the sending hours must be after the start.', field: 'send_until' } as Fail;
  const db = createAdminClient();
  const { error } = await db.from('message_settings').upsert({
    tenant_id: tenantId,
    send_from: input.send_from,
    send_until: input.send_until,
    skip_shabbat: !!input.skip_shabbat,
    digest_time: input.digest_time,
    updated_at: new Date().toISOString(),
    updated_by: adminId,
  });
  if (error) return { ok: false, status: 500, error: error.message } as Fail;
  clearSchoolCache(tenantId);
  return { ok: true as const };
}

// --- needs attention --------------------------------------------------------

export interface AttentionItem {
  key: string;
  kind: 'payment' | 'enrollment' | 'email';
  userId: string;
  client: string;
  product: string;
  amount: number | null;
  currency: string | null;
  /** What happened, in plain words (Hebrew and English). */
  what: { he: string; en: string };
  /** Reminder progress. */
  sent: number;
  nextAt: string | null;
  lastError: string | null;
  daysLate: number | null;
  badge: 'late' | 'suspended' | 'bounced' | 'waiting';
  emailOff: boolean;
  enrollmentId: string | null;
  scheduleId: string | null;
  runId: string | null;
  bounced: boolean;
}

async function attentionCount(db: Db, tenantId: string): Promise<number> {
  try {
    const items = await attentionItems(db, tenantId);
    return items.length;
  } catch {
    return 0;
  }
}

async function attentionItems(db: Db, tenantId: string): Promise<AttentionItem[]> {
  const now = Date.now();
  const [failed, pending, suspended] = await Promise.all([
    db
      .from('payment_schedules')
      .select('id, enrollment_id, amount, currency, scheduled_date, status, retry_count, next_retry_date, last_error, payment_number')
      .eq('tenant_id', tenantId)
      .in('status', ['failed', 'overdue']),
    db
      .from('enrollments')
      .select('id, user_id, product_id, invitation_sent_at, signature_status, status, product:products!enrollments_product_id_fkey(title)')
      .eq('tenant_id', tenantId)
      .eq('status', 'pending')
      .not('invitation_sent_at', 'is', null)
      .lt('invitation_sent_at', new Date(now - 2 * DAY_MS).toISOString()),
    db.from('enrollments').select('id').eq('tenant_id', tenantId).eq('status', 'suspended'),
  ]);
  const scheds = (failed.data ?? []) as any[];
  const enrollmentIds = [...new Set(scheds.map((s) => s.enrollment_id))];
  const { data: enr } = enrollmentIds.length
    ? await db.from('enrollments').select('id, user_id, status, product:products!enrollments_product_id_fkey(title)').in('id', enrollmentIds)
    : { data: [] as any[] };
  const enrById = new Map((enr ?? []).map((e: any) => [e.id, e]));
  const suspendedIds = new Set((suspended.data ?? []).map((e: any) => e.id));

  const userIds = new Set<string>();
  for (const e of enr ?? []) if (e.user_id) userIds.add(e.user_id);
  for (const e of pending.data ?? []) if ((e as any).user_id) userIds.add((e as any).user_id);
  const ids = [...userIds];
  const [{ data: users }, { data: prefs }, { data: runs }, { data: bounces }] = await Promise.all([
    ids.length ? db.from('users').select('id, first_name, last_name, email').in('id', ids) : Promise.resolve({ data: [] as any[] }),
    ids.length ? db.from('notification_preferences').select('user_id, email_enabled, category_preferences').in('user_id', ids) : Promise.resolve({ data: [] as any[] }),
    db.from('chaser_runs').select('id, subject_id, user_id, next_position, next_at, status').eq('tenant_id', tenantId).in('status', ['active', 'done']),
    ids.length ? db.from('email_queue').select('user_id, to_email').eq('bounce_type', 'hard').in('user_id', ids) : Promise.resolve({ data: [] as any[] }),
  ]);
  const userById = new Map((users ?? []).map((u: any) => [u.id, u]));
  const prefById = new Map((prefs ?? []).map((p: any) => [p.user_id, p]));
  const bounced = new Set((bounces ?? []).map((b: any) => b.user_id));
  const runBySubject = new Map<string, any>();
  for (const r of runs ?? []) {
    const k = `${r.subject_id}:${r.user_id}`;
    const cur = runBySubject.get(k);
    if (!cur || r.status === 'active') runBySubject.set(k, r);
  }
  const name = (u: any) => (u ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email : '');
  const off = (uid: string, cat: string) => {
    const p: any = prefById.get(uid);
    return !!p && (p.email_enabled === false || p.category_preferences?.[cat]?.email === false);
  };

  const out: AttentionItem[] = [];
  for (const s of scheds) {
    const e: any = enrById.get(s.enrollment_id);
    if (!e?.user_id || e.status === 'cancelled' || e.status === 'completed') continue;
    const run = runBySubject.get(`${s.id}:${e.user_id}`);
    const late = Math.max(0, Math.floor((now - new Date(s.scheduled_date).getTime()) / DAY_MS));
    out.push({
      key: `pay:${s.id}`,
      kind: 'payment',
      userId: e.user_id,
      client: name(userById.get(e.user_id)),
      product: one<any>(e.product)?.title ?? '',
      amount: s.amount != null ? Number(s.amount) : null,
      currency: s.currency,
      what: { he: s.last_error ? `החיוב נכשל: ${s.last_error}` : 'החיוב נכשל', en: s.last_error ? `Charge failed: ${s.last_error}` : 'Charge failed' },
      sent: run ? Math.max(0, run.next_position - 1) : 0,
      nextAt: s.next_retry_date ?? null,
      lastError: s.last_error ?? null,
      daysLate: late,
      badge: suspendedIds.has(e.id) || e.status === 'suspended' ? 'suspended' : 'late',
      emailOff: off(e.user_id, 'payment'),
      enrollmentId: e.id,
      scheduleId: s.id,
      runId: run?.status === 'active' ? run.id : null,
      bounced: bounced.has(e.user_id),
    });
  }
  for (const e of (pending.data ?? []) as any[]) {
    if (!e.user_id) continue;
    const contract = e.signature_status === 'sent' || e.signature_status === 'delivered';
    const run = runBySubject.get(`${e.id}:${e.user_id}`);
    out.push({
      key: `enr:${e.id}`,
      kind: bounced.has(e.user_id) ? 'email' : 'enrollment',
      userId: e.user_id,
      client: name(userById.get(e.user_id)),
      product: one<any>(e.product)?.title ?? '',
      amount: null,
      currency: null,
      what: contract ? { he: 'החוזה לא נחתם', en: "Contract isn't signed" } : { he: 'ההרשמה לא הושלמה', en: "Enrollment isn't finished" },
      sent: run ? Math.max(0, run.next_position - 1) : 0,
      nextAt: run?.next_at ?? null,
      lastError: null,
      daysLate: Math.floor((now - new Date(e.invitation_sent_at).getTime()) / DAY_MS),
      badge: bounced.has(e.user_id) ? 'bounced' : 'waiting',
      emailOff: off(e.user_id, 'enrollment'),
      enrollmentId: e.id,
      scheduleId: null,
      runId: run?.status === 'active' ? run.id : null,
      bounced: bounced.has(e.user_id),
    });
  }
  return out;
}

export async function needsAttention(tenantId: string) {
  const db = createAdminClient();
  const items = await attentionItems(db, tenantId);
  const { data: t } = await db.from('tenants').select('currency').eq('id', tenantId).maybeSingle();
  return { items, currency: t?.currency || 'USD' };
}

/** "Send a link to update the card": one message to the client, through their settings. */
export async function sendCardLink(tenantId: string, adminId: string, userId: string, enrollmentId: string | null) {
  const db = createAdminClient();
  const { data: client } = await db.from('users').select('id').eq('id', userId).eq('tenant_id', tenantId).maybeSingle();
  if (!client) return { ok: false, status: 404, error: 'Client not found' } as Fail;
  const { data: e } = enrollmentId
    ? await db.from('enrollments').select('product:products!enrollments_product_id_fkey(title)').eq('id', enrollmentId).eq('tenant_id', tenantId).maybeSingle()
    : { data: null };
  const product = one<any>((e as any)?.product)?.title;
  const r = await deliverMessage(
    {
      tenantId,
      userId,
      source: 'manual',
      category: 'payment',
      priority: 'high',
      title: 'עדכון כרטיס לתשלום',
      body: product
        ? `כדי שהתשלומים עבור ${product} ימשיכו בלי הפסקה, אפשר לעדכן כאן את הכרטיס. זה לוקח דקה.`
        : 'כדי שהתשלומים ימשיכו בלי הפסקה, אפשר לעדכן כאן את הכרטיס. זה לוקח דקה.',
      actionUrl: '/billing/card',
      actionLabel: 'עדכון כרטיס',
      createdBy: adminId,
      metadata: { kind: 'card_link', enrollment_id: enrollmentId },
    },
    db,
  );
  return { ok: true as const, outcome: r.outcome, reason: r.reason };
}

export async function stopForClient(tenantId: string, runId: string) {
  const ok = await stopRunManually(tenantId, runId);
  return ok ? { ok: true as const } : ({ ok: false, status: 404, error: 'Already stopped' } as Fail);
}

export { CATALOG };
