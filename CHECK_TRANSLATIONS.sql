-- ============================================================================
-- CHECK IF ADMIN PAYMENTS TRANSLATIONS EXIST
-- ============================================================================
-- Run this in Supabase SQL Editor to verify if translations are loaded
-- ============================================================================

-- Check if any admin.payments translations exist
SELECT
  COUNT(*) as total_translations,
  language_code,
  context
FROM translations
WHERE translation_key LIKE 'admin.payments%'
GROUP BY language_code, context
ORDER BY language_code, context;

-- Show a sample of existing admin.payments translations
SELECT
  translation_key,
  translation_value,
  language_code,
  context
FROM translations
WHERE translation_key LIKE 'admin.payments%'
ORDER BY translation_key, language_code
LIMIT 20;

-- Check tenant_id from users table
SELECT
  id as user_id,
  tenant_id,
  role,
  email
FROM users
WHERE role IN ('admin', 'super_admin')
LIMIT 5;
