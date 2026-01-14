-- Check for triggers that might prevent user deletion

SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- Also check for any custom functions that reference auth.users
SELECT
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_definition ILIKE '%auth.users%'
  AND routine_schema = 'public'
ORDER BY routine_name;
