-- Force reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the function exists and get its definition
SELECT
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_user_dashboard_v3'
  AND n.nspname = 'public';
