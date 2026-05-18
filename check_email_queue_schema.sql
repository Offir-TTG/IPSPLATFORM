-- Check email_queue table schema
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'email_queue'
ORDER BY ordinal_position;
