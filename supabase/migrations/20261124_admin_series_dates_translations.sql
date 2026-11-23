-- Lesson series, dates step: group titles, day picked from the start date, date range. In he + en.
-- The Hebrew is written as U&'\05E9...' character codes, so the file is plain ASCII and
-- cannot be scrambled when pasted in the SQL editor. Postgres stores the same Hebrew text.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.courses.builder.groupStart', 'When it starts'),
  ('he', 'admin.courses.builder.groupStart', U&'\05DE\05EA\05D9 \05DE\05EA\05D7\05D9\05DC\05D9\05DD'),
  ('en', 'admin.courses.builder.groupRepeat', 'Repeats'),
  ('he', 'admin.courses.builder.groupRepeat', U&'\05D7\05D5\05D6\05E8'),
  ('en', 'admin.courses.builder.dayFromDate', 'Picked from the start date'),
  ('he', 'admin.courses.builder.dayFromDate', U&'\05E0\05D1\05D7\05E8 \05DC\05E4\05D9 \05EA\05D0\05E8\05D9\05DA \05D4\05D4\05EA\05D7\05DC\05D4'),
  ('en', 'admin.courses.builder.seriesRange', U&'{n} lessons \00B7 {from} to {to}'),
  ('he', 'admin.courses.builder.seriesRange', U&'{n} \05E9\05D9\05E2\05D5\05E8\05D9\05DD \00B7 {from} \05E2\05D3 {to}')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
