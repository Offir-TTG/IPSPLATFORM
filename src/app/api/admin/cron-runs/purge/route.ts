/**
 * Manual purge of `cron_runs` — deletes a date window.
 *
 * POST /api/admin/cron-runs/purge
 * Body: { from: ISO timestamp, to: ISO timestamp }
 *
 * Deletes every `cron_runs` row with started_at >= from AND
 * started_at < to. The dialog on /admin/crons computes the window
 * as [anchor − N days at 00:00, anchor + 1 day at 00:00) so when
 * the admin says "yesterday, 30 days back" they get exactly the
 * last 30 days INCLUDING yesterday wiped.
 *
 * Admin-only, service-role. Returns { success: true, deleted: n }.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data: caller } = await sb
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!caller || !['admin', 'super_admin'].includes(caller.role)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  let body: { from?: string; to?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.from || !body.to || typeof body.from !== 'string' || typeof body.to !== 'string') {
    return NextResponse.json(
      { success: false, error: '`from` and `to` (ISO timestamps) required' },
      { status: 400 },
    );
  }

  const fromDate = new Date(body.from);
  const toDate = new Date(body.to);
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return NextResponse.json({ success: false, error: 'Invalid timestamps' }, { status: 400 });
  }
  if (fromDate.getTime() >= toDate.getTime()) {
    return NextResponse.json(
      { success: false, error: '`from` must be earlier than `to`' },
      { status: 400 },
    );
  }

  // Deleted in slices: one DELETE over a large window (hundreds of
  // thousands of rows) runs past the database's statement timeout and
  // deletes nothing. Each round finds the start time of the BATCH-th
  // oldest run left in the window and deletes everything before it, so
  // every statement stays small. Stops when the window is empty or the
  // time budget is used up (then the admin can press Delete again).
  const admin = createAdminClient();
  const to = toDate.toISOString();
  let from = fromDate.toISOString();
  const started = Date.now();
  let deleted = 0;
  let remaining = false;
  for (;;) {
    if (Date.now() - started > TIME_BUDGET_MS) {
      remaining = true;
      break;
    }
    // The first run past this slice; none means the rest fits in one slice.
    const { data: edge, error: edgeError } = await admin
      .from('cron_runs')
      .select('started_at')
      .gte('started_at', from)
      .lt('started_at', to)
      .order('started_at', { ascending: true })
      .range(BATCH, BATCH);
    if (edgeError) return failed(edgeError, deleted);
    let cut = (edge?.[0]?.started_at as string | undefined) ?? to;
    // More than BATCH runs with the very same start time: take them too,
    // so the slice is never empty.
    if (cut === from) {
      const { data: next } = await admin
        .from('cron_runs')
        .select('started_at')
        .gt('started_at', from)
        .lt('started_at', to)
        .order('started_at', { ascending: true })
        .limit(1);
      cut = (next?.[0]?.started_at as string | undefined) ?? to;
    }

    const { error: deleteError, count } = await admin
      .from('cron_runs')
      .delete({ count: 'exact' })
      .gte('started_at', from)
      .lt('started_at', cut);
    if (deleteError) return failed(deleteError, deleted);
    deleted += count ?? 0;
    if (cut === to) break;
    from = cut;
  }

  return NextResponse.json({ success: true, deleted, remaining });
}

/** Rows deleted per statement (about; runs sharing one start time go together). */
const BATCH = 5000;
/** Stop starting new batches after this long, well inside maxDuration. */
const TIME_BUDGET_MS = 45_000;

export const maxDuration = 60;

function failed(error: { message: string }, deleted: number) {
  console.error('[cron-runs purge] failed:', error);
  const message = deleted
    ? `${deleted} runs were deleted before an error: ${error.message}. Press Delete again to continue.`
    : error.message;
  return NextResponse.json({ success: false, error: message, deleted }, { status: 500 });
}
