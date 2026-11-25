-- Hebrew names for the four email templates that had none (shown on Communications > Templates and Overview).
-- Hebrew as U&'..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'email_template.system_password_reset.name', 'Password Reset'),
  ('he', 'email_template.system_password_reset.name', U&'\05D0\05D9\05E4\05D5\05E1 \05E1\05D9\05E1\05DE\05D4'),
  ('en', 'email_template.system_password_reset.description', 'Sent when admin triggers password reset for a user'),
  ('he', 'email_template.system_password_reset.description', U&'\05E0\05E9\05DC\05D7 \05DB\05E9\05DE\05D1\05E7\05E9\05D9\05DD \05D0\05D9\05E4\05D5\05E1 \05E1\05D9\05E1\05DE\05D4 \05DC\05DC\05E7\05D5\05D7 \05D0\05D5 \05DC\05DE\05E9\05EA\05DE\05E9'),
  ('en', 'email_template.notification_generic.name', 'Generic Notification'),
  ('he', 'email_template.notification_generic.name', U&'\05D4\05D5\05D3\05E2\05D4 \05DB\05DC\05DC\05D9\05EA'),
  ('en', 'email_template.notification_generic.description', 'Generic template for in-app notifications sent via email'),
  ('he', 'email_template.notification_generic.description', U&'\05D4\05EA\05D1\05E0\05D9\05EA \05E9\05DC \05D4\05D5\05D3\05E2\05D5\05EA \05D5\05D0\05D9\05DE\05D9\05D9\05DC\05D9\05DD \05DE\05EA\05D5\05D6\05DE\05E0\05D9\05DD \05E9\05E0\05E9\05DC\05D7\05D9\05DD \05D1\05D0\05D9\05DE\05D9\05D9\05DC'),
  ('en', 'email_template.subscription_price_change.name', 'Membership price change'),
  ('he', 'email_template.subscription_price_change.name', U&'\05E9\05D9\05E0\05D5\05D9 \05DE\05D7\05D9\05E8 \05DE\05E0\05D5\05D9'),
  ('en', 'email_template.subscription_price_change.description', 'Sent to current members before a scheduled membership price change takes effect'),
  ('he', 'email_template.subscription_price_change.description', U&'\05E0\05E9\05DC\05D7 \05DC\05D7\05D1\05E8\05D9\05DD \05DC\05E4\05E0\05D9 \05E9\05E9\05D9\05E0\05D5\05D9 \05DE\05D7\05D9\05E8 \05D4\05DE\05E0\05D5\05D9 \05E0\05DB\05E0\05E1 \05DC\05EA\05D5\05E7\05E3'),
  ('en', 'email_template.subscription_price_change_cancelled.name', 'Membership price change cancelled'),
  ('he', 'email_template.subscription_price_change_cancelled.name', U&'\05E9\05D9\05E0\05D5\05D9 \05DE\05D7\05D9\05E8 \05D4\05DE\05E0\05D5\05D9 \05D1\05D5\05D8\05DC'),
  ('en', 'email_template.subscription_price_change_cancelled.description', 'Sent when a price change members were told about is cancelled'),
  ('he', 'email_template.subscription_price_change_cancelled.description', U&'\05E0\05E9\05DC\05D7 \05DB\05E9\05DE\05D1\05D8\05DC\05D9\05DD \05E9\05D9\05E0\05D5\05D9 \05DE\05D7\05D9\05E8 \05E9\05DB\05D1\05E8 \05D4\05D5\05D3\05D9\05E2\05D5 \05E2\05DC\05D9\05D5')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.tenant_id IS NULL AND t.language_code = v.lang AND t.translation_key = v.key
);
