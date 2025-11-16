-- Check if context column exists and has correct values
SELECT
  translation_key,
  language_code,
  translation_value,
  context,
  category
FROM translations
WHERE translation_key LIKE 'admin.audit.%'
ORDER BY translation_key, language_code;

-- Check if translations have context = 'admin' or context = 'both'
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN context = 'admin' THEN 1 END) as admin_context,
  COUNT(CASE WHEN context = 'both' THEN 1 END) as both_context,
  COUNT(CASE WHEN context = 'user' THEN 1 END) as user_context,
  COUNT(CASE WHEN context IS NULL THEN 1 END) as null_context
FROM translations
WHERE translation_key LIKE 'admin.audit.%';
