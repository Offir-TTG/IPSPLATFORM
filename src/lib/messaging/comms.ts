/**
 * The Communications area: one place for everything that goes out to
 * clients. This file serves its Overview (the numbers from every channel),
 * the one send log (the email queue and the reminders' log together),
 * cancelling an email that is still waiting, and the email template
 * categories.
 *
 * Server only. Every function takes the tenant from the signed-in admin.
 */

import { createAdminClient } from '@/lib/supabase/server';

type Db = ReturnType<typeof createAdminClient>;
type Fail = { ok: false; status: number; error: string };

const DAY_MS = 24 * 60 * 60 * 1000;

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

/** message_log may not exist yet (the reminders SQL not run): read it as empty. */
async function logRows<T>(make: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  try {
    return await allRows(make);
  } catch {
    return [];
  }
}

/** Where an email in the queue came from, when it has no log row of its own. */
function queueSource(row: { trigger_type?: string | null; trigger_event?: string | null }): string {
  if (row.trigger_type === 'scheduled') return 'scheduled';
  if (row.trigger_event === 'daily_summary') return 'digest';
  if (row.trigger_type === 'automated') return 'trigger';
  return 'system';
}

const DELIVERED = new Set(['email_and_bell', 'email_only', 'bell_only', 'in_digest']);

// --- Overview ---------------------------------------------------------------

