-- Payment Plan Configuration - Hebrew Translations
-- This migration adds Hebrew translations for the dynamic payment plan configuration UI

DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the first tenant (or specify your tenant ID)
  SELECT id INTO tenant_uuid FROM tenants LIMIT 1;

  -- Delete existing payment plan config translations to avoid duplicates
  DELETE FROM translations WHERE translation_key IN (
    'products.payment_plan.initial_deposit',
    'products.payment_plan.deposit_percentage_title',
    'products.payment_plan.deposit',
    'products.payment_plan.initial_deposit_desc',
    'products.payment_plan.deposit_percentage_desc',
    'products.payment_plan.deposit_desc',
    'products.payment_plan.deposit_percentage',
    'products.payment_plan.deposit_calc'
  );

  -- Insert English translations
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    -- Card Title Translations (dynamic based on deposit type) - NO % symbol in titles
    ('en', 'products.payment_plan.initial_deposit', 'Initial Deposit', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'products.payment_plan.deposit_percentage_title', 'Deposit Percentage', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'products.payment_plan.deposit', 'Deposit Configuration', 'admin', NOW(), NOW(), tenant_uuid),

    -- Card Description Translations (dynamic based on deposit type)
    ('en', 'products.payment_plan.initial_deposit_desc', 'Amount customer pays upfront before installments begin', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'products.payment_plan.deposit_percentage_desc', 'Percentage of total price paid upfront before installments begin', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'products.payment_plan.deposit_desc', 'Configure how customers will pay the initial deposit', 'admin', NOW(), NOW(), tenant_uuid),

    -- Field Labels
    ('en', 'products.payment_plan.deposit_percentage', 'Deposit Percentage (%)', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'products.payment_plan.deposit_calc', 'Deposit: {currency} {amount}', 'admin', NOW(), NOW(), tenant_uuid);

  -- Insert Hebrew translations
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    -- Card Title Translations (dynamic based on deposit type) - NO % symbol in titles
    ('he', 'products.payment_plan.initial_deposit', 'מקדמה ראשונית', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.deposit_percentage_title', 'אחוז מקדמה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.deposit', 'הגדרת מקדמה', 'admin', NOW(), NOW(), tenant_uuid),

    -- Card Description Translations (dynamic based on deposit type)
    ('he', 'products.payment_plan.initial_deposit_desc', 'סכום שהלקוח משלם מראש לפני תחילת התשלומים', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.deposit_percentage_desc', 'אחוז ממחיר מלא ששולם מראש לפני תחילת התשלומים', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.deposit_desc', 'הגדר כיצד לקוחות ישלמו את המקדמה הראשונית', 'admin', NOW(), NOW(), tenant_uuid),

    -- Field Labels
    ('he', 'products.payment_plan.deposit_percentage', 'אחוז מקדמה (%)', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.deposit_calc', 'מקדמה: {currency} {amount}', 'admin', NOW(), NOW(), tenant_uuid);

END $$;

-- Verify the insertions
SELECT
  language_code,
  translation_key,
  translation_value
FROM translations
WHERE translation_key IN (
  'products.payment_plan.initial_deposit',
  'products.payment_plan.deposit_percentage_title',
  'products.payment_plan.deposit',
  'products.payment_plan.initial_deposit_desc',
  'products.payment_plan.deposit_percentage_desc',
  'products.payment_plan.deposit_desc',
  'products.payment_plan.deposit_percentage',
  'products.payment_plan.deposit_calc'
)
ORDER BY language_code, translation_key;
