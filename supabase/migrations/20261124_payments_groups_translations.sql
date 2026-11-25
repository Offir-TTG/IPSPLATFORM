-- Payments home: the two group headings above the cards.
-- Hebrew as U&'\05..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.payments.group.money', 'Payments and reports'),
  ('he', 'admin.payments.group.money', U&'\05EA\05E9\05DC\05D5\05DE\05D9\05DD \05D5\05D3\05D5\05D7\05D5\05EA'),
  ('en', 'admin.payments.group.setup', 'Setup'),
  ('he', 'admin.payments.group.setup', U&'\05D4\05D2\05D3\05E8\05D5\05EA')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.tenant_id IS NULL AND t.language_code = v.lang AND t.translation_key = v.key
);
