INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW() FROM (VALUES
  ('en', 'admin.keapHistory.productSearch', 'Search a product...'),
  ('he', 'admin.keapHistory.productSearch', U&'\05D7\05D9\05E4\05D5\05E9 \05DE\05D5\05E6\05E8...'),
  ('en', 'admin.keapHistory.productNone', 'No product by that name.'),
  ('he', 'admin.keapHistory.productNone', U&'\05DC\05D0 \05E0\05DE\05E6\05D0 \05DE\05D5\05E6\05E8 \05D1\05E9\05DD \05D4\05D6\05D4.'),
  ('en', 'admin.keapHistory.email', 'Email'),
  ('he', 'admin.keapHistory.email', U&'\05DE\05D9\05D9\05DC'),
  ('en', 'admin.keapHistory.phone', 'Phone'),
  ('he', 'admin.keapHistory.phone', U&'\05D8\05DC\05E4\05D5\05DF')
) AS v(lang, key, value) WHERE NOT EXISTS (SELECT 1 FROM translations t WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL);
