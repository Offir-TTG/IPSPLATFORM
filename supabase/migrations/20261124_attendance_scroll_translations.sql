-- Attendance, all meetings: arrows to scroll between meetings. In he + en.
-- The Hebrew is written as U&'\05E9...' character codes, so the file is plain ASCII and
-- cannot be scrambled when pasted in the SQL editor. Postgres stores the same Hebrew text.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.attendanceTab.meetingsCount', '{n} meetings'),
  ('he', 'admin.attendanceTab.meetingsCount', U&'{n} \05DE\05E4\05D2\05E9\05D9\05DD'),
  ('en', 'admin.attendanceTab.earlier', 'Earlier meetings'),
  ('he', 'admin.attendanceTab.earlier', U&'\05DE\05E4\05D2\05E9\05D9\05DD \05E7\05D5\05D3\05DE\05D9\05DD'),
  ('en', 'admin.attendanceTab.later', 'Later meetings'),
  ('he', 'admin.attendanceTab.later', U&'\05DE\05E4\05D2\05E9\05D9\05DD \05D4\05D1\05D0\05D9\05DD')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
