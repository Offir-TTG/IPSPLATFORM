-- Communications overview: the chart title when long periods are shown by week.
-- Hebrew as U&'\05..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.comms.chartTitleWeek', 'Sent and didn''t arrive, per week'),
  ('he', 'admin.comms.chartTitleWeek', U&'\05E0\05E9\05DC\05D7\05D5 \05D5\05DC\05D0 \05D4\05D2\05D9\05E2\05D5, \05D1\05E9\05D1\05D5\05E2')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.tenant_id IS NULL AND t.language_code = v.lang AND t.translation_key = v.key
);
