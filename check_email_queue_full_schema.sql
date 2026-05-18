-- Check full email_queue schema
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'email_queue'
ORDER BY ordinal_position;
