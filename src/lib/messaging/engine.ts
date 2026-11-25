/**
 * The automatic reminders engine.
 *
 *   discover  for each reminder that is on, find its cases (a failed
 *             payment, a meeting tomorrow, an unfinished enrollment) and
 *             start a run for each new one
 *   process   for each run whose next step is due: check the stop
 *             conditions, send the step through deliverMessage (the
 *             client's settings decide how it arrives), move on
 *   fireEvent reminders started where something happens (a recording is
 *             up, an enrollment is suspended, a coaching session moved)
 *
 * When several steps are due at once (the reminder was just turned on for
 * existing cases, or the engine was down), only the latest is sent. A step
 * tied to a time that is over an hour late is skipped.
 *
 * Server only.
 */

import { createAdminClient } from '@/lib/supabase/server';
import { DEFAULT_FALLBACK_TIMEZONE } from '@/lib/datetime/timezone';
import { CATALOG_BY_KEY, fillPlaceholders, type CatalogEvent } from './catalog';
import { actionPath, placeholderValues, type CaseContext } from './context';
import { deliverMessage, logExternalSend, type DeliveryResult } from './deliver';
import { htmlToText } from './html';
import { EVENT_CHECKS, SOURCES, type Case, type RunRow } from './sources';
import { ensureSeeded, loadChasers, activeChaserFor, type Chaser, type ChaserStep } from './store';
import { notifyTeam } from './teamAlerts';

type Db = ReturnType<typeof createAdminClient>;

const MIN_MS = 60_000;
const DAY_MS = 24 * 60 * MIN_MS;
const LATE_LIMIT_MS = 60 * MIN_MS;
/** Stops that always end a run, whatever the reminder's stop list says. */
const ALWAYS_STOP = new Set(['rescheduled', 'resent', 'lesson_moved', 'session_changed', 'manual']);

const RUN_COLUMNS = 'id, tenant_id, chaser_id, subject_type, subject_id, user_id, anchor_at, status, next_position, next_at, context';

export interface EngineSummary {
  tenants: number;
  discovered: number;
  sent: number;
  stopped: number;
  skipped: number;
  errors: string[];
}

function orderedSteps(c: Chaser): ChaserStep[] {
  return [...c.steps].sort((a, b) => a.position - b.position);
}

function stepTime(anchor: string | Date, step: ChaserStep): number {
  return new Date(anchor).getTime() + step.offset_minutes * MIN_MS;
}

// --- discover ---------------------------------------------------------------

async function discover(db: Db, chaser: Chaser, now: Date, summary: EngineSummary): Promise<void> {
  const ev = CATALOG_BY_KEY[chaser.event_key];
  const src = ev && ev.source === 'poll' ? SOURCES[ev.key] : undefined;
  if (!ev || !src) return;
  const steps = orderedSteps(chaser);
  if (!steps.length) return;
  if (src.everyMinutes && Math.floor(now.getTime() / MIN_MS) % src.everyMinutes >= 5) return;

  const earliest = Math.min(...steps.map((s) => s.offset_minutes));
  const until = new Date(now.getTime() + Math.min(Math.max(0, -earliest) * MIN_MS + 60 * MIN_MS, 60 * DAY_MS));
  const activated = chaser.activated_at ? new Date(chaser.activated_at) : now;
  const since = chaser.applies_to === 'all' ? new Date(now.getTime() - 30 * DAY_MS) : activated;

  let cases: Case[] = await src.find({ db, tenantId: chaser.tenant_id, now, since, until });
  if (chaser.product_ids?.length) {
    const allowed = new Set(chaser.product_ids);
    cases = cases.filter((c) => !c.productId || allowed.has(c.productId));
  }
  if (!cases.length) return;

  if (src.oncePerCase) {
    const { data: had } = await db
      .from('chaser_runs')
      .select('subject_id, user_id')
      .eq('chaser_id', chaser.id)
      .in('subject_id', [...new Set(cases.map((c) => c.subjectId))]);
    const seen = new Set((had ?? []).map((r: any) => `${r.subject_id}:${r.user_id}`));
    cases = cases.filter((c) => !seen.has(`${c.subjectId}:${c.userId}`));
    if (!cases.length) return;
  }

  const rows = cases.map((c) => ({
    tenant_id: chaser.tenant_id,
    chaser_id: chaser.id,
    subject_type: c.subjectType,
    subject_id: c.subjectId,
    user_id: c.userId,
    anchor_at: c.anchorAt.toISOString(),
    status: 'active',
    next_position: steps[0].position,
    next_at: new Date(stepTime(c.anchorAt, steps[0])).toISOString(),
    context: c.context,
  }));
  for (let i = 0; i < rows.length; i += 200) {
    const { data, error } = await db
      .from('chaser_runs')
      .upsert(rows.slice(i, i + 200), { onConflict: 'chaser_id,subject_type,subject_id,user_id,anchor_at', ignoreDuplicates: true })
      .select('id');
    if (error) summary.errors.push(`${chaser.event_key} discover: ${error.message}`);
    else summary.discovered += data?.length ?? 0;
  }
}

