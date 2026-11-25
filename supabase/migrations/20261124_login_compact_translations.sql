-- Login page (compact design): heading, help link, the enrollment line and back to the enrollment. In he + en.
-- The Hebrew (and the ellipsis) is written as U&'\05E9...' character codes, so
-- the file is plain ASCII and cannot be scrambled when pasted in the SQL editor.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, v.ctx, NOW(), NOW()
FROM (VALUES
  ('en', 'auth.login.heading', 'Log in', 'both'),
  ('he', 'auth.login.heading', U&'\05D4\05EA\05D7\05D1\05E8\05D5\05EA', 'both'),
  ('en', 'auth.login.submit', 'Log in', 'both'),
  ('he', 'auth.login.submit', U&'\05D4\05EA\05D7\05D1\05E8\05D5\05EA', 'both'),
  ('en', 'auth.login.help', 'Help', 'both'),
  ('he', 'auth.login.help', U&'\05E2\05D6\05E8\05D4', 'both'),
  ('en', 'auth.login.forgotPasswordShort', 'Forgot your password?', 'both'),
  ('he', 'auth.login.forgotPasswordShort', U&'\05E9\05DB\05D7\05EA\05DD \05E1\05D9\05E1\05DE\05D4?', 'both'),
  ('en', 'auth.login.continueEnrollment', 'After you log in, your enrollment in {product} continues in your portal.', 'both'),
  ('he', 'auth.login.continueEnrollment', U&'\05D0\05D7\05E8\05D9 \05D4\05D4\05EA\05D7\05D1\05E8\05D5\05EA \05D4\05D4\05E8\05E9\05DE\05D4 \05DC{product} \05EA\05DE\05E9\05D9\05DA \05D1\05E4\05D5\05E8\05D8\05DC \05E9\05DC\05DB\05DD.', 'both'),
  ('en', 'auth.login.noAccountYet', 'Don''t have an account?', 'both'),
  ('he', 'auth.login.noAccountYet', U&'\05D0\05D9\05DF \05DC\05DB\05DD \05D7\05E9\05D1\05D5\05DF?', 'both'),
  ('en', 'auth.login.backToEnrollment', 'Back to the enrollment', 'both'),
  ('he', 'auth.login.backToEnrollment', U&'\05D7\05D6\05E8\05D4 \05DC\05D4\05E8\05E9\05DE\05D4', 'both')
) AS v(lang, key, value, ctx)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
