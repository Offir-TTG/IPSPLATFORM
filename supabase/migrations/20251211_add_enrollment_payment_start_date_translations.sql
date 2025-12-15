-- Migration: Add enrollment payment_start_date field translations
-- Date: 2025-12-11
-- Purpose: Add translations for payment start date override in enrollment creation dialog

INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
VALUES
  -- English translations
  (NULL::uuid, 'en', 'admin.enrollments.create.paymentStartDate', 'Payment Start Date (Optional Override)', 'admin', NOW(), NOW()),
  (NULL::uuid, 'en', 'admin.enrollments.create.paymentStartDateHelp', 'Override payment schedule start date for this enrollment. Default from product will be used if not specified.', 'admin', NOW(), NOW()),

  -- Hebrew translations
  (NULL::uuid, 'he', 'admin.enrollments.create.paymentStartDate', 'תאריך תחילת תשלום (עקיפה אופציונלית)', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.create.paymentStartDateHelp', 'עקוף את תאריך התחלת לוח התשלומים עבור הרשמה זו. ברירת המחדל מהמוצר תשמש אם לא צוין.', 'admin', NOW(), NOW())
ON CONFLICT (translation_key, language_code, context) WHERE tenant_id IS NULL
DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  updated_at = NOW();
