-- Product wizard: custom payment types as cards, and pay per session.
-- Hebrew as U&'\05..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'products.pricing.cards.oneTimeText', 'The full price at enrollment.'),
  ('he', 'products.pricing.cards.oneTimeText', U&'\05D4\05DE\05D7\05D9\05E8 \05D4\05DE\05DC\05D0 \05D1\05D4\05E8\05E9\05DE\05D4.'),
  ('en', 'products.pricing.cards.depositText', 'A deposit at enrollment, the rest in installments.'),
  ('he', 'products.pricing.cards.depositText', U&'\05DE\05E7\05D3\05DE\05D4 \05D1\05D4\05E8\05E9\05DE\05D4, \05D5\05D4\05E9\05D0\05E8 \05D1\05EA\05E9\05DC\05D5\05DE\05D9\05DD.'),
  ('en', 'products.pricing.cards.subscriptionText', 'Charged again every period until cancelled.'),
  ('he', 'products.pricing.cards.subscriptionText', U&'\05E0\05D2\05D1\05D4 \05E9\05D5\05D1 \05D1\05DB\05DC \05EA\05E7\05D5\05E4\05D4 \05E2\05D3 \05DC\05D1\05D9\05D8\05D5\05DC.'),
  ('en', 'products.pricing.cards.freeText', 'No payment.'),
  ('he', 'products.pricing.cards.freeText', U&'\05DC\05DC\05D0 \05EA\05E9\05DC\05D5\05DD.'),
  ('en', 'products.pricing.perSessionHelp', 'Nothing is charged at enrollment: the card is saved, and each session is charged after it is held.'),
  ('he', 'products.pricing.perSessionHelp', U&'\05D1\05D4\05E8\05E9\05DE\05D4 \05DC\05D0 \05E0\05D2\05D1\05D4 \05DB\05DC\05D5\05DD: \05D4\05DB\05E8\05D8\05D9\05E1 \05E0\05E9\05DE\05E8, \05D5\05DB\05DC \05DE\05E4\05D2\05E9 \05E0\05D2\05D1\05D4 \05D0\05D7\05E8\05D9 \05E9\05D4\05EA\05E7\05D9\05D9\05DD.'),
  ('en', 'products.validation.session_amount_required', 'Write the price of one session'),
  ('he', 'products.validation.session_amount_required', U&'\05DB\05EA\05D1\05D5 \05D0\05EA \05D4\05DE\05D7\05D9\05E8 \05E9\05DC \05DE\05E4\05D2\05E9 \05D0\05D7\05D3'),
  ('en', 'products.payment_model.per_session', 'Pay per session'),
  ('he', 'products.payment_model.per_session', U&'\05EA\05E9\05DC\05D5\05DD \05DC\05E4\05D9 \05DE\05E4\05D2\05E9'),
  ('en', 'enrollment.paymentPlan.perSession', 'Pay per session'),
  ('he', 'enrollment.paymentPlan.perSession', U&'\05EA\05E9\05DC\05D5\05DD \05DC\05E4\05D9 \05DE\05E4\05D2\05E9'),
  ('en', 'enrollment.paymentPlan.perSessionNote', 'charged after each session'),
  ('he', 'enrollment.paymentPlan.perSessionNote', U&'\05E0\05D2\05D1\05D4 \05D0\05D7\05E8\05D9 \05DB\05DC \05DE\05E4\05D2\05E9')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
