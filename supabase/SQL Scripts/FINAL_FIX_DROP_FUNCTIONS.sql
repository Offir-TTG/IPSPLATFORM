-- ============================================================================
-- FINAL FIX: Drop problematic tenant functions
-- ============================================================================
-- These functions are trying to use app.current_tenant_id which doesn't exist
-- Your RLS policies already work correctly using auth.uid()
-- ============================================================================

-- STEP 1: Check what's using these functions
-- ============================================================================
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual AS using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual LIKE '%set_current_tenant%'
    OR qual LIKE '%get_current_tenant_id%'
  )
ORDER BY tablename, policyname;

-- ============================================================================
-- STEP 2: Drop the problematic functions with CASCADE
-- ============================================================================
-- This will remove the functions AND any policies/triggers that depend on them
-- CASCADE ensures everything that references these functions gets cleaned up

DROP FUNCTION IF EXISTS public.set_current_tenant() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_tenant_id() CASCADE;

-- Also try schema-qualified versions
DROP FUNCTION IF EXISTS set_current_tenant() CASCADE;
DROP FUNCTION IF EXISTS get_current_tenant_id() CASCADE;

-- ============================================================================
-- STEP 3: Verify they're gone
-- ============================================================================
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('set_current_tenant', 'get_current_tenant_id')
  AND n.nspname = 'public';

-- Should return no rows if successfully dropped

-- ============================================================================
-- STEP 4: Check if any policies were dropped
-- ============================================================================
-- List remaining policies on modules table to see if any were removed
SELECT
  policyname,
  cmd AS command,
  qual AS using_expression
FROM pg_policies
WHERE tablename = 'modules'
  AND schemaname = 'public'
ORDER BY policyname;

-- ============================================================================
-- STEP 5: Test module creation
-- ============================================================================
-- After running STEP 2, go back to your UI and try creating a module
-- It should work now without the "unrecognized configuration parameter" error
-- ============================================================================

-- ============================================================================
-- NOTES:
-- ============================================================================
-- The CASCADE option will automatically drop any database objects that
-- depend on these functions, including:
-- - Triggers that call these functions
-- - RLS policies that use these functions
-- - Other functions that call these functions
--
-- This is safe because your RLS policies in APPLY_LMS_SCHEMA.sql don't
-- use these functions - they use auth.uid() directly.
-- ============================================================================
