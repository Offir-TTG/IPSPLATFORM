-- Find the enrollment and check product payment_model
SELECT 
  e.id as enrollment_id,
  e.enrollment_token,
  e.total_amount,
  e.paid_amount,
  e.payment_status,
  p.title as product_title,
  p.payment_model,
  p.price_amount,
  ps.id as schedule_id,
  ps.payment_type,
  ps.status as schedule_status,
  ps.amount as schedule_amount
FROM enrollments e
JOIN products p ON e.product_id = p.id
LEFT JOIN payment_schedules ps ON ps.enrollment_id = e.id
WHERE e.enrollment_token = 'qN_dAB0lAB9zWRDtqi7BqjSUSLDNGiP8d7L3u44GJXU'
ORDER BY ps.payment_number;
