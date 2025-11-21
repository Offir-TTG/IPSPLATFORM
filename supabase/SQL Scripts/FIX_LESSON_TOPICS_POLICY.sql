-- ============================================================================
-- FIX LESSON_TOPICS TABLE POLICY
-- ============================================================================
-- The "Students can view topics" policy uses app.current_tenant_id
-- This causes the same error as we had with modules
-- We need to drop it because we already have a correct policy:
-- "Users can view lesson topics in their tenant" (uses auth.uid())
-- ============================================================================

-- STEP 1: Drop the problematic policy
-- ============================================================================

DROP POLICY IF EXISTS "Students can view topics" ON lesson_topics;

-- ============================================================================
-- STEP 2: Verify only correct policies remain
-- ============================================================================

SELECT
  policyname,
  cmd AS command,
  qual AS using_expression
FROM pg_policies
WHERE tablename = 'lesson_topics'
  AND schemaname = 'public'
ORDER BY policyname;

-- Should show these 4 policies (all using auth.uid() correctly):
-- - Admins can delete lesson topics
-- - Admins can insert lesson topics
-- - Admins can update lesson topics
-- - Users can view lesson topics in their tenant

-- ============================================================================
-- STEP 3: Test module fetch
-- ============================================================================
-- After running STEP 1, refresh your UI
-- The modules should now appear!
-- ============================================================================

-- ============================================================================
-- EXPLANATION:
-- ============================================================================
-- You have TWO SELECT policies on lesson_topics:
--
-- OLD POLICY (causing error):
-- - "Students can view topics" - uses app.current_tenant_id
--
-- NEW POLICY (working correctly):
-- - "Users can view lesson topics in their tenant" - uses auth.uid()
--
-- When fetching modules with include_lessons=true, the query joins:
-- modules -> lessons -> lesson_topics -> zoom_sessions
--
-- The problematic policy on lesson_topics was blocking the entire query
-- because PostgreSQL tried to evaluate app.current_tenant_id which doesn't exist.
-- ============================================================================
