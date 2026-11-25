-- Enrollment wizard: the login line for returning clients. In he + en.
-- The Hebrew (and the ellipsis) is written as U&'\05E9...' character codes, so
-- the file is plain ASCII and cannot be scrambled when pasted in the SQL editor.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, v.ctx, NOW(), NOW()
FROM (VALUES
  ('en', 'enrollment.wizard.profile.haveAccount', 'Already have an account?', 'both'),
  ('he', 'enrollment.wizard.profile.haveAccount', U&'\05DB\05D1\05E8 \05D9\05E9 \05DC\05DB\05DD \05D7\05E9\05D1\05D5\05DF?', 'both'),
  ('en', 'enrollment.wizard.profile.loginHere', 'Log in', 'both'),
  ('he', 'enrollment.wizard.profile.loginHere', U&'\05D4\05EA\05D7\05D1\05E8\05D5', 'both')
) AS v(lang, key, value, ctx)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
