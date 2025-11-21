-- RUN THIS COMPLETE FILE AND SHARE ALL OUTPUT
-- This will give me everything needed to create the perfect dashboard function

-- ============================================================================
-- CRITICAL FIELDS CHECK
-- ============================================================================

SELECT '=== CRITICAL FIELD EXISTENCE CHECK ===' as info;

SELECT
  -- ENROLLMENTS TABLE
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'expires_at') AS enrollments_has_expires_at,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'user_id') AS enrollments_has_user_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'student_id') AS enrollments_has_student_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'tenant_id') AS enrollments_has_tenant_id,

  -- USER_PROGRESS TABLE
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'enrollment_id') AS user_progress_has_enrollment_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'course_id') AS user_progress_has_course_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'time_spent_seconds') AS user_progress_has_time_spent_seconds,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'time_spent_minutes') AS user_progress_has_time_spent_minutes,

  -- LESSONS TABLE
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'end_time') AS lessons_has_end_time,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'duration') AS lessons_has_duration,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'module_id') AS lessons_has_module_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'course_id') AS lessons_has_course_id;

-- ============================================================================
-- ENROLLMENTS TABLE COMPLETE SCHEMA
-- ============================================================================

SELECT '=== ENROLLMENTS TABLE COLUMNS ===' as info;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'enrollments'
ORDER BY ordinal_position;

-- ============================================================================
-- USER_PROGRESS TABLE COMPLETE SCHEMA
-- ============================================================================

SELECT '=== USER_PROGRESS TABLE COLUMNS ===' as info;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_progress'
ORDER BY ordinal_position;

-- ============================================================================
-- LESSONS TABLE COMPLETE SCHEMA
-- ============================================================================

SELECT '=== LESSONS TABLE COLUMNS ===' as info;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'lessons'
ORDER BY ordinal_position;

-- ============================================================================
-- TEST ACTUAL DATA
-- ============================================================================

SELECT '=== YOUR ACTUAL ENROLLMENT DATA ===' as info;

SELECT
  id,
  program_id,
  course_id,
  CASE
    WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'user_id')
    THEN user_id
    ELSE NULL
  END as user_id_if_exists,
  status,
  enrolled_at
FROM enrollments
WHERE CASE
    WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'user_id')
    THEN user_id = 'd7cb0921-4af6-4641-bdbd-c14c59eba9dc'
    ELSE true
  END
LIMIT 5;

SELECT '=== YOUR ACTUAL USER_PROGRESS DATA ===' as info;

SELECT * FROM user_progress LIMIT 3;

SELECT '=== YOUR ACTUAL LESSONS DATA ===' as info;

SELECT id, title, start_time, duration FROM lessons LIMIT 3;

-- ============================================================================
-- END - SHARE ALL OUTPUT ABOVE
-- ============================================================================

SELECT '=== DIAGNOSTIC COMPLETE ===' as info;
SELECT 'Copy ALL the output above and share it' as next_step;
