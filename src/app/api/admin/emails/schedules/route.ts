import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { validateRRule } from '@/lib/email/rruleHelpers';
import { resolveScheduleRecipients } from '@/lib/email/scheduleRecipients';
import { resolveGenericNotificationTemplateId } from '@/lib/email/genericNotificationTemplate';

export const dynamic = 'force-dynamic';

// GET /api/admin/emails/schedules
// List every email_schedule for the caller's tenant with its template
// title joined in.
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: caller } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!caller || !['admin', 'super_admin'].includes(caller.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = createAdminClient();
    // `select *` so we don't trip on column-name drift between the
    // migration file and the actual production DB (e.g. one production
    // schema uses `description` while the migration spec used
    // `schedule_description`). The template join is explicit.
    const { data, error } = await admin
      .from('email_schedules')
      .select('*, template:email_templates ( id, template_key, template_name )')
      .eq('tenant_id', caller.tenant_id)
      .order('scheduled_for', { ascending: false });

    if (error) {
      console.error('email_schedules list query failed:', error);
      return NextResponse.json({ error: 'Failed to load schedules' }, { status: 500 });
    }

    // Compute per-schedule counts from `email_queue`. Linkage lives
    // in `metadata->>'trigger_id'` and PostgREST URL-encoding of the
    // `->>` operator from JS is unreliable, so we delegate to a SQL
    // function that does the JSONB extraction server-side. See
    // 20260525_get_schedule_queue_counts.sql.
    //   - sent_count   → for the "X of Y" badge
    //   - active_count → anything not 'cancelled'; gates the Delete
    //     button (matches the DELETE route's server-side guard).
    const rows = data ?? [];
    const ids = rows.map((r) => r.id);
    const sentCounts = new Map<string, number>();
    const activeCounts = new Map<string, number>();
    if (ids.length > 0) {
      const { data: countRows, error: countErr } = await admin.rpc(
        'get_schedule_queue_counts',
        { p_schedule_ids: ids },
      );
      if (countErr) {
        console.error('get_schedule_queue_counts failed:', countErr);
      }
      for (const row of (countRows ?? []) as Array<{ schedule_id: string; sent_count: number; active_count: number }>) {
        sentCounts.set(row.schedule_id, Number(row.sent_count) || 0);
        activeCounts.set(row.schedule_id, Number(row.active_count) || 0);
      }
    }
    const enriched = rows.map((r) => ({
      ...r,
      sent_count: sentCounts.get(r.id) ?? 0,
      active_count: activeCounts.get(r.id) ?? 0,
    }));

    return NextResponse.json({ schedules: enriched });
  } catch (error) {
    console.error('Error in GET /api/admin/emails/schedules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/emails/schedules
// Create a new schedule. Validates the RRULE (if present), pre-computes
// the recipient_count so the list view can display it without
// re-resolving, and stores `created_by` for the audit trail.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: caller } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!caller || !['admin', 'super_admin'].includes(caller.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      schedule_name,
      description,
      recipient_filter,
      recipient_ids,
      scheduled_for,
      timezone,
      recurrence_rule,
      recurrence_end_date,
      template_variables,
      language_code,
    } = body ?? {};

    if (!schedule_name || !scheduled_for) {
      return NextResponse.json(
        { error: 'schedule_name and scheduled_for are required' },
        { status: 400 },
      );
    }

    // Email schedules are pinned to the generic-notification template
    // server-side; the admin's compose form (title/message) is mapped
    // into template_variables and rendered identically across recipients.
    const admin = createAdminClient();
    const template_id = await resolveGenericNotificationTemplateId(admin, caller.tenant_id);
    if (!template_id) {
      return NextResponse.json(
        { error: 'Generic notification template is not configured for this tenant' },
        { status: 500 },
      );
    }

    if (recurrence_rule) {
      const err = validateRRule(recurrence_rule);
      if (err) {
        return NextResponse.json({ error: `Invalid recurrence_rule: ${err}` }, { status: 400 });
      }
    }

    // Pre-compute recipient_count using the eligibility gate so the
    // list view can show the real "will receive" number without
    // re-resolving every render.
    const recipients = await resolveScheduleRecipients(admin, caller.tenant_id, {
      filter: recipient_filter ?? null,
      recipientIds: recipient_ids ?? null,
      dryRun: false,
    });

    // Requires `20260525_email_schedules_align_to_spec.sql` to have
    // been run in production so every column below exists.
    const { data, error } = await admin
      .from('email_schedules')
      .insert({
        tenant_id: caller.tenant_id,
        schedule_name,
        description: description ?? null,
        template_id,
        recipient_filter: recipient_filter ?? null,
        recipient_ids: recipient_ids ?? null,
        recipient_count: recipients.length,
        scheduled_for,
        timezone: timezone ?? 'UTC',
        recurrence_rule: recurrence_rule ?? null,
        recurrence_end_date: recurrence_end_date ?? null,
        template_variables: template_variables ?? null,
        language_code: language_code ?? null,
        status: 'pending',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('email_schedules insert failed:', error);
      return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
    }

    return NextResponse.json({ schedule: data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/emails/schedules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
