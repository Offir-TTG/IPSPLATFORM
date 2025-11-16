-- Find all translation keys that don't have Spanish translations yet
-- This will help you identify what still needs to be translated

SELECT
  tk.key,
  tk.category,
  tk.description,
  en.translation_value as english_text,
  CASE
    WHEN es.translation_value IS NOT NULL THEN '✓ Translated'
    ELSE '✗ Missing'
  END as spanish_status
FROM translation_keys tk
LEFT JOIN translations en ON tk.key = en.translation_key AND en.language_code = 'en'
LEFT JOIN translations es ON tk.key = es.translation_key AND es.language_code = 'es'
WHERE es.translation_value IS NULL  -- Only show keys without Spanish translation
ORDER BY tk.category, tk.key;

-- Count summary
SELECT
  'Total keys' as metric,
  COUNT(*) as count
FROM translation_keys
UNION ALL
SELECT
  'Keys with Spanish' as metric,
  COUNT(DISTINCT tk.key) as count
FROM translation_keys tk
JOIN translations es ON tk.key = es.translation_key AND es.language_code = 'es'
UNION ALL
SELECT
  'Keys missing Spanish' as metric,
  COUNT(*) as count
FROM translation_keys tk
LEFT JOIN translations es ON tk.key = es.translation_key AND es.language_code = 'es'
WHERE es.translation_value IS NULL;
