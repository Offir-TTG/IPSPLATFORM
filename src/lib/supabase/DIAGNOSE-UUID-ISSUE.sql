-- ============================================================================
-- DIAGNOSTIC QUERIES - Run these to understand the current state
-- ============================================================================

-- 1. Check if uuid-ossp extension is installed
SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';
-- Expected: Should return 1 row if installed

-- 2. Check which schema the extension is in
SELECT n.nspname as schema_name
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname = 'uuid-ossp';
-- Expected: Should show 'public' or 'extensions'

-- 3. Check if the function exists and its properties
SELECT
  p.proname as function_name,
  n.nspname as schema_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE
    WHEN p.prosecdef THEN 'DEFINER'
    ELSE 'INVOKER'
  END as security_type,
  p.provolatile as volatility
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'log_audit_event';
-- Expected: Should show security_type = 'DEFINER'

-- 4. Check if uuid_generate_v4 is accessible
SELECT uuid_generate_v4();
-- Expected: Should generate a UUID like '550e8400-e29b-41d4-a716-446655440000'

-- 5. Check the function's search_path setting
SELECT
  p.proname,
  p.proconfig as search_path_config
FROM pg_proc p
WHERE p.proname = 'log_audit_event';
-- Expected: Should show search_path configuration

-- ============================================================================
-- RESULTS INTERPRETATION
-- ============================================================================
-- If query 1 returns no rows: Extension is NOT installed
-- If query 4 fails: Extension is not in the search path
-- If query 3 shows security_type = 'INVOKER': Function not using SECURITY DEFINER
-- ============================================================================
