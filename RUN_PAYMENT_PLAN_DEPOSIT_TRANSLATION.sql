-- Add Deposit Translation for Payment Plans
-- Run this in your SQL editor to add the missing "Deposit" translation

DELETE FROM translations WHERE translation_key = 'enrollment.paymentPlan.deposit';

INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
VALUES
  ('enrollment.paymentPlan.deposit', 'en', 'Deposit', 'user', NULL),
  ('enrollment.paymentPlan.deposit', 'he', 'מקדמה', 'user', NULL);
