/**
 * Cron tick wrapper — observability + dry-run gate.
 *
 * Every cron handler wraps its main logic in this helper so:
 *   1. Each tick gets a row in `cron_runs` with status, duration, summary
 *      jsonb (or error message) — so a runaway is visible *immediately*
 *      instead of only after the email blast lands in inboxes.
 *   2. `cron_settings.dry_run` (toggleable from /admin/crons) globally
 *      disables the *write* paths for that cron without code edits.
 *      Read paths still execute and the summary is logged so admins
 *      can verify the shape of what *would* have happened before
 *      re-arming.
 *
 * Dry-run / enabled state is read from the DB (`cron_settings`) every
 * tick so the admin UI is the single source of truth. No env-var
 * override exists — flipping the toggle in /admin/crons is final.
 *
 * Usage:
 *   export async function GET(req: NextRequest) {
 *     if (!authorizeCron(req)) return unauthorized();
 *     return runCron('lesson-reminders', async ({ dryRun }) => {
 *       const work = await doTheReadStuff();
 *       if (!dryRun) await actuallySendEmails(work);
 *       return { lessons: work.length, queued: 0 };
 *     });
 *   }
 *
 * The handler MUST honour `dryRun` by skipping side-effects (inserts,
 * emails, external POSTs). Returns whatever the cron returns as a
 * NextResponse JSON, plus a `_cron` envelope with run_id + dry_run flag.
 *
 * Failure semantics: if the wrapped handler throws, the cron_runs row is
 * marked `failed` with the error message, and the wrapper RE-THROWS so
 * the existing per-cron try/catch still emits the same 500 response.
 * Existing behaviour preserved; observability is purely additive.
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export type CronContext = {
  /** True when `cron_settings.dry_run` is on for this cron. Handlers
   *  must short-circuit any write/email/external-POST path on dry-run. */
  dryRun: boolean;
};

export type CronEnvelope<T> = T & {
  _cron: {
    run_id: string | null;
    duration_ms: number;
    dry_run: boolean;
  };
};

export async function runCron<T extends Record<string, unknown>>(
  cronName: string,
  handler: (ctx: CronContext) => Promise<T>,
): Promise<NextResponse> {
  const supabase = createAdminClient();

  // Per-cron settings from DB (toggleable from /admin/crons; no
  // redeploy). Best-effort: if the table doesn't exist yet or the
  // read fails, default to enabled=true / dry_run=false so the cron
  // still runs. The DB is the only source of truth — no env override.
  let dbEnabled = true;
  let dryRun = false;
  let settingsSource: 'db_row' | 'no_db_row' | 'db_read_error' = 'no_db_row';
  let settingsUpdatedAt: string | null = null;
  try {
    const { data: settings, error: settingsErr } = await supabase
      .from('cron_settings')
      .select('enabled, dry_run, updated_at')
      .eq('cron_name', cronName)
      .maybeSingle();
    if (settingsErr) {
      settingsSource = 'db_read_error';
      console.warn(`[runCron] ${cronName} settings read returned error:`, settingsErr);
    } else if (settings) {
      settingsSource = 'db_row';
      dbEnabled = settings.enabled ?? true;
      dryRun = settings.dry_run ?? false;
      settingsUpdatedAt = (settings as any).updated_at ?? null;
    }
  } catch (e) {
    settingsSource = 'db_read_error';
    console.warn(`[runCron] cron_settings read threw for ${cronName}:`, e);
  }
  // Loud diagnostic. `supabaseHost` confirms which Supabase project
  // the cron is hitting, and `updatedAt` lets you cross-check against
  // the same column in Supabase Studio. If the cron's updated_at
  // disagrees with the value you see in Studio, the cron is reading
  // a different DB than you're editing.
  const supabaseHost = (process.env.NEXT_PUBLIC_SUPABASE_URL || '')
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
  console.log(
    `[runCron] ${cronName} settings:`,
    {
      source: settingsSource,
      dbEnabled,
      dryRun,
      updatedAt: settingsUpdatedAt,
      supabaseHost,
    },
  );

  // Disabled cron: log a 'skipped_disabled' row and bail. We still emit
  // a cron_runs row so the admin sees the tick fired and was suppressed
  // (vs the cron silently vanishing from the timeline).
  if (!dbEnabled) {
    try {
      await supabase.from('cron_runs').insert({
        cron_name: cronName,
        status: 'skipped_disabled',
        dry_run: dryRun,
        finished_at: new Date().toISOString(),
        duration_ms: 0,
      });
    } catch (e) {
      console.warn(`[runCron] cron_runs insert (skipped_disabled) failed:`, e);
    }
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'disabled_in_cron_settings',
      _cron: { run_id: null, duration_ms: 0, dry_run: dryRun },
    });
  }

  // Insert the running row first so a hang/timeout still leaves evidence
  // it ran. `maybeSingle` so a transient DB hiccup logging the start
  // doesn't 500 the cron itself — we degrade to logging-disabled.
  let runId: string | null = null;
  try {
    const { data } = await supabase
      .from('cron_runs')
      .insert({ cron_name: cronName, status: 'running', dry_run: dryRun })
      .select('id')
      .single();
    runId = data?.id ?? null;
  } catch (e) {
    // Logging is best-effort. Cron still proceeds.
    console.warn(`[runCron] cron_runs insert failed for ${cronName}:`, e);
  }

  const t0 = Date.now();

  try {
    const summary = await handler({ dryRun });
    const duration_ms = Date.now() - t0;

    if (runId) {
      await supabase
        .from('cron_runs')
        .update({
          finished_at: new Date().toISOString(),
          duration_ms,
          status: dryRun ? 'skipped_dry_run' : 'success',
          summary,
        })
        .eq('id', runId);
    }

    const envelope: CronEnvelope<T> = {
      ...summary,
      _cron: { run_id: runId, duration_ms, dry_run: dryRun },
    };
    return NextResponse.json(envelope);
  } catch (err) {
    const duration_ms = Date.now() - t0;
    const error_message =
      err instanceof Error ? err.message : String(err ?? 'unknown error');

    if (runId) {
      await supabase
        .from('cron_runs')
        .update({
          finished_at: new Date().toISOString(),
          duration_ms,
          status: 'failed',
          error_message,
        })
        .eq('id', runId)
        .then(() => undefined, (e) => {
          console.warn(`[runCron] cron_runs update-on-failure failed:`, e);
        });
    }

    console.error(`[runCron] ${cronName} failed:`, err);
    return NextResponse.json(
      {
        success: false,
        error: error_message,
        _cron: { run_id: runId, duration_ms, dry_run: dryRun },
      },
      { status: 500 },
    );
  }
}
