-- Check products table schema
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- Sample product records
SELECT *
FROM products
LIMIT 2;
