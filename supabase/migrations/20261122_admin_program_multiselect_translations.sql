-- Ticking several courses or people at once in a program's Courses and Students steps, in he + en.
-- The Hebrew is written as U&'\05E9...' character codes, so the file is plain ASCII and
-- cannot be scrambled when pasted in the SQL editor. Postgres stores the same Hebrew text.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.programs.multi.selectAll', 'Select all ({n})'),
  ('he', 'admin.programs.multi.selectAll', U&'\05D1\05D7\05D9\05E8\05EA \05D4\05DB\05D5\05DC ({n})'),
  ('en', 'admin.programs.multi.selected', '{n} selected'),
  ('he', 'admin.programs.multi.selected', U&'{n} \05E0\05D1\05D7\05E8\05D5'),
  ('en', 'admin.programs.multi.clear', 'Clear'),
  ('he', 'admin.programs.multi.clear', U&'\05E0\05D9\05E7\05D5\05D9'),
  ('en', 'admin.programs.multi.addCourses', 'Add {n}'),
  ('he', 'admin.programs.multi.addCourses', U&'\05D4\05D5\05E1\05E4\05EA {n}'),
  ('en', 'admin.programs.multi.enrollMany', 'Enroll {n}'),
  ('he', 'admin.programs.multi.enrollMany', U&'\05E8\05D9\05E9\05D5\05DD {n}'),
  ('en', 'admin.programs.multi.enrolled', '{n} people enrolled'),
  ('he', 'admin.programs.multi.enrolled', U&'{n} \05D0\05E0\05E9\05D9\05DD \05E0\05E8\05E9\05DE\05D5'),
  ('en', 'admin.programs.multi.someFailed', '{n} of them were not enrolled. Try them again.'),
  ('he', 'admin.programs.multi.someFailed', U&'{n} \05DE\05D4\05DD \05DC\05D0 \05E0\05E8\05E9\05DE\05D5. \05D0\05E4\05E9\05E8 \05DC\05E0\05E1\05D5\05EA \05D0\05D5\05EA\05DD \05E9\05D5\05D1.')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
