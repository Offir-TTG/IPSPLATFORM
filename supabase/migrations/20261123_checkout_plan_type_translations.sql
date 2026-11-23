-- Payment summary: names for a plan built from the product's own payment setting
-- (no plan attached), which had English placeholder names. Hebrew as U&'\05..' codes
-- so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'user', NOW(), NOW()
FROM (VALUES
  ('en', 'user.payments.checkout.planType.subscription', 'Subscription'),
  ('he', 'user.payments.checkout.planType.subscription', U&'\05DE\05E0\05D5\05D9'),
  ('en', 'user.payments.checkout.planType.deposit', 'Deposit and installments'),
  ('he', 'user.payments.checkout.planType.deposit', U&'\05DE\05E7\05D3\05DE\05D4 \05D5\05EA\05E9\05DC\05D5\05DE\05D9\05DD'),
  ('en', 'user.payments.checkout.planType.one_time', 'One-time payment'),
  ('he', 'user.payments.checkout.planType.one_time', U&'\05EA\05E9\05DC\05D5\05DD \05D0\05D7\05D3'),
  ('en', 'user.payments.checkout.planType.free', 'Free'),
  ('he', 'user.payments.checkout.planType.free', U&'\05DC\05DC\05D0 \05EA\05E9\05DC\05D5\05DD')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
