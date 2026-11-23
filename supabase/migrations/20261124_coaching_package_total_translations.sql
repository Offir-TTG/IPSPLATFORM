-- Coaching drawer: the package total under "charged so far".
-- Hebrew as U&'\05..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.coaching.drawer.packageTotal', 'Package total: {price}'),
  ('he', 'admin.coaching.drawer.packageTotal', U&'\05E1\05D4\05F4\05DB \05D7\05D1\05D9\05DC\05D4: {price}')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
