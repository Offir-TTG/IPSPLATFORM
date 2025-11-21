-- Verify both functions exist and check their actual definitions

-- Check if get_user_dashboard exists
SELECT
  'get_user_dashboard' as function_name,
  p.proname,
  pg_get_function_arguments(p.oid) as arguments,
  CASE
    WHEN pg_get_functiondef(p.oid) LIKE '%enrollment_id%' THEN 'Uses enrollment_id ✓'
    WHEN pg_get_functiondef(p.oid) LIKE '%up.course_id%' THEN 'Uses course_id ✗'
    ELSE 'Unknown'
  END as status,
  CASE
    WHEN pg_get_functiondef(p.oid) LIKE '%VOLATILE%' THEN 'VOLATILE ✓'
    ELSE 'NOT VOLATILE ✗'
  END as volatility
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'get_user_dashboard'
  AND n.nspname = 'public';

-- Check if get_user_dashboard_v2 exists
SELECT
  'get_user_dashboard_v2' as function_name,
  p.proname,
  pg_get_function_arguments(p.oid) as arguments,
  CASE
    WHEN pg_get_functiondef(p.oid) LIKE '%enrollment_id%' THEN 'Uses enrollment_id ✓'
    WHEN pg_get_functiondef(p.oid) LIKE '%up.course_id%' THEN 'Uses course_id ✗'
    ELSE 'Unknown'
  END as status,
  CASE
    WHEN pg_get_functiondef(p.oid) LIKE '%VOLATILE%' THEN 'VOLATILE ✓'
    ELSE 'NOT VOLATILE ✗'
  END as volatility
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'get_user_dashboard_v2'
  AND n.nspname = 'public';

-- Test calling get_user_dashboard_v2 directly
SELECT 'Testing get_user_dashboard_v2 with dummy UUID' as message;
