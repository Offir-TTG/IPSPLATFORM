-- Integrations page: the SMTP card (email fallback when Resend isn't set up or fails).
-- Hebrew as U&'\05..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.integrations.smtp.description', 'Sends email through your own mail server when Resend isn''t set up or isn''t working'),
  ('he', 'admin.integrations.smtp.description', U&'\05E9\05D5\05DC\05D7 \05DE\05D9\05D9\05DC\05D9\05DD \05D3\05E8\05DA \05E9\05E8\05EA \05D4\05D3\05D5\05D0\05E8 \05E9\05DC\05DB\05DD \05DB\05E9-Resend \05DC\05D0 \05DE\05D5\05D2\05D3\05E8 \05D0\05D5 \05DC\05D0 \05E2\05D5\05D1\05D3'),
  ('en', 'admin.integrations.smtp.host', 'Mail server'),
  ('he', 'admin.integrations.smtp.host', U&'\05E9\05E8\05EA \05D3\05D5\05D0\05E8'),
  ('en', 'admin.integrations.smtp.port', 'Port'),
  ('he', 'admin.integrations.smtp.port', U&'\05E4\05D5\05E8\05D8'),
  ('en', 'admin.integrations.smtp.security', 'Security'),
  ('he', 'admin.integrations.smtp.security', U&'\05D0\05D1\05D8\05D7\05D4'),
  ('en', 'admin.integrations.smtp.securityTls', 'STARTTLS (usually port 587)'),
  ('he', 'admin.integrations.smtp.securityTls', U&'STARTTLS (\05D1\05D3\05E8\05DA \05DB\05DC\05DC \05E4\05D5\05E8\05D8 587)'),
  ('en', 'admin.integrations.smtp.securitySsl', 'SSL/TLS (usually port 465)'),
  ('he', 'admin.integrations.smtp.securitySsl', U&'SSL/TLS (\05D1\05D3\05E8\05DA \05DB\05DC\05DC \05E4\05D5\05E8\05D8 465)'),
  ('en', 'admin.integrations.smtp.securityNone', 'None (not recommended)'),
  ('he', 'admin.integrations.smtp.securityNone', U&'\05DC\05DC\05D0 (\05DC\05D0 \05DE\05D5\05DE\05DC\05E5)'),
  ('en', 'admin.integrations.smtp.username', 'Username'),
  ('he', 'admin.integrations.smtp.username', U&'\05E9\05DD \05DE\05E9\05EA\05DE\05E9'),
  ('en', 'admin.integrations.smtp.password', 'Password'),
  ('he', 'admin.integrations.smtp.password', U&'\05E1\05D9\05E1\05DE\05D4'),
  ('en', 'admin.integrations.smtp.passwordPlaceholder', 'For Gmail, an app password'),
  ('he', 'admin.integrations.smtp.passwordPlaceholder', U&'\05D1-Gmail: \05E1\05D9\05E1\05DE\05EA \05D0\05E4\05DC\05D9\05E7\05E6\05D9\05D4'),
  ('en', 'admin.integrations.smtp.fromEmail', 'Sender email'),
  ('he', 'admin.integrations.smtp.fromEmail', U&'\05DB\05EA\05D5\05D1\05EA \05D4\05E9\05D5\05DC\05D7'),
  ('en', 'admin.integrations.smtp.fromName', 'Sender name'),
  ('he', 'admin.integrations.smtp.fromName', U&'\05E9\05DD \05D4\05E9\05D5\05DC\05D7')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
