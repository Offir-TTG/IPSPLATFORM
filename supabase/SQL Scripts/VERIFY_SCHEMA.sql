-- SCHEMA VERIFICATION QUERIES
-- Run these first to check which schema is actually deployed in your database

-- 1. Check user_progress table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_progress'
ORDER BY ordinal_position;

-- 2. Check if enrollment_id exists in user_progress
SELECT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'user_progress'
    AND column_name = 'enrollment_id'
) AS has_enrollment_id;

-- 3. Check lessons table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'lessons'
ORDER BY ordinal_position;

-- 4. Check if course_id exists in lessons table
SELECT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'lessons'
    AND column_name = 'course_id'
) AS has_course_id;

-- 5. Check if end_time exists in lessons table
SELECT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'lessons'
    AND column_name = 'end_time'
) AS has_end_time;

-- 6. Check time_spent field name in user_progress
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_progress'
  AND column_name LIKE 'time_spent%';

-- 7. Check enrollments table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'enrollments'
ORDER BY ordinal_position;

-- 8. List all existing dashboard functions
SELECT
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%dashboard%'
ORDER BY routine_name;
