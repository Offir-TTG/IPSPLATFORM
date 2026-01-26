-- Simple test query to check if all enrollments are returned
SELECT
  e.id as enrollment_id,
  e.enrolled_at,
  prod.id as product_id,
  prod.title as product_title,
  prod.program_id,
  prod.course_id,
  prog.name as program_name,
  c.title as course_name,
  CASE
    WHEN prod.course_id IS NOT NULL THEN 'HAS_COURSE'
    WHEN prod.program_id IS NOT NULL THEN 'HAS_PROGRAM'
    ELSE 'NO_REFERENCE'
  END as product_type
FROM enrollments e
INNER JOIN products prod ON prod.id = e.product_id
LEFT JOIN programs prog ON prog.id = prod.program_id
LEFT JOIN courses c ON c.id = prod.course_id
WHERE e.status = 'active'
ORDER BY e.enrolled_at DESC;
