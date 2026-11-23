-- Editing a program or course from its drawer (name, picture, description), in he + en.
-- The Hebrew is written as U&'\05E9...' character codes, so the file is plain ASCII and
-- cannot be scrambled when pasted in the SQL editor. Postgres stores the same Hebrew text.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.drawer.addDescription', 'Add'),
  ('he', 'admin.drawer.addDescription', U&'\05D4\05D5\05E1\05E4\05D4'),
  ('en', 'admin.drawer.editDescription', 'Edit'),
  ('he', 'admin.drawer.editDescription', U&'\05E2\05E8\05D9\05DB\05D4'),
  ('en', 'admin.drawer.noDescription', 'No description yet.'),
  ('he', 'admin.drawer.noDescription', U&'\05E2\05D5\05D3 \05D0\05D9\05DF \05EA\05D9\05D0\05D5\05E8.'),
  ('en', 'admin.drawer.editTitle', 'Name, picture and description'),
  ('he', 'admin.drawer.editTitle', U&'\05E9\05DD, \05EA\05DE\05D5\05E0\05D4 \05D5\05EA\05D9\05D0\05D5\05E8'),
  ('en', 'admin.drawer.picture', 'Picture'),
  ('he', 'admin.drawer.picture', U&'\05EA\05DE\05D5\05E0\05D4'),
  ('en', 'admin.drawer.imageTooBig', 'This picture is larger than {mb}MB. Choose a smaller one.'),
  ('he', 'admin.drawer.imageTooBig', U&'\05D4\05EA\05DE\05D5\05E0\05D4 \05D2\05D3\05D5\05DC\05D4 \05DE-{mb}MB. \05D9\05E9 \05DC\05D1\05D7\05D5\05E8 \05EA\05DE\05D5\05E0\05D4 \05E7\05D8\05E0\05D4 \05D9\05D5\05EA\05E8.'),
  ('en', 'admin.drawer.nameRequired', 'Write a name.'),
  ('he', 'admin.drawer.nameRequired', U&'\05D7\05D5\05D1\05D4 \05DC\05DE\05DC\05D0 \05E9\05DD.')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
