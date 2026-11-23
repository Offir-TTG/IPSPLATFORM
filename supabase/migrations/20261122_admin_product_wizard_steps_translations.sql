-- Product wizard: name and description in their own step, then benefit and access, in he + en.
-- The Hebrew is written as U&'\05E9...' character codes, so the file is plain ASCII and
-- cannot be scrambled when pasted in the SQL editor. Postgres stores the same Hebrew text.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'products.tabs.nameDescription', 'Name and description'),
  ('he', 'products.tabs.nameDescription', U&'\05E9\05DD \05D5\05EA\05D9\05D0\05D5\05E8'),
  ('en', 'products.tabs.benefitAccess', 'Benefit and access'),
  ('he', 'products.tabs.benefitAccess', U&'\05D4\05D8\05D1\05D4 \05D5\05D2\05D9\05E9\05D4')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
