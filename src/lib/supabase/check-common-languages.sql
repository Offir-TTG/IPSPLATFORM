-- Check if common_languages table exists and has data

-- Check table existence
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'common_languages'
) as table_exists;

-- Check how many languages are in the table
SELECT COUNT(*) as total_languages FROM common_languages;

-- Check Spanish language data specifically
SELECT
  code,
  name,
  native_name,
  currency_code,
  currency_symbol,
  currency_position,
  is_popular
FROM common_languages
WHERE code = 'es';

-- Show all popular languages
SELECT
  code,
  name,
  native_name,
  currency_code,
  currency_symbol,
  is_popular
FROM common_languages
WHERE is_popular = true
ORDER BY name;
