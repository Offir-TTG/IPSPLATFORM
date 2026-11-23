-- Deleting a program, and the reason when enrollments still run, in he + en.
-- The Hebrew is written as U&'\05E9...' character codes, so the file is plain ASCII and
-- cannot be scrambled when pasted in the SQL editor. Postgres stores the same Hebrew text.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.programs.delete.blocked', 'Cannot be deleted while {n} students are enrolled (active or waiting). Cancel their enrollments first.'),
  ('he', 'admin.programs.delete.blocked', U&'\05D0\05D9 \05D0\05E4\05E9\05E8 \05DC\05DE\05D7\05D5\05E7 \05DB\05DC \05E2\05D5\05D3 {n} \05EA\05DC\05DE\05D9\05D3\05D9\05DD \05E8\05E9\05D5\05DE\05D9\05DD (\05E4\05E2\05D9\05DC\05D9\05DD \05D0\05D5 \05DE\05DE\05EA\05D9\05E0\05D9\05DD). \05E7\05D5\05D3\05DD \05DE\05D1\05D8\05DC\05D9\05DD \05D0\05EA \05D4\05D4\05E8\05E9\05DE\05D5\05EA \05E9\05DC\05D4\05DD.'),
  ('en', 'admin.programs.delete.blockedTitle', 'This program cannot be deleted yet'),
  ('he', 'admin.programs.delete.blockedTitle', U&'\05E2\05D5\05D3 \05D0\05D9 \05D0\05E4\05E9\05E8 \05DC\05DE\05D7\05D5\05E7 \05D0\05EA \05D4\05EA\05D5\05DB\05E0\05D9\05EA'),
  ('en', 'admin.programs.delete.seeStudents', 'See the students'),
  ('he', 'admin.programs.delete.seeStudents', U&'\05DC\05EA\05DC\05DE\05D9\05D3\05D9\05DD'),
  ('en', 'admin.programs.delete.confirm', 'Delete "{name}"? Its courses stay; they are only removed from the program. This cannot be undone.'),
  ('he', 'admin.programs.delete.confirm', U&'\05DC\05DE\05D7\05D5\05E7 \05D0\05EA "{name}"? \05D4\05E7\05D5\05E8\05E1\05D9\05DD \05E2\05E6\05DE\05DD \05E0\05E9\05D0\05E8\05D9\05DD, \05D4\05DD \05E8\05E7 \05D9\05D5\05E1\05E8\05D5 \05DE\05D4\05EA\05D5\05DB\05E0\05D9\05EA. \05D0\05D9 \05D0\05E4\05E9\05E8 \05DC\05D1\05D8\05DC \05D0\05EA \05D4\05E4\05E2\05D5\05DC\05D4.')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
