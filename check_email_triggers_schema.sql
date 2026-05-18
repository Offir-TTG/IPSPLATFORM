-- Check the actual schema of email_triggers table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'email_triggers'
ORDER BY ordinal_position;

-- Also check email_templates schema
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'email_templates'
ORDER BY ordinal_position;

-- Check if email trigger system exists at all
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE '%email%' OR table_name LIKE '%trigger%' OR table_name LIKE '%notification%')
ORDER BY table_name;
