-- Payment plans: the "per session" (pay as you go) type, its price field and help.
-- Hebrew as U&'..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.payments.plans.form.pricePerSessionTotalHelp', U&'Charged to the saved card each time a session is marked held. A product on this plan costs its sessions \00D7 this price.'),
  ('he', 'admin.payments.plans.form.pricePerSessionTotalHelp', U&'\05E0\05D2\05D1\05D4 \05DE\05D4\05DB\05E8\05D8\05D9\05E1 \05D4\05E9\05DE\05D5\05E8 \05D1\05DB\05DC \05E4\05E2\05DD \05E9\05DE\05E4\05D2\05E9 \05DE\05E1\05D5\05DE\05DF \05DB\05D4\05EA\05E7\05D9\05D9\05DD. \05DE\05D5\05E6\05E8 \05D1\05EA\05D5\05DB\05E0\05D9\05EA \05D4\05D6\05D5 \05E2\05D5\05DC\05D4 \05DE\05E1\05E4\05E8 \05D4\05DE\05E4\05D2\05E9\05D9\05DD \00D7 \05D4\05DE\05D7\05D9\05E8 \05D4\05D6\05D4.'),
  ('en', 'products.payment_plans.description.perSession', '{amount} per session'),
  ('he', 'products.payment_plans.description.perSession', U&'{amount} \05DC\05DE\05E4\05D2\05E9'),
  ('en', 'products.pricing.perSessionTotal', U&'{count} sessions \00D7 {price} per session, from the payment plan'),
  ('he', 'products.pricing.perSessionTotal', U&'{count} \05DE\05E4\05D2\05E9\05D9\05DD \00D7 {price} \05DC\05DE\05E4\05D2\05E9, \05DC\05E4\05D9 \05EA\05D5\05DB\05E0\05D9\05EA \05D4\05EA\05E9\05DC\05D5\05DD'),
  ('en', 'products.pricing.perSessionNeedsCount', 'Set the number of sessions in Content, and the total is worked out from the payment plan.'),
  ('he', 'products.pricing.perSessionNeedsCount', U&'\05D4\05D2\05D3\05D9\05E8\05D5 \05D0\05EA \05DE\05E1\05E4\05E8 \05D4\05DE\05E4\05D2\05E9\05D9\05DD \05D1\05E9\05DC\05D1 \05D4\05EA\05D5\05DB\05DF, \05D5\05D4\05E1\05DB\05D5\05DD \05D9\05D7\05D5\05E9\05D1 \05DC\05E4\05D9 \05EA\05D5\05DB\05E0\05D9\05EA \05D4\05EA\05E9\05DC\05D5\05DD.')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
