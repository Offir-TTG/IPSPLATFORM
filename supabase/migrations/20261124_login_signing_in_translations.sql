-- Login button while signing in. Login pages load only 'user' translations, so the
-- admin-only common.loading never reached them. In he + en, written as U& character codes.
-- Adds only missing keys; safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'user', NOW(), NOW()
FROM (VALUES
  ('en', 'auth.login.signingIn', U&'Signing in\2026'),
  ('he', 'auth.login.signingIn', U&'\05DE\05EA\05D7\05D1\05E8\2026')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
