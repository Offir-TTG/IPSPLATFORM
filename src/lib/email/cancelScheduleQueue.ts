import type { SupabaseClient } from '@supabase/supabase-js';

// Schedule ↔ queue linkage. The canonical `email_queue` schema has
// no `trigger_id` column; rows queued by a schedule are tagged with
// `trigger_resource_type='schedule'` and `trigger_resource_id=<id>`.
// The schedule cron + send-now both write these columns immediately
// after each `queue_triggered_email` call, so they are reliable.

// Cancel every `email_queue` row that belongs to a schedule and is
// still pending. Used by Pause / Stop / Delete on a schedule so the
// in-flight campaign actually stops sending. Sent / failed /
// processing rows are never touched.
export async function cancelScheduleQueue(
  admin: SupabaseClient,
  scheduleId: string,
  reason: string,
): Promise<number> {
  const { data, error } = await admin
    .from('email_queue')
    .update({
      status: 'cancelled',
      error_message: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('trigger_resource_type', 'schedule')
    .eq('trigger_resource_id', scheduleId)
    .eq('status', 'pending')
    .select('id');

  if (error) {
    console.error('[cancelScheduleQueue] failed for schedule', scheduleId, error);
    return 0;
  }
  return data?.length ?? 0;
}

// Count `email_queue` rows in `sent` status that belong to a
// schedule. Used to show the "X of Y sent" badge on the list.
export async function countSentForSchedule(
  admin: SupabaseClient,
  scheduleId: string,
): Promise<number> {
  const { count, error } = await admin
    .from('email_queue')
    .select('id', { count: 'exact', head: true })
    .eq('trigger_resource_type', 'schedule')
    .eq('trigger_resource_id', scheduleId)
    .eq('status', 'sent');

  if (error) {
    console.error('[countSentForSchedule] failed for', scheduleId, error);
    return 0;
  }
  return count ?? 0;
}

// Count `email_queue` rows that represent campaign activity — i.e.
// anything not in `cancelled` state. This is the guard for hard-delete:
// a schedule that has produced any pending / processing / sent /
// failed / expired queue rows is no longer a clean slate, and
// admins must Stop instead so the audit trail survives.
export async function countActiveQueueForSchedule(
  admin: SupabaseClient,
  scheduleId: string,
): Promise<number> {
  const { count, error } = await admin
    .from('email_queue')
    .select('id', { count: 'exact', head: true })
    .eq('trigger_resource_type', 'schedule')
    .eq('trigger_resource_id', scheduleId)
    .not('status', 'eq', 'cancelled');

  if (error) {
    console.error('[countActiveQueueForSchedule] failed for', scheduleId, error);
    return 0;
  }
  return count ?? 0;
}
