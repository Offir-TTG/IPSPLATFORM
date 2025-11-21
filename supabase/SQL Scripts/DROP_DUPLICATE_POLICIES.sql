-- ============================================================================
-- DROP DUPLICATE/PROBLEMATIC RLS POLICIES
-- ============================================================================
-- You have TWO sets of policies on modules table
-- The old ones use app.current_tenant_id (causing the error)
-- The new ones use auth.uid() (correct)
-- ============================================================================

-- STEP 1: Drop the problematic policies that use app.current_tenant_id
-- ============================================================================

DROP POLICY IF EXISTS "Admin/Instructor can manage modules" ON modules;
DROP POLICY IF EXISTS "Students can view published modules" ON modules;

-- ============================================================================
-- STEP 2: Drop the problematic functions
-- ============================================================================

DROP FUNCTION IF EXISTS public.set_current_tenant() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_tenant_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_tenant_instructor() CASCADE;

-- ============================================================================
-- STEP 3: Verify the remaining policies
-- ============================================================================

SELECT
  policyname,
  cmd AS command,
  qual AS using_expression
FROM pg_policies
WHERE tablename = 'modules'
  AND schemaname = 'public'
ORDER BY policyname;

-- Should only show these 4 policies (the good ones):
-- - Admins can delete modules
-- - Admins can insert modules
-- - Admins can update modules
-- - Users can view modules in their tenant

-- ============================================================================
-- STEP 4: Test module creation
-- ============================================================================
-- After running steps 1-2, try creating a module in your UI
-- It should work now!
-- ============================================================================

-- ============================================================================
-- EXPLANATION:
-- ============================================================================
-- The error occurred because you had duplicate RLS policies:
--
-- OLD POLICIES (causing error):
-- - "Admin/Instructor can manage modules" - uses app.current_tenant_id
-- - "Students can view published modules" - uses app.current_tenant_id
--
-- NEW POLICIES (working correctly):
-- - "Admins can insert modules" - uses auth.uid() via tenant_users lookup
-- - "Admins can update modules" - uses auth.uid() via tenant_users lookup
-- - "Admins can delete modules" - uses auth.uid() via tenant_users lookup
-- - "Users can view modules in their tenant" - uses auth.uid() via tenant_users lookup
--
-- The old policies were blocking your inserts because PostgreSQL was trying
-- to evaluate app.current_tenant_id which doesn't exist.
-- ============================================================================
