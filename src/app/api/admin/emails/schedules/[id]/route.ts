import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { validateRRule } from '@/lib/email/rruleHelpers';
import { resolveScheduleRecipients } from '@/lib/email/scheduleRecipients';
import { cancelScheduleQueue } from '@/lib/email/cancelScheduleQueue';

export const dynamic = 'force-dynamic';

async function adminGate(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 as const };

  const { data: caller } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single();

  if (!caller || !['admin', 'super_admin'].includes(caller.role)) {
    return { error: 'Forbidden', status: 403 as const };
  }
  return { tenantId: caller.tenant_id as string };
}

// GET /api/admin/emails/schedules/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const gate = await adminGate(request);
  if ('error' in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('email_schedules')
    .select(`
      *,
      template:email_templates ( id, template_key, template_name )
    `)
    .eq('id', params.id)
    .eq('tenant_id', gate.tenantId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ schedule: data });
}

// PUT /api/admin/emails/schedules/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const gate = await adminGate(request);
  if ('error' in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const body = await request.json();
  const admin = createAdminClient();

  if (body.recurrence_rule) {
    const rruleErr = validateRRule(body.recurrence_rule);
    if (rruleErr) {
      return NextResponse.json({ error: `Invalid recurrence_rule: ${rruleErr}` }, { status: 400 });
    }
  }

  // Recompute recipient_count when filter or ids change.
  // `template_id` is intentionally not editable from the client — every
  // schedule uses the generic notification template, set at create time.
  const updates: Record<string, any> = {};
  for (const key of [
    'schedule_name', 'description',
    'recipient_filter', 'recipient_ids',
    'scheduled_for', 'timezone',
    'recurrence_rule', 'recurrence_end_date',
    'template_variables', 'language_code',
  ]) {
    if (key in body) updates[key] = body[key];
  }

  // Editing a failed schedule resets it back to pending so the cron
  // retries it on the next tick. Editing a paused schedule keeps it
  // paused (admin must Resume explicitly). All other status writes
  // from the client are ignored — those go through dedicated routes
  // (/pause, /resume, /stop) which also touch email_queue.
  const { data: current } = await admin
    .from('email_schedules')
    .select('status, emails_sent')
    .eq('id', params.id)
    .eq('tenant_id', gate.tenantId)
    .single();
  if (current?.status === 'failed') {
    updates.status = 'pending';
    updates.error_message = null;
  }

  // Recompute recipient_count when filter or ids change so the list
  // view reflects the new audience.
  if ('recipient_filter' in body || 'recipient_ids' in body) {
    const recipients = await resolveScheduleRecipients(admin, gate.tenantId, {
      filter: body.recipient_filter ?? null,
      recipientIds: body.recipient_ids ?? null,
      dryRun: false,
    });
    updates.recipient_count = recipients.length;
  }
  updates.updated_at = new Date().toISOString();

  const { data, error } = await admin
    .from('email_schedules')
    .update(updates)
    .eq('id', params.id)
    .eq('tenant_id', gate.tenantId)
    .select()
    .single();

  if (error) {
    console.error('email_schedules update failed:', error);
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
  }
  return NextResponse.json({ schedule: data });
}

// DELETE /api/admin/emails/schedules/[id]
// Hard-deletes the schedule, but ONLY if no emails have been sent for
// it yet — sent emails are immutable history and we won't orphan them
// behind a deleted campaign. Pending email_queue rows belonging to
// this schedule are cancelled first so nothing escapes between this
// call and the next cron tick. Sent / failed queue rows survive
// untouched (their trigger_id becomes dangling, which is fine — there
// is no FK and they exist on their own merits).
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const gate = await adminGate(request);
  if ('error' in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const admin = createAdminClient();
  const { data: schedule, error: fetchErr } = await admin
    .from('email_schedules')
    .select('id, status')
    .eq('id', params.id)
    .eq('tenant_id', gate.tenantId)
    .single();

  if (fetchErr || !schedule) {
    return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
  }

  // Simple rule: hard-delete is only allowed after Stop, i.e. once
  // status is `cancelled`. Any other status either has active work
  // (pending / processing / paused) or carries an audit trail
  // (completed / failed) that we don't want to silently destroy.
  // The flow is always: Stop → Delete.
  if (schedule.status !== 'cancelled') {
    return NextResponse.json(
      {
        error:
          'This campaign must be stopped before it can be deleted. Use Stop, then Delete.',
        code: 'MUST_STOP_FIRST',
      },
      { status: 409 },
    );
  }

  const cancelled = await cancelScheduleQueue(admin, schedule.id, 'Schedule deleted');

  const { error } = await admin
    .from('email_schedules')
    .delete()
    .eq('id', params.id)
    .eq('tenant_id', gate.tenantId);

  if (error) {
    console.error('email_schedules delete failed:', error);
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
  return NextResponse.json({ success: true, cancelledQueueRows: cancelled });
}
