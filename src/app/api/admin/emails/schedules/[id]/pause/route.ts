import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { cancelScheduleQueue } from '@/lib/email/cancelScheduleQueue';

export const dynamic = 'force-dynamic';

// POST /api/admin/emails/schedules/[id]/pause
// Temporarily halt a schedule. Pending email_queue rows are cancelled
// so they don't go out while paused; the schedule row goes to
// `paused`. The admin can Resume to bring it back to `pending` and
// let the cron continue from there.
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

  if (schedule.status !== 'pending') {
    return NextResponse.json(
      { error: `Cannot pause a ${schedule.status} schedule` },
      { status: 400 },
    );
  }

  const cancelled = await cancelScheduleQueue(admin, schedule.id, 'Schedule paused');

  const nowIso = new Date().toISOString();
  const { error: updErr } = await admin
    .from('email_schedules')
    .update({ status: 'paused', paused_at: nowIso, updated_at: nowIso })
    .eq('id', schedule.id);

  if (updErr) {
    console.error('[pause] schedule update failed:', updErr);
    return NextResponse.json({ error: 'Failed to pause schedule' }, { status: 500 });
  }
  return NextResponse.json({ paused: true, cancelledQueueRows: cancelled });
}
