-- Check all functions named get_user_dashboard in ALL schemas
SELECT
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  CASE
    WHEN pg_get_functiondef(p.oid) LIKE '%enrollment_id%' THEN 'CORRECT (uses enrollment_id)'
    WHEN pg_get_functiondef(p.oid) LIKE '%up.course_id%' THEN 'WRONG (uses course_id)'
    ELSE 'UNKNOWN'
  END as version_status,
  CASE
    WHEN pg_get_functiondef(p.oid) LIKE '%FROM enrollments e%WHERE e.user_id%AND e.status%AND e.tenant_id%' AND
         pg_get_functiondef(p.oid) LIKE '%COUNT(DISTINCT e.course_id)%'
    THEN 'HAS GROUP BY BUG'
    ELSE 'NO GROUP BY BUG'
  END as group_by_status
FROM pg_proc p
LEFT JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'get_user_dashboard'
ORDER BY n.nspname;
