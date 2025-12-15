-- Add Complete Password Step Translations for Enrollment Wizard
-- Date: 2025-12-12
-- Purpose: Add all missing Hebrew translations for the password creation step
--          Including main labels, placeholders, validation messages, and requirements

-- Delete existing password step translations if any
DELETE FROM translations
WHERE (translation_key LIKE 'enrollment.wizard.password%'
   OR translation_key = 'enrollment.wizard.steps.password')
  AND tenant_id IS NULL;

-- Insert all password step translations
INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
VALUES
  -- Main password step labels
  ('enrollment.wizard.password.title', 'en', 'Create Account', 'user', NULL),
  ('enrollment.wizard.password.title', 'he', 'יצירת חשבון', 'user', NULL),

  ('enrollment.wizard.password.description', 'en', 'Create a password to secure your account', 'user', NULL),
  ('enrollment.wizard.password.description', 'he', 'צור סיסמה לאבטחת החשבון שלך', 'user', NULL),

  ('enrollment.wizard.password.info', 'en', 'Create a secure password for your account. This will be used to log in to your dashboard.', 'user', NULL),
  ('enrollment.wizard.password.info', 'he', 'צור סיסמה מאובטחת לחשבון שלך. זו תשמש להתחברות ללוח הבקרה שלך.', 'user', NULL),

  ('enrollment.wizard.password.label', 'en', 'Password', 'user', NULL),
  ('enrollment.wizard.password.label', 'he', 'סיסמה', 'user', NULL),

  ('enrollment.wizard.password.confirm', 'en', 'Confirm Password', 'user', NULL),
  ('enrollment.wizard.password.confirm', 'he', 'אמת סיסמה', 'user', NULL),

  ('enrollment.wizard.password.creating', 'en', 'Creating Account...', 'user', NULL),
  ('enrollment.wizard.password.creating', 'he', 'יוצר חשבון...', 'user', NULL),

  ('enrollment.wizard.password.button', 'en', 'Create Account', 'user', NULL),
  ('enrollment.wizard.password.button', 'he', 'צור חשבון', 'user', NULL),

  -- Placeholders
  ('enrollment.wizard.password.placeholder', 'en', 'Enter a secure password (min. 8 characters)', 'user', NULL),
  ('enrollment.wizard.password.placeholder', 'he', 'הזן סיסמה מאובטחת (לפחות 8 תווים)', 'user', NULL),

  ('enrollment.wizard.password.confirm.placeholder', 'en', 'Re-enter your password', 'user', NULL),
  ('enrollment.wizard.password.confirm.placeholder', 'he', 'הזן שוב את הסיסמה שלך', 'user', NULL),

  -- Validation messages
  ('enrollment.wizard.password.min_length', 'en', 'Password must be at least 8 characters long', 'user', NULL),
  ('enrollment.wizard.password.min_length', 'he', 'הסיסמה חייבת להכיל לפחות 8 תווים', 'user', NULL),

  ('enrollment.wizard.password.mismatch', 'en', 'Passwords do not match', 'user', NULL),
  ('enrollment.wizard.password.mismatch', 'he', 'הסיסמאות אינן תואמות', 'user', NULL),

  -- Password requirements section
  ('enrollment.wizard.password.requirements.title', 'en', 'Password requirements:', 'user', NULL),
  ('enrollment.wizard.password.requirements.title', 'he', 'דרישות סיסמה:', 'user', NULL),

  ('enrollment.wizard.password.requirements.min_chars', 'en', 'At least 8 characters long', 'user', NULL),
  ('enrollment.wizard.password.requirements.min_chars', 'he', 'לפחות 8 תווים', 'user', NULL),

  ('enrollment.wizard.password.requirements.mix', 'en', 'Mix of letters and numbers recommended', 'user', NULL),
  ('enrollment.wizard.password.requirements.mix', 'he', 'מומלץ שילוב של אותיות ומספרים', 'user', NULL),

  ('enrollment.wizard.password.requirements.avoid', 'en', 'Avoid common words or patterns', 'user', NULL),
  ('enrollment.wizard.password.requirements.avoid', 'he', 'הימנע ממילים או תבניות נפוצות', 'user', NULL),

  -- Step indicator
  ('enrollment.wizard.steps.password', 'en', 'Password', 'user', NULL),
  ('enrollment.wizard.steps.password', 'he', 'סיסמה', 'user', NULL);

-- Verify the insertions
SELECT
  translation_key,
  language_code,
  translation_value
FROM translations
WHERE (translation_key LIKE 'enrollment.wizard.password%'
   OR translation_key = 'enrollment.wizard.steps.password')
  AND tenant_id IS NULL
ORDER BY translation_key, language_code;
