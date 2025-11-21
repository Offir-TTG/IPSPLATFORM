-- Check the ACTUAL structure of user_progress table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_progress'
ORDER BY ordinal_position;

-- Check if enrollment_id exists
SELECT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'user_progress'
    AND column_name = 'enrollment_id'
) AS has_enrollment_id;

-- Check if course_id exists
SELECT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'user_progress'
    AND column_name = 'course_id'
) AS has_course_id;

-- Check lessons table for end_time column
SELECT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'lessons'
    AND column_name = 'end_time'
) AS lessons_has_end_time;

-- Check lessons table for duration column
SELECT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'lessons'
    AND column_name = 'duration'
) AS lessons_has_duration;

-- Sample a few rows from user_progress if any exist
SELECT * FROM user_progress LIMIT 3;

-- Check enrollments table
SELECT * FROM enrollments LIMIT 3;
