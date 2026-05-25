/**
 * Cron Job: Schedule Email Sends
 *
 * Scans `email_schedules` for rows whose `scheduled_for` is at or
 * before "now" and status is 'pending'. For each due schedule:
 *
 *   1. Resolve recipients via resolveScheduleRecipients (filter +
 *      explicit ids + communication-eligible gate).
 *   2. Insert one `email_queue` row per recipient with
 *      trigger_type='scheduled' and the schedule's template + vars.
 *      The existing `process-email-queue` cron picks those up and
 *      handles the actual SMTP send + rendering.
 *   3. Bump emails_queued on the schedule.
 *   4. Advance the schedule:
 *        - one-off (no recurrence_rule) → status='completed'
 *        - recurring → set scheduled_for to the next RRULE occurrence;
 *          if that exceeds recurrence_end_date, status='completed'.
 *
 * Schedule: every 5 minutes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { runCron } from '@/lib/cron/withCronLogging';
import { resolveScheduleRecipients } from '@/lib/email/scheduleRecipients';
import { nextOccurrenceAfter } from '@/lib/email/rruleHelpers';
import { renderQueueSubject } from '@/lib/email/renderQueueSubject';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET || 'K8mX2vN9pL5wQ3yT7hJ6fR4aZ1cD0gH3';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    console.error('[Schedule Email Sends] Unauthorized');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return runCron('schedule-email-sends', async ({ dryRun }) => {
    const supabase = createAdminClient();
    const now = new Date();
    const nowIso = now.toISOString();

    // Find all due schedules.
    const { data: due, error: fetchErr } = await supabase
      .from('email_schedules')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', nowIso)
      .limit(100);

    if (fetchErr) {
      console.error('[Schedule Email Sends] fetch failed:', fetchErr);
      return { processed: 0, error: fetchErr.message };
    }

    if (!due || due.length === 0) {
      return { processed: 0 };
    }

    let totalEnqueued = 0;
    let totalAdvanced = 0;
    let totalCompleted = 0;

    for (const schedule of due) {
      try {
        // Mark processing so a concurrent cron tick doesn't double-fire.
        if (!dryRun) {
          await supabase
            .from('email_schedules')
            .update({ status: 'processing', started_at: nowIso })
            .eq('id', schedule.id);
        }

        const recipients = await resolveScheduleRecipients(supabase, schedule.tenant_id, {
          filter: schedule.recipient_filter ?? null,
          recipientIds: schedule.recipient_ids ?? null,
          dryRun: false,
        });

        let enqueued = 0;
        if (recipients.length > 0 && !dryRun) {
          // Use the shared queue_triggered_email RPC — same path the
          // triggerEngine uses. It resolves the template version for
          // the recipient's language (with English fallback) and
          // pre-renders subject + body into the queue row.
          const { data: tpl } = await supabase
            .from('email_templates')
            .select('template_key')
            .eq('id', schedule.template_id)
            .single();

          if (!tpl?.template_key) {
            console.error('[Schedule Email Sends] no template_key on', schedule.id);
            await supabase
              .from('email_schedules')
              .update({ status: 'failed', error_message: 'template not found' })
              .eq('id', schedule.id);
            continue;
          }

          // Pull tenant name so the generic-notification template
          // renders the right organizationName for every recipient.
          const { data: tenantRow } = await supabase
            .from('tenants')
            .select('name')
            .eq('id', schedule.tenant_id)
            .single();
          const organizationName = tenantRow?.name || 'Learning Platform';

          // Drop empty schedule-wide vars so blanks don't shadow
          // tenant defaults, then top-up the required generic-template
          // variables for each recipient.
          const baseVars: Record<string, any> = {};
          for (const [k, v] of Object.entries(schedule.template_variables || {})) {
            if (v !== null && v !== undefined && String(v).trim() !== '') baseVars[k] = v;
          }
          const composePriority = typeof baseVars.priority === 'string' ? baseVars.priority : 'normal';
          const scheduleLang: string | null = schedule.language_code || null;

          for (const r of recipients) {
            const recipientName = [r.first_name, r.last_name].filter(Boolean).join(' ') || '';
            const userName = r.first_name || recipientName || r.email;
            const varsForRow = {
              ...baseVars,
              userName,
              organizationName,
              category: baseVars.category || 'announcement',
              priority: composePriority,
              first_name: r.first_name || '',
              last_name: r.last_name || '',
              email: r.email,
            };
            const { data: queueId, error: rpcErr } = await supabase.rpc('queue_triggered_email', {
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
              console.error('[Schedule Email Sends] RPC failed for', r.email, rpcErr);
              continue;
            }
            // Tag schedule linkage AND render the subject so the
            // queue list shows the real subject. See send-now for
            // the same pattern + rationale.
            if (queueId) {
              const { data: justInserted } = await supabase
                .from('email_queue')
                .select('subject')
                .eq('id', queueId as string)
                .single();
              const renderedSubject = renderQueueSubject(justInserted?.subject || '', varsForRow);
              await supabase
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
        } else if (dryRun) {
          enqueued = recipients.length;
        }

        totalEnqueued += enqueued;

        // Advance the schedule.
        const next = schedule.recurrence_rule
          ? nextOccurrenceAfter(
              schedule.recurrence_rule,
              new Date(schedule.scheduled_for),
              now,
              schedule.recurrence_end_date ? new Date(schedule.recurrence_end_date) : null,
            )
          : null;

        if (!dryRun) {
          if (next) {
            await supabase
              .from('email_schedules')
              .update({
                status: 'pending',
                scheduled_for: next.toISOString(),
                emails_queued: (schedule.emails_queued || 0) + enqueued,
                started_at: null,
              })
              .eq('id', schedule.id);
            totalAdvanced += 1;
          } else {
            await supabase
              .from('email_schedules')
              .update({
                status: 'completed',
                completed_at: nowIso,
                emails_queued: (schedule.emails_queued || 0) + enqueued,
              })
              .eq('id', schedule.id);
            totalCompleted += 1;
          }
        }
      } catch (err: any) {
        console.error('[Schedule Email Sends] schedule', schedule.id, 'failed:', err);
        if (!dryRun) {
          await supabase
            .from('email_schedules')
            .update({
              status: 'failed',
              error_message: err?.message || String(err),
            })
            .eq('id', schedule.id);
        }
      }
    }

    return {
      processed: due.length,
      enqueued: totalEnqueued,
      advanced: totalAdvanced,
      completed: totalCompleted,
      dryRun,
    };
  });
}
