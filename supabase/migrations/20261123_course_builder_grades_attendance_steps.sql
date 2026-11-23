-- Course builder: the Grades and Attendance steps (shown when the course uses them).
-- Hebrew as U&'\05..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.courses.tab.grades', 'Grades'),
  ('he', 'admin.courses.tab.grades', U&'\05E6\05D9\05D5\05E0\05D9\05DD'),
  ('en', 'admin.courses.tab.attendance', 'Attendance'),
  ('he', 'admin.courses.tab.attendance', U&'\05E0\05D5\05DB\05D7\05D5\05EA'),
  ('en', 'admin.courses.wizard.leadGrades', 'Assignments and each client''s grades.'),
  ('he', 'admin.courses.wizard.leadGrades', U&'\05D4\05DE\05E9\05D9\05DE\05D5\05EA \05D5\05D4\05E6\05D9\05D5\05E0\05D9\05DD \05E9\05DC \05DB\05DC \05DC\05E7\05D5\05D7.'),
  ('en', 'admin.courses.wizard.leadAttendance', 'Who came to each meeting, and the summary.'),
  ('he', 'admin.courses.wizard.leadAttendance', U&'\05DE\05D9 \05D4\05D2\05D9\05E2 \05DC\05DB\05DC \05DE\05E4\05D2\05E9, \05D5\05D4\05E1\05D9\05DB\05D5\05DD.')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
