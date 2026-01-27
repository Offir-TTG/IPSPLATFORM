/**
 * Check what audit-related tables exist in the database
 */

-- Check all tables that contain 'audit' in the name
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename LIKE '%audit%'
ORDER BY tablename;

-- Check all columns in information_schema for audit tables
SELECT
  table_schema,
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name LIKE '%audit%'
ORDER BY table_name, ordinal_position;
