-- Simple check: are there enrollments for the test course?

-- Count active enrollments by product
SELECT
  p.id as product_id,
  p.title as product_title,
  p.course_id,
  COUNT(e.id) as active_enrollments
FROM products p
LEFT JOIN enrollments e ON e.product_id = p.id AND e.status = 'active'
WHERE p.course_id = '321f0bb3-c0c6-43a1-a1c0-8810e317fdf6'
GROUP BY p.id, p.title, p.course_id;

-- Show test lesson timing
SELECT
  title,
  start_time,
  ROUND(EXTRACT(EPOCH FROM (start_time - NOW())) / 60) as minutes_until_start,
  CASE
    WHEN ROUND(EXTRACT(EPOCH FROM (start_time - NOW())) / 60) BETWEEN 55 AND 65 THEN 'IN TRIGGER WINDOW (-60 min)'
    ELSE 'Not in trigger window'
  END as trigger_status
FROM lessons
WHERE course_id = '321f0bb3-c0c6-43a1-a1c0-8810e317fdf6'
  AND start_time > NOW()
ORDER BY start_time
LIMIT 3;
