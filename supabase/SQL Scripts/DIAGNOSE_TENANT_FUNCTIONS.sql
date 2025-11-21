-- ============================================================================
-- DIAGNOSE TENANT FUNCTIONS
-- ============================================================================
-- Let's look at the actual function definitions to understand the problem
-- ============================================================================

-- STEP 1: Get set_current_tenant function definition
-- ============================================================================
SELECT pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'set_current_tenant';

-- ============================================================================
-- STEP 2: Get get_current_tenant_id function definition
-- ============================================================================
SELECT pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'get_current_tenant_id';

-- ============================================================================
-- STEP 3: Find what's CALLING these functions
-- ============================================================================
-- Check if they're used in RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE qual LIKE '%set_current_tenant%'
   OR qual LIKE '%get_current_tenant_id%'
   OR with_check LIKE '%set_current_tenant%'
   OR with_check LIKE '%get_current_tenant_id%';

-- ============================================================================
-- STEP 4: Check all policies on modules table
-- ============================================================================
SELECT
  policyname,
  cmd,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'modules'
ORDER BY policyname;

-- ============================================================================
-- STEP 5: THE FIX - Drop the problematic functions
-- ============================================================================
-- These functions are trying to use app.current_tenant_id which doesn't exist
-- Your RLS policies use auth.uid() directly, so these functions aren't needed

DROP FUNCTION IF EXISTS set_current_tenant() CASCADE;
DROP FUNCTION IF EXISTS get_current_tenant_id() CASCADE;

-- ============================================================================
-- STEP 6: Verify they're gone
-- ============================================================================
SELECT proname
FROM pg_proc
WHERE proname IN ('set_current_tenant', 'get_current_tenant_id');

-- Should return no rows

-- ============================================================================
-- STEP 7: Test module creation
-- ============================================================================
-- After running this, try creating a module in your UI
-- It should work now!
-- ============================================================================
