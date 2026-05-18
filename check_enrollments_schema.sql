-- Check enrollments table schema
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'enrollments'
ORDER BY ordinal_position;

-- Sample enrollment records
SELECT *
FROM enrollments
LIMIT 3;
