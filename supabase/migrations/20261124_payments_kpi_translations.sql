-- Payments page: the Refunds number also counts disputes lost to the bank; its line says how much. In he + en.
-- The Hebrew is written as U&'\05E9...' character codes, so the file is plain ASCII and
-- cannot be scrambled when pasted in the SQL editor. Postgres stores the same Hebrew text.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.payments.refundsAndLostDisputes', 'Includes {amount} in lost disputes'),
  ('he', 'admin.payments.refundsAndLostDisputes', U&'\05DB\05D5\05DC\05DC {amount} \05DE\05DE\05D7\05DC\05D5\05E7\05D5\05EA \05E9\05D4\05D5\05E4\05E1\05D3\05D5 \05DE\05D5\05DC \05D4\05D1\05E0\05E7')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
