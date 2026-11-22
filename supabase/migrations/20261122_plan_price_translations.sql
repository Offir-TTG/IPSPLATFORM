-- Labels for the "Price per period" field on membership plans (admin).
-- Already applied on 22 Nov 2026; kept for other environments. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.payments.plans.form.pricePerPeriod', 'Price per period'),
  ('he', 'admin.payments.plans.form.pricePerPeriod', 'מחיר לתקופה'),
  ('en', 'admin.payments.plans.form.pricePerPeriodHelp', 'Charged every period, e.g. 100 monthly or 1,000 yearly. Leave empty to use the product price. A change applies from each member''s next charge.'),
  ('he', 'admin.payments.plans.form.pricePerPeriodHelp', 'הסכום שיחויב בכל תקופה, למשל 100 לחודש או 1,000 לשנה. השאירו ריק כדי להשתמש במחיר המוצר. שינוי חל מהחיוב הבא של כל מנוי.'),
  ('en', 'admin.payments.plans.details.productPrice', 'product price'),
  ('he', 'admin.payments.plans.details.productPrice', 'מחיר המוצר')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