export async function overview(tenantId: string, days: number) {
  const db = createAdminClient();
  const span = [7, 30, 90, 365].includes(days) ? days : 30;
  const since = new Date(Date.now() - span * DAY_MS);
  const sinceIso = since.toISOString();

  const [queue, logs, waitingQueue, digestWaiting, schedules, templates] = await Promise.all([
    // Before the reminders SQL there is no message_log_id column: read without it.
    allRows<any>((a, b) =>
      db
        .from('email_queue')
        .select('id, status, bounce_type, created_at, sent_at, template_id, trigger_type, trigger_event, message_log_id, to_email')
        .eq('tenant_id', tenantId)
        .gte('created_at', sinceIso)
        .range(a, b),
    ).catch(() =>
      allRows<any>((a, b) =>
        db
          .from('email_queue')
          .select('id, status, bounce_type, created_at, sent_at, template_id, trigger_type, trigger_event, to_email')
          .eq('tenant_id', tenantId)
          .gte('created_at', sinceIso)
          .range(a, b),
      ),
    ),
    logRows<any>((a, b) =>
      db
        .from('message_log')
        .select('id, source, outcome, chaser_id, created_at, chasers(name)')
        .eq('tenant_id', tenantId)
        .gte('created_at', sinceIso)
        .range(a, b),
    ),
    db.from('email_queue').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'pending'),
    db.from('digest_items').select('user_id').eq('tenant_id', tenantId).is('sent_at', null),
    db
      .from('email_schedules')
      .select('id, schedule_name, scheduled_for, status, recipient_count')
      .eq('tenant_id', tenantId)
      .in('status', ['pending', 'processing'])
      .lte('scheduled_for', new Date(Date.now() + DAY_MS).toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(10),
    db.from('email_templates').select('id, template_name, template_key').eq('tenant_id', tenantId),
  ]);

  // Emails: delivered, failed, blocked.
  const emailSent = queue.filter((q) => q.status === 'sent').length;
  const emailFailed = queue.filter((q) => q.status === 'failed' || q.bounce_type === 'hard').length;
  const blocked = new Set(queue.filter((q) => q.bounce_type === 'hard').map((q) => String(q.to_email).toLowerCase())).size;

  // Everything that reached someone: log rows, plus emails sent without a log row.
  const loggedQueue = new Set(logs.map((l) => l.id));
  const unloggedSent = queue.filter((q) => q.status === 'sent' && !(q.message_log_id && loggedQueue.has(q.message_log_id)));
  const totalSent = logs.filter((l) => DELIVERED.has(l.outcome)).length + unloggedSent.length;

  // Per day.
  const byDay = new Map<string, { sent: number; failed: number }>();
  for (let i = span - 1; i >= 0; i--) byDay.set(new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10), { sent: 0, failed: 0 });
  for (const q of queue) {
    const d = byDay.get(String(q.created_at).slice(0, 10));
    if (!d) continue;
    if (q.status === 'sent') d.sent++;
    if (q.status === 'failed' || q.bounce_type === 'hard') d.failed++;
  }
  for (const l of logs) {
    if (l.outcome !== 'bell_only' && l.outcome !== 'in_digest') continue;
    const d = byDay.get(String(l.created_at).slice(0, 10));
    if (d) d.sent++;
  }

  // Where it came from.
  const sources: Record<string, number> = {};
  for (const l of logs) if (DELIVERED.has(l.outcome)) sources[l.source] = (sources[l.source] ?? 0) + 1;
  for (const q of unloggedSent) {
    const s = queueSource(q);
    sources[s] = (sources[s] ?? 0) + 1;
  }

  // How it arrived.
  const outcomes: Record<string, number> = {};
  for (const l of logs) outcomes[l.outcome] = (outcomes[l.outcome] ?? 0) + 1;
  if (unloggedSent.length) outcomes.email_only = (outcomes.email_only ?? 0) + unloggedSent.length;
  const unloggedFailed = queue.filter((q) => (q.status === 'failed' || q.bounce_type === 'hard') && !q.message_log_id).length;
  if (unloggedFailed) outcomes.email_failed = (outcomes.email_failed ?? 0) + unloggedFailed;

  // What was sent most: templates (queue) and reminders (log).
  const tplName = new Map((templates.data ?? []).map((t: any) => [t.id, t.template_name || t.template_key]));
  const tplKey = new Map((templates.data ?? []).map((t: any) => [t.id, t.template_key as string]));
  const most = new Map<string, { label: string; templateKey?: string; sent: number; delivered: number }>();
  for (const q of queue) {
    if (!q.template_id || !['sent', 'failed'].includes(q.status)) continue;
    const key = `t:${q.template_id}`;
    const m = most.get(key) ?? { label: tplName.get(q.template_id) ?? '—', templateKey: tplKey.get(q.template_id), sent: 0, delivered: 0 };
    m.sent++;
    if (q.status === 'sent' && q.bounce_type !== 'hard') m.delivered++;
    most.set(key, m);
  }
  for (const l of logs) {
    if (!l.chaser_id) continue;
    const c = Array.isArray(l.chasers) ? l.chasers[0] : l.chasers;
    const key = `c:${l.chaser_id}`;
    const m = most.get(key) ?? { label: c?.name ?? '—', sent: 0, delivered: 0 };
    if (l.outcome === 'stopped') continue;
    m.sent++;
    if (l.outcome !== 'email_failed') m.delivered++;
    most.set(key, m);
  }

  // Coming up in the next 24 hours.
  const upcoming: { at: string; label: string; count: number; kind: 'scheduled' | 'waiting' | 'digest' }[] = [];
  for (const s of schedules.data ?? []) upcoming.push({ at: s.scheduled_for, label: s.schedule_name, count: s.recipient_count ?? 0, kind: 'scheduled' });
  const digestUsers = new Set((digestWaiting.data ?? []).map((d: any) => d.user_id)).size;
  if (digestUsers) {
    const { data: ms } = await db.from('message_settings').select('digest_time').eq('tenant_id', tenantId).maybeSingle();
    upcoming.push({ at: (ms?.digest_time ?? '18:00').slice(0, 5), label: 'daily_summary', count: digestUsers, kind: 'digest' });
  }
  const { data: laterEmails } = await db
    .from('email_queue')
    .select('scheduled_for, subject')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .gt('scheduled_for', new Date().toISOString())
    .lte('scheduled_for', new Date(Date.now() + DAY_MS).toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(200);
  const grouped = new Map<string, { at: string; label: string; count: number }>();
  for (const e of laterEmails ?? []) {
    const k = `${String(e.scheduled_for).slice(0, 16)}|${e.subject}`;
    const g = grouped.get(k) ?? { at: e.scheduled_for, label: e.subject, count: 0 };
    g.count++;
    grouped.set(k, g);
  }
  for (const g of grouped.values()) upcoming.push({ ...g, kind: 'waiting' });

  return {
    days: span,
    kpis: {
      sent: totalSent,
      emailSent,
      emailTotal: emailSent + emailFailed,
      deliveredRate: emailSent + emailFailed ? Math.round((1000 * emailSent) / (emailSent + emailFailed)) / 10 : null,
      failed: emailFailed + logs.filter((l) => l.outcome === 'email_failed' && !queue.some((q) => q.message_log_id === l.id)).length,
      blocked,
      waiting: (waitingQueue.count ?? 0) + digestUsers,
    },
    daily: [...byDay.entries()].map(([day, v]) => ({ day, ...v })),
    sources,
    outcomes,
    most: [...most.values()].sort((a, b) => b.sent - a.sent).slice(0, 8),
    upcoming: upcoming.slice(0, 8),
  };
}

