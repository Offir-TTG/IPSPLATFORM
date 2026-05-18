-- Diagnose why payment schedules fail with "Enrollment not found"
SELECT
  ps.id as schedule_id,
  ps.enrollment_id,
  ps.tenant_id as schedule_tenant,
  ps.status as schedule_status,
  ps.scheduled_date,
  ps.amount,
  e.id as enrollment_exists,
  e.tenant_id as enrollment_tenant,
  e.status as enrollment_status,
  e.user_id,
  e.product_id,
  e.stripe_customer_id,
  CASE
    WHEN e.id IS NULL THEN 'Enrollment missing from DB'
    WHEN e.tenant_id != ps.tenant_id THEN 'Tenant ID mismatch'
    WHEN e.stripe_customer_id IS NULL THEN 'No stripe_customer_id'
    ELSE 'Should work'
  END as diagnosis
FROM payment_schedules ps
LEFT JOIN enrollments e ON e.id = ps.enrollment_id
WHERE ps.status = 'pending'
  AND ps.stripe_invoice_id IS NULL
ORDER BY ps.scheduled_date
LIMIT 20;