// --- process ----------------------------------------------------------------

interface SchoolFmt {
  timezone: string;
  currency: string;
}

const fmtCache = new Map<string, SchoolFmt>();

async function schoolFormat(db: Db, tenantId: string): Promise<SchoolFmt> {
  const hit = fmtCache.get(tenantId);
  if (hit) return hit;
  const { data } = await db.from('tenants').select('timezone, currency').eq('id', tenantId).maybeSingle();
  const f = { timezone: data?.timezone || DEFAULT_FALLBACK_TIMEZONE, currency: data?.currency || 'USD' };
  fmtCache.set(tenantId, f);
  return f;
}

/** One step's words for one client, filled in. */
export async function renderStep(
  db: Db,
  args: { tenantId: string; userId: string; ev: CatalogEvent | undefined; step: ChaserStep; context: CaseContext },
): Promise<{ title: string; html: string; text: string; actionUrl: string | null; actionLabel: string | null; lang: 'he' | 'en'; clientName: string }> {
  const [{ data: u }, school] = await Promise.all([
    db.from('users').select('first_name, last_name, email, preferred_language, timezone').eq('id', args.userId).maybeSingle(),
    schoolFormat(db, args.tenantId),
  ]);
  // The client portal is Hebrew only, so reminders go out in Hebrew.
  const lang: 'he' | 'en' = 'he';
  const values = placeholderValues(args.context, (u?.first_name || '').trim(), {
    lang,
    timezone: u?.timezone || school.timezone,
    currency: school.currency,
  });
  const title = fillPlaceholders(args.step.title_he, args.ev, values).trim();
  const html = fillPlaceholders(args.step.body_he, args.ev, values);
  const action = args.ev?.actions.find((a) => a.key === args.step.action_key);
  const label = args.step.action_label_he || (action ? action.he : null);
  return {
    title,
    html,
    text: htmlToText(html),
    actionUrl: actionPath(args.step.action_key, args.context),
    actionLabel: label,
    lang,
    clientName: `${u?.first_name ?? ''} ${u?.last_name ?? ''}`.trim() || u?.email || '',
  };
}

async function sendStep(db: Db, chaser: Chaser, ev: CatalogEvent | undefined, step: ChaserStep, run: RunRow): Promise<DeliveryResult | null> {
  if (!run.user_id) return null;
  const r = await renderStep(db, { tenantId: run.tenant_id, userId: run.user_id, ev, step, context: run.context });
  const result = await deliverMessage(
    {
      tenantId: run.tenant_id,
      userId: run.user_id,
      source: 'reminder',
      category: ev?.category ?? 'announcement',
      title: r.title,
      body: r.text,
      bodyHtml: r.html,
      actionUrl: r.actionUrl,
      actionLabel: r.actionLabel,
      email: step.send_email,
      timeSensitiveUntil: ev?.timeSensitive ? new Date(run.anchor_at) : null,
      useSendHours: !ev?.timeSensitive,
      sendFrom: chaser.send_from,
      sendUntil: chaser.send_until,
      skipShabbat: chaser.skip_shabbat,
      priority: ev?.category === 'payment' ? 'high' : 'medium',
      metadata: { kind: `reminder_${chaser.event_key}`, subject_type: run.subject_type, subject_id: run.subject_id },
      chaser: { chaserId: chaser.id, stepId: step.id, runId: run.id },
    },
    db,
  );
  if (step.admin_copy || chaser.admin_copy) {
    const n = step.position;
    await notifyTeam({
      tenantId: run.tenant_id,
      kind: 'reminder_copy',
      actionUrl: `/admin/reminders?open=${chaser.id}`,
      he: { title: `${chaser.name} · שלב ${n} נשלח ל${r.clientName}`, body: r.title, actionLabel: 'לתזכורת' },
      en: { title: `${chaser.name} · step ${n} sent to ${r.clientName}`, body: r.title, actionLabel: 'Open reminder' },
      metadata: { chaser_id: chaser.id, run_id: run.id },
    });
  }
  return result;
}

