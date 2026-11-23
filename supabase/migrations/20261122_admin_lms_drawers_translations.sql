-- Programs and Courses list drawers, in he + en.
-- The Hebrew is written as U&'\05E9...' character codes, so the file is plain ASCII and
-- cannot be scrambled when pasted in the SQL editor. Postgres stores the same Hebrew text.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.programs.drawer.description', 'Program summary'),
  ('he', 'admin.programs.drawer.description', U&'\05E1\05D9\05DB\05D5\05DD \05D4\05EA\05D5\05DB\05E0\05D9\05EA'),
  ('en', 'admin.programs.drawer.open', 'Open program'),
  ('he', 'admin.programs.drawer.open', U&'\05E4\05EA\05D9\05D7\05EA \05D4\05EA\05D5\05DB\05E0\05D9\05EA'),
  ('en', 'admin.programs.drawer.deactivate', 'Turn off'),
  ('he', 'admin.programs.drawer.deactivate', U&'\05DB\05D9\05D1\05D5\05D9'),
  ('en', 'admin.programs.drawer.activate', 'Turn on'),
  ('he', 'admin.programs.drawer.activate', U&'\05D4\05E4\05E2\05DC\05D4'),
  ('en', 'admin.programs.drawer.placesLeft', 'Places left'),
  ('he', 'admin.programs.drawer.placesLeft', U&'\05DE\05E7\05D5\05DE\05D5\05EA \05E4\05E0\05D5\05D9\05D9\05DD'),
  ('en', 'admin.programs.drawer.created', 'Created'),
  ('he', 'admin.programs.drawer.created', U&'\05E0\05D5\05E6\05E8\05D4'),
  ('en', 'admin.programs.drawer.offered', 'Offered to new students'),
  ('he', 'admin.programs.drawer.offered', U&'\05DE\05D5\05E6\05E2\05EA \05DC\05EA\05DC\05DE\05D9\05D3\05D9\05DD \05D7\05D3\05E9\05D9\05DD'),
  ('en', 'admin.programs.drawer.turnedOn', 'The program is on. New students can enroll.'),
  ('he', 'admin.programs.drawer.turnedOn', U&'\05D4\05EA\05D5\05DB\05E0\05D9\05EA \05E4\05E2\05D9\05DC\05D4. \05EA\05DC\05DE\05D9\05D3\05D9\05DD \05D7\05D3\05E9\05D9\05DD \05D9\05DB\05D5\05DC\05D9\05DD \05DC\05D4\05D9\05E8\05E9\05DD.'),
  ('en', 'admin.programs.drawer.turnedOff', 'The program is off. It is not offered to new students.'),
  ('he', 'admin.programs.drawer.turnedOff', U&'\05D4\05EA\05D5\05DB\05E0\05D9\05EA \05DB\05D1\05D5\05D9\05D4. \05D4\05D9\05D0 \05DC\05D0 \05DE\05D5\05E6\05E2\05EA \05DC\05EA\05DC\05DE\05D9\05D3\05D9\05DD \05D7\05D3\05E9\05D9\05DD.'),
  ('en', 'admin.courses.drawer.description', 'Course summary'),
  ('he', 'admin.courses.drawer.description', U&'\05E1\05D9\05DB\05D5\05DD \05D4\05E7\05D5\05E8\05E1'),
  ('en', 'admin.courses.drawer.starts', 'Starts'),
  ('he', 'admin.courses.drawer.starts', U&'\05DE\05EA\05D7\05D9\05DC'),
  ('en', 'admin.courses.drawer.open', 'Open course'),
  ('he', 'admin.courses.drawer.open', U&'\05E4\05EA\05D9\05D7\05EA \05D4\05E7\05D5\05E8\05E1'),
  ('en', 'admin.courses.drawer.deactivate', 'Turn off'),
  ('he', 'admin.courses.drawer.deactivate', U&'\05DB\05D9\05D1\05D5\05D9'),
  ('en', 'admin.courses.drawer.activate', 'Turn on'),
  ('he', 'admin.courses.drawer.activate', U&'\05D4\05E4\05E2\05DC\05D4'),
  ('en', 'admin.courses.drawer.turnOnFirst', 'Turn the course on first'),
  ('he', 'admin.courses.drawer.turnOnFirst', U&'\05D9\05E9 \05DC\05D4\05E4\05E2\05D9\05DC \05D0\05EA \05D4\05E7\05D5\05E8\05E1 \05E7\05D5\05D3\05DD'),
  ('en', 'admin.courses.drawer.hide', 'Hide'),
  ('he', 'admin.courses.drawer.hide', U&'\05D4\05E1\05EA\05E8\05D4'),
  ('en', 'admin.courses.drawer.publish', 'Publish'),
  ('he', 'admin.courses.drawer.publish', U&'\05E4\05E8\05E1\05D5\05DD'),
  ('en', 'admin.courses.drawer.instructor', 'Instructor'),
  ('he', 'admin.courses.drawer.instructor', U&'\05DE\05E0\05D7\05D4'),
  ('en', 'admin.courses.drawer.visible', 'Students can see it'),
  ('he', 'admin.courses.drawer.visible', U&'\05D2\05DC\05D5\05D9 \05DC\05EA\05DC\05DE\05D9\05D3\05D9\05DD'),
  ('en', 'admin.courses.drawer.turnedOn', 'The course is on.'),
  ('he', 'admin.courses.drawer.turnedOn', U&'\05D4\05E7\05D5\05E8\05E1 \05E4\05E2\05D9\05DC.'),
  ('en', 'admin.courses.drawer.turnedOff', 'The course is off. Students cannot see it.'),
  ('he', 'admin.courses.drawer.turnedOff', U&'\05D4\05E7\05D5\05E8\05E1 \05DB\05D1\05D5\05D9. \05EA\05DC\05DE\05D9\05D3\05D9\05DD \05DC\05D0 \05E8\05D5\05D0\05D9\05DD \05D0\05D5\05EA\05D5.'),
  ('en', 'admin.courses.drawer.published', 'The course is published. Students can see it.'),
  ('he', 'admin.courses.drawer.published', U&'\05D4\05E7\05D5\05E8\05E1 \05E4\05D5\05E8\05E1\05DD. \05EA\05DC\05DE\05D9\05D3\05D9\05DD \05E8\05D5\05D0\05D9\05DD \05D0\05D5\05EA\05D5.'),
  ('en', 'admin.courses.drawer.hidden', 'The course is hidden from students.'),
  ('he', 'admin.courses.drawer.hidden', U&'\05D4\05E7\05D5\05E8\05E1 \05DE\05D5\05E1\05EA\05E8 \05DE\05D4\05EA\05DC\05DE\05D9\05D3\05D9\05DD.'),
  ('en', 'admin.courses.drawer.saveError', 'The change was not saved. Try again.'),
  ('he', 'admin.courses.drawer.saveError', U&'\05D4\05E9\05D9\05E0\05D5\05D9 \05DC\05D0 \05E0\05E9\05DE\05E8. \05D0\05E4\05E9\05E8 \05DC\05E0\05E1\05D5\05EA \05E9\05D5\05D1.')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
