import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/debug/cron-settings
//
// Returns the EXACT same query the runCron() wrapper runs on every
// tick — using the same `createAdminClient()` (service role,
// bypasses RLS). Hit this from the browser and compare what comes
// back to what you see in Supabase Studio's `SELECT * FROM
// cron_settings`. If the two differ, your Vercel server functions
// and your Supabase Studio session are pointing at different
// projects, and the env var mismatch is the bug.
//
// Also reports the Supabase project hostname the function is
// connected to so the comparison is one-shot.
export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: caller } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!caller || !['admin', 'super_admin'].includes(caller.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from('cron_settings')
    .select('cron_name, enabled, dry_run, updated_at')
    .order('cron_name');

  const supabaseHost = (process.env.NEXT_PUBLIC_SUPABASE_URL || '')
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');

  return NextResponse.json({
    supabaseHost,
    rowCount: rows?.length ?? 0,
    rows: rows ?? [],
    error: error?.message ?? null,
  });
}
