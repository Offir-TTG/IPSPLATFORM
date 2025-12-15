-- Check current unique constraints and indexes on translations table
SELECT
    i.relname as index_name,
    pg_get_indexdef(i.oid) as index_definition
FROM pg_index idx
JOIN pg_class i ON i.oid = idx.indexrelid
JOIN pg_class t ON t.oid = idx.indrelid
WHERE t.relname = 'translations'
  AND idx.indisunique = true
ORDER BY i.relname;

-- Check all columns in translations table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'translations'
ORDER BY ordinal_position;
