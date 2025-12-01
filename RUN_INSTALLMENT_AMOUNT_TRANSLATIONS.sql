-- Add "installments of" translation for displaying payment plan with installment amounts
-- Run this in your SQL editor to add the missing translation

DELETE FROM translations WHERE translation_key = 'enrollment.paymentPlan.installmentsOf';

INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
VALUES
  ('enrollment.paymentPlan.installmentsOf', 'en', 'installments of', 'user', NULL),
  ('enrollment.paymentPlan.installmentsOf', 'he', 'תשלומים של', 'user', NULL);
