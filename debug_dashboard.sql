-- Debug: Check what the dashboard function returns for a specific user
-- Replace USER_ID_HERE with the actual user ID

-- First, check the enrollments directly
SELECT 
  'Direct Enrollment Query' as query_type,
  e.id as enrollment_id,
  e.user_id,
  e.status,
  e.product_id,
  e.program_id as direct_program_id,
  e.course_id as direct_course_id,
  prod.id as product_id_exists,
  prod.program_id as product_program_id,
  prod.course_id as product_course_id,
  COALESCE(e.program_id, prod.program_id) as resolved_program_id,
  COALESCE(e.course_id, prod.course_id) as resolved_course_id,
  COALESCE(p.name, prog_via_product.name) as program_name,
  COALESCE(c.title, course_via_product.title) as course_name
FROM enrollments e
LEFT JOIN products prod ON prod.id = e.product_id
LEFT JOIN programs p ON p.id = e.program_id
LEFT JOIN courses c ON c.id = e.course_id
LEFT JOIN programs prog_via_product ON prog_via_product.id = prod.program_id
LEFT JOIN courses course_via_product ON course_via_product.id = prod.course_id
WHERE e.status = 'active'
ORDER BY e.enrolled_at DESC;

-- Now check what the function returns (replace USER_ID_HERE)
-- SELECT get_user_dashboard_v3('USER_ID_HERE'::uuid) -> 'enrollments';
