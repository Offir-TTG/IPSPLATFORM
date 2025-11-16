-- ============================================================================
-- FIX AUDIT TRANSLATIONS CONTEXT
-- ============================================================================
-- This updates the context column for audit translations to ensure they
-- are returned by the API when filtering for admin context

-- First, ensure translation_keys have correct context
UPDATE translation_keys
SET context = 'admin'
WHERE key LIKE 'admin.audit.%'
  AND (context IS NULL OR context != 'admin');

-- Then, update the translations table to match
UPDATE translations
SET context = 'admin'
WHERE translation_key LIKE 'admin.audit.%'
  AND (context IS NULL OR context != 'admin');

-- Verify the fix
SELECT
  translation_key,
  language_code,
  context,
  translation_value
FROM translations
WHERE translation_key LIKE 'admin.audit.%'
ORDER BY translation_key, language_code;

-- Count by context to confirm
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN context = 'admin' THEN 1 END) as admin_context,
  COUNT(CASE WHEN context = 'both' THEN 1 END) as both_context,
  COUNT(CASE WHEN context = 'user' THEN 1 END) as user_context,
  COUNT(CASE WHEN context IS NULL THEN 1 END) as null_context
FROM translations
WHERE translation_key LIKE 'admin.audit.%';
