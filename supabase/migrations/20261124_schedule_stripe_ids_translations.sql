-- Payment drawer (Payments > Payments): Stripe ids with a copy button.
-- Hebrew as U&'\05..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.payments.schedules.drawer.stripePayment', 'Stripe payment ID'),
  ('he', 'admin.payments.schedules.drawer.stripePayment', U&'\05DE\05D6\05D4\05D4 \05EA\05E9\05DC\05D5\05DD \05D1-Stripe'),
  ('en', 'admin.payments.schedules.drawer.stripeInvoice', 'Stripe invoice ID'),
  ('he', 'admin.payments.schedules.drawer.stripeInvoice', U&'\05DE\05D6\05D4\05D4 \05D7\05E9\05D1\05D5\05E0\05D9\05EA \05D1-Stripe'),
  ('en', 'admin.payments.schedules.drawer.copy', 'Copy'),
  ('he', 'admin.payments.schedules.drawer.copy', U&'\05D4\05E2\05EA\05E7\05D4'),
  ('en', 'admin.payments.schedules.drawer.copied', 'Copied'),
  ('he', 'admin.payments.schedules.drawer.copied', U&'\05D4\05D5\05E2\05EA\05E7')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.tenant_id IS NULL AND t.language_code = v.lang AND t.translation_key = v.key
);
