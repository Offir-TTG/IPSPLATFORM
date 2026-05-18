-- Show ALL payment schedules (no date filter) to find the missing 5

SELECT
  ps.id as schedule_id,
  ps.scheduled_date,
  (ps.scheduled_date::date - CURRENT_DATE) as days_from_now,
  ps.status,
  ps.amount,
  ps.stripe_invoice_id IS NOT NULL as has_invoice,
  ps.retry_count,
  ps.last_error,
  ps.tenant_id as schedule_tenant,
  ps.enrollment_id,
  e.id as enrollment_exists,
  e.tenant_id as enrollment_tenant,
  e.status as enrollment_status,
  CASE
    WHEN e.id IS NULL THEN '❌ ENROLLMENT MISSING'
    WHEN e.tenant_id != ps.tenant_id THEN '❌ TENANT MISMATCH (Sched: ' || ps.tenant_id || ', Enroll: ' || e.tenant_id || ')'
    WHEN e.stripe_customer_id IS NULL THEN '⚠️ NO STRIPE CUSTOMER'
    ELSE '✅ OK'
  END as diagnosis
FROM payment_schedules ps
LEFT JOIN enrollments e ON e.id = ps.enrollment_id
ORDER BY ps.updated_at DESC
LIMIT 30;

-- Count by status (all schedules)
SELECT
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN stripe_invoice_id IS NOT NULL THEN 1 END) as with_invoice,
  COUNT(CASE WHEN stripe_invoice_id IS NULL THEN 1 END) as no_invoice,
  MIN(scheduled_date::date) as earliest,
  MAX(scheduled_date::date) as latest
FROM payment_schedules
GROUP BY status
ORDER BY status;
