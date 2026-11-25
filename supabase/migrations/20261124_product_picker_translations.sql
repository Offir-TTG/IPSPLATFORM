-- Product editor: the searchable content picker (program, course, bundle). In he + en.
-- Hebrew is written as U& character codes, so the file is plain ASCII.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'products.picker.change', U&'Change'),
  ('he', 'products.picker.change', U&'\05D4\05D7\05DC\05E4\05D4'),
  ('en', 'products.picker.noneChosen', U&'No courses chosen yet'),
  ('he', 'products.picker.noneChosen', U&'\05E2\05D5\05D3 \05DC\05D0 \05E0\05D1\05D7\05E8\05D5 \05E7\05D5\05E8\05E1\05D9\05DD'),
  ('en', 'products.picker.chosenCount', U&'{n} chosen:'),
  ('he', 'products.picker.chosenCount', U&'\05E0\05D1\05D7\05E8\05D5 {n}:'),
  ('en', 'products.picker.remove', U&'Remove {name}'),
  ('he', 'products.picker.remove', U&'\05D4\05E1\05E8\05EA {name}'),
  ('en', 'products.picker.clearAll', U&'Clear all'),
  ('he', 'products.picker.clearAll', U&'\05E0\05D9\05E7\05D5\05D9 \05D4\05DB\05DC'),
  ('en', 'products.picker.all', U&'All'),
  ('he', 'products.picker.all', U&'\05D4\05DB\05DC'),
  ('en', 'products.picker.starts', U&'Starts {date}'),
  ('he', 'products.picker.starts', U&'\05DE\05EA\05D7\05D9\05DC {date}'),
  ('en', 'products.picker.courseCount', U&'{n} courses'),
  ('he', 'products.picker.courseCount', U&'{n} \05E7\05D5\05E8\05E1\05D9\05DD'),
  ('en', 'products.picker.programLabel', U&'Which program does the product open?'),
  ('he', 'products.picker.programLabel', U&'\05D0\05D9\05D6\05D5 \05EA\05D5\05DB\05E0\05D9\05EA \05D4\05DE\05D5\05E6\05E8 \05E4\05D5\05EA\05D7?'),
  ('en', 'products.picker.programHint', U&'Search by name and choose one program.'),
  ('he', 'products.picker.programHint', U&'\05D7\05E4\05E9\05D5 \05DC\05E4\05D9 \05E9\05DD \05D5\05D1\05D7\05E8\05D5 \05EA\05D5\05DB\05E0\05D9\05EA \05D0\05D7\05EA.'),
  ('en', 'products.picker.programSearch', U&'Search a program by name...'),
  ('he', 'products.picker.programSearch', U&'\05D7\05D9\05E4\05D5\05E9 \05EA\05D5\05DB\05E0\05D9\05EA \05DC\05E4\05D9 \05E9\05DD\2026'),
  ('en', 'products.picker.programNoneFound', U&'No program by that name.'),
  ('he', 'products.picker.programNoneFound', U&'\05DC\05D0 \05E0\05DE\05E6\05D0\05D4 \05EA\05D5\05DB\05E0\05D9\05EA \05D1\05E9\05DD \05D4\05D6\05D4.'),
  ('en', 'products.picker.programCreate', U&'Program not listed? Create a new program'),
  ('he', 'products.picker.programCreate', U&'\05D4\05EA\05D5\05DB\05E0\05D9\05EA \05DC\05D0 \05D1\05E8\05E9\05D9\05DE\05D4? \05D9\05E6\05D9\05E8\05EA \05EA\05D5\05DB\05E0\05D9\05EA \05D7\05D3\05E9\05D4'),
  ('en', 'products.picker.bundleLabel', U&'Which courses are in the bundle?'),
  ('he', 'products.picker.bundleLabel', U&'\05D0\05D9\05DC\05D5 \05E7\05D5\05E8\05E1\05D9\05DD \05D1\05D7\05D1\05D9\05DC\05D4?'),
  ('en', 'products.picker.bundleHint', U&'You can choose several courses. Chosen courses show on top; \2715 removes one.'),
  ('he', 'products.picker.bundleHint', U&'\05D0\05E4\05E9\05E8 \05DC\05D1\05D7\05D5\05E8 \05DB\05DE\05D4 \05E7\05D5\05E8\05E1\05D9\05DD. \05D4\05E7\05D5\05E8\05E1\05D9\05DD \05E9\05E0\05D1\05D7\05E8\05D5 \05DE\05D5\05E4\05D9\05E2\05D9\05DD \05DC\05DE\05E2\05DC\05D4, \05D5\05DC\05D7\05D9\05E6\05D4 \05E2\05DC \2715 \05DE\05E1\05D9\05E8\05D4 \05E7\05D5\05E8\05E1.'),
  ('en', 'products.picker.courseSearch', U&'Search a course by name...'),
  ('he', 'products.picker.courseSearch', U&'\05D7\05D9\05E4\05D5\05E9 \05E7\05D5\05E8\05E1 \05DC\05E4\05D9 \05E9\05DD\2026'),
  ('en', 'products.picker.courseNoneFound', U&'No course by that name.'),
  ('he', 'products.picker.courseNoneFound', U&'\05DC\05D0 \05E0\05DE\05E6\05D0 \05E7\05D5\05E8\05E1 \05D1\05E9\05DD \05D4\05D6\05D4.'),
  ('en', 'products.picker.courseCreateMissing', U&'Course missing? Create a new course'),
  ('he', 'products.picker.courseCreateMissing', U&'\05E7\05D5\05E8\05E1 \05D7\05E1\05E8? \05D9\05E6\05D9\05E8\05EA \05E7\05D5\05E8\05E1 \05D7\05D3\05E9'),
  ('en', 'products.picker.courseLabel', U&'Which course does the product open?'),
  ('he', 'products.picker.courseLabel', U&'\05D0\05D9\05D6\05D4 \05E7\05D5\05E8\05E1 \05D4\05DE\05D5\05E6\05E8 \05E4\05D5\05EA\05D7?'),
  ('en', 'products.picker.courseHint', U&'Search by name and choose one course or lecture.'),
  ('he', 'products.picker.courseHint', U&'\05D7\05E4\05E9\05D5 \05DC\05E4\05D9 \05E9\05DD \05D5\05D1\05D7\05E8\05D5 \05E7\05D5\05E8\05E1 \05D0\05D5 \05D4\05E8\05E6\05D0\05D4 \05D0\05D7\05EA.'),
  ('en', 'products.picker.courseCreate', U&'Course not listed? Create a new course'),
  ('he', 'products.picker.courseCreate', U&'\05D4\05E7\05D5\05E8\05E1 \05DC\05D0 \05D1\05E8\05E9\05D9\05DE\05D4? \05D9\05E6\05D9\05E8\05EA \05E7\05D5\05E8\05E1 \05D7\05D3\05E9')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
