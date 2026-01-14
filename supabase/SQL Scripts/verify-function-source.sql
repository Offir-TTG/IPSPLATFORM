-- Get the actual source code of the function
SELECT
  p.proname as function_name,
  CASE
    WHEN p.prosrc LIKE '%attendance_rate%' THEN 'HAS attendance_rate'
    ELSE 'MISSING attendance_rate'
  END as status,
  CASE
    WHEN p.prosrc LIKE '%total_attendance%' THEN 'HAS total_attendance'
    ELSE 'MISSING total_attendance'
  END as status2,
  LENGTH(p.prosrc) as source_length
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_user_dashboard_v3'
  AND n.nspname = 'public';
