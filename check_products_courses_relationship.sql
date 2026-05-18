-- Check products table schema
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- Sample products to see course relationship
SELECT id, name, course_id, program_id
FROM products
LIMIT 5;

-- Check if the test course has any products
SELECT p.id, p.name, p.course_id
FROM products p
WHERE p.course_id = '321f0bb3-c0c6-43a1-a1c0-8810e317fdf6';
