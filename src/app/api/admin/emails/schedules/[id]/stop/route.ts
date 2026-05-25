import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { cancelScheduleQueue } from '@/lib/email/cancelScheduleQueue';

export const dynamic = 'force-dynamic';

// POST /api/admin/emails/schedules/[id]/stop
// Terminal cancellation. The schedule goes to `cancelled` and stays
// in the list as audit history; pending queue rows are cancelled too.
// Sent / failed queue rows are immutable history and stay put. Unlike
// Pause, there is no Resume — the admin must create a new schedule.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: caller } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single();

  if (!caller || !['admin', 'super_admin'].includes(caller.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: schedule, error: fetchErr } = await admin
    .from('email_schedules')
    .select('id, status')
    .eq('id', params.id)
    .eq('tenant_id', caller.tenant_id)
    .single();

  if (fetchErr || !schedule) {
    return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
  }

  if (!['pending', 'processing', 'paused'].includes(schedule.status)) {
    return NextResponse.json(
      { error: `Cannot stop a ${schedule.status} schedule` },
      { status: 400 },
    );
  }

  const cancelled = await cancelScheduleQueue(admin, schedule.id, 'Schedule stopped');

  const nowIso = new Date().toISOString();
  const { error: updErr } = await admin
    .from('email_schedules')
    .update({
      status: 'cancelled',
      cancelled_at: nowIso,
      paused_at: null,
      updated_at: nowIso,
    })
    .eq('id', schedule.id);

  if (updErr) {
    console.error('[stop] schedule update failed:', updErr);
    return NextResponse.json({ error: 'Failed to stop schedule' }, { status: 500 });
  }
  return NextResponse.json({ stopped: true, cancelledQueueRows: cancelled });
}
