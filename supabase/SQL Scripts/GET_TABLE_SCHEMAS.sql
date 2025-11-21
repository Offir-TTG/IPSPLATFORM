-- Get complete schema for enrollments table
SELECT
  'ENROLLMENTS' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'enrollments'
ORDER BY ordinal_position;
