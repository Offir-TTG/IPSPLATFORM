-- Show ALL payment schedules to understand the data

SELECT
  ps.id,
  ps.scheduled_date,
  ps.scheduled_date::date as date,
  (ps.scheduled_date::date - CURRENT_DATE) as days_from_now,
  ps.status,
  ps.amount,
  ps.payment_number,
  ps.stripe_invoice_id IS NOT NULL as has_invoice,
  ps.tenant_id,
  ps.enrollment_id,
  e.id IS NOT NULL as enrollment_exists,
  e.tenant_id as enrollment_tenant,
  CASE
    WHEN e.id IS NULL THEN 'NO ENROLLMENT'
    WHEN e.tenant_id != ps.tenant_id THEN 'TENANT MISMATCH'
    ELSE 'OK'
  END as issue
FROM payment_schedules ps
LEFT JOIN enrollments e ON e.id = ps.enrollment_id
ORDER BY ps.scheduled_date
LIMIT 50;

-- Summary by status
SELECT
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN stripe_invoice_id IS NOT NULL THEN 1 END) as with_invoice,
  MIN(scheduled_date::date) as earliest_date,
  MAX(scheduled_date::date) as latest_date
FROM payment_schedules
GROUP BY status
ORDER BY status;
