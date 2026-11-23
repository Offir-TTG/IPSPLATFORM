-- Open-a-package wizard: choosing the intake form.
-- Hebrew as U&'..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.coaching.newPack.intakeForm', 'Intake form'),
  ('he', 'admin.coaching.newPack.intakeForm', U&'\05E9\05D0\05DC\05D5\05DF \05E4\05EA\05D9\05D7\05D4'),
  ('en', 'admin.coaching.newPack.intakeFormHint', 'The client fills it in at the end of the enrollment. Edit forms in the "Intake forms" tab.'),
  ('he', 'admin.coaching.newPack.intakeFormHint', U&'\05D4\05DC\05E7\05D5\05D7 \05DE\05DE\05DC\05D0 \05D0\05D5\05EA\05D5 \05D1\05E1\05D5\05E3 \05D4\05D4\05E8\05E9\05DE\05D4. \05E2\05D5\05E8\05DB\05D9\05DD \05E9\05D0\05DC\05D5\05E0\05D9\05DD \05D1\05DC\05E9\05D5\05E0\05D9\05EA "\05E9\05D0\05DC\05D5\05E0\05D9 \05E4\05EA\05D9\05D7\05D4".'),
  ('en', 'admin.coaching.newPack.intakeProduct', 'The product''s: {title}'),
  ('he', 'admin.coaching.newPack.intakeProduct', U&'\05E9\05DC \05D4\05DE\05D5\05E6\05E8: {title}'),
  ('en', 'admin.coaching.newPack.intakeProductNone', 'The product''s (no form)'),
  ('he', 'admin.coaching.newPack.intakeProductNone', U&'\05E9\05DC \05D4\05DE\05D5\05E6\05E8 (\05D0\05D9\05DF \05E9\05D0\05DC\05D5\05DF)'),
  ('en', 'admin.coaching.newPack.intakeOption', U&'{title} \00B7 {n} questions'),
  ('he', 'admin.coaching.newPack.intakeOption', U&'{title} \00B7 {n} \05E9\05D0\05DC\05D5\05EA'),
  ('en', 'admin.coaching.newPack.intakeNone', 'No intake form'),
  ('he', 'admin.coaching.newPack.intakeNone', U&'\05D1\05DC\05D9 \05E9\05D0\05DC\05D5\05DF'),
  ('en', 'admin.coaching.newPack.intakeNotSaved', 'The package is open, but the chosen form was not saved: {error}'),
  ('he', 'admin.coaching.newPack.intakeNotSaved', U&'\05D4\05D7\05D1\05D9\05DC\05D4 \05E0\05E4\05EA\05D7\05D4, \05D0\05D1\05DC \05D4\05E9\05D0\05DC\05D5\05DF \05E9\05E0\05D1\05D7\05E8 \05DC\05D0 \05E0\05E9\05DE\05E8: {error}')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
