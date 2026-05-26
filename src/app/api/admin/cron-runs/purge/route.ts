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

  const admin = createAdminClient();
  const { error, count } = await admin
    .from('cron_runs')
    .delete({ count: 'exact' })
    .gte('started_at', fromDate.toISOString())
    .lt('started_at', toDate.toISOString());

  if (error) {
    console.error('[cron-runs purge] failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, deleted: count ?? 0 });
}
