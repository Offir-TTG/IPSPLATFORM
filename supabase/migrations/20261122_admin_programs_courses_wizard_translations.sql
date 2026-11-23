-- Step names for the Programs and Courses wizards (new and edit), in he + en.
-- The Hebrew is written as U&'\05E9...' character codes, so the file is plain ASCII and
-- cannot be scrambled when pasted in the SQL editor. Postgres stores the same Hebrew text.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.programs.wizard.leadCourses', 'The courses in the program, in order. Changes here are saved straight away.'),
  ('he', 'admin.programs.wizard.leadCourses', U&'\05D4\05E7\05D5\05E8\05E1\05D9\05DD \05D1\05EA\05D5\05DB\05E0\05D9\05EA, \05DC\05E4\05D9 \05D4\05E1\05D3\05E8. \05E9\05D9\05E0\05D5\05D9\05D9\05DD \05DB\05D0\05DF \05E0\05E9\05DE\05E8\05D9\05DD \05DE\05D9\05D3.'),
  ('en', 'admin.programs.wizard.leadStudents', 'Who is enrolled. Changes here are saved straight away.'),
  ('he', 'admin.programs.wizard.leadStudents', U&'\05DE\05D9 \05E8\05E9\05D5\05DD \05DC\05EA\05D5\05DB\05E0\05D9\05EA. \05E9\05D9\05E0\05D5\05D9\05D9\05DD \05DB\05D0\05DF \05E0\05E9\05DE\05E8\05D9\05DD \05DE\05D9\05D3.'),
  ('en', 'admin.courses.wizard.leadStructure', 'Modules and lessons. Changes here are saved straight away.'),
  ('he', 'admin.courses.wizard.leadStructure', U&'\05E4\05E8\05E7\05D9\05DD \05D5\05E9\05D9\05E2\05D5\05E8\05D9\05DD. \05E9\05D9\05E0\05D5\05D9\05D9\05DD \05DB\05D0\05DF \05E0\05E9\05DE\05E8\05D9\05DD \05DE\05D9\05D3.'),
  ('en', 'admin.courses.wizard.leadMaterials', 'Files for the course. Changes here are saved straight away.'),
  ('he', 'admin.courses.wizard.leadMaterials', U&'\05E7\05D1\05E6\05D9\05DD \05DC\05E7\05D5\05E8\05E1. \05E9\05D9\05E0\05D5\05D9\05D9\05DD \05DB\05D0\05DF \05E0\05E9\05DE\05E8\05D9\05DD \05DE\05D9\05D3.')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
