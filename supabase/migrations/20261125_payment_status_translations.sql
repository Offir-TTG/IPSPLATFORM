-- Payment statuses with no translation (showed as raw words, e.g. 'refunded'). In he + en. Adds only missing keys; safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'both', NOW(), NOW() FROM (VALUES
  ('en', 'common.refunded', 'Refunded'), ('he', 'common.refunded', U&'\05D4\05D5\05D7\05D6\05E8'),
  ('en', 'common.partially_refunded', 'Partly refunded'), ('he', 'common.partially_refunded', U&'\05D4\05D5\05D7\05D6\05E8 \05D7\05DC\05E7\05D9\05EA'),
  ('en', 'common.cancelled', 'Cancelled'), ('he', 'common.cancelled', U&'\05D1\05D5\05D8\05DC'),
  ('en', 'common.processing', 'Processing'), ('he', 'common.processing', U&'\05D1\05E2\05D9\05D1\05D5\05D3'),
  ('en', 'common.adjusted', 'Adjusted'), ('he', 'common.adjusted', U&'\05E2\05D5\05D3\05DB\05DF'),
  ('en', 'common.scheduled', 'Scheduled'), ('he', 'common.scheduled', U&'\05DE\05EA\05D5\05DB\05E0\05DF')
) AS v(lang, key, value) WHERE NOT EXISTS (SELECT 1 FROM translations t WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL);
