-- Comprehensive diagnosis of "Enrollment not found" errors
-- This checks for tenant mismatches and other issues

WITH failing_schedules AS (
  SELECT DISTINCT ps.enrollment_id
  FROM payment_schedules ps
  WHERE ps.status = 'pending'
    AND ps.stripe_invoice_id IS NULL
)
SELECT
  'Payment Schedule Info' as section,
  ps.id as schedule_id,
  ps.enrollment_id,
  ps.tenant_id as ps_tenant_id,
  ps.status,
  ps.scheduled_date,
  ps.amount,
  '---' as separator,
  'Enrollment Info' as enrollment_section,
  e.id as enrollment_id,
  e.tenant_id as e_tenant_id,
  e.status as e_status,
  e.user_id,
  e.product_id,
  e.stripe_customer_id,
  '---' as separator2,
  'Diagnosis' as diagnosis_section,
  CASE
    WHEN e.id IS NULL THEN 'ENROLLMENT DOES NOT EXIST'
    WHEN e.tenant_id != ps.tenant_id THEN 'TENANT MISMATCH: Schedule tenant=' || ps.tenant_id || ', Enrollment tenant=' || e.tenant_id
    WHEN e.stripe_customer_id IS NULL OR e.stripe_customer_id = '' THEN 'MISSING STRIPE CUSTOMER ID'
    WHEN e.status != 'active' THEN 'ENROLLMENT NOT ACTIVE (status=' || e.status || ')'
    ELSE 'No obvious issue - should work'
  END as diagnosis
FROM payment_schedules ps
LEFT JOIN enrollments e ON e.id = ps.enrollment_id
WHERE ps.enrollment_id IN (SELECT enrollment_id FROM failing_schedules)
ORDER BY ps.scheduled_date;

-- Also show count summary
SELECT
  COUNT(*) as total_schedules,
  COUNT(e.id) as enrollments_found,
  COUNT(*) - COUNT(e.id) as missing_enrollments,
  COUNT(CASE WHEN e.tenant_id != ps.tenant_id THEN 1 END) as tenant_mismatches,
  COUNT(CASE WHEN e.stripe_customer_id IS NULL THEN 1 END) as missing_stripe_customer
FROM payment_schedules ps
LEFT JOIN enrollments e ON e.id = ps.enrollment_id
WHERE ps.status = 'pending'
  AND ps.stripe_invoice_id IS NULL;
