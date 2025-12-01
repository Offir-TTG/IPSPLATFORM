-- Migration: Add translations for deposit type options in payment plans

DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the first tenant ID, or use default
  SELECT id INTO tenant_uuid FROM public.tenants LIMIT 1;
  IF tenant_uuid IS NULL THEN
    tenant_uuid := '70d86807-7e7c-49cd-8601-98235444e2ac';
  END IF;

  -- Delete existing translations if they exist
  DELETE FROM public.translations
  WHERE translation_key IN (
    'admin.payments.plans.form.depositType',
    'admin.payments.plans.form.percentage',
    'admin.payments.plans.form.fixedAmount',
    'admin.payments.plans.form.depositAmount'
  );

  -- English translations
  INSERT INTO public.translations (language_code, translation_key, translation_value, category, created_at, updated_at, tenant_id) VALUES
    ('en', 'admin.payments.plans.form.depositType', 'Deposit Type', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.plans.form.percentage', 'Percentage (%)', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.plans.form.fixedAmount', 'Fixed Amount', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.plans.form.depositAmount', 'Deposit Amount', 'admin', NOW(), NOW(), tenant_uuid);

  -- Hebrew translations
  INSERT INTO public.translations (language_code, translation_key, translation_value, category, created_at, updated_at, tenant_id) VALUES
    ('he', 'admin.payments.plans.form.depositType', 'סוג הפקדון', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.plans.form.percentage', 'אחוזים (%)', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.plans.form.fixedAmount', 'סכום קבוע', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.plans.form.depositAmount', 'סכום הפקדון', 'admin', NOW(), NOW(), tenant_uuid);

END $$;
