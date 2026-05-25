import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/admin/emails/schedules/[id]/resume
// Resume a paused schedule. Sets status back to 'pending' so the
// schedule-email-sends cron picks it up on its next tick (or sooner
// if the admin clicks Send Now). Recipients are re-resolved fresh
// during the next cron tick, so any drift during the pause (deactivated
// users, new matches for the filter) is handled automatically.
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
    .select('id, status, scheduled_for')
    .eq('id', params.id)
    .eq('tenant_id', caller.tenant_id)
    .single();

  if (fetchErr || !schedule) {
    return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
  }

  if (schedule.status !== 'paused') {
    return NextResponse.json(
      { error: `Cannot resume a ${schedule.status} schedule` },
      { status: 400 },
    );
  }

  const { error: updErr } = await admin
    .from('email_schedules')
    .update({
      status: 'pending',
      paused_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', schedule.id);

  if (updErr) {
    console.error('[resume] schedule update failed:', updErr);
    return NextResponse.json({ error: 'Failed to resume schedule' }, { status: 500 });
  }
  return NextResponse.json({ resumed: true });
}