async function stopRun(db: Db, run: RunRow, chaser: Chaser, reason: string, nextStep: ChaserStep | undefined) {
  await db.from('chaser_runs').update({ status: 'stopped', stop_reason: reason, next_at: null, updated_at: new Date().toISOString() }).eq('id', run.id);
  // The send log shows the step that didn't go out, and why.
  if (nextStep && run.user_id) {
    await logExternalSend(
      {
        tenantId: run.tenant_id,
        userId: run.user_id,
        source: 'reminder',
        category: CATALOG_BY_KEY[chaser.event_key]?.category ?? null,
        title: nextStep.title_he,
        outcome: 'stopped',
        reason,
        chaser: { chaserId: chaser.id, stepId: nextStep.id, runId: run.id },
      },
      db,
    );
  }
}

/** Handles one run whose next step is due. Returns what happened. */
export async function processRun(db: Db, chaser: Chaser, run: RunRow, now: Date): Promise<'sent' | 'stopped' | 'skipped' | 'waiting' | 'done'> {
  const ev = CATALOG_BY_KEY[chaser.event_key];
  const steps = orderedSteps(chaser);
  const remaining = steps.filter((s) => s.position >= run.next_position);
  if (!remaining.length) {
    await db.from('chaser_runs').update({ status: 'done', next_at: null, updated_at: now.toISOString() }).eq('id', run.id);
    return 'done';
  }

  // Stop conditions.
  const check = ev?.source === 'poll' ? SOURCES[ev.key]?.check : EVENT_CHECKS[chaser.event_key];
  if (check) {
    const res = await check(db, run);
    if (res.stop) {
      const locked = ev?.stops.find((s) => s.key === res.stop)?.locked;
      if (ALWAYS_STOP.has(res.stop) || locked || chaser.stop_on.includes(res.stop)) {
        await stopRun(db, run, chaser, res.stop, remaining[0]);
        return 'stopped';
      }
    }
    if (res.context) run = { ...run, context: res.context };
  }

  const due = remaining.filter((s) => stepTime(run.anchor_at, s) <= now.getTime());
  if (!due.length) {
    const next = new Date(stepTime(run.anchor_at, remaining[0])).toISOString();
    if (next !== run.next_at) await db.from('chaser_runs').update({ next_at: next }).eq('id', run.id);
    return 'waiting';
  }

  const step = due[due.length - 1];
  const after = remaining.find((s) => s.position > step.position);
  // Claim the step first, so two engine runs at once can't both send it.
  const { data: claimed } = await db
    .from('chaser_runs')
    .update({
      next_position: step.position + 1,
      next_at: after ? new Date(stepTime(run.anchor_at, after)).toISOString() : null,
      status: after ? 'active' : 'done',
      context: run.context,
      updated_at: now.toISOString(),
    })
    .eq('id', run.id)
    .eq('next_position', run.next_position)
    .select('id');
  if (!claimed?.length) return 'skipped';

  const late = now.getTime() - stepTime(run.anchor_at, step);
  if (ev?.timeSensitive && late > LATE_LIMIT_MS) return 'skipped';

  await sendStep(db, chaser, ev, step, run);
  return 'sent';
}

