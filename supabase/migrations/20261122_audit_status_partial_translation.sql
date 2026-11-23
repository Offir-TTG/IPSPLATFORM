-- Audit status "Partial" in he + en (the Hebrew was missing, so the filter showed English).
-- Hebrew written as U&'\05..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.audit.filters.statusValue.partial', 'Partial'),
  ('he', 'admin.audit.filters.statusValue.partial', U&'\05D7\05DC\05E7\05D9')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
