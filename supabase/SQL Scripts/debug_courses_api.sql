-- Debug script to understand why /api/user/courses doesn't return all enrollments
-- Replace with actual user ID: a018e2ea-ac21-4564-8f43-39e7d58e9bb2

-- Step 1: Get all enrollments with products
SELECT
  e.id as enrollment_id,
  e.product_id,
  e.status,
  e.enrolled_at,
  prod.id as product_id_check,
  prod.type as product_type,
  prod.title as product_title,
  prod.course_id,
  prod.program_id
FROM enrollments e
INNER JOIN products prod ON prod.id = e.product_id
WHERE e.user_id = 'a018e2ea-ac21-4564-8f43-39e7d58e9bb2'
  AND e.status IN ('active', 'completed')
ORDER BY e.enrolled_at DESC;

-- Step 2: For course products, check if courses exist and are published
SELECT
  e.id as enrollment_id,
  prod.title as product_title,
  prod.course_id,
  c.id as course_exists,
  c.title as course_title,
  c.is_published,
  c.is_active
FROM enrollments e
INNER JOIN products prod ON prod.id = e.product_id
LEFT JOIN courses c ON c.id = prod.course_id
WHERE e.user_id = 'a018e2ea-ac21-4564-8f43-39e7d58e9bb2'
  AND e.status IN ('active', 'completed')
  AND prod.type = 'course'
  AND prod.course_id IS NOT NULL;

-- Step 3: For program products, check if they have courses in program_courses
SELECT
  e.id as enrollment_id,
  prod.title as product_title,
  prod.program_id,
  prog.name as program_name,
  pc.course_id,
  c.title as course_title,
  c.is_published,
  c.is_active
FROM enrollments e
INNER JOIN products prod ON prod.id = e.product_id
LEFT JOIN programs prog ON prog.id = prod.program_id
LEFT JOIN program_courses pc ON pc.program_id = prod.program_id
LEFT JOIN courses c ON c.id = pc.course_id
WHERE e.user_id = 'a018e2ea-ac21-4564-8f43-39e7d58e9bb2'
  AND e.status IN ('active', 'completed')
  AND prod.type = 'program'
  AND prod.program_id IS NOT NULL
ORDER BY pc.order;

-- Step 4: Summary - Which enrollments would be returned by the API?
SELECT
  e.id as enrollment_id,
  prod.title as product_title,
  prod.type as product_type,
  CASE
    WHEN prod.type = 'course' AND prod.course_id IS NOT NULL AND c.is_published AND c.is_active THEN 'WILL SHOW (course)'
    WHEN prod.type = 'program' AND prod.program_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM program_courses pc2
      JOIN courses c2 ON c2.id = pc2.course_id
      WHERE pc2.program_id = prod.program_id
        AND c2.is_published = true
        AND c2.is_active = true
    ) THEN 'WILL SHOW (program with courses)'
    WHEN prod.type = 'program' AND prod.program_id IS NOT NULL THEN 'WILL NOT SHOW (program with no published courses)'
    ELSE 'WILL NOT SHOW (unknown reason)'
  END as api_result
FROM enrollments e
INNER JOIN products prod ON prod.id = e.product_id
LEFT JOIN courses c ON c.id = prod.course_id
WHERE e.user_id = 'a018e2ea-ac21-4564-8f43-39e7d58e9bb2'
  AND e.status IN ('active', 'completed');
