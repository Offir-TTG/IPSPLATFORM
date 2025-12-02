-- ============================================================================
-- Enrollment Email Validation Translations
-- ============================================================================
-- Description: Add translations for email validation in create enrollment dialog
-- Author: Claude Code Assistant
-- Date: 2025-12-02

DO $$
BEGIN
  -- Add email validation translations
  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  VALUES
    -- Email exists error
    ('admin.enrollments.create.emailExists', 'en', 'A user with this email already exists. Please use the "Select User" option instead.', 'admin', NULL::uuid),
    ('admin.enrollments.create.emailExists', 'he', 'משתמש עם כתובת דוא"ל זו כבר קיים. אנא השתמש באפשרות "בחר משתמש" במקום זאת.', 'admin', NULL::uuid),

    -- Checking email status
    ('admin.enrollments.create.checkingEmail', 'en', 'Checking email...', 'admin', NULL::uuid),
    ('admin.enrollments.create.checkingEmail', 'he', 'בודק דוא"ל...', 'admin', NULL::uuid),

    -- Email exists warning
    ('admin.enrollments.create.emailExistsWarning', 'en', 'This email is already registered. Please select the existing user from the dropdown instead.', 'admin', NULL::uuid),
    ('admin.enrollments.create.emailExistsWarning', 'he', 'דוא"ל זה כבר רשום. אנא בחר את המשתמש הקיים מהרשימה הנפתחת במקום זאת.', 'admin', NULL::uuid),

    -- Email available
    ('admin.enrollments.create.emailAvailable', 'en', 'Email is available', 'admin', NULL::uuid),
    ('admin.enrollments.create.emailAvailable', 'he', 'הדוא"ל זמין', 'admin', NULL::uuid)
  ON CONFLICT (translation_key, language_code, context) WHERE tenant_id IS NULL
  DO UPDATE SET
    translation_value = EXCLUDED.translation_value,
    updated_at = NOW();

  RAISE NOTICE 'Enrollment email validation translations added successfully';
END$$;
