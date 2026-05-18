-- Debug the complete flow

-- 1. Show test lessons
SELECT
  id,
  title,
  course_id,
  start_time,
  EXTRACT(EPOCH FROM (start_time - NOW())) / 60 as minutes_until_start
FROM lessons
WHERE start_time > NOW()
  AND start_time <= NOW() + INTERVAL '2 hours'
ORDER BY start_time;

-- 2. Show products for that course
SELECT
  p.id as product_id,
  p.title as product_title,
  p.course_id
FROM products p
WHERE p.course_id = '321f0bb3-c0c6-43a1-a1c0-8810e317fdf6';

-- 3. Show active enrollments for those products
SELECT
  e.id as enrollment_id,
  e.user_id,
  e.product_id,
  e.status,
  u.email,
  u.first_name
FROM enrollments e
JOIN users u ON u.id = e.user_id
WHERE e.product_id IN (
  SELECT id FROM products WHERE course_id = '321f0bb3-c0c6-43a1-a1c0-8810e317fdf6'
)
AND e.status = 'active';

-- 4. Show the trigger and its delay
SELECT
  id,
  trigger_name,
  trigger_event,
  delay_minutes,
  is_active
FROM email_triggers
WHERE trigger_event = 'lesson.reminder';
