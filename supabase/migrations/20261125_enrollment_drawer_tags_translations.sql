-- Enrollment drawer: the label of the CRM tag badges (read by screen readers).
-- Hebrew as U&'\05..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.enrollments.drawer.crmTags', 'CRM tags'),
  ('he', 'admin.enrollments.drawer.crmTags', U&'\05EA\05D2\05D9\05D5\05EA CRM')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.tenant_id IS NULL AND t.language_code = v.lang AND t.translation_key = v.key
);
