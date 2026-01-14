-- ============================================================================
-- Add Missing Email Templates for Trigger System
-- ============================================================================
-- This script adds the missing email templates needed for the trigger system:
-- 1. payment.failed - For failed payment notifications
-- 2. recording.available - For Zoom recording ready notifications
-- ============================================================================

DO $$
DECLARE
  v_tenant_id UUID;
  v_template_id_payment_failed UUID;
  v_template_id_recording UUID;
BEGIN
  -- Get the first tenant (or you can specify a specific tenant_id)
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No tenant found. Please create a tenant first.';
  END IF;

  RAISE NOTICE 'Using tenant_id: %', v_tenant_id;

  -- ============================================================================
  -- 1. CREATE PAYMENT FAILED TEMPLATE
  -- ============================================================================

  -- Check if payment.failed template already exists
  IF NOT EXISTS (
    SELECT 1 FROM email_templates
    WHERE tenant_id = v_tenant_id AND template_key = 'payment.failed'
  ) THEN
    -- Insert payment.failed template
    INSERT INTO email_templates (
      id,
      tenant_id,
      template_key,
      template_name,
      template_category,
      description,
      is_system,
      is_active,
      allow_customization,
      variables
    ) VALUES (
      gen_random_uuid(),
      v_tenant_id,
      'payment.failed',
      'Payment Failed',
      'payment',
      'Sent when a payment attempt fails',
      false,
      true,
      true,
      '[
        {"name": "userName", "description": "Student full name", "example": "John Doe", "required": true},
        {"name": "productName", "description": "Product name", "example": "Parenting 101", "required": true},
        {"name": "amount", "description": "Payment amount", "example": "99.00", "required": true},
        {"name": "currency", "description": "Currency code", "example": "USD", "required": true},
        {"name": "failureReason", "description": "Reason for payment failure", "example": "Insufficient funds", "required": false},
        {"name": "retryUrl", "description": "URL to retry payment", "example": "https://example.com/retry", "required": false}
      ]'::jsonb
    )
    RETURNING id INTO v_template_id_payment_failed;

    RAISE NOTICE '✓ Created payment.failed template with ID: %', v_template_id_payment_failed;

    -- Insert English version for payment.failed
    INSERT INTO email_template_versions (
      template_id,
      language_code,
      subject,
      body_html,
      body_text,
      version,
      is_current
    ) VALUES (
      v_template_id_payment_failed,
      'en',
      'Payment Failed - {{productName}}',
      '<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; }
    .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
    .button { display: inline-block; padding: 12px 30px; background-color: #f44336; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .amount { font-size: 24px; font-weight: bold; color: #f44336; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Failed</h1>
    </div>
    <div class="content">
      <p>Hello {{userName}},</p>

      <p>We were unable to process your payment for <strong>{{productName}}</strong>.</p>

      <div style="text-align: center; margin: 30px 0;">
        <div class="amount">{{currency}} {{amount}}</div>
      </div>

      {{#if failureReason}}
      <p><strong>Reason:</strong> {{failureReason}}</p>
      {{/if}}

      <p>Please check your payment method and try again. If the problem persists, please contact your bank or card issuer.</p>

      {{#if retryUrl}}
      <div style="text-align: center;">
        <a href="{{retryUrl}}" class="button">Retry Payment</a>
      </div>
      {{/if}}

      <p>If you have any questions, please don''t hesitate to contact us.</p>

      <p>Best regards,<br>The Support Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>',
      'Hello {{userName}},

We were unable to process your payment for {{productName}}.

Amount: {{currency}} {{amount}}

{{#if failureReason}}
Reason: {{failureReason}}
{{/if}}

Please check your payment method and try again. If the problem persists, please contact your bank or card issuer.

{{#if retryUrl}}
Retry payment: {{retryUrl}}
{{/if}}

If you have any questions, please don''t hesitate to contact us.

Best regards,
The Support Team

---
This is an automated message. Please do not reply to this email.',
      1,
      true
    );

    RAISE NOTICE '✓ Created English version for payment.failed';

    -- Insert Hebrew version for payment.failed
    INSERT INTO email_template_versions (
      template_id,
      language_code,
      subject,
      body_html,
      body_text,
      version,
      is_current
    ) VALUES (
      v_template_id_payment_failed,
      'he',
      'תשלום נכשל - {{productName}}',
      '<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; }
    .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
    .button { display: inline-block; padding: 12px 30px; background-color: #f44336; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .amount { font-size: 24px; font-weight: bold; color: #f44336; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>תשלום נכשל</h1>
    </div>
    <div class="content">
      <p>שלום {{userName}},</p>

      <p>לא הצלחנו לעבד את התשלום שלך עבור <strong>{{productName}}</strong>.</p>

      <div style="text-align: center; margin: 30px 0;">
        <div class="amount">{{currency}} {{amount}}</div>
      </div>

      {{#if failureReason}}
      <p><strong>סיבה:</strong> {{failureReason}}</p>
      {{/if}}

      <p>נא לבדוק את אמצעי התשלום שלך ולנסות שוב. אם הבעיה נמשכת, נא ליצור קשר עם הבנק או חברת האשראי שלך.</p>

      {{#if retryUrl}}
      <div style="text-align: center;">
        <a href="{{retryUrl}}" class="button">נסה שוב</a>
      </div>
      {{/if}}

      <p>אם יש לך שאלות, אנא אל תהסס לפנות אלינו.</p>

      <p>בברכה,<br>צוות התמיכה</p>
    </div>
    <div class="footer">
      <p>זהו מסר אוטומטי. נא לא להשיב למייל זה.</p>
    </div>
  </div>
</body>
</html>',
      'שלום {{userName}},

לא הצלחנו לעבד את התשלום שלך עבור {{productName}}.

סכום: {{currency}} {{amount}}

{{#if failureReason}}
סיבה: {{failureReason}}
{{/if}}

נא לבדוק את אמצעי התשלום שלך ולנסות שוב. אם הבעיה נמשכת, נא ליצור קשר עם הבנק או חברת האשראי שלך.

{{#if retryUrl}}
נסה שוב: {{retryUrl}}
{{/if}}

אם יש לך שאלות, אנא אל תהסס לפנות אלינו.

בברכה,
צוות התמיכה

---
זהו מסר אוטומטי. נא לא להשיב למייל זה.',
      1,
      true
    );

    RAISE NOTICE '✓ Created Hebrew version for payment.failed';
  ELSE
    RAISE NOTICE '⚠ payment.failed template already exists, skipping';
  END IF;

  -- ============================================================================
  -- 2. CREATE RECORDING AVAILABLE TEMPLATE
  -- ============================================================================

  -- Check if recording.available template already exists
  IF NOT EXISTS (
    SELECT 1 FROM email_templates
    WHERE tenant_id = v_tenant_id AND template_key = 'recording.available'
  ) THEN
    -- Insert recording.available template
    INSERT INTO email_templates (
      id,
      tenant_id,
      template_key,
      template_name,
      template_category,
      description,
      is_system,
      is_active,
      allow_customization,
      variables
    ) VALUES (
      gen_random_uuid(),
      v_tenant_id,
      'recording.available',
      'Recording Available',
      'lesson',
      'Sent when a lesson recording is ready to view',
      false,
      true,
      true,
      '[
        {"name": "userName", "description": "Student full name", "example": "John Doe", "required": true},
        {"name": "lessonTitle", "description": "Lesson title", "example": "Introduction to Parenting", "required": true},
        {"name": "courseName", "description": "Course name", "example": "Parenting 101", "required": true},
        {"name": "recordingUrl", "description": "URL to view recording", "example": "https://example.com/recording/123", "required": true},
        {"name": "lessonDate", "description": "Date of lesson", "example": "January 15, 2024", "required": false},
        {"name": "duration", "description": "Recording duration", "example": "1h 30m", "required": false}
      ]'::jsonb
    )
    RETURNING id INTO v_template_id_recording;

    RAISE NOTICE '✓ Created recording.available template with ID: %', v_template_id_recording;

    -- Insert English version for recording.available
    INSERT INTO email_template_versions (
      template_id,
      language_code,
      subject,
      body_html,
      body_text,
      version,
      is_current
    ) VALUES (
      v_template_id_recording,
      'en',
      'Recording Available - {{lessonTitle}}',
      '<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; }
    .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
    .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .lesson-info { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📹 Recording Available</h1>
    </div>
    <div class="content">
      <p>Hello {{userName}},</p>

      <p>Great news! The recording for your recent lesson is now available to watch.</p>

      <div class="lesson-info">
        <h3>{{lessonTitle}}</h3>
        <p><strong>Course:</strong> {{courseName}}</p>
        {{#if lessonDate}}
        <p><strong>Date:</strong> {{lessonDate}}</p>
        {{/if}}
        {{#if duration}}
        <p><strong>Duration:</strong> {{duration}}</p>
        {{/if}}
      </div>

      <p>You can now watch the recording at your convenience. The recording will be available for the duration of your enrollment.</p>

      <div style="text-align: center;">
        <a href="{{recordingUrl}}" class="button">Watch Recording</a>
      </div>

      <p>If you have any questions about the lesson or need assistance accessing the recording, please don''t hesitate to reach out.</p>

      <p>Happy learning!<br>The Support Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>',
      'Hello {{userName}},

Great news! The recording for your recent lesson is now available to watch.

Lesson: {{lessonTitle}}
Course: {{courseName}}
{{#if lessonDate}}
Date: {{lessonDate}}
{{/if}}
{{#if duration}}
Duration: {{duration}}
{{/if}}

You can now watch the recording at your convenience. The recording will be available for the duration of your enrollment.

Watch recording: {{recordingUrl}}

If you have any questions about the lesson or need assistance accessing the recording, please don''t hesitate to reach out.

Happy learning!
The Support Team

---
This is an automated message. Please do not reply to this email.',
      1,
      true
    );

    RAISE NOTICE '✓ Created English version for recording.available';

    -- Insert Hebrew version for recording.available
    INSERT INTO email_template_versions (
      template_id,
      language_code,
      subject,
      body_html,
      body_text,
      version,
      is_current
    ) VALUES (
      v_template_id_recording,
      'he',
      'הקלטה זמינה - {{lessonTitle}}',
      '<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; }
    .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
    .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .lesson-info { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📹 הקלטה זמינה</h1>
    </div>
    <div class="content">
      <p>שלום {{userName}},</p>

      <p>חדשות טובות! ההקלטה של השיעור האחרון שלך זמינה כעת לצפייה.</p>

      <div class="lesson-info">
        <h3>{{lessonTitle}}</h3>
        <p><strong>קורס:</strong> {{courseName}}</p>
        {{#if lessonDate}}
        <p><strong>תאריך:</strong> {{lessonDate}}</p>
        {{/if}}
        {{#if duration}}
        <p><strong>משך:</strong> {{duration}}</p>
        {{/if}}
      </div>

      <p>אתה יכול כעת לצפות בהקלטה בנוחות שלך. ההקלטה תהיה זמינה למשך תקופת ההרשמה שלך.</p>

      <div style="text-align: center;">
        <a href="{{recordingUrl}}" class="button">צפה בהקלטה</a>
      </div>

      <p>אם יש לך שאלות על השיעור או שאתה צריך עזרה בגישה להקלטה, אל תהסס לפנות אלינו.</p>

      <p>למידה מהנה!<br>צוות התמיכה</p>
    </div>
    <div class="footer">
      <p>זהו מסר אוטומטי. נא לא להשיב למייל זה.</p>
    </div>
  </div>
</body>
</html>',
      'שלום {{userName}},

חדשות טובות! ההקלטה של השיעור האחרון שלך זמינה כעת לצפייה.

שיעור: {{lessonTitle}}
קורס: {{courseName}}
{{#if lessonDate}}
תאריך: {{lessonDate}}
{{/if}}
{{#if duration}}
משך: {{duration}}
{{/if}}

אתה יכול כעת לצפות בהקלטה בנוחות שלך. ההקלטה תהיה זמינה למשך תקופת ההרשמה שלך.

צפה בהקלטה: {{recordingUrl}}

אם יש לך שאלות על השיעור או שאתה צריך עזרה בגישה להקלטה, אל תהסס לפנות אלינו.

למידה מהנה!
צוות התמיכה

---
זהו מסר אוטומטי. נא לא להשיב למייל זה.',
      1,
      true
    );

    RAISE NOTICE '✓ Created Hebrew version for recording.available';
  ELSE
    RAISE NOTICE '⚠ recording.available template already exists, skipping';
  END IF;

  -- ============================================================================
  -- 3. ADD TEMPLATE NAME TRANSLATIONS
  -- ============================================================================

  -- Add payment.failed translations
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
  VALUES
    (NULL, 'email_template.payment_failed.name', 'en', 'Payment Failed', 'admin'),
    (NULL, 'email_template.payment_failed.name', 'he', 'תשלום נכשל', 'admin'),
    (NULL, 'email_template.payment_failed.description', 'en', 'Sent when a payment attempt fails', 'admin'),
    (NULL, 'email_template.payment_failed.description', 'he', 'נשלח כאשר ניסיון תשלום נכשל', 'admin')
  ON CONFLICT (translation_key, language_code, context) WHERE tenant_id IS NULL
  DO UPDATE SET translation_value = EXCLUDED.translation_value;

  -- Add recording.available translations
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
  VALUES
    (NULL, 'email_template.recording_available.name', 'en', 'Recording Available', 'admin'),
    (NULL, 'email_template.recording_available.name', 'he', 'הקלטה זמינה', 'admin'),
    (NULL, 'email_template.recording_available.description', 'en', 'Sent when a lesson recording is ready to view', 'admin'),
    (NULL, 'email_template.recording_available.description', 'he', 'נשלח כאשר הקלטת שיעור מוכנה לצפייה', 'admin')
  ON CONFLICT (translation_key, language_code, context) WHERE tenant_id IS NULL
  DO UPDATE SET translation_value = EXCLUDED.translation_value;

  RAISE NOTICE '✓ Added template name translations';

  -- ============================================================================
  -- SUMMARY
  -- ============================================================================

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Email Template Creation Complete!';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Created templates:';
  RAISE NOTICE '  1. payment.failed - For failed payment notifications';
  RAISE NOTICE '  2. recording.available - For Zoom recording notifications';
  RAISE NOTICE '';
  RAISE NOTICE 'Each template includes:';
  RAISE NOTICE '  ✓ English version with HTML and plain text';
  RAISE NOTICE '  ✓ Hebrew version with RTL support';
  RAISE NOTICE '  ✓ Handlebars variable support';
  RAISE NOTICE '  ✓ Translation entries in translations table';
  RAISE NOTICE '';
  RAISE NOTICE 'These templates can now be used with email triggers!';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

END $$;
