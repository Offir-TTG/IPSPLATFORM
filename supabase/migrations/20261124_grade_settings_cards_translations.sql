-- Grade settings panel: scale cards (type names, default tag) and the drop-lowest stepper.
-- Hebrew as U&'\05..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.grades.settings.defaultTag', 'Default'),
  ('he', 'admin.grades.settings.defaultTag', U&'\05D1\05E8\05D9\05E8\05EA \05DE\05D7\05D3\05DC'),
  ('en', 'admin.grades.settings.typeLetter', 'Letter grades'),
  ('he', 'admin.grades.settings.typeLetter', U&'\05E6\05D9\05D5\05E0\05D9\05DD \05D1\05D0\05D5\05EA\05D9\05D5\05EA'),
  ('en', 'admin.grades.settings.typeNumeric', 'Numbers'),
  ('he', 'admin.grades.settings.typeNumeric', U&'\05E6\05D9\05D5\05DF \05DE\05E1\05E4\05E8\05D9'),
  ('en', 'admin.grades.settings.typePassFail', 'Pass / fail'),
  ('he', 'admin.grades.settings.typePassFail', U&'\05E2\05D1\05E8 / \05DC\05D0 \05E2\05D1\05E8'),
  ('en', 'admin.grades.settings.typeCustom', 'Custom'),
  ('he', 'admin.grades.settings.typeCustom', U&'\05DE\05D5\05EA\05D0\05DD \05D0\05D9\05E9\05D9\05EA'),
  ('en', 'admin.grades.settings.dropLess', 'Fewer'),
  ('he', 'admin.grades.settings.dropLess', U&'\05E4\05D7\05D5\05EA'),
  ('en', 'admin.grades.settings.dropMore', 'More'),
  ('he', 'admin.grades.settings.dropMore', U&'\05D9\05D5\05EA\05E8')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
