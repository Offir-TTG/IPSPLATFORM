-- Migration: Add payment_start_date field translations
-- Date: 2025-12-11
-- Purpose: Add translations for the new payment_start_date field in products

INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
VALUES
  -- English translations
  (NULL::uuid, 'en', 'admin.products.payment_start_date', 'Payment Start Date', 'admin', NOW(), NOW()),
  (NULL::uuid, 'en', 'admin.products.payment_start_date_help', 'Default date when first payment is due for new enrollments. Works for all payment models.', 'admin', NOW(), NOW()),

  -- Hebrew translations
  (NULL::uuid, 'he', 'admin.products.payment_start_date', 'תאריך תחילת תשלום', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.products.payment_start_date_help', 'תאריך ברירת המחדל למועד התשלום הראשון עבור הרשמות חדשות. עובד עבור כל מודלי התשלום.', 'admin', NOW(), NOW())
ON CONFLICT (translation_key, language_code, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid))
DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  context = EXCLUDED.context,
  updated_at = NOW();
