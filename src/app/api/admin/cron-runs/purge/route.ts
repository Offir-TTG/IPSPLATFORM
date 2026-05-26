/**
 * Manual purge of `cron_runs`.
 *
 * POST /api/admin/cron-runs/purge
 * Body: { before: ISO timestamp }
 *
 * Deletes every `cron_runs` row whose `started_at < before`. The
 * caller is expected to compute `before` from an anchor date + days
 * back (cron monitor dialog does this). Admin-only, service-role.
 *
 * Returns { success: true, deleted: number }.
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

  let body: { before?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.before || typeof body.before !== 'string') {
    return NextResponse.json({ success: false, error: '`before` (ISO timestamp) required' }, { status: 400 });
  }

  const beforeDate = new Date(body.before);
  if (isNaN(beforeDate.getTime())) {
    return NextResponse.json({ success: false, error: 'Invalid `before` timestamp' }, { status: 400 });
  }

  // Sanity bound: refuse a wide-open delete (anchor=now, depth=0
  // would wipe everything). Force the cutoff to be at least 1 hour
  // in the past so the admin can't accidentally torch live history.
  const minPastMs = 60 * 60 * 1000;
  if (beforeDate.getTime() > Date.now() - minPastMs) {
    return NextResponse.json(
      { success: false, error: 'Cutoff must be at least 1 hour in the past' },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  // .select() forces PostgREST to return the deleted rows so we can
  // count them; using { count: 'exact' } on a delete is the simplest
  // way to get a row count back.
  const { error, count } = await admin
    .from('cron_runs')
    .delete({ count: 'exact' })
    .lt('started_at', beforeDate.toISOString());

  if (error) {
    console.error('[cron-runs purge] failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, deleted: count ?? 0 });
}
