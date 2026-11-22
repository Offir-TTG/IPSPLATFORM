-- Email moves to Resend; SMTP, SendGrid, Twilio (SMS) and Keap are removed.
--
-- 1. Each tenant gets a "resend" integration, with the sender email and name
--    copied from its SMTP settings. The API key is added on the Integrations
--    page (Settings → Integrations → Resend). Until it is, emails don't go out
--    (in development they're printed to the console instead).
-- 2. The smtp, sendgrid, twilio and keap integration rows are deleted.
-- 3. products.keap_tag is dropped (no product has one set).
-- 4. Wording for the removed screens is deleted, and the Resend card's
--    wording added (he + en). audit.keap.* stays, to label past audit entries.
--
-- RUN AFTER DEPLOYING the code that sends through Resend. Safe to rerun.

-- 1. Resend settings, seeded from SMTP's sender details.
INSERT INTO integrations (tenant_id, integration_key, integration_name, is_enabled, credentials, settings, webhook_url, created_at, updated_at)
SELECT s.tenant_id, 'resend', 'Resend', true,
       jsonb_strip_nulls(jsonb_build_object(
         'from_email', s.credentials->>'from_email',
         'from_name', s.credentials->>'from_name'
       )),
       '{}'::jsonb, '/api/webhooks/resend', NOW(), NOW()
FROM integrations s
WHERE s.integration_key = 'smtp'
  AND NOT EXISTS (
    SELECT 1 FROM integrations r
    WHERE r.integration_key = 'resend' AND r.tenant_id IS NOT DISTINCT FROM s.tenant_id
  );

-- A tenant that had no SMTP row still gets an empty Resend card to fill in.
INSERT INTO integrations (tenant_id, integration_key, integration_name, is_enabled, credentials, settings, webhook_url, created_at, updated_at)
SELECT t.id, 'resend', 'Resend', true, '{}'::jsonb, '{}'::jsonb, '/api/webhooks/resend', NOW(), NOW()
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM integrations r WHERE r.integration_key = 'resend' AND r.tenant_id = t.id
);

-- 2. The removed services.
DELETE FROM integrations WHERE integration_key IN ('smtp', 'sendgrid', 'twilio', 'keap');

-- 3. Keap's tag on products.
ALTER TABLE products DROP COLUMN IF EXISTS keap_tag;

-- 4a. Wording of removed screens and options.
DELETE FROM translations
WHERE translation_key LIKE 'admin.integrations.keap.%'
   OR translation_key LIKE 'admin.integrations.sendgrid.%'
   OR translation_key LIKE 'admin.integrations.smtp.%'
   OR translation_key LIKE 'admin.integrations.twilio.%'
   OR translation_key LIKE 'admin.keap.%'
   OR translation_key LIKE 'admin.nav.keap%'
   OR translation_key LIKE 'products.keap%'
   OR translation_key LIKE 'user.notifications.preferences.sms%'
   OR translation_key IN (
     'admin.notifications.channels.sms',
     'admin.notifications.sms',
     'admin.notifications.smsChannel',
     'admin.notifications.wizard.smsText',
     'admin.users.activity.overview.tags.keapHeading',
     'emails.settings.smtp'
   );

-- 4b. The Resend card.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.integrations.resend.description', 'Sends every email from the platform, and reports bounces'),
  ('he', 'admin.integrations.resend.description', 'שולח את כל הדוא"ל מהפלטפורמה, ומדווח על הודעות שחזרו'),
  ('en', 'admin.integrations.resend.apiKey', 'API Key'),
  ('he', 'admin.integrations.resend.apiKey', 'מפתח API'),
  ('en', 'admin.integrations.resend.fromEmail', 'Sender email'),
  ('he', 'admin.integrations.resend.fromEmail', 'כתובת השולח'),
  ('en', 'admin.integrations.resend.fromName', 'Sender name'),
  ('he', 'admin.integrations.resend.fromName', 'שם השולח'),
  ('en', 'admin.integrations.resend.fromNamePlaceholder', 'Your organization'),
  ('he', 'admin.integrations.resend.fromNamePlaceholder', 'שם הארגון'),
  ('en', 'admin.integrations.resend.webhookSecret', 'Webhook signing secret'),
  ('he', 'admin.integrations.resend.webhookSecret', 'סוד החתימה של ה-Webhook')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
