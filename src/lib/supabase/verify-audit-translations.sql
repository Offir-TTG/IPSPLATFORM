-- Check if translations exist
SELECT
  'translation_keys' as table_name,
  COUNT(*) as count
FROM translation_keys
WHERE key LIKE 'admin.audit.%'

UNION ALL

SELECT
  'translations (Hebrew)' as table_name,
  COUNT(*) as count
FROM translations
WHERE translation_key LIKE 'admin.audit.%'
  AND language_code = 'he'

UNION ALL

SELECT
  'translations (English)' as table_name,
  COUNT(*) as count
FROM translations
WHERE translation_key LIKE 'admin.audit.%'
  AND language_code = 'en';

-- Show actual translation keys
SELECT * FROM translation_keys WHERE key LIKE 'admin.audit.%' ORDER BY key;

-- Show actual translations
SELECT translation_key, language_code, translation_value
FROM translations
WHERE translation_key LIKE 'admin.audit.%'
ORDER BY translation_key, language_code;
