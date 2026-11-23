-- Product wizard: the currency is the business's, set in Organization settings.
-- Hebrew as U&'\05..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'products.currencyFromSettings', 'Set for the whole business in Organization settings'),
  ('he', 'products.currencyFromSettings', U&'\05E0\05E7\05D1\05E2 \05DC\05DB\05DC \05D4\05E2\05E1\05E7 \05D1\05D4\05D2\05D3\05E8\05D5\05EA \05D4\05D0\05E8\05D2\05D5\05DF')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
