-- Check payment schedule for invoice payment #5 ($540.83)
SELECT
  ps.id,
  ps.payment_number,
  ps.scheduled_date,
  ps.amount,
  ps.status as schedule_status,
  ps.stripe_invoice_id,
  ps.enrollment_id,
  e.invoice_number as enrollment_invoice,
  p.id as payment_id,
  p.amount as payment_amount,
  p.status as payment_status,
  p.refunded_amount,
  p.created_at as payment_created_at
FROM payment_schedules ps
LEFT JOIN enrollments e ON e.id = ps.enrollment_id
LEFT JOIN payments p ON p.payment_schedule_id = ps.id
WHERE ps.payment_number = 5
  AND ps.amount = 540.83
ORDER BY ps.created_at DESC
LIMIT 5;
