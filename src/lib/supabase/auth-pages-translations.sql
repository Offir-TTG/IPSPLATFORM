-- Authentication Pages Translations
-- Complete Hebrew and English translations for Login, Signup, and Reset Password pages

-- First, ensure translation keys exist
INSERT INTO translation_keys (key, category)
VALUES
  -- Login Page
  ('auth.login.title', 'auth'),
  ('auth.login.welcome', 'auth'),
  ('auth.login.email', 'auth'),
  ('auth.login.password', 'auth'),
  ('auth.login.forgotPassword', 'auth'),
  ('auth.login.button', 'auth'),
  ('auth.login.noAccount', 'auth'),
  ('auth.login.signupLink', 'auth'),

  -- Signup Page
  ('auth.signup.title', 'auth'),
  ('auth.signup.subtitle', 'auth'),
  ('auth.signup.firstName', 'auth'),
  ('auth.signup.lastName', 'auth'),
  ('auth.signup.email', 'auth'),
  ('auth.signup.phone', 'auth'),
  ('auth.signup.password', 'auth'),
  ('auth.signup.confirmPassword', 'auth'),
  ('auth.signup.passwordHint', 'auth'),
  ('auth.signup.button', 'auth'),
  ('auth.signup.creating', 'auth'),
  ('auth.signup.haveAccount', 'auth'),
  ('auth.signup.loginLink', 'auth'),
  ('auth.signup.passwordMismatch', 'auth'),
  ('auth.signup.passwordTooShort', 'auth'),

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

  -- Reset Password Confirmation Page
  ('auth.resetConfirm.title', 'auth'),
  ('auth.resetConfirm.subtitle', 'auth'),
  ('auth.resetConfirm.newPassword', 'auth'),
  ('auth.resetConfirm.confirmPassword', 'auth'),
  ('auth.resetConfirm.updateButton', 'auth'),
  ('auth.resetConfirm.successMessage', 'auth'),
  ('auth.resetConfirm.redirecting', 'auth'),
  ('auth.resetConfirm.invalidLink', 'auth'),

  -- Common
  ('common.loading', 'common'),
  ('platform.name', 'common'),
  ('nav.home', 'nav')
ON CONFLICT (key) DO NOTHING;

-- Hebrew Translations
INSERT INTO translations (language_code, translation_key, translation_value, category, context)
VALUES
  -- Login Page
  ('he', 'auth.login.title', 'התחברות', 'auth', 'user'),
  ('he', 'auth.login.welcome', 'ברוכים הבאים בחזרה', 'auth', 'user'),
  ('he', 'auth.login.email', 'אימייל', 'auth', 'user'),
  ('he', 'auth.login.password', 'סיסמה', 'auth', 'user'),
  ('he', 'auth.login.forgotPassword', 'שכחת סיסמה?', 'auth', 'user'),
  ('he', 'auth.login.button', 'התחבר', 'auth', 'user'),
  ('he', 'auth.login.noAccount', 'אין לך חשבון?', 'auth', 'user'),
  ('he', 'auth.login.signupLink', 'הירשם עכשיו', 'auth', 'user'),

  -- Signup Page
  ('he', 'auth.signup.title', 'הרשמה', 'auth', 'user'),
  ('he', 'auth.signup.subtitle', 'צור חשבון חדש', 'auth', 'user'),
  ('he', 'auth.signup.firstName', 'שם פרטי', 'auth', 'user'),
  ('he', 'auth.signup.lastName', 'שם משפחה', 'auth', 'user'),
  ('he', 'auth.signup.email', 'אימייל', 'auth', 'user'),
  ('he', 'auth.signup.phone', 'טלפון', 'auth', 'user'),
  ('he', 'auth.signup.password', 'סיסמה', 'auth', 'user'),
  ('he', 'auth.signup.confirmPassword', 'אימות סיסמה', 'auth', 'user'),
  ('he', 'auth.signup.passwordHint', 'לפחות 8 תווים', 'auth', 'user'),
  ('he', 'auth.signup.button', 'הירשם', 'auth', 'user'),
  ('he', 'auth.signup.creating', 'יוצר חשבון...', 'auth', 'user'),
  ('he', 'auth.signup.haveAccount', 'כבר יש לך חשבון?', 'auth', 'user'),
  ('he', 'auth.signup.loginLink', 'התחבר', 'auth', 'user'),
  ('he', 'auth.signup.passwordMismatch', 'הסיסמאות אינן תואמות', 'auth', 'user'),
  ('he', 'auth.signup.passwordTooShort', 'הסיסמה חייבת להכיל לפחות 8 תווים', 'auth', 'user'),

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

  -- Reset Password Confirmation Page
  ('he', 'auth.resetConfirm.title', 'הגדר סיסמה חדשה', 'auth', 'user'),
  ('he', 'auth.resetConfirm.subtitle', 'הזן את הסיסמה החדשה שלך למטה', 'auth', 'user'),
  ('he', 'auth.resetConfirm.newPassword', 'סיסמה חדשה', 'auth', 'user'),
  ('he', 'auth.resetConfirm.confirmPassword', 'אמת סיסמה חדשה', 'auth', 'user'),
  ('he', 'auth.resetConfirm.updateButton', 'עדכן סיסמה', 'auth', 'user'),
  ('he', 'auth.resetConfirm.successMessage', 'הסיסמה עודכנה בהצלחה!', 'auth', 'user'),
  ('he', 'auth.resetConfirm.redirecting', 'מפנה להתחברות...', 'auth', 'user'),
  ('he', 'auth.resetConfirm.invalidLink', 'קישור לא תקין או שפג תוקפו. אנא בקש קישור חדש.', 'auth', 'user'),

  -- Common
  ('he', 'common.loading', 'טוען...', 'common', 'both'),
  ('he', 'platform.name', 'בית הספר להורות', 'common', 'both'),
  ('he', 'nav.home', 'בית', 'nav', 'both')
