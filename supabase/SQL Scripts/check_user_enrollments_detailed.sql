-- Check detailed enrollment information for the user with 2 program enrollments
-- User ID: a018e2ea-ac21-4564-8f43-39e7d58e9bb2

-- Step 1: Check all enrollments and their products
SELECT
  e.id as enrollment_id,
  e.status as enrollment_status,
  e.enrolled_at,
  prod.id as product_id,
  prod.type as product_type,
  prod.title as product_title,
  prod.program_id,
  prod.course_id,
  prog.name as program_name,
  c.title as course_title
FROM enrollments e
INNER JOIN products prod ON prod.id = e.product_id
LEFT JOIN programs prog ON prog.id = prod.program_id
LEFT JOIN courses c ON c.id = prod.course_id
WHERE e.user_id = 'a018e2ea-ac21-4564-8f43-39e7d58e9bb2'
ORDER BY e.enrolled_at DESC;

-- Step 2: For program products, check if they have courses in program_courses
SELECT
  '=== PROGRAM COURSES CHECK ===' as section,
  prog.id as program_id,
  prog.name as program_name,
  pc.course_id,
  c.title as course_title,
  c.is_published,
  c.is_active,
  pc.order
FROM programs prog
LEFT JOIN program_courses pc ON pc.program_id = prog.id
LEFT JOIN courses c ON c.id = pc.course_id
WHERE prog.id IN (
  SELECT DISTINCT prod.program_id
  FROM enrollments e
  INNER JOIN products prod ON prod.id = e.product_id
  WHERE e.user_id = 'a018e2ea-ac21-4564-8f43-39e7d58e9bb2'
    AND prod.program_id IS NOT NULL
)
ORDER BY prog.id, pc.order;

-- Step 3: Check what the API would return (simulate the query)
SELECT
  '=== API SIMULATION ===' as section,
  e.id as enrollment_id,
  e.status,
  prod.type as product_type,
  prod.title as product_title,
  CASE
    WHEN prod.type = 'course' AND prod.course_id IS NOT NULL THEN 'WILL SHOW COURSE'
    WHEN prod.type = 'program' AND prod.program_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM program_courses pc
      JOIN courses c2 ON c2.id = pc.course_id
      WHERE pc.program_id = prod.program_id
        AND c2.is_published = true
        AND c2.is_active = true
    ) THEN 'WILL SHOW PROGRAM COURSES'
    WHEN prod.type = 'program' AND prod.program_id IS NOT NULL THEN 'WILL SHOW PROGRAM (NO COURSES)'
    ELSE 'WILL NOT SHOW'
  END as api_behavior,
  prog.name as program_name
FROM enrollments e
INNER JOIN products prod ON prod.id = e.product_id
LEFT JOIN programs prog ON prog.id = prod.program_id
WHERE e.user_id = 'a018e2ea-ac21-4564-8f43-39e7d58e9bb2'
  AND e.status IN ('active', 'completed')
ORDER BY e.enrolled_at DESC;
