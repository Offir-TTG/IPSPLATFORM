-- Check what happened to the schedules that were just processed

-- Show all schedules from today and near future (regardless of invoice status)
SELECT
  ps.id as schedule_id,
  ps.scheduled_date::date as date,
  ps.status,
  ps.amount,
  ps.stripe_invoice_id,
  ps.retry_count,
  ps.last_error,
  ps.updated_at,
  ps.tenant_id as schedule_tenant,
  ps.enrollment_id,
  e.id as enrollment_exists,
  e.tenant_id as enrollment_tenant,
  e.status as enrollment_status,
  CASE
    WHEN e.id IS NULL THEN '❌ ENROLLMENT MISSING'
    WHEN e.tenant_id != ps.tenant_id THEN '❌ TENANT MISMATCH (Schedule: ' || ps.tenant_id || ', Enrollment: ' || e.tenant_id || ')'
    WHEN e.stripe_customer_id IS NULL THEN '⚠️ NO STRIPE CUSTOMER'
    ELSE '✅ OK'
  END as diagnosis
FROM payment_schedules ps
LEFT JOIN enrollments e ON e.id = ps.enrollment_id
WHERE ps.scheduled_date <= (CURRENT_DATE + INTERVAL '30 days')
ORDER BY ps.scheduled_date, ps.status, ps.id
LIMIT 30;

-- Check if there are any schedules with stripe_invoice_id set but status still failed/pending
SELECT
  status,
  COUNT(*) as count,
  COUNT(CASE WHEN stripe_invoice_id IS NOT NULL THEN 1 END) as has_invoice_id,
  COUNT(CASE WHEN stripe_invoice_id IS NULL THEN 1 END) as no_invoice_id
FROM payment_schedules
WHERE scheduled_date <= (CURRENT_DATE + INTERVAL '30 days')
GROUP BY status;
