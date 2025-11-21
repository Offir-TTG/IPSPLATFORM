-- SIMPLE SCHEMA DIAGNOSTIC - Run this single query
-- This will show all critical field existence in one result

SELECT
  -- ENROLLMENTS TABLE FIELDS
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'enrollments' AND column_name = 'expires_at') AS enrollments_has_expires_at,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'enrollments' AND column_name = 'user_id') AS enrollments_has_user_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'enrollments' AND column_name = 'student_id') AS enrollments_has_student_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'enrollments' AND column_name = 'tenant_id') AS enrollments_has_tenant_id,

  -- USER_PROGRESS TABLE FIELDS
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_progress' AND column_name = 'enrollment_id') AS user_progress_has_enrollment_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_progress' AND column_name = 'course_id') AS user_progress_has_course_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_progress' AND column_name = 'time_spent_seconds') AS user_progress_has_time_spent_seconds,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_progress' AND column_name = 'time_spent_minutes') AS user_progress_has_time_spent_minutes,

  -- LESSONS TABLE FIELDS
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'end_time') AS lessons_has_end_time,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'duration') AS lessons_has_duration,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'module_id') AS lessons_has_module_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'course_id') AS lessons_has_course_id;
