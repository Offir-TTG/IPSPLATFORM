-- ============================================================================
-- COMPLETE FIX: Resolve "unrecognized configuration parameter app.current_tenant_id"
-- ============================================================================
-- Run each section step-by-step in Supabase SQL Editor
-- ============================================================================

-- STEP 1: Find what's causing the error
-- ============================================================================
-- Check for triggers that might be setting app.current_tenant_id

-- Check modules table triggers
SELECT
  t.tgname AS trigger_name,
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'modules'::regclass;

-- Check for any functions that reference app.current_tenant_id
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) LIKE '%app.current_tenant_id%';

-- ============================================================================
-- STEP 2: RECOMMENDED FIX - Drop the problematic trigger/function
-- ============================================================================
-- If you found a trigger above, drop it. Common trigger names might be:
-- - set_tenant_context
-- - enforce_tenant_isolation
-- - tenant_context_trigger

-- Example (uncomment and replace with actual trigger name):
-- DROP TRIGGER IF EXISTS set_tenant_context ON modules;
-- DROP TRIGGER IF EXISTS set_tenant_context ON lessons;
-- DROP TRIGGER IF EXISTS set_tenant_context ON lesson_topics;

-- Drop the function too (uncomment and replace with actual function name):
-- DROP FUNCTION IF EXISTS set_current_tenant();

-- ============================================================================
-- STEP 3: ALTERNATIVE FIX - Create the parameter (if you want to keep the trigger)
-- ============================================================================
-- Only do this if you want to keep the trigger that sets app.current_tenant_id

-- Create the configuration parameter
ALTER DATABASE postgres SET app.current_tenant_id = '';

-- Grant permission to use it
-- (This might be needed depending on your setup)
-- ALTER ROLE authenticated SET app.current_tenant_id = '';

-- ============================================================================
-- STEP 4: Verify the fix
-- ============================================================================
-- Try inserting a test module (replace with your actual values)
-- This should work after applying one of the fixes above

-- SELECT current_setting('app.current_tenant_id', true);  -- Should not error

-- ============================================================================
-- NOTES:
-- ============================================================================
-- The error occurs because:
-- 1. There's a trigger/function trying to SET app.current_tenant_id
-- 2. This parameter was never created in PostgreSQL
-- 3. Your RLS policies don't actually need this - they use auth.uid()
--
-- RECOMMENDED: Remove the trigger (Step 2) rather than create the parameter
-- ============================================================================
