-- Check actual email_queue table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'email_queue'
ORDER BY ordinal_position;
