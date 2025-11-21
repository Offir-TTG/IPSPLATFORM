-- COMPREHENSIVE SCHEMA DIAGNOSTIC
-- Run this entire file in Supabase SQL Editor to see your ACTUAL database schema

-- ============================================================================
-- SECTION 1: ENROLLMENTS TABLE
-- ============================================================================

SELECT '=== ENROLLMENTS TABLE SCHEMA ===' as section;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'enrollments'
ORDER BY ordinal_position;

-- Check specific critical fields
SELECT
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'expires_at') AS has_expires_at,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'tenant_id') AS has_tenant_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'user_id') AS has_user_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'student_id') AS has_student_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'course_id') AS has_course_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'program_id') AS has_program_id;

-- Sample data (if any)
SELECT '=== ENROLLMENTS SAMPLE DATA ===' as section;
SELECT * FROM enrollments LIMIT 3;

-- ============================================================================
-- SECTION 2: USER_PROGRESS TABLE
-- ============================================================================

SELECT '=== USER_PROGRESS TABLE SCHEMA ===' as section;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_progress'
ORDER BY ordinal_position;

-- Check specific critical fields
SELECT
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'enrollment_id') AS has_enrollment_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'course_id') AS has_course_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'program_id') AS has_program_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'lesson_id') AS has_lesson_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'topic_id') AS has_topic_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'time_spent_seconds') AS has_time_spent_seconds,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'time_spent_minutes') AS has_time_spent_minutes;

-- Sample data (if any)
SELECT '=== USER_PROGRESS SAMPLE DATA ===' as section;
SELECT * FROM user_progress LIMIT 3;

-- ============================================================================
-- SECTION 3: LESSONS TABLE
-- ============================================================================

SELECT '=== LESSONS TABLE SCHEMA ===' as section;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'lessons'
ORDER BY ordinal_position;

-- Check specific critical fields
SELECT
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'end_time') AS has_end_time,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'duration') AS has_duration,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'module_id') AS has_module_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'course_id') AS has_course_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'start_time') AS has_start_time,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'zoom_meeting_id') AS has_zoom_meeting_id;

-- Sample data (if any)
SELECT '=== LESSONS SAMPLE DATA ===' as section;
SELECT id, title, start_time, duration FROM lessons LIMIT 3;

-- ============================================================================
-- SECTION 4: MODULES TABLE
-- ============================================================================

SELECT '=== MODULES TABLE SCHEMA ===' as section;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'modules'
ORDER BY ordinal_position;

-- Sample data (if any)
SELECT '=== MODULES SAMPLE DATA ===' as section;
SELECT * FROM modules LIMIT 3;

-- ============================================================================
-- SECTION 5: COURSES TABLE
-- ============================================================================

SELECT '=== COURSES TABLE SCHEMA ===' as section;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'courses'
ORDER BY ordinal_position;

-- Sample data (if any)
SELECT '=== COURSES SAMPLE DATA ===' as section;
SELECT * FROM courses LIMIT 3;

-- ============================================================================
-- SECTION 6: PROGRAMS TABLE
-- ============================================================================

SELECT '=== PROGRAMS TABLE SCHEMA ===' as section;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'programs'
ORDER BY ordinal_position;

-- Sample data (if any)
SELECT '=== PROGRAMS SAMPLE DATA ===' as section;
SELECT * FROM programs LIMIT 3;

-- ============================================================================
-- SECTION 7: USERS TABLE
-- ============================================================================

SELECT '=== USERS TABLE SCHEMA ===' as section;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 8: EXISTING DASHBOARD FUNCTIONS
-- ============================================================================

SELECT '=== EXISTING DASHBOARD FUNCTIONS ===' as section;

SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%dashboard%'
ORDER BY routine_name;

-- ============================================================================
-- SECTION 9: FOREIGN KEY RELATIONSHIPS
-- ============================================================================

SELECT '=== FOREIGN KEY RELATIONSHIPS ===' as section;

SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('enrollments', 'user_progress', 'lessons', 'modules', 'courses', 'programs')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- SECTION 10: SUMMARY AND RECOMMENDATIONS
-- ============================================================================

SELECT '=== DIAGNOSTIC SUMMARY ===' as section;

SELECT
  'Run all queries above and review results' as instruction,
  'Share the complete output to get a working dashboard function' as next_step;
