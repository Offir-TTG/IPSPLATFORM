-- Check if there are active enrollments for the test course

SELECT
  e.id,
  e.user_id,
  e.status,
  u.email,
  u.first_name,
  u.preferred_language
FROM enrollments e
JOIN users u ON u.id = e.user_id
WHERE e.course_id = '321f0bb3-c0c6-43a1-a1c0-8810e317fdf6'
  AND e.status = 'active'
  AND e.tenant_id = '70d86807-7e7c-49cd-8601-98235444e2ac';

-- Also check the test lesson details
SELECT
  id,
  title,
  start_time,
  EXTRACT(EPOCH FROM (start_time - NOW())) / 60 as minutes_until_start,
  NOW() as current_time
FROM lessons
WHERE course_id = '321f0bb3-c0c6-43a1-a1c0-8810e317fdf6'
  AND start_time > NOW()
ORDER BY start_time
LIMIT 5;