// --- One send log -----------------------------------------------------------

export interface LogRow {
  key: string;
  logId: string | null;
  queueId: string | null;
  userId: string | null;
  client: string;
  email: string | null;
  title: string;
  source: string;
  reminder: string | null;
  step: number | null;
  category: string | null;
  outcome: string;
  reason: string | null;
  priority: string | null;
  bounce: string | null;
  sendAt: string | null;
  at: string;
  /** An email that is still waiting and can be cancelled. */
  cancellable: boolean;
}

/** Queue status → the log's words for how it arrived. */
function queueOutcome(status: string, bounce: string | null): string {
  if (bounce === 'hard' || bounce === 'soft') return 'email_failed';
  switch (status) {
    case 'sent':
      return 'email_only';
    case 'failed':
      return 'email_failed';
    case 'cancelled':
    case 'expired':
      return 'cancelled';
    default:
      return 'waiting';
  }
}

const OUTCOME_TO_LOG: Record<string, string[]> = {
  sent: ['email_and_bell', 'email_only'],
  bell_only: ['bell_only'],
  waiting: ['waiting'],
  in_digest: ['in_digest'],
  stopped: ['stopped'],
  failed: ['email_failed'],
  cancelled: [],
};
const OUTCOME_TO_QUEUE: Record<string, string[]> = {
  sent: ['sent'],
  bell_only: [],
  waiting: ['pending', 'processing'],
  in_digest: [],
  stopped: [],
  failed: ['failed'],
  cancelled: ['cancelled', 'expired'],
};

