-- Check scheduled dates and tenant mismatches for failing schedules

SELECT
  ps.id as schedule_id,
  ps.scheduled_date,
  ps.scheduled_date::date as date_only,
  CASE
    WHEN ps.scheduled_date::date = CURRENT_DATE THEN 'DUE TODAY'
    WHEN ps.scheduled_date::date < CURRENT_DATE THEN 'OVERDUE'
    ELSE 'FUTURE (' || (ps.scheduled_date::date - CURRENT_DATE) || ' days)'
  END as due_status,
  ps.status as schedule_status,
  ps.amount,
  ps.tenant_id as schedule_tenant_id,
  ps.enrollment_id,
  e.id as enrollment_found,
  e.tenant_id as enrollment_tenant_id,
  e.status as enrollment_status,
  e.stripe_customer_id,
  CASE
    WHEN e.id IS NULL THEN '❌ ENROLLMENT MISSING'
    WHEN e.tenant_id != ps.tenant_id THEN '❌ TENANT MISMATCH'
    WHEN e.stripe_customer_id IS NULL THEN '⚠️ NO STRIPE CUSTOMER'
    WHEN e.status != 'active' THEN '⚠️ NOT ACTIVE'
    ELSE '✅ OK'
  END as diagnosis
FROM payment_schedules ps
LEFT JOIN enrollments e ON e.id = ps.enrollment_id
WHERE ps.status IN ('pending', 'failed')
  AND ps.stripe_invoice_id IS NULL
  AND ps.scheduled_date <= (CURRENT_DATE + INTERVAL '30 days')
ORDER BY ps.scheduled_date, ps.id;

-- Summary
SELECT
  COUNT(*) as total_schedules,
  COUNT(CASE WHEN ps.scheduled_date::date = CURRENT_DATE THEN 1 END) as due_today,
  COUNT(CASE WHEN ps.scheduled_date::date < CURRENT_DATE THEN 1 END) as overdue,
  COUNT(CASE WHEN ps.scheduled_date::date > CURRENT_DATE THEN 1 END) as future,
  COUNT(CASE WHEN e.id IS NULL THEN 1 END) as missing_enrollments,
  COUNT(CASE WHEN e.id IS NOT NULL AND e.tenant_id != ps.tenant_id THEN 1 END) as tenant_mismatches,
  COUNT(CASE WHEN e.stripe_customer_id IS NULL THEN 1 END) as no_stripe_customer
FROM payment_schedules ps
LEFT JOIN enrollments e ON e.id = ps.enrollment_id
WHERE ps.status IN ('pending', 'failed')
  AND ps.stripe_invoice_id IS NULL
  AND ps.scheduled_date <= (CURRENT_DATE + INTERVAL '30 days');
