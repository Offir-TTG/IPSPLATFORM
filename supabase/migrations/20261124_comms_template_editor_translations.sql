-- Communications > Templates: the template editor in the new design.
-- Hebrew as U&'\05..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.comms.editor.back', 'Communications · Templates'),
  ('he', 'admin.comms.editor.back', U&'\05EA\05E7\05E9\05D5\05E8\05EA \00B7 \05EA\05D1\05E0\05D9\05D5\05EA'),
  ('en', 'admin.comms.editor.notFound', 'This template was not found.'),
  ('he', 'admin.comms.editor.notFound', U&'\05D4\05EA\05D1\05E0\05D9\05EA \05DC\05D0 \05E0\05DE\05E6\05D0\05D4.'),
  ('en', 'admin.comms.editor.preview', 'Preview'),
  ('he', 'admin.comms.editor.preview', U&'\05EA\05E6\05D5\05D2\05D4 \05DE\05E7\05D3\05D9\05DE\05D4'),
  ('en', 'admin.comms.editor.category', 'Category'),
  ('he', 'admin.comms.editor.category', U&'\05E7\05D8\05D2\05D5\05E8\05D9\05D4'),
  ('en', 'admin.comms.editor.subject', 'Subject'),
  ('he', 'admin.comms.editor.subject', U&'\05E0\05D5\05E9\05D0'),
  ('en', 'admin.comms.editor.subjectRequired', 'Write a subject.'),
  ('he', 'admin.comms.editor.subjectRequired', U&'\05E6\05E8\05D9\05DA \05DC\05DB\05EA\05D5\05D1 \05E0\05D5\05E9\05D0.'),
  ('en', 'admin.comms.editor.body', 'The email'),
  ('he', 'admin.comms.editor.body', U&'\05EA\05D5\05DB\05DF \05D4\05D0\05D9\05DE\05D9\05D9\05DC'),
  ('en', 'admin.comms.editor.bodyRequired', 'Write the email.'),
  ('he', 'admin.comms.editor.bodyRequired', U&'\05E6\05E8\05D9\05DA \05DC\05DB\05EA\05D5\05D1 \05D0\05EA \05D4\05D0\05D9\05DE\05D9\05D9\05DC.'),
  ('en', 'admin.comms.editor.plain', 'Plain text (for email apps without design)'),
  ('he', 'admin.comms.editor.plain', U&'\05D8\05E7\05E1\05D8 \05E4\05E9\05D5\05D8 (\05DC\05EA\05D5\05DB\05E0\05D5\05EA \05D3\05D5\05D0\05E8 \05D1\05DC\05D9 \05E2\05D9\05E6\05D5\05D1)'),
  ('en', 'admin.comms.editor.variables', 'Available variables'),
  ('he', 'admin.comms.editor.variables', U&'\05DE\05E9\05EA\05E0\05D9\05DD \05D6\05DE\05D9\05E0\05D9\05DD'),
  ('en', 'admin.comms.editor.variablesHint', 'Add them with ''+ variable'' in the editor. The client gets them filled in.'),
  ('he', 'admin.comms.editor.variablesHint', U&'\05DE\05D5\05E1\05D9\05E4\05D9\05DD \05D0\05D5\05EA\05DD \05D1\05DB\05E4\05EA\05D5\05E8 \05D4\05DE\05E9\05EA\05E0\05D4 \05E9\05D1\05E2\05D5\05E8\05DA. \05D4\05DC\05E7\05D5\05D7 \05DE\05E7\05D1\05DC \05D0\05D5\05EA\05DD \05DE\05DE\05D5\05DC\05D0\05D9\05DD.'),
  ('en', 'admin.comms.editor.noVariables', 'This template has no variables.'),
  ('he', 'admin.comms.editor.noVariables', U&'\05D0\05D9\05DF \05DE\05E9\05EA\05E0\05D9\05DD \05D1\05EA\05D1\05E0\05D9\05EA \05D4\05D6\05D5.'),
  ('en', 'admin.comms.editor.unsavedToo', 'including unsaved changes'),
  ('he', 'admin.comms.editor.unsavedToo', U&'\05DB\05D5\05DC\05DC \05E9\05D9\05E0\05D5\05D9\05D9\05DD \05E9\05DC\05D0 \05E0\05E9\05DE\05E8\05D5')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.tenant_id IS NULL AND t.language_code = v.lang AND t.translation_key = v.key
);
