-- Check all versions of get_user_dashboard functions
SELECT
  p.proname,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  p.prosrc LIKE '%attendance_rate%' as has_attendance_rate
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE 'get_user_dashboard%'
  AND n.nspname = 'public'
ORDER BY p.proname;
