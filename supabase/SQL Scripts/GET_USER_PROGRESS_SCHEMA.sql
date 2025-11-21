-- Get complete schema for user_progress table
SELECT
  'USER_PROGRESS' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_progress'
ORDER BY ordinal_position;