ON CONFLICT (language_code, translation_key)
DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  category = EXCLUDED.category,
  context = EXCLUDED.context,
  updated_at = NOW();

-- English Translations
INSERT INTO translations (language_code, translation_key, translation_value, category, context)
VALUES
  -- Login Page
  ('en', 'auth.login.title', 'Login', 'auth', 'user'),
  ('en', 'auth.login.welcome', 'Welcome back', 'auth', 'user'),
  ('en', 'auth.login.email', 'Email', 'auth', 'user'),
  ('en', 'auth.login.password', 'Password', 'auth', 'user'),
  ('en', 'auth.login.forgotPassword', 'Forgot password?', 'auth', 'user'),
  ('en', 'auth.login.button', 'Login', 'auth', 'user'),
  ('en', 'auth.login.noAccount', 'Don''t have an account?', 'auth', 'user'),
  ('en', 'auth.login.signupLink', 'Sign up', 'auth', 'user'),

  -- Signup Page
  ('en', 'auth.signup.title', 'Sign Up', 'auth', 'user'),
  ('en', 'auth.signup.subtitle', 'Create a new account', 'auth', 'user'),
  ('en', 'auth.signup.firstName', 'First Name', 'auth', 'user'),
  ('en', 'auth.signup.lastName', 'Last Name', 'auth', 'user'),
  ('en', 'auth.signup.email', 'Email', 'auth', 'user'),
  ('en', 'auth.signup.phone', 'Phone', 'auth', 'user'),
  ('en', 'auth.signup.password', 'Password', 'auth', 'user'),
  ('en', 'auth.signup.confirmPassword', 'Confirm Password', 'auth', 'user'),
  ('en', 'auth.signup.passwordHint', 'At least 8 characters', 'auth', 'user'),
  ('en', 'auth.signup.button', 'Sign Up', 'auth', 'user'),
  ('en', 'auth.signup.creating', 'Creating account...', 'auth', 'user'),
  ('en', 'auth.signup.haveAccount', 'Already have an account?', 'auth', 'user'),
  ('en', 'auth.signup.loginLink', 'Login', 'auth', 'user'),
  ('en', 'auth.signup.passwordMismatch', 'Passwords do not match', 'auth', 'user'),
  ('en', 'auth.signup.passwordTooShort', 'Password must be at least 8 characters', 'auth', 'user'),

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

  -- Reset Password Confirmation Page
  ('en', 'auth.resetConfirm.title', 'Set New Password', 'auth', 'user'),
  ('en', 'auth.resetConfirm.subtitle', 'Enter your new password below', 'auth', 'user'),
  ('en', 'auth.resetConfirm.newPassword', 'New Password', 'auth', 'user'),
  ('en', 'auth.resetConfirm.confirmPassword', 'Confirm New Password', 'auth', 'user'),
  ('en', 'auth.resetConfirm.updateButton', 'Update Password', 'auth', 'user'),
  ('en', 'auth.resetConfirm.successMessage', 'Password updated successfully!', 'auth', 'user'),
  ('en', 'auth.resetConfirm.redirecting', 'Redirecting to login...', 'auth', 'user'),
  ('en', 'auth.resetConfirm.invalidLink', 'Invalid or expired reset link. Please request a new one.', 'auth', 'user'),

  -- Common
  ('en', 'common.loading', 'Loading...', 'common', 'both'),
  ('en', 'platform.name', 'Parenting School', 'common', 'both'),
  ('en', 'nav.home', 'Home', 'nav', 'both')
ON CONFLICT (language_code, translation_key)
DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  category = EXCLUDED.category,
  context = EXCLUDED.context,
  updated_at = NOW();

-- Verify all auth translations
SELECT
  tk.key,
  tk.category,
  t_en.translation_value AS english,
  t_he.translation_value AS hebrew
FROM translation_keys tk
LEFT JOIN translations t_en ON tk.key = t_en.translation_key AND t_en.language_code = 'en'
LEFT JOIN translations t_he ON tk.key = t_he.translation_key AND t_he.language_code = 'he'
WHERE tk.key LIKE 'auth.%' OR tk.key IN ('common.loading', 'platform.name', 'nav.home')
ORDER BY tk.category, tk.key;
