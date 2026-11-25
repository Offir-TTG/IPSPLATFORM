INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW() FROM (VALUES
  ('en', 'admin.keapHistory.sync.pause', 'Keap asked to slow down. Continuing in {s} seconds…'),
  ('he', 'admin.keapHistory.sync.pause', U&'Keap \05D1\05D9\05E7\05E9 \05DC\05D4\05D0\05D8. \05DE\05DE\05E9\05D9\05DA \05D1\05E2\05D5\05D3 {s} \05E9\05E0\05D9\05D5\05EA\2026')
) AS v(lang, key, value) WHERE NOT EXISTS (SELECT 1 FROM translations t WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL);
