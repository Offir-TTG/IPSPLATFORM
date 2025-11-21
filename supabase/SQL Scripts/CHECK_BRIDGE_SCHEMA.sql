-- Check the actual structure of instructor_bridge_links table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'instructor_bridge_links'
ORDER BY ordinal_position;
