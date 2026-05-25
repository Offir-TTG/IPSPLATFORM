-- Aggregate queue counts per schedule. Used by the schedules list +
-- DELETE guard.
--
-- Linkage: `email_queue.trigger_resource_id` is the schedule id when
-- `trigger_resource_type = 'schedule'`. The schedule cron + send-now
-- write these columns right after each `queue_triggered_email` call,
-- so newly-queued rows are linkable. (We previously tried the
-- `metadata->>'trigger_id'` JSONB path but that column doesn't exist
-- in production; the canonical schema uses the trigger_resource_*
-- columns instead.)
--
-- Returns one row per schedule id passed in; schedules with no queue
-- rows are omitted (caller should default both counts to 0).
--
-- sent_count   = rows in status='sent'
-- active_count = rows NOT in status='cancelled' (anything that
--                represents real campaign activity — pending,
--                processing, sent, failed, expired)
--
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.get_schedule_queue_counts(p_schedule_ids uuid[])
RETURNS TABLE(
  schedule_id uuid,
  sent_count bigint,
  active_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    trigger_resource_id AS schedule_id,
    COUNT(*) FILTER (WHERE status = 'sent')         AS sent_count,
    COUNT(*) FILTER (WHERE status <> 'cancelled')   AS active_count
  FROM public.email_queue
  WHERE trigger_resource_type = 'schedule'
    AND trigger_resource_id = ANY(p_schedule_ids)
  GROUP BY trigger_resource_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_schedule_queue_counts(uuid[])
  TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
