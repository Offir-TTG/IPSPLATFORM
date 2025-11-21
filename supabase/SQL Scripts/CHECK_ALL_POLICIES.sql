-- ============================================================================
-- CHECK ALL LMS TABLE POLICIES
-- ============================================================================
-- Check if lessons and lesson_topics have similar problematic policies
-- ============================================================================

-- Check lessons table policies
SELECT
  'lessons' as table_name,
  policyname,
  cmd AS command,
  qual AS using_expression
FROM pg_policies
WHERE tablename = 'lessons'
  AND schemaname = 'public'
ORDER BY policyname;

-- Check lesson_topics table policies
SELECT
  'lesson_topics' as table_name,
  policyname,
  cmd AS command,
  qual AS using_expression
FROM pg_policies
WHERE tablename = 'lesson_topics'
  AND schemaname = 'public'
ORDER BY policyname;

-- ============================================================================
-- If you see policies using app.current_tenant_id, drop them like this:
-- ============================================================================
-- DROP POLICY IF EXISTS "Admin/Instructor can manage lessons" ON lessons;
-- DROP POLICY IF EXISTS "Students can view published lessons" ON lessons;
-- DROP POLICY IF EXISTS "Admin/Instructor can manage lesson topics" ON lesson_topics;
-- DROP POLICY IF EXISTS "Students can view published lesson topics" ON lesson_topics;