export async function sendLog(
  tenantId: string,
  opts: { outcome?: string; source?: string; priority?: string; q?: string; today?: boolean; page?: number },
) {
  const db = createAdminClient();
  const pageSize = 25;
  const page = Math.max(1, opts.page ?? 1);
  const want = page * pageSize;
  const since = opts.today ? new Date(Date.now() - DAY_MS).toISOString() : null;
  const term = opts.q?.trim().replace(/[%,()]/g, ' ') || '';

  let userIds: string[] | null = null;
  if (term) {
    const { data: users } = await db
      .from('users')
      .select('id')
      .eq('tenant_id', tenantId)
      .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`)
      .limit(200);
    userIds = (users ?? []).map((u: any) => u.id);
  }

  const logOutcomes = opts.outcome ? OUTCOME_TO_LOG[opts.outcome] ?? [] : null;
  const queueStatuses = opts.outcome ? OUTCOME_TO_QUEUE[opts.outcome] ?? [] : null;
  const sourceIsLogOnly = !!opts.source && !['scheduled', 'trigger', 'system', 'digest'].includes(opts.source);

  // The reminders' log (every message sent through the delivery check).
  let logPart: any[] = [];
  let logCount = 0;
  if (!logOutcomes || logOutcomes.length) {
    let q = db
      .from('message_log')
      .select('id, user_id, to_email, source, chaser_id, step_id, category, title, outcome, reason, send_at, email_queue_id, created_at, users(first_name, last_name, email), chasers(name)', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (logOutcomes) q = q.in('outcome', logOutcomes);
    if (opts.source) q = q.eq('source', opts.source);
    if (since) q = q.gte('created_at', since);
    if (term) q = userIds?.length ? q.or(`user_id.in.(${userIds.join(',')}),title.ilike.%${term}%,to_email.ilike.%${term}%`) : q.or(`title.ilike.%${term}%,to_email.ilike.%${term}%`);
    const { data, count, error } = await q.range(0, want - 1);
    if (!error) {
      logPart = data ?? [];
      logCount = count ?? 0;
    }
  }

  // Emails in the queue that have no log row of their own.
  let queuePart: any[] = [];
  let queueCount = 0;
  if ((!queueStatuses || queueStatuses.length) && !sourceIsLogOnly && opts.source !== 'digest_only') {
    let q = db
      .from('email_queue')
      .select('id, user_id, to_email, to_name, subject, status, priority, bounce_type, scheduled_for, error_message, trigger_type, trigger_event, created_at', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('message_log_id', null)
      .order('created_at', { ascending: false });
    if (queueStatuses) q = q.in('status', queueStatuses);
    if (opts.outcome === 'failed') q = db
      .from('email_queue')
      .select('id, user_id, to_email, to_name, subject, status, priority, bounce_type, scheduled_for, error_message, trigger_type, trigger_event, created_at', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('message_log_id', null)
      .or('status.eq.failed,bounce_type.eq.hard,bounce_type.eq.soft')
      .order('created_at', { ascending: false });
    if (opts.priority) q = q.eq('priority', opts.priority);
    if (opts.source === 'scheduled') q = q.eq('trigger_type', 'scheduled');
    if (opts.source === 'trigger') q = q.eq('trigger_type', 'automated').neq('trigger_event', 'daily_summary');
    if (opts.source === 'digest') q = q.eq('trigger_event', 'daily_summary');
    if (opts.source === 'system') q = q.or('trigger_type.is.null,trigger_type.eq.api,trigger_type.eq.manual');
    if (since) q = q.gte('created_at', since);
    if (term) q = q.or(`to_email.ilike.%${term}%,subject.ilike.%${term}%,to_name.ilike.%${term}%`);
    const res = await q.range(0, want - 1);
    if (res.error) {
      // Before the reminders SQL there is no message_log_id column: read the queue without it.
      if (/message_log_id/.test(res.error.message)) {
        let q2 = db
          .from('email_queue')
          .select('id, user_id, to_email, to_name, subject, status, priority, bounce_type, scheduled_for, error_message, trigger_type, trigger_event, created_at', { count: 'exact' })
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });
        if (queueStatuses) q2 = q2.in('status', queueStatuses);
        if (opts.priority) q2 = q2.eq('priority', opts.priority);
        if (since) q2 = q2.gte('created_at', since);
        if (term) q2 = q2.or(`to_email.ilike.%${term}%,subject.ilike.%${term}%,to_name.ilike.%${term}%`);
        const r2 = await q2.range(0, want - 1);
        queuePart = r2.data ?? [];
        queueCount = r2.count ?? 0;
      }
    } else {
      queuePart = res.data ?? [];
      queueCount = res.count ?? 0;
    }
  }

  // Queue rows behind the log rows: status, priority, bounce, and whether they can still be cancelled.
  const linkedIds = logPart.map((l) => l.email_queue_id).filter(Boolean);
  const { data: linked } = linkedIds.length
    ? await db.from('email_queue').select('id, status, priority, bounce_type').in('id', linkedIds)
    : { data: [] as any[] };
  const linkedById = new Map((linked ?? []).map((r: any) => [r.id, r]));
  const stepIds = [...new Set(logPart.map((l) => l.step_id).filter(Boolean))];
  const { data: steps } = stepIds.length ? await db.from('chaser_steps').select('id, position').in('id', stepIds) : { data: [] as any[] };
  const pos = new Map((steps ?? []).map((s: any) => [s.id, s.position]));
  const one = (x: any) => (Array.isArray(x) ? x[0] : x);

  const rows: LogRow[] = [
    ...logPart.map((l): LogRow => {
      const u = one(l.users);
      const qr: any = l.email_queue_id ? linkedById.get(l.email_queue_id) : null;
      return {
        key: `l:${l.id}`,
        logId: l.id,
        queueId: l.email_queue_id ?? null,
        userId: l.user_id,
        client: u ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email : l.to_email ?? '',
        email: u?.email ?? l.to_email ?? null,
        title: l.title,
        source: l.source,
        reminder: one(l.chasers)?.name ?? null,
        step: l.step_id ? pos.get(l.step_id) ?? null : null,
        category: l.category,
        outcome: qr?.status === 'cancelled' ? 'cancelled' : l.outcome,
        reason: l.reason,
        priority: qr?.priority ?? null,
        bounce: qr?.bounce_type ?? null,
        sendAt: l.send_at,
        at: l.created_at,
        cancellable: qr?.status === 'pending',
      };
    }),
    ...queuePart.map((q): LogRow => ({
      key: `q:${q.id}`,
      logId: null,
      queueId: q.id,
      userId: q.user_id,
      client: q.to_name || q.to_email,
      email: q.to_email,
      title: q.subject,
      source: queueSource(q),
      reminder: null,
      step: null,
      category: null,
      outcome: queueOutcome(q.status, q.bounce_type),
      reason: q.status === 'failed' || q.status === 'cancelled' ? q.error_message : null,
      priority: q.priority,
      bounce: q.bounce_type,
      sendAt: q.status === 'pending' && q.scheduled_for ? q.scheduled_for : null,
      at: q.created_at,
      cancellable: q.status === 'pending',
    })),
  ]
    // Priority lives on emails; a bell-only row has none, so it drops out of a priority filter.
    .filter((r) => !opts.priority || r.priority === opts.priority)
    .sort((a, b) => (a.at < b.at ? 1 : -1));

  return {
    rows: rows.slice((page - 1) * pageSize, page * pageSize),
    total: logCount + queueCount,
    page,
    pageSize,
  };
}

/** Cancels emails that are still waiting. Their log rows say "cancelled". */
export async function cancelQueued(tenantId: string, queueIds: string[]) {
  if (!Array.isArray(queueIds) || !queueIds.length) return { ok: false, status: 400, error: 'Nothing chosen' } as Fail;
  const db = createAdminClient();
  const ids = queueIds.filter((x) => typeof x === 'string').slice(0, 500);
  const { data, error } = await db
    .from('email_queue')
    .update({ status: 'cancelled', error_message: 'Cancelled by admin', updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .in('id', ids)
    .select('id, message_log_id');
  if (error && /message_log_id/.test(error.message)) {
    const r = await db
      .from('email_queue')
      .update({ status: 'cancelled', error_message: 'Cancelled by admin', updated_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .eq('status', 'pending')
      .in('id', ids)
      .select('id');
    return { ok: true as const, cancelled: r.data?.length ?? 0 };
  }
  if (error) return { ok: false, status: 500, error: error.message } as Fail;
  const logIds = (data ?? []).map((r: any) => r.message_log_id).filter(Boolean);
  if (logIds.length) {
    await db.from('message_log').update({ outcome: 'stopped', reason: 'cancelled', send_at: null }).in('id', logIds);
  }
  return { ok: true as const, cancelled: data?.length ?? 0 };
}

// --- Template categories (were on Email settings) --------------------------

export interface TemplateCategory {
  value: string;
  label_en: string;
  label_he: string;
  color: string;
  dark_color: string;
}

export async function getCategories(tenantId: string): Promise<{ categories: TemplateCategory[] | null }> {
  const db = createAdminClient();
  const { data } = await db.from('tenant_settings').select('settings').eq('tenant_id', tenantId).eq('setting_key', 'email_categories').maybeSingle();
  return { categories: (data?.settings as any)?.categories ?? null };
}

export async function saveCategories(tenantId: string, categories: TemplateCategory[]) {
  if (!Array.isArray(categories) || !categories.length) return { ok: false, status: 400, error: 'Keep at least one category.' } as Fail;
  const seen = new Set<string>();
  for (const c of categories) {
    if (!c.value?.trim() || !c.label_en?.trim() || !c.label_he?.trim()) return { ok: false, status: 400, error: 'Every category needs a key and a name in both languages.' } as Fail;
    if (seen.has(c.value.trim())) return { ok: false, status: 400, error: `The key "${c.value}" is used twice.` } as Fail;
    seen.add(c.value.trim());
  }
  const db = createAdminClient();
  const clean = categories.map((c) => ({ value: c.value.trim(), label_en: c.label_en.trim(), label_he: c.label_he.trim(), color: c.color, dark_color: c.dark_color }));
  const { data: existing } = await db.from('tenant_settings').select('tenant_id').eq('tenant_id', tenantId).eq('setting_key', 'email_categories').maybeSingle();
  const res = existing
    ? await db.from('tenant_settings').update({ settings: { categories: clean }, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('setting_key', 'email_categories')
    : await db.from('tenant_settings').insert({ tenant_id: tenantId, setting_key: 'email_categories', settings: { categories: clean }, updated_at: new Date().toISOString() });
  if (res.error) return { ok: false, status: 500, error: res.error.message } as Fail;
  return { ok: true as const };
}

// --- Templates ----------------------------------------------------------------

export async function listTemplates(tenantId: string) {
  const db = createAdminClient();
  const [{ data: templates, error }, { data: triggers }, cats] = await Promise.all([
    db
      .from('email_templates')
      .select('id, template_key, template_name, template_category, description, is_system, is_active, variables')
      .eq('tenant_id', tenantId)
      .order('template_category', { ascending: true })
      .order('template_name', { ascending: true }),
    db.from('email_triggers').select('id, trigger_name, template_id, is_active').eq('tenant_id', tenantId),
    getCategories(tenantId),
  ]);
  if (error) return { ok: false, status: 500, error: error.message } as Fail;
  const ids = (templates ?? []).map((t: any) => t.id);
  const { data: versions } = ids.length
    ? await db.from('email_template_versions').select('template_id, language_code').in('template_id', ids).eq('is_current', true)
    : { data: [] as any[] };
  const langs = new Map<string, string[]>();
  for (const v of versions ?? []) langs.set(v.template_id, [...(langs.get(v.template_id) ?? []), v.language_code]);
  return {
    categories: cats.categories,
    templates: (templates ?? []).map((t: any) => ({
      ...t,
      languages: (langs.get(t.id) ?? []).sort((a, b) => (a === 'he' ? -1 : b === 'he' ? 1 : a.localeCompare(b))),
      variableCount: Array.isArray(t.variables) ? t.variables.length : t.variables && typeof t.variables === 'object' ? Object.keys(t.variables).length : 0,
      usedBy: (triggers ?? []).filter((g: any) => g.template_id === t.id).map((g: any) => ({ kind: 'trigger', name: g.trigger_name, active: g.is_active })),
    })),
  };
}

/** One template's words in each language, inside the school's email layout. */
export async function templatePreview(tenantId: string, id: string) {
  const db = createAdminClient();
  const { data: t } = await db.from('email_templates').select('id, template_name, template_key, template_category, description, is_system, is_active, variables').eq('tenant_id', tenantId).eq('id', id).maybeSingle();
  if (!t) return { ok: false, status: 404, error: 'Not found' } as Fail;
  const { data: versions } = await db.from('email_template_versions').select('language_code, subject, body_html, body_text').eq('template_id', id).eq('is_current', true);
  const { loadSchool } = await import('./deliver');
  const { renderEmailLayout } = await import('@/lib/email/layout');
  const school = await loadSchool(db, tenantId);
  const out: Record<string, { subject: string; html: string; text: string }> = {};
  for (const v of versions ?? []) {
    const lang = v.language_code === 'en' ? 'en' : 'he';
    out[v.language_code] = {
      subject: v.subject ?? '',
      html: renderEmailLayout(v.body_html ?? '', {
        language: lang,
        organizationName: school.name,
        primaryColor: school.primaryColor,
        buttonColor: school.buttonColor,
        logoUrl: school.logoUrl,
        headerStyle: school.headerStyle,
        footerNote: school.footerNote,
      }),
      text: v.body_text ?? '',
    };
  }
  return { template: t, versions: out };
}

/** One template for its editor: details, categories and each language's current words. */
export async function templateForEdit(tenantId: string, id: string) {
  const db = createAdminClient();
  const { data: t } = await db
    .from('email_templates')
    .select('id, template_key, template_name, template_category, description, is_system, is_active, variables')
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .maybeSingle();
  if (!t) return { ok: false, status: 404, error: 'Not found' } as Fail;
  const [{ data: versions }, cats] = await Promise.all([
    db.from('email_template_versions').select('id, language_code, subject, body_html, body_text').eq('template_id', id).eq('is_current', true),
    getCategories(tenantId),
  ]);
  return { template: t, versions: versions ?? [], categories: cats.categories };
}

/** Saves the category and the words of each language that already has a version (as the old editor did). */
export async function saveTemplate(
  tenantId: string,
  id: string,
  input: { category?: string; versions?: Record<string, { subject: string; body_html: string; body_text: string }> },
) {
  const db = createAdminClient();
  const { data: t } = await db.from('email_templates').select('id, template_category').eq('tenant_id', tenantId).eq('id', id).maybeSingle();
  if (!t) return { ok: false, status: 404, error: 'Not found' } as Fail;
  for (const [lang, v] of Object.entries(input.versions ?? {})) {
    if (!v.subject?.trim()) return { ok: false, status: 400, error: `${lang === 'he' ? 'Hebrew' : 'English'}: write a subject.`, field: `${lang}.subject` } as Fail & { field: string };
    if (!v.body_html?.replace(/<[^>]*>/g, '').trim()) return { ok: false, status: 400, error: `${lang === 'he' ? 'Hebrew' : 'English'}: write the email.`, field: `${lang}.body_html` } as Fail & { field: string };
  }
  if (input.category && input.category !== t.template_category) {
    const { error } = await db.from('email_templates').update({ template_category: input.category, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return { ok: false, status: 500, error: error.message } as Fail;
  }
  const { data: current } = await db.from('email_template_versions').select('id, language_code').eq('template_id', id).eq('is_current', true);
  for (const v of current ?? []) {
    const words = input.versions?.[v.language_code];
    if (!words) continue;
    const { error } = await db
      .from('email_template_versions')
      .update({ subject: words.subject, body_html: words.body_html, body_text: words.body_text ?? '' })
      .eq('id', v.id);
    if (error) return { ok: false, status: 500, error: error.message } as Fail;
  }
  return { ok: true as const };
}
