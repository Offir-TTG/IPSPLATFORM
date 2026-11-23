-- Program Courses step as two columns (in the program / available), in he + en.
-- The Hebrew is written as U&'\05E9...' character codes, so the file is plain ASCII and
-- cannot be scrambled when pasted in the SQL editor. Postgres stores the same Hebrew text.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.programs.courses.inProgram', 'In the program'),
  ('he', 'admin.programs.courses.inProgram', U&'\05D1\05EA\05D5\05DB\05E0\05D9\05EA'),
  ('en', 'admin.programs.courses.dragShort', 'Drag to change the order'),
  ('he', 'admin.programs.courses.dragShort', U&'\05D2\05D5\05E8\05E8\05D9\05DD \05DC\05E9\05D9\05E0\05D5\05D9 \05E1\05D3\05E8'),
  ('en', 'admin.programs.courses.emptyPick', 'Press + next to a course to add it.'),
  ('he', 'admin.programs.courses.emptyPick', U&'\05DC\05D5\05D7\05E6\05D9\05DD \05E2\05DC + \05DC\05D9\05D3 \05E7\05D5\05E8\05E1 \05DB\05D3\05D9 \05DC\05D4\05D5\05E1\05D9\05E3 \05D0\05D5\05EA\05D5.'),
  ('en', 'admin.programs.courses.available', 'Available courses'),
  ('he', 'admin.programs.courses.available', U&'\05E7\05D5\05E8\05E1\05D9\05DD \05D6\05DE\05D9\05E0\05D9\05DD'),
  ('en', 'admin.programs.courses.search', 'Search a course'),
  ('he', 'admin.programs.courses.search', U&'\05D7\05D9\05E4\05D5\05E9 \05E7\05D5\05E8\05E1'),
  ('en', 'admin.programs.courses.noDate', 'No date'),
  ('he', 'admin.programs.courses.noDate', U&'\05D1\05DC\05D9 \05EA\05D0\05E8\05D9\05DA'),
  ('en', 'admin.programs.courses.addOne', 'Add {title} to the program'),
  ('he', 'admin.programs.courses.addOne', U&'\05D4\05D5\05E1\05E4\05EA {title} \05DC\05EA\05D5\05DB\05E0\05D9\05EA')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
