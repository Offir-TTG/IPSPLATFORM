-- One enrollment process: existing-enrollment notice, program add client, cancelled by client
-- The Hebrew (and the ellipsis) is written as U&'\05E9...' character codes, so
-- the file is plain ASCII and cannot be scrambled when pasted in the SQL editor.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, v.ctx, NOW(), NOW()
FROM (VALUES
  ('en', 'admin.enrollments.existing.openTitle', 'There''s already an open enrollment for this client', 'admin'),
  ('he', 'admin.enrollments.existing.openTitle', U&'\05DB\05D1\05E8 \05D9\05E9 \05DC\05DC\05E7\05D5\05D7 \05D4\05D6\05D4 \05D4\05E8\05E9\05DE\05D4 \05E4\05EA\05D5\05D7\05D4', 'admin'),
  ('en', 'admin.enrollments.existing.openText', 'Nothing new was made. You can send the client the link to this enrollment, or open it.', 'admin'),
  ('he', 'admin.enrollments.existing.openText', U&'\05DC\05D0 \05E0\05D5\05E6\05E8\05D4 \05D4\05E8\05E9\05DE\05D4 \05D7\05D3\05E9\05D4. \05D0\05E4\05E9\05E8 \05DC\05E9\05DC\05D5\05D7 \05DC\05DC\05E7\05D5\05D7 \05D0\05EA \05D4\05E7\05D9\05E9\05D5\05E8 \05DC\05D4\05E8\05E9\05DE\05D4 \05D4\05D6\05D5, \05D0\05D5 \05DC\05E4\05EA\05D5\05D7 \05D0\05D5\05EA\05D4.', 'admin'),
  ('en', 'admin.enrollments.existing.activeTitle', 'This client is already enrolled in this product', 'admin'),
  ('he', 'admin.enrollments.existing.activeTitle', U&'\05D4\05DC\05E7\05D5\05D7 \05D4\05D6\05D4 \05DB\05D1\05E8 \05E8\05E9\05D5\05DD \05DC\05DE\05D5\05E6\05E8 \05D4\05D6\05D4', 'admin'),
  ('en', 'admin.enrollments.existing.activeText', 'Nothing new was made. You can open their enrollment.', 'admin'),
  ('he', 'admin.enrollments.existing.activeText', U&'\05DC\05D0 \05E0\05D5\05E6\05E8\05D4 \05D4\05E8\05E9\05DE\05D4 \05D7\05D3\05E9\05D4. \05D0\05E4\05E9\05E8 \05DC\05E4\05EA\05D5\05D7 \05D0\05EA \05D4\05D4\05E8\05E9\05DE\05D4 \05E9\05DC\05D5.', 'admin'),
  ('en', 'admin.enrollments.existing.sentText', 'The link was sent to the client.', 'admin'),
  ('he', 'admin.enrollments.existing.sentText', U&'\05D4\05E7\05D9\05E9\05D5\05E8 \05E0\05E9\05DC\05D7 \05DC\05DC\05E7\05D5\05D7.', 'admin'),
  ('en', 'admin.enrollments.existing.sendLink', 'Send the link', 'admin'),
  ('he', 'admin.enrollments.existing.sendLink', U&'\05E9\05DC\05D9\05D7\05EA \05D4\05E7\05D9\05E9\05D5\05E8', 'admin'),
  ('en', 'admin.enrollments.existing.open', 'Open the enrollment', 'admin'),
  ('he', 'admin.enrollments.existing.open', U&'\05E4\05EA\05D9\05D7\05EA \05D4\05D4\05E8\05E9\05DE\05D4', 'admin'),
  ('en', 'admin.enrollments.existing.sendFailed', 'The link wasn''t sent. Please try again.', 'admin'),
  ('he', 'admin.enrollments.existing.sendFailed', U&'\05D4\05E7\05D9\05E9\05D5\05E8 \05DC\05D0 \05E0\05E9\05DC\05D7. \05E0\05E1\05D5 \05E9\05D5\05D1.', 'admin'),
  ('en', 'admin.enrollments.status.cancelledByClient', 'Cancelled by client', 'admin'),
  ('he', 'admin.enrollments.status.cancelledByClient', U&'\05D1\05D5\05D8\05DC \05E2\05DC \05D9\05D3\05D9 \05D4\05DC\05E7\05D5\05D7', 'admin'),
  ('en', 'admin.programs.students.waitingForClient', 'This program is paid, so the client gets an enrollment to complete. Open it under "Enrolled" and send them the link.', 'admin'),
  ('he', 'admin.programs.students.waitingForClient', U&'\05D4\05EA\05D5\05DB\05E0\05D9\05EA \05D1\05EA\05E9\05DC\05D5\05DD, \05D0\05D6 \05E0\05D5\05E6\05E8\05D4 \05DC\05DC\05E7\05D5\05D7 \05D4\05E8\05E9\05DE\05D4 \05DC\05D4\05E9\05DC\05DE\05D4. \05E4\05EA\05D7\05D5 \05D0\05D5\05EA\05D4 \05D1\05E8\05E9\05D9\05DE\05EA "\05E8\05E9\05D5\05DE\05D9\05DD" \05D5\05E9\05DC\05D7\05D5 \05DC\05D5 \05D0\05EA \05D4\05E7\05D9\05E9\05D5\05E8.', 'admin'),
  ('en', 'admin.programs.students.alreadyHas', 'This client already has an enrollment in this program. Open it under "Enrolled".', 'admin'),
  ('he', 'admin.programs.students.alreadyHas', U&'\05DC\05DC\05E7\05D5\05D7 \05D4\05D6\05D4 \05DB\05D1\05E8 \05D9\05E9 \05D4\05E8\05E9\05DE\05D4 \05DC\05EA\05D5\05DB\05E0\05D9\05EA \05D4\05D6\05D5. \05D0\05E4\05E9\05E8 \05DC\05E4\05EA\05D5\05D7 \05D0\05D5\05EA\05D4 \05D1\05E8\05E9\05D9\05DE\05EA "\05E8\05E9\05D5\05DE\05D9\05DD".', 'admin'),
  ('en', 'admin.programs.multi.waiting', 'This program is paid, so {n} clients got an enrollment to complete. Open each one under "Enrolled" and send them the link.', 'admin'),
  ('he', 'admin.programs.multi.waiting', U&'\05D4\05EA\05D5\05DB\05E0\05D9\05EA \05D1\05EA\05E9\05DC\05D5\05DD, \05D0\05D6 \05E0\05D5\05E6\05E8\05D5 \05D4\05E8\05E9\05DE\05D5\05EA \05DC\05D4\05E9\05DC\05DE\05D4 \05DC-{n} \05DC\05E7\05D5\05D7\05D5\05EA. \05E4\05EA\05D7\05D5 \05DB\05DC \05D0\05D7\05EA \05D1\05E8\05E9\05D9\05DE\05EA "\05E8\05E9\05D5\05DE\05D9\05DD" \05D5\05E9\05DC\05D7\05D5 \05D0\05EA \05D4\05E7\05D9\05E9\05D5\05E8.', 'admin')
) AS v(lang, key, value, ctx)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
