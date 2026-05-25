/**
 * Read + update cron_settings (UI-driven enable/disable + dry-run flip).
 *
 * GET  → returns array of { cron_name, enabled, dry_run, log_runs, updated_at }
 * PATCH → body: { cron_name, enabled?, dry_run?, log_runs? } → updates the row
 *
 * Admin-only. Auth is enforced via the user's role on `users.role`.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function requireAdmin(req: NextRequest) {
  const sb = await createClient();
  const {
    data: { user },
    error: authError,
  } = await sb.auth.getUser();
  if (authError || !user) {
    return { ok: false as const, status: 401, msg: 'Unauthorized' };
  }
  const { data: userRow } = await sb
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!userRow || (userRow.role !== 'admin' && userRow.role !== 'super_admin')) {
    return { ok: false as const, status: 403, msg: 'Forbidden' };
  }
  return { ok: true as const, userId: user.id };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.msg }, { status: auth.status });
  }
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('cron_settings')
    .select('cron_name, enabled, dry_run, log_runs, updated_at')
    .order('cron_name', { ascending: true });
  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json({ success: true, data: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.msg }, { status: auth.status });
  }

  let body: { cron_name?: string; enabled?: boolean; dry_run?: boolean; log_runs?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON' },
      { status: 400 },
    );
  }

  if (!body.cron_name || typeof body.cron_name !== 'string') {
    return NextResponse.json(
      { success: false, error: 'cron_name required' },
      { status: 400 },
    );
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: auth.userId,
  };
  if (typeof body.enabled === 'boolean') patch.enabled = body.enabled;
  if (typeof body.dry_run === 'boolean') patch.dry_run = body.dry_run;
  if (typeof body.log_runs === 'boolean') patch.log_runs = body.log_runs;

  // Nothing to update beyond the audit columns — reject so we don't
  // silently write only a timestamp.
  if (
    patch.enabled === undefined &&
    patch.dry_run === undefined &&
    patch.log_runs === undefined
  ) {
    return NextResponse.json(
      { success: false, error: 'Provide enabled, dry_run, or log_runs' },
      { status: 400 },
    );
  }

  const sb = createAdminClient();
  const { data, error } = await sb
    .from('cron_settings')
    .update(patch)
    .eq('cron_name', body.cron_name)
    .select('cron_name, enabled, dry_run, log_runs, updated_at')
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json(
      { success: false, error: `Unknown cron_name: ${body.cron_name}` },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, data });
}
