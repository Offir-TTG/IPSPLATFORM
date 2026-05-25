import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { resolveScheduleRecipients } from '@/lib/email/scheduleRecipients';
import { nextOccurrenceAfter } from '@/lib/email/rruleHelpers';
import { renderQueueSubject } from '@/lib/email/renderQueueSubject';

export const dynamic = 'force-dynamic';

// POST /api/admin/emails/schedules/[id]/send-now
// Manually trigger one schedule's enqueue step — same logic the
// schedule-email-sends cron runs, but for a single row and ignoring
// `scheduled_for`. Useful for testing and one-off ad-hoc blasts.
// After enqueue, recurring schedules advance to the next occurrence;
// non-recurring schedules are marked completed.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
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
      .select('*')
      .eq('id', params.id)
      .eq('tenant_id', caller.tenant_id)
      .single();

    if (fetchErr || !schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    if (!['pending', 'processing'].includes(schedule.status)) {
      return NextResponse.json(
        { error: `Schedule is ${schedule.status}; only pending schedules can be sent` },
        { status: 400 },
      );
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // Resolve recipients (eligibility-gated).
    const recipients = await resolveScheduleRecipients(admin, schedule.tenant_id, {
      filter: schedule.recipient_filter ?? null,
      recipientIds: schedule.recipient_ids ?? null,
      dryRun: false,
    });

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'No eligible recipients for this schedule' },
        { status: 400 },
      );
    }

    // Look up template_key — queue_triggered_email() resolves the
    // subject/body via email_template_versions for the right language.
    const { data: tpl } = await admin
      .from('email_templates')
      .select('template_key')
      .eq('id', schedule.template_id)
      .single();

    if (!tpl?.template_key) {
      return NextResponse.json({ error: 'Template has no template_key' }, { status: 400 });
    }

    // Resolve tenant display name AND brand colours once so every
    // email renders with the right organizationName + button gradient.
    // Without primaryColor / secondaryColor the notification.generic
    // template's CTA renders white-on-white (invalid linear-gradient
    // → transparent background, default white text).
    const { data: tenantRow } = await admin
      .from('tenants')
      .select('name, primary_color, email_primary_color, email_button_color')
      .eq('id', schedule.tenant_id)
      .single();
    const organizationName = tenantRow?.name || 'Learning Platform';
    const primaryColor = tenantRow?.email_primary_color || tenantRow?.primary_color || '#667eea';
    const secondaryColor = tenantRow?.email_button_color || '#764ba2';

    // The schedule's compose fields live in template_variables. Strip
    // out empty values so we don't overwrite tenant defaults, then
    // ensure the generic-notification template's required vars
    // (userName, organizationName, priority, category) are present
    // even if the admin left them blank.
    const baseVars: Record<string, any> = {};
    for (const [k, v] of Object.entries(schedule.template_variables || {})) {
      if (v !== null && v !== undefined && String(v).trim() !== '') baseVars[k] = v;
    }
    const composePriority = typeof baseVars.priority === 'string' ? baseVars.priority : 'normal';

    // Schedule-level language override pins every render to one
    // language, so the queue preview matches what the admin composed.
    // When unset, fall back to per-recipient preference.
    const scheduleLang: string | null = schedule.language_code || null;

    let enqueued = 0;
    for (const r of recipients) {
      const recipientName = [r.first_name, r.last_name].filter(Boolean).join(' ') || '';
      const userName = r.first_name || recipientName || r.email;
      const varsForRow = {
        ...baseVars,
        userName,
        organizationName,
        primaryColor,
        secondaryColor,
        category: baseVars.category || 'announcement',
        priority: composePriority,
        first_name: r.first_name || '',
        last_name: r.last_name || '',
        email: r.email,
      };
      const { data: queueId, error: rpcErr } = await admin.rpc('queue_triggered_email', {
        p_tenant_id: schedule.tenant_id,
        p_trigger_id: schedule.id,
        p_recipient_email: r.email,
        p_recipient_name: recipientName,
        p_recipient_user_id: r.user_id,
        p_language_code: scheduleLang || r.preferred_language || 'en',
        p_template_key: tpl.template_key,
        p_template_variables: varsForRow,
        p_scheduled_for: nowIso,
        p_priority: composePriority,
      });
      if (rpcErr) {
        console.error('[send-now] queue_triggered_email failed for', r.email, rpcErr);
        continue;
      }
      // Post-RPC update on the freshly-inserted queue row:
      //   * Tag the schedule linkage (trigger_resource_*) so the
      //     delete guard / Pause / Stop lookups work.
      //   * Render the subject so the queue list shows the real
      //     subject text instead of `{{notificationTitle}}`. The
      //     send pipeline re-renders later — this update is just
      //     for display; the re-render is a no-op once the
      //     placeholders are gone.
      if (queueId) {
        const { data: justInserted } = await admin
          .from('email_queue')
          .select('subject')
          .eq('id', queueId as string)
          .single();
        const renderedSubject = renderQueueSubject(justInserted?.subject || '', varsForRow);
        await admin
          .from('email_queue')
          .update({
            trigger_type: 'scheduled',
            trigger_resource_type: 'schedule',
            trigger_resource_id: schedule.id,
            subject: renderedSubject,
          })
          .eq('id', queueId as string);
      }
      enqueued += 1;
    }

    if (enqueued === 0) {
      return NextResponse.json(
        { error: 'No emails could be enqueued (check server logs)' },
        { status: 500 },
      );
    }

    // Advance schedule state.
    const next = schedule.recurrence_rule
      ? nextOccurrenceAfter(
          schedule.recurrence_rule,
          new Date(schedule.scheduled_for),
          now,
          schedule.recurrence_end_date ? new Date(schedule.recurrence_end_date) : null,
        )
      : null;

    const updates: Record<string, any> = {
      emails_queued: (schedule.emails_queued || 0) + enqueued,
      updated_at: nowIso,
    };

    if (next) {
      updates.status = 'pending';
      updates.scheduled_for = next.toISOString();
      updates.started_at = null;
    } else {
      updates.status = 'completed';
      updates.completed_at = nowIso;
    }

    const { error: updErr } = await admin
      .from('email_schedules')
      .update(updates)
      .eq('id', schedule.id);
    if (updErr) console.error('[send-now] schedule update failed:', updErr);

    return NextResponse.json({
      enqueued,
      completed: !next,
      nextScheduledFor: next?.toISOString() ?? null,
    });
  } catch (error: any) {
    console.error('Error in send-now:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
