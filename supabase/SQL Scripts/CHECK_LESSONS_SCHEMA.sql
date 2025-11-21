-- Check the lessons table structure to see what references it has
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'lessons'
ORDER BY ordinal_position;
