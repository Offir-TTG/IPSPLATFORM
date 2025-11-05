-- Reset Password Page Translations
-- Hebrew and English translations for the password reset functionality

-- First, ensure translation keys exist
INSERT INTO translation_keys (key, category)
VALUES
  -- Reset Password Page
  ('auth.reset.title', 'auth'),
  ('auth.reset.subtitle', 'auth'),
  ('auth.reset.email', 'auth'),
  ('auth.reset.sendButton', 'auth'),
  ('auth.reset.sending', 'auth'),
  ('auth.reset.backToLogin', 'auth'),
  ('auth.reset.successMessage', 'auth'),
  ('auth.reset.emailSent', 'auth'),
  ('auth.reset.withInstructions', 'auth'),

  -- Platform name (if not already exists)
  ('platform.name', 'common')
ON CONFLICT (key) DO NOTHING;

-- Hebrew Translations
INSERT INTO translations (language_code, translation_key, translation_value, category, context)
VALUES
  -- Reset Password Page
  ('he', 'auth.reset.title', 'איפוס סיסמה', 'auth', 'user'),
  ('he', 'auth.reset.subtitle', 'נשלח לך מייל עם קישור לאיפוס הסיסמה', 'auth', 'user'),
  ('he', 'auth.reset.email', 'כתובת אימייל', 'auth', 'user'),
  ('he', 'auth.reset.sendButton', 'שלח קישור לאיפוס', 'auth', 'user'),
  ('he', 'auth.reset.sending', 'שולח...', 'auth', 'user'),
  ('he', 'auth.reset.backToLogin', 'חזרה להתחברות', 'auth', 'user'),
  ('he', 'auth.reset.successMessage', 'בדוק את האימייל שלך לקישור איפוס הסיסמה', 'auth', 'user'),
  ('he', 'auth.reset.emailSent', 'שלחנו אימייל אל', 'auth', 'user'),
  ('he', 'auth.reset.withInstructions', 'עם הוראות לאיפוס הסיסמה שלך', 'auth', 'user'),

  -- Platform name
  ('he', 'platform.name', 'בית הספר להורות', 'common', 'both')
ON CONFLICT (language_code, translation_key)
DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  category = EXCLUDED.category,
  context = EXCLUDED.context,
  updated_at = NOW();

-- English Translations
INSERT INTO translations (language_code, translation_key, translation_value, category, context)
VALUES
  -- Reset Password Page
  ('en', 'auth.reset.title', 'Reset your password', 'auth', 'user'),
  ('en', 'auth.reset.subtitle', 'We''ll send you an email with a link to reset your password', 'auth', 'user'),
  ('en', 'auth.reset.email', 'Email address', 'auth', 'user'),
  ('en', 'auth.reset.sendButton', 'Send reset link', 'auth', 'user'),
  ('en', 'auth.reset.sending', 'Sending...', 'auth', 'user'),
  ('en', 'auth.reset.backToLogin', 'Back to login', 'auth', 'user'),
  ('en', 'auth.reset.successMessage', 'Check your email for a password reset link', 'auth', 'user'),
  ('en', 'auth.reset.emailSent', 'We''ve sent an email to', 'auth', 'user'),
  ('en', 'auth.reset.withInstructions', 'with instructions to reset your password', 'auth', 'user'),

  -- Platform name
  ('en', 'platform.name', 'Parenting School', 'common', 'both')
ON CONFLICT (language_code, translation_key)
DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  category = EXCLUDED.category,
  context = EXCLUDED.context,
  updated_at = NOW();

-- Verify translations
SELECT
  tk.key,
  t_en.translation_value AS english,
  t_he.translation_value AS hebrew
FROM translation_keys tk
LEFT JOIN translations t_en ON tk.key = t_en.translation_key AND t_en.language_code = 'en'
LEFT JOIN translations t_he ON tk.key = t_he.translation_key AND t_he.language_code = 'he'
WHERE tk.key LIKE 'auth.reset.%' OR tk.key = 'platform.name'
ORDER BY tk.key;