async function processDue(db: Db, tenantId: string, chasers: Chaser[], now: Date, summary: EngineSummary) {
  const byId = new Map(chasers.map((c) => [c.id, c]));
  if (!byId.size) return;
  const { data: runs, error } = await db
    .from('chaser_runs')
    .select(RUN_COLUMNS)
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .lte('next_at', now.toISOString())
    .in('chaser_id', [...byId.keys()])
    .order('next_at', { ascending: true })
    .limit(300);
  if (error) {
    summary.errors.push(`runs: ${error.message}`);
    return;
  }
  for (const run of (runs ?? []) as RunRow[]) {
    const chaser = byId.get(run.chaser_id);
    if (!chaser) continue;
    try {
      const r = await processRun(db, chaser, run, now);
      if (r === 'sent') summary.sent++;
      else if (r === 'stopped') summary.stopped++;
      else if (r === 'skipped') summary.skipped++;
    } catch (e) {
      summary.errors.push(`run ${run.id}: ${(e as Error).message}`);
    }
  }
}

/** One engine pass over every school. */
export async function runReminders(opts: { dryRun?: boolean } = {}): Promise<EngineSummary> {
  const db = createAdminClient();
  const now = new Date();
  const summary: EngineSummary = { tenants: 0, discovered: 0, sent: 0, stopped: 0, skipped: 0, errors: [] };
  const { data: tenants, error } = await db.from('tenants').select('id').neq('status', 'deleted');
  if (error) throw new Error(`tenants: ${error.message}`);
  for (const t of tenants ?? []) {
    try {
      await ensureSeeded(db, t.id);
      const active = await loadChasers(db, t.id, { status: 'active' });
      if (!active.length) continue;
      summary.tenants++;
      if (opts.dryRun) continue;
      for (const c of active) {
        try {
          await discover(db, c, now, summary);
        } catch (e) {
          summary.errors.push(`${c.event_key}: ${(e as Error).message}`);
        }
      }
      await processDue(db, t.id, active, now, summary);
    } catch (e) {
      summary.errors.push(`tenant ${t.id}: ${(e as Error).message}`);
    }
  }
  return summary;
}

// --- events -----------------------------------------------------------------

export interface FiredCase {
  subjectType: string;
  subjectId: string;
  userId: string;
  productId?: string | null;
  context: CaseContext;
  /** Defaults to now. */
  anchorAt?: Date;
}

/**
 * Starts the reminder for an event that just happened, for each client
 * given, and sends what's due now. Returns how many clients it started for
 * (0 when the reminder is off). Never throws.
 */
export async function fireEvent(tenantId: string, eventKey: string, cases: FiredCase[]): Promise<number> {
  try {
    if (!cases.length) return 0;
    const db = createAdminClient();
    const chaser = await activeChaserFor(db, tenantId, eventKey);
    if (!chaser || !chaser.steps.length) return 0;
    const steps = orderedSteps(chaser);
    let wanted = cases;
    if (chaser.product_ids?.length) {
      const allowed = new Set(chaser.product_ids);
      wanted = wanted.filter((c) => !c.productId || allowed.has(c.productId));
    }
    const now = new Date();
    let started = 0;
    for (const c of wanted) {
      const anchor = c.anchorAt ?? now;
      const { data, error } = await db
        .from('chaser_runs')
        .upsert(
          {
            tenant_id: tenantId,
            chaser_id: chaser.id,
            subject_type: c.subjectType,
            subject_id: c.subjectId,
            user_id: c.userId,
            anchor_at: anchor.toISOString(),
            status: 'active',
            next_position: steps[0].position,
            next_at: new Date(stepTime(anchor, steps[0])).toISOString(),
            context: c.context,
          },
          { onConflict: 'chaser_id,subject_type,subject_id,user_id,anchor_at', ignoreDuplicates: true },
        )
        .select(RUN_COLUMNS);
      if (error) {
        console.error('[reminders] fireEvent insert failed', error.message);
        continue;
      }
      const run = data?.[0] as RunRow | undefined;
      if (!run) continue;
      started++;
      await processRun(db, chaser, run, now);
    }
    return started;
  } catch (error) {
    console.error('[reminders] fireEvent failed', error);
    return 0;
  }
}

/** Stops one client's run by hand (from the drawer or Needs attention). */
export async function stopRunManually(tenantId: string, runId: string): Promise<boolean> {
  const db = createAdminClient();
  const { data } = await db
    .from('chaser_runs')
    .update({ status: 'stopped', stop_reason: 'manual', next_at: null, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .eq('id', runId)
    .eq('status', 'active')
    .select('id');
  return !!data?.length;
}
