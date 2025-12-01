-- ============================================================================
-- Email Template Name Translations
-- ============================================================================
-- Translations for email template names that appear in dropdowns
-- ============================================================================

-- Enrollment Templates
-- Note: Using DO blocks to handle potential conflicts with partial unique index
DO $$
BEGIN
  -- enrollment.confirmation (English)
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
  VALUES (NULL, 'email_template.enrollment_confirmation.name', 'en', 'Enrollment Confirmation', 'admin');
EXCEPTION WHEN unique_violation THEN
  UPDATE translations
  SET translation_value = 'Enrollment Confirmation'
  WHERE translation_key = 'email_template.enrollment_confirmation.name'
    AND language_code = 'en'
    AND context = 'admin'
    AND tenant_id IS NULL;
END $$;

DO $$
BEGIN
  -- enrollment.confirmation (Hebrew)
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
  VALUES (NULL, 'email_template.enrollment_confirmation.name', 'he', 'אישור הרשמה', 'admin');
EXCEPTION WHEN unique_violation THEN
  UPDATE translations
  SET translation_value = 'אישור הרשמה'
  WHERE translation_key = 'email_template.enrollment_confirmation.name'
    AND language_code = 'he'
    AND context = 'admin'
    AND tenant_id IS NULL;
END $$;

DO $$
BEGIN
  -- enrollment.invitation (English)
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
  VALUES (NULL, 'email_template.enrollment_invitation.name', 'en', 'Enrollment Invitation', 'admin');
EXCEPTION WHEN unique_violation THEN
  UPDATE translations
  SET translation_value = 'Enrollment Invitation'
  WHERE translation_key = 'email_template.enrollment_invitation.name'
    AND language_code = 'en'
    AND context = 'admin'
    AND tenant_id IS NULL;
END $$;

DO $$
BEGIN
  -- enrollment.invitation (Hebrew)
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
  VALUES (NULL, 'email_template.enrollment_invitation.name', 'he', 'הזמנה להרשמה', 'admin');
EXCEPTION WHEN unique_violation THEN
  UPDATE translations
  SET translation_value = 'הזמנה להרשמה'
  WHERE translation_key = 'email_template.enrollment_invitation.name'
    AND language_code = 'he'
    AND context = 'admin'
    AND tenant_id IS NULL;
END $$;
