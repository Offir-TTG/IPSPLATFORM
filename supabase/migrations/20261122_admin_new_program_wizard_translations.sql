-- New program wizard with courses and students in one go, in he + en.
-- The Hebrew is written as U&'\05E9...' character codes, so the file is plain ASCII and
-- cannot be scrambled when pasted in the SQL editor. Postgres stores the same Hebrew text.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.programs.courses.dragHintNew', 'Drag to change the order. The courses are added when you create the program.'),
  ('he', 'admin.programs.courses.dragHintNew', U&'\05D2\05D5\05E8\05E8\05D9\05DD \05DB\05D3\05D9 \05DC\05E9\05E0\05D5\05EA \05D0\05EA \05D4\05E1\05D3\05E8. \05D4\05E7\05D5\05E8\05E1\05D9\05DD \05D9\05EA\05D5\05D5\05E1\05E4\05D5 \05DB\05E9\05D9\05D5\05E6\05E8\05D9\05DD \05D0\05EA \05D4\05EA\05D5\05DB\05E0\05D9\05EA.'),
  ('en', 'admin.programs.wizard.leadCoursesNew', 'The courses in the program, in order. They are added when you create the program.'),
  ('he', 'admin.programs.wizard.leadCoursesNew', U&'\05D4\05E7\05D5\05E8\05E1\05D9\05DD \05D1\05EA\05D5\05DB\05E0\05D9\05EA, \05DC\05E4\05D9 \05D4\05E1\05D3\05E8. \05D4\05DD \05D9\05EA\05D5\05D5\05E1\05E4\05D5 \05DB\05E9\05D9\05D5\05E6\05E8\05D9\05DD \05D0\05EA \05D4\05EA\05D5\05DB\05E0\05D9\05EA.'),
  ('en', 'admin.programs.wizard.leadStudentsNew', 'Who to enroll. They are enrolled when you create the program.'),
  ('he', 'admin.programs.wizard.leadStudentsNew', U&'\05D0\05EA \05DE\05D9 \05DC\05E8\05E9\05D5\05DD. \05D4\05E8\05D9\05E9\05D5\05DD \05D9\05D9\05E2\05E9\05D4 \05DB\05E9\05D9\05D5\05E6\05E8\05D9\05DD \05D0\05EA \05D4\05EA\05D5\05DB\05E0\05D9\05EA.'),
  ('en', 'admin.programs.wizard.partlySaved', 'The program was created, but {n} courses or students were not added. Check them in the program.'),
  ('he', 'admin.programs.wizard.partlySaved', U&'\05D4\05EA\05D5\05DB\05E0\05D9\05EA \05E0\05D5\05E6\05E8\05D4, \05D0\05D1\05DC {n} \05E7\05D5\05E8\05E1\05D9\05DD \05D0\05D5 \05EA\05DC\05DE\05D9\05D3\05D9\05DD \05DC\05D0 \05E0\05D5\05E1\05E4\05D5. \05DB\05D3\05D0\05D9 \05DC\05D1\05D3\05D5\05E7 \05D0\05D5\05EA\05DD \05D1\05EA\05D5\05DB\05E0\05D9\05EA.'),
  ('en', 'admin.programs.newIntroAll', 'Go through the steps and press Create at the end. The courses and students you choose are added together with the program.'),
  ('he', 'admin.programs.newIntroAll', U&'\05E2\05D5\05D1\05E8\05D9\05DD \05E2\05DC \05D4\05E9\05DC\05D1\05D9\05DD \05D5\05DC\05D5\05D7\05E6\05D9\05DD "\05D9\05E6\05D9\05E8\05D4" \05D1\05E1\05D5\05E3. \05D4\05E7\05D5\05E8\05E1\05D9\05DD \05D5\05D4\05EA\05DC\05DE\05D9\05D3\05D9\05DD \05E9\05D1\05D5\05D7\05E8\05D9\05DD \05D9\05EA\05D5\05D5\05E1\05E4\05D5 \05D9\05D7\05D3 \05E2\05DD \05D4\05EA\05D5\05DB\05E0\05D9\05EA.')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
