-- Check user enrollments and related data
SELECT 
  e.id,
  e.user_id,
  e.status,
  e.product_id,
  e.program_id,
  e.course_id,
  e.enrolled_at,
  p.id as product_exists,
  p.title as product_title,
  p.program_id as product_program_id,
  p.course_id as product_course_id,
  prog.name as program_name,
  c.title as course_name
FROM enrollments e
LEFT JOIN products p ON p.id = e.product_id
LEFT JOIN programs prog ON prog.id = COALESCE(e.program_id, p.program_id)
LEFT JOIN courses c ON c.id = COALESCE(e.course_id, p.course_id)
WHERE e.status = 'active'
ORDER BY e.enrolled_at DESC
LIMIT 20;
