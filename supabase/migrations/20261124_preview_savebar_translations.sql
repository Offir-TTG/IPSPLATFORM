-- The Save button of the floating save bar, and the live message preview in the reminder wizard.
-- Hebrew as U&'\05..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.saveBar.save', 'Save'),
  ('he', 'admin.saveBar.save', U&'\05E9\05DE\05D9\05E8\05D4'),
  ('en', 'admin.reminders.preview.title', 'How the client sees it'),
  ('he', 'admin.reminders.preview.title', U&'\05D0\05D9\05DA \05D6\05D4 \05E0\05E8\05D0\05D4 \05DC\05DC\05E7\05D5\05D7'),
  ('en', 'admin.reminders.preview.email', 'Email'),
  ('he', 'admin.reminders.preview.email', U&'\05D0\05D9\05DE\05D9\05D9\05DC'),
  ('en', 'admin.reminders.preview.bell', 'Portal bell'),
  ('he', 'admin.reminders.preview.bell', U&'\05E4\05E2\05DE\05D5\05DF \05D1\05E4\05D5\05E8\05D8\05DC'),
  ('en', 'admin.reminders.preview.sample', 'With sample details'),
  ('he', 'admin.reminders.preview.sample', U&'\05E2\05DD \05E4\05E8\05D8\05D9 \05D3\05D5\05D2\05DE\05D4'),
  ('en', 'admin.reminders.preview.noEmail', 'This step doesn''t send an email; it goes to the portal bell only.'),
  ('he', 'admin.reminders.preview.noEmail', U&'\05D4\05E9\05DC\05D1 \05D4\05D6\05D4 \05DC\05D0 \05E0\05E9\05DC\05D7 \05D1\05D0\05D9\05DE\05D9\05D9\05DC, \05E8\05E7 \05DC\05E4\05E2\05DE\05D5\05DF \05D1\05E4\05D5\05E8\05D8\05DC.'),
  ('en', 'admin.reminders.preview.subject', 'Subject'),
  ('he', 'admin.reminders.preview.subject', U&'\05E0\05D5\05E9\05D0'),
  ('en', 'admin.reminders.preview.emailTitle', 'How the email looks'),
  ('he', 'admin.reminders.preview.emailTitle', U&'\05D0\05D9\05DA \05D4\05D0\05D9\05DE\05D9\05D9\05DC \05E0\05E8\05D0\05D4'),
  ('en', 'admin.reminders.preview.bellNote', 'Every client sees this in the portal bell, whatever their settings.'),
  ('he', 'admin.reminders.preview.bellNote', U&'\05DB\05DC \05DC\05E7\05D5\05D7 \05E8\05D5\05D0\05D4 \05D0\05EA \05D6\05D4 \05D1\05E4\05E2\05DE\05D5\05DF \05D1\05E4\05D5\05E8\05D8\05DC, \05D1\05DC\05D9 \05E7\05E9\05E8 \05DC\05D4\05D2\05D3\05E8\05D5\05EA.')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.tenant_id IS NULL AND t.language_code = v.lang AND t.translation_key = v.key
);
