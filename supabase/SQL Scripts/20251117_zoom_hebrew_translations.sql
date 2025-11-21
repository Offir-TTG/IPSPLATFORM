-- Hebrew translations for ALL Integrations (Zoom, DocuSign, Stripe, SendGrid, Twilio)
-- Run this migration to add Hebrew translations for all integration UI elements

-- First, get the tenant_id (assuming single tenant or default tenant)
-- If you have multiple tenants, you'll need to run this for each tenant
DO $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- Get the first tenant ID (or you can specify a specific tenant)
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;

  -- If no tenant exists, raise an error
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No tenant found. Please create a tenant first.';
  END IF;

  -- Delete existing Hebrew translations for integrations to avoid duplicates
  DELETE FROM translations
  WHERE language_code = 'he'
    AND translation_key LIKE 'admin.integrations.%'
    AND context = 'admin'
    AND tenant_id = v_tenant_id;

  -- Insert all translations
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    -- Zoom Integration translations
    (v_tenant_id, 'he', 'admin.integrations.zoom.description', 'שיחות וידאו ופגישות מקוונות', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.zoom.accountId', 'מזהה חשבון (Account ID)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.zoom.accountIdPlaceholder', 'מזהה חשבון Zoom שלך', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.zoom.clientId', 'מזהה לקוח (Client ID)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.zoom.clientIdPlaceholder', 'מזהה הלקוח שלך ב-Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.zoom.clientSecret', 'סוד לקוח (Client Secret)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.zoom.clientSecretPlaceholder', 'מפתח הסוד שלך ב-Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.zoom.sdkKey', 'מפתח SDK', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.zoom.sdkKeyPlaceholder', 'מפתח ה-SDK שלך ב-Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.zoom.sdkSecret', 'סוד SDK', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.zoom.sdkSecretPlaceholder', 'סוד ה-SDK שלך ב-Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.zoom.defaultDuration', 'משך פגישה ברירת מחדל (דקות)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.zoom.autoRecording', 'הקלטה אוטומטית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.zoom.recordingNone', 'ללא', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.zoom.recordingLocal', 'מקומי', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.zoom.recordingCloud', 'ענן', 'admin', NOW(), NOW()),

    -- Common integration terms
    (v_tenant_id, 'he', 'admin.integrations.title', 'אינטגרציות', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.description', 'חיבור והגדרת שירותי צד שלישי להרחבת יכולות הפלטפורמה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.active', 'פעיל', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.credentials', 'אישורי גישה (API Credentials)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.hide', 'הסתר', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.show', 'הצג', 'admin', NOW(), NOW()),

    -- Status messages
    (v_tenant_id, 'he', 'admin.integrations.status.connected', 'מחובר', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.status.disconnected', 'מנותק', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.status.error', 'שגיאה', 'admin', NOW(), NOW()),

    -- Success messages
    (v_tenant_id, 'he', 'admin.integrations.success.saved', 'ההגדרות נשמרו בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.success.testPassed', 'בדיקת החיבור הצליחה', 'admin', NOW(), NOW()),

    -- Error messages
    (v_tenant_id, 'he', 'admin.integrations.errors.loadFailed', 'טעינת האינטגרציות נכשלה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.errors.saveFailed', 'שמירת ההגדרות נכשלה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.errors.testFailed', 'בדיקת החיבור נכשלה', 'admin', NOW(), NOW()),

    -- Security notice
    (v_tenant_id, 'he', 'admin.integrations.securityNote', 'כל האישורים מוצפנים ונשמרים בצורה מאובטחת. מומלץ להשתמש במפתחות API עם ההרשאות המינימליות הנדרשות.', 'admin', NOW(), NOW()),

    -- Environment labels
    (v_tenant_id, 'he', 'admin.integrations.environment.sandbox', 'סביבת ניסיון (Sandbox)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.environment.production', 'סביבת ייצור (Production)', 'admin', NOW(), NOW()),

    -- DocuSign translations
    (v_tenant_id, 'he', 'admin.integrations.docusign.description', 'פלטפורמת חתימה אלקטרונית והסכמים בענן', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.docusign.accountId', 'מזהה חשבון (Account ID)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.docusign.accountIdPlaceholder', 'מזהה חשבון DocuSign שלך', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.docusign.integrationKey', 'מפתח אינטגרציה (Integration Key)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.docusign.integrationKeyPlaceholder', 'מפתח האינטגרציה שלך ב-DocuSign', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.docusign.userId', 'מזהה משתמש (User ID - GUID)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.docusign.userIdPlaceholder', 'מזהה המשתמש שלך ב-DocuSign', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.docusign.privateKey', 'מפתח פרטי RSA', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.docusign.privateKeyPlaceholder', 'הדבק את המפתח הפרטי RSA (כולל שורות BEGIN/END)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.docusign.oauthBasePath', 'נתיב בסיס OAuth', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.docusign.apiBasePath', 'נתיב בסיס API', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.docusign.webhookSecret', 'סוד Webhook (מפתח HMAC)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.docusign.webhookSecretPlaceholder', 'אופציונלי: מפתח HMAC מ-DocuSign Connect', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.docusign.autoSend', 'שלח מעטפות אוטומטית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.docusign.reminderDays', 'תזכורת לאחר (ימים)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.docusign.expirationDays', 'תפוגה לאחר (ימים)', 'admin', NOW(), NOW()),

    -- Stripe translations
    (v_tenant_id, 'he', 'admin.integrations.stripe.description', 'פלטפורמת עיבוד תשלומים מקוונת', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.stripe.secretKey', 'מפתח סודי (Secret Key)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.stripe.publishableKey', 'מפתח ציבורי (Publishable Key)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.stripe.webhookSecret', 'סוד Webhook', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.stripe.currency', 'מטבע ברירת מחדל', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.stripe.statementDescriptor', 'תיאור בדף חיוב', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.stripe.statementDescriptorPlaceholder', 'שם החברה שלך', 'admin', NOW(), NOW()),

    -- SendGrid translations
    (v_tenant_id, 'he', 'admin.integrations.sendgrid.description', 'שירות שליחת אימייל', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.sendgrid.apiKey', 'מפתח API', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.sendgrid.fromEmail', 'כתובת אימייל שולח', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.sendgrid.fromName', 'שם שולח', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.sendgrid.fromNamePlaceholder', 'החברה שלך', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.sendgrid.sandboxMode', 'מצב ניסיון (Sandbox)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.sendgrid.emailTracking', 'מעקב אימייל', 'admin', NOW(), NOW()),

    -- Twilio translations
    (v_tenant_id, 'he', 'admin.integrations.twilio.description', 'תקשורת SMS וקולית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.twilio.accountSid', 'מזהה חשבון (Account SID)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.twilio.authToken', 'טוקן אימות (Auth Token)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.twilio.authTokenPlaceholder', 'טוקן האימות שלך', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.twilio.phoneNumber', 'מספר טלפון', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.twilio.messagingServiceSid', 'מזהה שירות הודעות (Messaging Service SID)', 'admin', NOW(), NOW()),

    -- Additional UI elements (buttons and actions)
    (v_tenant_id, 'he', 'admin.integrations.select', 'בחר', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.settings', 'הגדרות אינטגרציה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.webhookUrl', 'כתובת Webhook', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.webhookDescription', 'הגדר כתובת URL זו בהגדרות ה-webhook של', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.copy', 'העתק', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.copied', 'כתובת ה-Webhook הועתקה ללוח', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.testing', 'בודק...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.testConnection', 'בדוק חיבור', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.saving', 'שומר...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'admin.integrations.save', 'שמור הגדרות', 'admin', NOW(), NOW());

  -- Show success message
  RAISE NOTICE 'Successfully added % Hebrew translations for integrations', (
    SELECT COUNT(*)
    FROM translations
    WHERE translation_key LIKE 'admin.integrations.%'
      AND language_code = 'he'
      AND tenant_id = v_tenant_id
  );

END $$;

-- Verify the insertions
SELECT
  COUNT(*) as total_translations,
  language_code,
  context
FROM translations
WHERE translation_key LIKE 'admin.integrations.%'
  AND language_code = 'he'
GROUP BY language_code, context;
