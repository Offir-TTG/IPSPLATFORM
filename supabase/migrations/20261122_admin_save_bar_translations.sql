-- The one save bar every admin editor uses, and the "leave without saving?" question.
-- The Hebrew is written as U&'\05E9...' character codes, so the file is plain ASCII and
-- cannot be scrambled when pasted in the SQL editor. Postgres stores the same Hebrew text.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.saveBar.new', 'Not saved yet'),
  ('he', 'admin.saveBar.new', U&'\05E2\05D5\05D3 \05DC\05D0 \05E0\05E9\05DE\05E8'),
  ('en', 'admin.saveBar.clean', 'No changes'),
  ('he', 'admin.saveBar.clean', U&'\05D0\05D9\05DF \05E9\05D9\05E0\05D5\05D9\05D9\05DD'),
  ('en', 'admin.saveBar.dirty', 'You have unsaved changes'),
  ('he', 'admin.saveBar.dirty', U&'\05D9\05E9 \05E9\05D9\05E0\05D5\05D9\05D9\05DD \05E9\05DC\05D0 \05E0\05E9\05DE\05E8\05D5'),
  ('en', 'admin.saveBar.saving', 'Saving'),
  ('he', 'admin.saveBar.saving', U&'\05E9\05D5\05DE\05E8'),
  ('en', 'admin.saveBar.discard', 'Discard'),
  ('he', 'admin.saveBar.discard', U&'\05D1\05D9\05D8\05D5\05DC \05D4\05E9\05D9\05E0\05D5\05D9\05D9\05DD'),
  ('en', 'admin.saveBar.cancel', 'Cancel'),
  ('he', 'admin.saveBar.cancel', U&'\05D1\05D9\05D8\05D5\05DC'),
  ('en', 'admin.saveBar.leaveTitle', 'Leave without saving?'),
  ('he', 'admin.saveBar.leaveTitle', U&'\05DC\05E6\05D0\05EA \05D1\05DC\05D9 \05DC\05E9\05DE\05D5\05E8?'),
  ('en', 'admin.saveBar.leaveBody', 'You have changes on this page that are not saved. If you leave now, they will be lost.'),
  ('he', 'admin.saveBar.leaveBody', U&'\05D9\05E9 \05D1\05E2\05DE\05D5\05D3 \05E9\05D9\05E0\05D5\05D9\05D9\05DD \05E9\05DC\05D0 \05E0\05E9\05DE\05E8\05D5. \05D0\05DD \05EA\05E6\05D0\05D5 \05E2\05DB\05E9\05D9\05D5, \05D4\05DD \05D9\05D0\05D1\05D3\05D5.'),
  ('en', 'admin.saveBar.stay', 'Stay on this page'),
  ('he', 'admin.saveBar.stay', U&'\05DC\05D4\05D9\05E9\05D0\05E8 \05D1\05E2\05DE\05D5\05D3'),
  ('en', 'admin.saveBar.leave', 'Leave without saving'),
  ('he', 'admin.saveBar.leave', U&'\05DC\05E6\05D0\05EA \05D1\05DC\05D9 \05DC\05E9\05DE\05D5\05E8')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
