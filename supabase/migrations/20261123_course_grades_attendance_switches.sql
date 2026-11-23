-- Course switches: does this course use grades, and attendance? (Course → Settings.)
-- A parents' club, for example, turns both off; the client portal then shows no
-- grades or attendance tabs for it. Both start on, so existing courses don't change.
-- Safe to rerun.
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS uses_grades boolean NOT NULL DEFAULT true;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS uses_attendance boolean NOT NULL DEFAULT true;

-- Labels for the two switches on the course settings page.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.courses.form.usesGrades', 'Grades'),
  ('he', 'admin.courses.form.usesGrades', U&'\05E6\05D9\05D5\05E0\05D9\05DD'),
  ('en', 'admin.courses.form.usesGradesHint', 'Clients see their grades in the portal'),
  ('he', 'admin.courses.form.usesGradesHint', U&'\05D4\05DC\05E7\05D5\05D7\05D5\05EA \05E8\05D5\05D0\05D9\05DD \05D0\05EA \05D4\05E6\05D9\05D5\05E0\05D9\05DD \05E9\05DC\05D4\05DD \05D1\05E4\05D5\05E8\05D8\05DC'),
  ('en', 'admin.courses.form.usesAttendance', 'Attendance'),
  ('he', 'admin.courses.form.usesAttendance', U&'\05E0\05D5\05DB\05D7\05D5\05EA'),
  ('en', 'admin.courses.form.usesAttendanceHint', 'Clients see their attendance in the portal'),
  ('he', 'admin.courses.form.usesAttendanceHint', U&'\05D4\05DC\05E7\05D5\05D7\05D5\05EA \05E8\05D5\05D0\05D9\05DD \05D0\05EA \05D4\05E0\05D5\05DB\05D7\05D5\05EA \05E9\05DC\05D4\05DD \05D1\05E4\05D5\05E8\05D8\05DC')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
