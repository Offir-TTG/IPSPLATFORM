-- Fix the "recording.available" Hebrew email template so the text
-- actually renders right-aligned in Gmail / Outlook. The previous
-- version relied on `direction: rtl` inside a <style> block, but
-- those rules get stripped by most email clients — only inline
-- styles and HTML attributes survive. Adds dir="rtl" attributes on
-- <body> and the main containers, plus explicit text-align so the
-- punctuation lands on the correct side.
--
-- Targets every tenant copy of the template (tenant_id IS NULL +
-- per-tenant), language 'he'. Safe to re-run.

UPDATE public.email_template_versions
SET body_html = '<html>
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
<body dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; direction: rtl; text-align: right; margin: 0; padding: 0;">
  <div dir="rtl" class="container" style="max-width: 600px; margin: 0 auto; padding: 20px; text-align: right; direction: rtl;">
    <div class="header" style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
      <h1 style="margin: 0;">📹 הקלטה זמינה</h1>
    </div>
    <div class="content" dir="rtl" style="background-color: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; text-align: right; direction: rtl;">
      <p style="text-align: right;">שלום {{userName}},</p>

      <p style="text-align: right;">חדשות טובות! ההקלטה של השיעור האחרון שלך זמינה כעת לצפייה.</p>

      <div class="lesson-info" dir="rtl" style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: right; direction: rtl;">
        <h3 style="margin: 0 0 10px 0;">{{lessonTitle}}</h3>
        <p style="margin: 5px 0;"><strong>קורס:</strong> {{courseName}}</p>
        {{#if lessonDate}}
        <p style="margin: 5px 0;"><strong>תאריך:</strong> {{lessonDate}}</p>
        {{/if}}
        {{#if duration}}
        <p style="margin: 5px 0;"><strong>משך:</strong> {{duration}}</p>
        {{/if}}
      </div>

      <p style="text-align: right;">אתה יכול כעת לצפות בהקלטה בנוחות שלך. ההקלטה תהיה זמינה למשך תקופת ההרשמה שלך.</p>

      <div style="text-align: center;">
        <a href="{{recordingUrl}}" class="button" style="display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">צפה בהקלטה</a>
      </div>

      <p style="text-align: right;">אם יש לך שאלות על השיעור או שאתה צריך עזרה בגישה להקלטה, אל תהסס לפנות אלינו.</p>

      <p style="text-align: right;">למידה מהנה!<br>צוות התמיכה</p>
    </div>
    <div class="footer" style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px;">
      <p style="margin: 0;">זהו מסר אוטומטי. נא לא להשיב למייל זה.</p>
    </div>
  </div>
</body>
</html>'
WHERE language_code = 'he'
  AND template_id IN (
    SELECT id FROM public.email_templates
    WHERE template_key = 'recording.available'
  );

-- Force PostgREST to refresh its schema cache (no-op here but
-- consistent with the project's migration style).
NOTIFY pgrst, 'reload schema';
