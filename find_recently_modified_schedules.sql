-- Find recently modified schedules to understand what changed

SELECT
  ps.id,
  ps.scheduled_date,
  ps.status,
  ps.amount,
  ps.payment_number,
  ps.created_at,
  ps.updated_at,
  ps.updated_at - ps.created_at as time_since_creation,
  CASE
    WHEN ps.updated_at > (NOW() - INTERVAL '1 hour') THEN 'Updated in last hour ⚠️'
    WHEN ps.updated_at > (NOW() - INTERVAL '24 hours') THEN 'Updated in last 24h'
    ELSE 'Older update'
  END as recency,
  ps.stripe_invoice_id IS NOT NULL as has_invoice,
  ps.last_error,
  ps.enrollment_id,
  e.id IS NOT NULL as enrollment_exists
FROM payment_schedules ps
LEFT JOIN enrollments e ON e.id = ps.enrollment_id
ORDER BY ps.updated_at DESC
LIMIT 20;

-- Check if any schedules were created/updated around the time of the cron run
SELECT
  'Schedules modified in last 2 hours' as info,
  COUNT(*) as count
FROM payment_schedules
WHERE updated_at > (NOW() - INTERVAL '2 hours');
