-- Payment plans: the "per session" (pay as you go) type, its price field and help.
-- Hebrew as U&'..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.payments.plans.types.perSession', 'Per session'),
  ('he', 'admin.payments.plans.types.perSession', U&'\05DC\05E4\05D9 \05DE\05E4\05D2\05E9'),
  ('en', 'admin.payments.plans.details.perSession', 'Charged after each session held'),
  ('he', 'admin.payments.plans.details.perSession', U&'\05E0\05D2\05D1\05D4 \05D0\05D7\05E8\05D9 \05DB\05DC \05DE\05E4\05D2\05E9 \05E9\05D4\05EA\05E7\05D9\05D9\05DD'),
  ('en', 'admin.payments.plans.form.perSession', 'Pay per session'),
  ('he', 'admin.payments.plans.form.perSession', U&'\05EA\05E9\05DC\05D5\05DD \05DC\05E4\05D9 \05DE\05E4\05D2\05E9'),
  ('en', 'admin.payments.plans.form.pricePerSession', 'Price per session'),
  ('he', 'admin.payments.plans.form.pricePerSession', U&'\05DE\05D7\05D9\05E8 \05DC\05DE\05E4\05D2\05E9'),
  ('en', 'admin.payments.plans.form.pricePerSessionHelp', 'Charged to the saved card each time a session is marked held. Leave empty to use the product price.'),
  ('he', 'admin.payments.plans.form.pricePerSessionHelp', U&'\05E0\05D2\05D1\05D4 \05DE\05D4\05DB\05E8\05D8\05D9\05E1 \05D4\05E9\05DE\05D5\05E8 \05D1\05DB\05DC \05E4\05E2\05DD \05E9\05DE\05E4\05D2\05E9 \05DE\05E1\05D5\05DE\05DF \05DB\05D4\05EA\05E7\05D9\05D9\05DD. \05E8\05D9\05E7 = \05DE\05D7\05D9\05E8 \05D4\05DE\05D5\05E6\05E8.'),
  ('en', 'admin.payments.plans.wizard.perSessionText', 'Nothing upfront: the card is saved, and each session is charged when it is held.'),
  ('he', 'admin.payments.plans.wizard.perSessionText', U&'\05DC\05D0 \05E0\05D2\05D1\05D4 \05DB\05DC\05D5\05DD \05DE\05E8\05D0\05E9: \05D4\05DB\05E8\05D8\05D9\05E1 \05E0\05E9\05DE\05E8, \05D5\05DB\05DC \05DE\05E4\05D2\05E9 \05E0\05D2\05D1\05D4 \05DB\05E9\05D4\05D5\05D0 \05DE\05EA\05E7\05D9\05D9\05DD.')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
