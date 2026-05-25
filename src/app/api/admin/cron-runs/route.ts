/**
 * Read cron_runs for the admin monitor (paginated, admin-only).
 *
 * GET /api/admin/cron-runs?page=1&per_page=20&cron_name=...&status=...
 *
 * Uses createAdminClient (service role) so RLS on `cron_runs`, if it
 * gets enabled, doesn't silently empty the admin's view.
 *
 * Response:
 *   {
 *     success: true,
 *     data: CronRun[],        // page rows, newest first
 *     total: number,           // total matching the filters
 *     page: number,
 *     per_page: number,
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { data: caller } = await sb
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!caller || !['admin', 'super_admin'].includes(caller.role)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const cronName = searchParams.get('cron_name');
  const status = searchParams.get('status');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '20', 10)));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const admin = createAdminClient();

  // Hide runs from currently-disabled crons. Deactivating a cron in
  // /admin/crons should make it disappear from the runs panel —
  // historical skipped_disabled rows from before the toggle are
  // noise, not signal. (We can't `eq('enabled', true)` join because
  // cron_runs has no FK to cron_settings; pull the disabled names
  // first and use NOT IN.)
  const { data: settingsRows } = await admin
    .from('cron_settings')
    .select('cron_name, enabled');
  const disabledCronNames = (settingsRows ?? [])
    .filter((r) => r.enabled === false)
    .map((r) => r.cron_name);

  let q = admin
    .from('cron_runs')
    .select('*', { count: 'exact' })
    .order('started_at', { ascending: false })
    .range(from, to);
  if (cronName && cronName !== 'all') q = q.eq('cron_name', cronName);
  if (status && status !== 'all') q = q.eq('status', status);
  if (disabledCronNames.length > 0) {
    // Caveat: if the admin EXPLICITLY filtered to a disabled cron via
    // the dropdown (cron_name=...), the NOT IN below would zero out
    // the result silently. Skip the exclusion in that case so the
    // filter still works for diagnostics.
    if (!cronName || cronName === 'all' || !disabledCronNames.includes(cronName)) {
      q = q.not('cron_name', 'in', `(${disabledCronNames.map((n) => `"${n}"`).join(',')})`);
    }
  }

  const { data, error, count } = await q;
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({
    success: true,
    data: data ?? [],
    total: count ?? 0,
    page,
    per_page: perPage,
  });
}
