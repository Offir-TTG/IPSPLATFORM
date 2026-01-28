-- Check if payment schedules exist for user's enrollments
-- Run this in Supabase SQL Editor

SELECT
    e.id as enrollment_id,
    e.invoice_number,
    e.total_amount as enrollment_total,
    e.paid_amount as enrollment_paid,
    p.title as product_name,
    COUNT(ps.id) as schedule_count,
    COUNT(CASE WHEN ps.status = 'paid' THEN 1 END) as paid_count,
    SUM(ps.amount) as total_scheduled,
    SUM(CASE WHEN ps.status = 'paid' THEN ps.amount ELSE 0 END) as total_paid_from_schedules,
    SUM(ps.refunded_amount) as total_refunded
FROM enrollments e
LEFT JOIN products p ON p.id = e.product_id
LEFT JOIN payment_schedules ps ON ps.enrollment_id = e.id
WHERE e.status IN ('active', 'completed')
GROUP BY e.id, e.invoice_number, e.total_amount, e.paid_amount, p.title
ORDER BY e.created_at DESC
LIMIT 10;
