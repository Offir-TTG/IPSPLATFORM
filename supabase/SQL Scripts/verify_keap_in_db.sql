-- Quick check: Do Keap translations exist AT ALL in the database?

SELECT COUNT(*) as total_keap_translations
FROM translations
WHERE translation_key LIKE '%keap%';

-- If the above returns 0, the SQL migration was never run successfully
-- If it returns 102, check which tenant_id:

SELECT
  tenant_id,
  language_code,
  COUNT(*) as count
FROM translations
WHERE translation_key LIKE '%keap%'
GROUP BY tenant_id, language_code;

-- Check what your user's tenant_id is:
SELECT DISTINCT tenant_id FROM users;
