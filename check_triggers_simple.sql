-- First, see what columns exist in email_triggers
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'email_triggers'
ORDER BY ordinal_position;

-- Then get all triggers (no filtering)
SELECT *
FROM email_triggers
LIMIT 5;
