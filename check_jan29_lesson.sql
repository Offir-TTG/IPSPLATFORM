-- Check for the Jan 29 lesson and why it's not showing up

-- 1. Find all lessons scheduled for Jan 29, 2026
SELECT
  l.id as lesson_id,
  l.title as lesson_title,
  l.start_time,
  l.zoom_meeting_id,
  c.id as course_id,
  c.title as course_name,
  m.id as module_id,
  m.title as module_name
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
WHERE l.start_time::date = '2026-01-29'
ORDER BY l.start_time;

-- 2. Check user enrollments and what they should see
SELECT
  e.id as enrollment_id,
  e.user_id,
  prod.id as product_id,
  prod.title as product_title,
  prod.course_id,
  prod.program_id,
  c.id as direct_course_id,
  c.title as direct_course_name,
  prog.id as program_id_from_product,
  prog.name as program_name
FROM enrollments e
JOIN products prod ON prod.id = e.product_id
LEFT JOIN courses c ON c.id = prod.course_id
LEFT JOIN programs prog ON prog.id = prod.program_id
WHERE e.status IN ('active', 'completed', 'pending')
ORDER BY e.enrolled_at DESC;

-- 3. Check if the Jan 29 lesson matches any enrollment
-- Replace YOUR_USER_ID with actual user ID
SELECT
  l.id as lesson_id,
  l.title as lesson_title,
  l.start_time,
  c.id as course_id,
  c.title as course_name,
  e.id as enrollment_id,
  prod.id as product_id,
  prod.title as product_title,
  CASE
    WHEN prod.course_id = c.id THEN 'Direct course match'
    WHEN EXISTS (
      SELECT 1 FROM program_courses pc
      WHERE pc.program_id = prod.program_id
        AND pc.course_id = c.id
    ) THEN 'Program course match'
    ELSE 'NO MATCH'
  END as match_type
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
CROSS JOIN enrollments e
JOIN products prod ON prod.id = e.product_id
WHERE l.start_time::date = '2026-01-29'
  AND e.status IN ('active', 'completed', 'pending')
  AND (
    prod.course_id = c.id
    OR
    EXISTS (
      SELECT 1 FROM program_courses pc
      WHERE pc.program_id = prod.program_id
        AND pc.course_id = c.id
    )
  )
ORDER BY l.start_time;

-- 4. Check all upcoming lessons that should show for enrollments
SELECT
  l.id as lesson_id,
  l.title as lesson_title,
  l.start_time,
  l.zoom_meeting_id,
  c.id as course_id,
  c.title as course_name,
  prod.id as product_id,
  prod.title as product_title,
  prod.course_id as product_course_id,
  prod.program_id as product_program_id,
  CASE
    WHEN prod.course_id IS NOT NULL AND prod.course_id = c.id THEN 'Standalone course'
    WHEN prod.program_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM program_courses pc
      WHERE pc.program_id = prod.program_id AND pc.course_id = c.id
    ) THEN 'Program course'
    ELSE 'Not matched'
  END as enrollment_type
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
JOIN enrollments e ON e.status IN ('active', 'completed', 'pending')
JOIN products prod ON prod.id = e.product_id
WHERE l.start_time > NOW()
  AND l.zoom_meeting_id IS NOT NULL
  AND (
    -- Direct course enrollment
    (prod.course_id IS NOT NULL AND prod.course_id = c.id)
    OR
    -- Program enrollment
    (prod.program_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM program_courses pc
      WHERE pc.program_id = prod.program_id
        AND pc.course_id = c.id
    ))
  )
ORDER BY l.start_time;
