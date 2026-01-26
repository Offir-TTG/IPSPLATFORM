-- Debug why Jan 29 lesson is not showing

-- 1. Check if lesson exists and its properties
SELECT
  l.id,
  l.title,
  l.start_time,
  l.zoom_meeting_id,
  l.tenant_id,
  c.id as course_id,
  c.title as course_name,
  m.id as module_id,
  m.title as module_title
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
WHERE l.start_time::date = '2026-01-29'
  OR l.start_time > NOW()
ORDER BY l.start_time;

-- 2. Check if user has enrollment for this lesson's course
-- Replace with your user ID
WITH jan29_lessons AS (
  SELECT
    l.id as lesson_id,
    l.title as lesson_title,
    l.start_time,
    l.zoom_meeting_id,
    c.id as course_id,
    c.title as course_name
  FROM lessons l
  JOIN modules m ON l.module_id = m.id
  JOIN courses c ON m.course_id = c.id
  WHERE l.start_time::date = '2026-01-29'
)
SELECT
  j.*,
  e.id as enrollment_id,
  prod.id as product_id,
  prod.title as product_title,
  prod.course_id as product_course_id,
  prod.program_id as product_program_id,
  CASE
    WHEN prod.course_id = j.course_id THEN 'MATCH: Direct course'
    WHEN prod.program_id IS NOT NULL THEN 'Check program_courses'
    ELSE 'NO MATCH'
  END as match_status
FROM jan29_lessons j
LEFT JOIN enrollments e ON e.status IN ('active', 'completed', 'pending')
LEFT JOIN products prod ON prod.id = e.product_id
ORDER BY j.start_time;

-- 3. Test the exact query from the function
SELECT DISTINCT ON (l.id)
  l.id,
  l.title,
  l.start_time,
  l.zoom_meeting_id,
  c.id as course_id,
  c.title as course_name,
  e.id as enrollment_id,
  prod.course_id as product_course_id,
  prod.program_id as product_program_id,
  CASE
    WHEN prod.course_id IS NOT NULL AND prod.course_id = c.id THEN 'Direct course match'
    WHEN prod.program_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM program_courses pc
      WHERE pc.program_id = prod.program_id
        AND pc.course_id = c.id
    ) THEN 'Program course match'
    ELSE 'NO MATCH'
  END as match_type
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
JOIN enrollments e ON e.status IN ('active', 'completed', 'pending')
JOIN products prod ON prod.id = e.product_id
LEFT JOIN users u ON u.id = c.instructor_id
WHERE (
  -- Direct course enrollment
  (prod.course_id IS NOT NULL AND prod.course_id = c.id)
  OR
  -- Program enrollment: course is part of the program
  (prod.program_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM program_courses pc
    WHERE pc.program_id = prod.program_id
      AND pc.course_id = c.id
  ))
)
  AND l.start_time IS NOT NULL
  AND l.start_time > NOW()
  -- Comment out zoom check to see if that's the issue
  -- AND l.zoom_meeting_id IS NOT NULL
ORDER BY l.id, l.start_time ASC;
