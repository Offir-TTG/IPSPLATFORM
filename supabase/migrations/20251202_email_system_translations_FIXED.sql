-- ============================================================================
-- Email System Translations (FIXED)
-- Comprehensive translation keys for the email management system
-- Languages: English (en) and Hebrew (he)
-- ============================================================================

DO $$
BEGIN
  -- Delete existing email translations to avoid conflicts
  DELETE FROM translations
  WHERE tenant_id IS NULL
    AND translation_key LIKE 'emails.%';

  -- Insert translations with global scope (tenant_id = NULL)
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context) VALUES

  -- ============================================================================
  -- Email Dashboard
  -- ============================================================================
  (NULL, 'emails.dashboard.title', 'en', 'Email Dashboard', 'admin'),
  (NULL, 'emails.dashboard.title', 'he', 'לוח בקרה - אימיילים', 'admin'),
  (NULL, 'emails.dashboard.overview', 'en', 'Overview', 'admin'),
  (NULL, 'emails.dashboard.overview', 'he', 'סקירה כללית', 'admin'),
  (NULL, 'emails.dashboard.stats.sent', 'en', 'Emails Sent', 'admin'),
  (NULL, 'emails.dashboard.stats.sent', 'he', 'אימיילים שנשלחו', 'admin'),
  (NULL, 'emails.dashboard.stats.delivered', 'en', 'Delivered', 'admin'),
  (NULL, 'emails.dashboard.stats.delivered', 'he', 'נמסרו בהצלחה', 'admin'),
  (NULL, 'emails.dashboard.stats.opened', 'en', 'Opened', 'admin'),
  (NULL, 'emails.dashboard.stats.opened', 'he', 'נפתחו', 'admin'),
  (NULL, 'emails.dashboard.stats.clicked', 'en', 'Clicked', 'admin'),
  (NULL, 'emails.dashboard.stats.clicked', 'he', 'נלחצו', 'admin'),
  (NULL, 'emails.dashboard.stats.failed', 'en', 'Failed', 'admin'),
  (NULL, 'emails.dashboard.stats.failed', 'he', 'נכשלו', 'admin'),
  (NULL, 'emails.dashboard.stats.pending', 'en', 'Pending', 'admin'),
  (NULL, 'emails.dashboard.stats.pending', 'he', 'ממתינים', 'admin'),
  (NULL, 'emails.dashboard.open_rate', 'en', 'Open Rate', 'admin'),
  (NULL, 'emails.dashboard.open_rate', 'he', 'שיעור פתיחה', 'admin'),
  (NULL, 'emails.dashboard.click_rate', 'en', 'Click Rate', 'admin'),
  (NULL, 'emails.dashboard.click_rate', 'he', 'שיעור הקלקה', 'admin'),
  (NULL, 'emails.dashboard.delivery_rate', 'en', 'Delivery Rate', 'admin'),
  (NULL, 'emails.dashboard.delivery_rate', 'he', 'שיעור מסירה', 'admin'),

  -- ============================================================================
  -- Email Templates
  -- ============================================================================
  (NULL, 'emails.templates.title', 'en', 'Email Templates', 'admin'),
  (NULL, 'emails.templates.title', 'he', 'תבניות אימייל', 'admin'),
  (NULL, 'emails.templates.create', 'en', 'Create Template', 'admin'),
  (NULL, 'emails.templates.create', 'he', 'יצירת תבנית', 'admin'),
  (NULL, 'emails.templates.edit', 'en', 'Edit Template', 'admin'),
  (NULL, 'emails.templates.edit', 'he', 'עריכת תבנית', 'admin'),
  (NULL, 'emails.templates.delete', 'en', 'Delete Template', 'admin'),
  (NULL, 'emails.templates.delete', 'he', 'מחיקת תבנית', 'admin'),
  (NULL, 'emails.templates.duplicate', 'en', 'Duplicate Template', 'admin'),
  (NULL, 'emails.templates.duplicate', 'he', 'שכפול תבנית', 'admin'),
  (NULL, 'emails.templates.preview', 'en', 'Preview', 'admin'),
  (NULL, 'emails.templates.preview', 'he', 'תצוגה מקדימה', 'admin'),
  (NULL, 'emails.templates.key', 'en', 'Template Key', 'admin'),
  (NULL, 'emails.templates.key', 'he', 'מפתח תבנית', 'admin'),
  (NULL, 'emails.templates.name', 'en', 'Template Name', 'admin'),
  (NULL, 'emails.templates.name', 'he', 'שם תבנית', 'admin'),
  (NULL, 'emails.templates.category', 'en', 'Category', 'admin'),
  (NULL, 'emails.templates.category', 'he', 'קטגוריה', 'admin'),
  (NULL, 'emails.templates.description', 'en', 'Description', 'admin'),
  (NULL, 'emails.templates.description', 'he', 'תיאור', 'admin'),
  (NULL, 'emails.templates.subject', 'en', 'Subject', 'admin'),
  (NULL, 'emails.templates.subject', 'he', 'נושא', 'admin'),
  (NULL, 'emails.templates.body', 'en', 'Email Body', 'admin'),
  (NULL, 'emails.templates.body', 'he', 'גוף האימייל', 'admin'),
  (NULL, 'emails.templates.variables', 'en', 'Variables', 'admin'),
  (NULL, 'emails.templates.variables', 'he', 'משתנים', 'admin'),
  (NULL, 'emails.templates.is_active', 'en', 'Active', 'admin'),
  (NULL, 'emails.templates.is_active', 'he', 'פעיל', 'admin'),
  (NULL, 'emails.templates.is_system', 'en', 'System Template', 'admin'),
  (NULL, 'emails.templates.is_system', 'he', 'תבנית מערכת', 'admin'),
  (NULL, 'emails.templates.custom_styles', 'en', 'Custom Styles', 'admin'),
  (NULL, 'emails.templates.custom_styles', 'he', 'עיצוב מותאם', 'admin'),
  (NULL, 'emails.templates.version', 'en', 'Version', 'admin'),
  (NULL, 'emails.templates.version', 'he', 'גרסה', 'admin'),

  -- Template Categories
  (NULL, 'emails.category.enrollment', 'en', 'Enrollment', 'admin'),
  (NULL, 'emails.category.enrollment', 'he', 'הרשמה', 'admin'),
  (NULL, 'emails.category.payment', 'en', 'Payment', 'admin'),
  (NULL, 'emails.category.payment', 'he', 'תשלום', 'admin'),
  (NULL, 'emails.category.lesson', 'en', 'Lesson', 'admin'),
  (NULL, 'emails.category.lesson', 'he', 'שיעור', 'admin'),
  (NULL, 'emails.category.parent', 'en', 'Parent Communication', 'admin'),
  (NULL, 'emails.category.parent', 'he', 'תקשורת הורים', 'admin'),
  (NULL, 'emails.category.system', 'en', 'System', 'admin'),
  (NULL, 'emails.category.system', 'he', 'מערכת', 'admin'),

  -- ============================================================================
  -- Email Queue
  -- ============================================================================
  (NULL, 'emails.queue.title', 'en', 'Email Queue', 'admin'),
  (NULL, 'emails.queue.title', 'he', 'תור אימיילים', 'admin'),
  (NULL, 'emails.queue.view', 'en', 'View Queue', 'admin'),
  (NULL, 'emails.queue.view', 'he', 'צפייה בתור', 'admin'),
  (NULL, 'emails.queue.retry', 'en', 'Retry', 'admin'),
  (NULL, 'emails.queue.retry', 'he', 'נסה שוב', 'admin'),
  (NULL, 'emails.queue.cancel', 'en', 'Cancel', 'admin'),
  (NULL, 'emails.queue.cancel', 'he', 'ביטול', 'admin'),
  (NULL, 'emails.queue.recipient', 'en', 'Recipient', 'admin'),
  (NULL, 'emails.queue.recipient', 'he', 'נמען', 'admin'),
  (NULL, 'emails.queue.status', 'en', 'Status', 'admin'),
  (NULL, 'emails.queue.status', 'he', 'סטטוס', 'admin'),
  (NULL, 'emails.queue.priority', 'en', 'Priority', 'admin'),
  (NULL, 'emails.queue.priority', 'he', 'עדיפות', 'admin'),
  (NULL, 'emails.queue.scheduled_for', 'en', 'Scheduled For', 'admin'),
  (NULL, 'emails.queue.scheduled_for', 'he', 'מתוזמן ל', 'admin'),
  (NULL, 'emails.queue.sent_at', 'en', 'Sent At', 'admin'),
  (NULL, 'emails.queue.sent_at', 'he', 'נשלח ב', 'admin'),
  (NULL, 'emails.queue.attempts', 'en', 'Attempts', 'admin'),
  (NULL, 'emails.queue.attempts', 'he', 'ניסיונות', 'admin'),

  -- Queue Status
  (NULL, 'emails.status.pending', 'en', 'Pending', 'admin'),
  (NULL, 'emails.status.pending', 'he', 'ממתין', 'admin'),
  (NULL, 'emails.status.processing', 'en', 'Processing', 'admin'),
  (NULL, 'emails.status.processing', 'he', 'מעבד', 'admin'),
  (NULL, 'emails.status.sent', 'en', 'Sent', 'admin'),
  (NULL, 'emails.status.sent', 'he', 'נשלח', 'admin'),
  (NULL, 'emails.status.failed', 'en', 'Failed', 'admin'),
  (NULL, 'emails.status.failed', 'he', 'נכשל', 'admin'),
  (NULL, 'emails.status.cancelled', 'en', 'Cancelled', 'admin'),
  (NULL, 'emails.status.cancelled', 'he', 'בוטל', 'admin'),
  (NULL, 'emails.status.expired', 'en', 'Expired', 'admin'),
  (NULL, 'emails.status.expired', 'he', 'פג תוקף', 'admin'),

  -- Priority Levels
  (NULL, 'emails.priority.urgent', 'en', 'Urgent', 'admin'),
  (NULL, 'emails.priority.urgent', 'he', 'דחוף', 'admin'),
  (NULL, 'emails.priority.high', 'en', 'High', 'admin'),
  (NULL, 'emails.priority.high', 'he', 'גבוה', 'admin'),
  (NULL, 'emails.priority.normal', 'en', 'Normal', 'admin'),
  (NULL, 'emails.priority.normal', 'he', 'רגיל', 'admin'),
  (NULL, 'emails.priority.low', 'en', 'Low', 'admin'),
  (NULL, 'emails.priority.low', 'he', 'נמוך', 'admin'),

  -- ============================================================================
  -- Email Analytics
  -- ============================================================================
  (NULL, 'emails.analytics.title', 'en', 'Email Analytics', 'admin'),
  (NULL, 'emails.analytics.title', 'he', 'ניתוח אימיילים', 'admin'),
  (NULL, 'emails.analytics.performance', 'en', 'Performance', 'admin'),
  (NULL, 'emails.analytics.performance', 'he', 'ביצועים', 'admin'),
  (NULL, 'emails.analytics.engagement', 'en', 'Engagement', 'admin'),
  (NULL, 'emails.analytics.engagement', 'he', 'מעורבות', 'admin'),
  (NULL, 'emails.analytics.template_stats', 'en', 'Template Statistics', 'admin'),
  (NULL, 'emails.analytics.template_stats', 'he', 'סטטיסטיקות תבניות', 'admin'),
  (NULL, 'emails.analytics.opens', 'en', 'Opens', 'admin'),
  (NULL, 'emails.analytics.opens', 'he', 'פתיחות', 'admin'),
  (NULL, 'emails.analytics.clicks', 'en', 'Clicks', 'admin'),
  (NULL, 'emails.analytics.clicks', 'he', 'הקלקות', 'admin'),
  (NULL, 'emails.analytics.bounces', 'en', 'Bounces', 'admin'),
  (NULL, 'emails.analytics.bounces', 'he', 'החזרות', 'admin'),
  (NULL, 'emails.analytics.first_opened', 'en', 'First Opened', 'admin'),
  (NULL, 'emails.analytics.first_opened', 'he', 'נפתח לראשונה', 'admin'),
  (NULL, 'emails.analytics.last_opened', 'en', 'Last Opened', 'admin'),
  (NULL, 'emails.analytics.last_opened', 'he', 'נפתח לאחרונה', 'admin'),
  (NULL, 'emails.analytics.device_type', 'en', 'Device Type', 'admin'),
  (NULL, 'emails.analytics.device_type', 'he', 'סוג מכשיר', 'admin'),
  (NULL, 'emails.analytics.bounce_hard', 'en', 'Hard Bounce', 'admin'),
  (NULL, 'emails.analytics.bounce_hard', 'he', 'החזרה קבועה', 'admin'),
  (NULL, 'emails.analytics.bounce_soft', 'en', 'Soft Bounce', 'admin'),
  (NULL, 'emails.analytics.bounce_soft', 'he', 'החזרה זמנית', 'admin'),

  -- ============================================================================
  -- Email Triggers
  -- ============================================================================
  (NULL, 'emails.triggers.title', 'en', 'Email Triggers', 'admin'),
  (NULL, 'emails.triggers.title', 'he', 'טריגרים לאימייל', 'admin'),
  (NULL, 'emails.triggers.create', 'en', 'Create Trigger', 'admin'),
  (NULL, 'emails.triggers.create', 'he', 'יצירת טריגר', 'admin'),
  (NULL, 'emails.triggers.edit', 'en', 'Edit Trigger', 'admin'),
  (NULL, 'emails.triggers.edit', 'he', 'עריכת טריגר', 'admin'),
  (NULL, 'emails.triggers.delete', 'en', 'Delete Trigger', 'admin'),
  (NULL, 'emails.triggers.delete', 'he', 'מחיקת טריגר', 'admin'),
  (NULL, 'emails.triggers.name', 'en', 'Trigger Name', 'admin'),
  (NULL, 'emails.triggers.name', 'he', 'שם טריגר', 'admin'),
  (NULL, 'emails.triggers.event', 'en', 'Trigger Event', 'admin'),
  (NULL, 'emails.triggers.event', 'he', 'אירוע מפעיל', 'admin'),
  (NULL, 'emails.triggers.template', 'en', 'Email Template', 'admin'),
  (NULL, 'emails.triggers.template', 'he', 'תבנית אימייל', 'admin'),
  (NULL, 'emails.triggers.conditions', 'en', 'Conditions', 'admin'),
  (NULL, 'emails.triggers.conditions', 'he', 'תנאים', 'admin'),
  (NULL, 'emails.triggers.delay', 'en', 'Delay (minutes)', 'admin'),
  (NULL, 'emails.triggers.delay', 'he', 'עיכוב (דקות)', 'admin'),
  (NULL, 'emails.triggers.send_time', 'en', 'Send Time', 'admin'),
  (NULL, 'emails.triggers.send_time', 'he', 'זמן שליחה', 'admin'),

  -- Trigger Events
  (NULL, 'emails.event.enrollment_created', 'en', 'Enrollment Created', 'admin'),
  (NULL, 'emails.event.enrollment_created', 'he', 'הרשמה נוצרה', 'admin'),
  (NULL, 'emails.event.payment_completed', 'en', 'Payment Completed', 'admin'),
  (NULL, 'emails.event.payment_completed', 'he', 'תשלום הושלם', 'admin'),
  (NULL, 'emails.event.payment_failed', 'en', 'Payment Failed', 'admin'),
  (NULL, 'emails.event.payment_failed', 'he', 'תשלום נכשל', 'admin'),
  (NULL, 'emails.event.payment_upcoming', 'en', 'Payment Upcoming', 'admin'),
  (NULL, 'emails.event.payment_upcoming', 'he', 'תשלום מתקרב', 'admin'),
  (NULL, 'emails.event.lesson_reminder', 'en', 'Lesson Reminder', 'admin'),
  (NULL, 'emails.event.lesson_reminder', 'he', 'תזכורת לשיעור', 'admin'),
  (NULL, 'emails.event.lesson_cancelled', 'en', 'Lesson Cancelled', 'admin'),
  (NULL, 'emails.event.lesson_cancelled', 'he', 'שיעור בוטל', 'admin'),
  (NULL, 'emails.event.course_completed', 'en', 'Course Completed', 'admin'),
  (NULL, 'emails.event.course_completed', 'he', 'קורס הושלם', 'admin'),

  -- ============================================================================
  -- Email Schedules (Campaigns)
  -- ============================================================================
  (NULL, 'emails.schedules.title', 'en', 'Email Schedules', 'admin'),
  (NULL, 'emails.schedules.title', 'he', 'תזמון אימיילים', 'admin'),
  (NULL, 'emails.schedules.create', 'en', 'Create Schedule', 'admin'),
  (NULL, 'emails.schedules.create', 'he', 'יצירת תזמון', 'admin'),
  (NULL, 'emails.schedules.edit', 'en', 'Edit Schedule', 'admin'),
  (NULL, 'emails.schedules.edit', 'he', 'עריכת תזמון', 'admin'),
  (NULL, 'emails.schedules.delete', 'en', 'Delete Schedule', 'admin'),
  (NULL, 'emails.schedules.delete', 'he', 'מחיקת תזמון', 'admin'),
  (NULL, 'emails.schedules.name', 'en', 'Schedule Name', 'admin'),
  (NULL, 'emails.schedules.name', 'he', 'שם תזמון', 'admin'),
  (NULL, 'emails.schedules.recipients', 'en', 'Recipients', 'admin'),
  (NULL, 'emails.schedules.recipients', 'he', 'נמענים', 'admin'),
  (NULL, 'emails.schedules.filter', 'en', 'Recipient Filter', 'admin'),
  (NULL, 'emails.schedules.filter', 'he', 'סינון נמענים', 'admin'),
  (NULL, 'emails.schedules.scheduled_for', 'en', 'Scheduled For', 'admin'),
  (NULL, 'emails.schedules.scheduled_for', 'he', 'מתוזמן ל', 'admin'),
  (NULL, 'emails.schedules.recurrence', 'en', 'Recurrence', 'admin'),
  (NULL, 'emails.schedules.recurrence', 'he', 'חזרה', 'admin'),
  (NULL, 'emails.schedules.last_run', 'en', 'Last Run', 'admin'),
  (NULL, 'emails.schedules.last_run', 'he', 'הרצה אחרונה', 'admin'),
  (NULL, 'emails.schedules.next_run', 'en', 'Next Run', 'admin'),
  (NULL, 'emails.schedules.next_run', 'he', 'הרצה הבאה', 'admin'),
  (NULL, 'emails.schedules.emails_sent', 'en', 'Emails Sent', 'admin'),
  (NULL, 'emails.schedules.emails_sent', 'he', 'אימיילים שנשלחו', 'admin'),

  -- ============================================================================
  -- Email Settings
  -- ============================================================================
  (NULL, 'emails.settings.title', 'en', 'Email Settings', 'admin'),
  (NULL, 'emails.settings.title', 'he', 'הגדרות אימייל', 'admin'),
  (NULL, 'emails.settings.smtp', 'en', 'SMTP Configuration', 'admin'),
  (NULL, 'emails.settings.smtp', 'he', 'הגדרות SMTP', 'admin'),
  (NULL, 'emails.settings.smtp_host', 'en', 'SMTP Host', 'admin'),
  (NULL, 'emails.settings.smtp_host', 'he', 'שרת SMTP', 'admin'),
  (NULL, 'emails.settings.smtp_port', 'en', 'SMTP Port', 'admin'),
  (NULL, 'emails.settings.smtp_port', 'he', 'פורט SMTP', 'admin'),
  (NULL, 'emails.settings.smtp_user', 'en', 'SMTP Username', 'admin'),
  (NULL, 'emails.settings.smtp_user', 'he', 'שם משתמש SMTP', 'admin'),
  (NULL, 'emails.settings.smtp_password', 'en', 'SMTP Password', 'admin'),
  (NULL, 'emails.settings.smtp_password', 'he', 'סיסמת SMTP', 'admin'),
  (NULL, 'emails.settings.smtp_from', 'en', 'From Email', 'admin'),
  (NULL, 'emails.settings.smtp_from', 'he', 'כתובת שולח', 'admin'),
  (NULL, 'emails.settings.smtp_secure', 'en', 'Use SSL/TLS', 'admin'),
  (NULL, 'emails.settings.smtp_secure', 'he', 'שימוש ב-SSL/TLS', 'admin'),
  (NULL, 'emails.settings.test_connection', 'en', 'Test Connection', 'admin'),
  (NULL, 'emails.settings.test_connection', 'he', 'בדיקת חיבור', 'admin'),
  (NULL, 'emails.settings.tracking_enabled', 'en', 'Enable Tracking', 'admin'),
  (NULL, 'emails.settings.tracking_enabled', 'he', 'הפעלת מעקב', 'admin'),
  (NULL, 'emails.settings.rate_limit', 'en', 'Rate Limit (per hour)', 'admin'),
  (NULL, 'emails.settings.rate_limit', 'he', 'הגבלת קצב (לשעה)', 'admin'),

  -- ============================================================================
  -- Email Composer / Send
  -- ============================================================================
  (NULL, 'emails.send.title', 'en', 'Send Email', 'admin'),
  (NULL, 'emails.send.title', 'he', 'שליחת אימייל', 'admin'),
  (NULL, 'emails.send.to', 'en', 'To', 'admin'),
  (NULL, 'emails.send.to', 'he', 'אל', 'admin'),
  (NULL, 'emails.send.cc', 'en', 'CC', 'admin'),
  (NULL, 'emails.send.cc', 'he', 'עותק', 'admin'),
  (NULL, 'emails.send.bcc', 'en', 'BCC', 'admin'),
  (NULL, 'emails.send.bcc', 'he', 'עותק סמוי', 'admin'),
  (NULL, 'emails.send.select_template', 'en', 'Select Template', 'admin'),
  (NULL, 'emails.send.select_template', 'he', 'בחר תבנית', 'admin'),
  (NULL, 'emails.send.language', 'en', 'Language', 'admin'),
  (NULL, 'emails.send.language', 'he', 'שפה', 'admin'),
  (NULL, 'emails.send.schedule', 'en', 'Schedule Send', 'admin'),
  (NULL, 'emails.send.schedule', 'he', 'תזמון שליחה', 'admin'),
  (NULL, 'emails.send.send_now', 'en', 'Send Now', 'admin'),
  (NULL, 'emails.send.send_now', 'he', 'שלח עכשיו', 'admin'),
  (NULL, 'emails.send.send_later', 'en', 'Send Later', 'admin'),
  (NULL, 'emails.send.send_later', 'he', 'שלח מאוחר יותר', 'admin'),

  -- ============================================================================
  -- Common Actions & Messages
  -- ============================================================================
  (NULL, 'emails.action.save', 'en', 'Save', 'admin'),
  (NULL, 'emails.action.save', 'he', 'שמור', 'admin'),
  (NULL, 'emails.action.cancel', 'en', 'Cancel', 'admin'),
  (NULL, 'emails.action.cancel', 'he', 'ביטול', 'admin'),
  (NULL, 'emails.action.send', 'en', 'Send', 'admin'),
  (NULL, 'emails.action.send', 'he', 'שלח', 'admin'),
  (NULL, 'emails.action.test', 'en', 'Send Test', 'admin'),
  (NULL, 'emails.action.test', 'he', 'שלח בדיקה', 'admin'),
  (NULL, 'emails.action.preview', 'en', 'Preview', 'admin'),
  (NULL, 'emails.action.preview', 'he', 'תצוגה מקדימה', 'admin'),
  (NULL, 'emails.action.activate', 'en', 'Activate', 'admin'),
  (NULL, 'emails.action.activate', 'he', 'הפעל', 'admin'),
  (NULL, 'emails.action.deactivate', 'en', 'Deactivate', 'admin'),
  (NULL, 'emails.action.deactivate', 'he', 'השבת', 'admin'),

  -- Success Messages
  (NULL, 'emails.message.template_created', 'en', 'Template created successfully', 'admin'),
  (NULL, 'emails.message.template_created', 'he', 'תבנית נוצרה בהצלחה', 'admin'),
  (NULL, 'emails.message.template_updated', 'en', 'Template updated successfully', 'admin'),
  (NULL, 'emails.message.template_updated', 'he', 'תבנית עודכנה בהצלחה', 'admin'),
  (NULL, 'emails.message.template_deleted', 'en', 'Template deleted successfully', 'admin'),
  (NULL, 'emails.message.template_deleted', 'he', 'תבנית נמחקה בהצלחה', 'admin'),
  (NULL, 'emails.message.email_sent', 'en', 'Email sent successfully', 'admin'),
  (NULL, 'emails.message.email_sent', 'he', 'אימייל נשלח בהצלחה', 'admin'),
  (NULL, 'emails.message.email_scheduled', 'en', 'Email scheduled successfully', 'admin'),
  (NULL, 'emails.message.email_scheduled', 'he', 'אימייל תוזמן בהצלחה', 'admin'),
  (NULL, 'emails.message.trigger_created', 'en', 'Trigger created successfully', 'admin'),
  (NULL, 'emails.message.trigger_created', 'he', 'טריגר נוצר בהצלחה', 'admin'),
  (NULL, 'emails.message.connection_verified', 'en', 'SMTP connection verified', 'admin'),
  (NULL, 'emails.message.connection_verified', 'he', 'חיבור SMTP אומת בהצלחה', 'admin'),

  -- Error Messages
  (NULL, 'emails.error.template_not_found', 'en', 'Template not found', 'admin'),
  (NULL, 'emails.error.template_not_found', 'he', 'תבנית לא נמצאה', 'admin'),
  (NULL, 'emails.error.send_failed', 'en', 'Failed to send email', 'admin'),
  (NULL, 'emails.error.send_failed', 'he', 'שליחת אימייל נכשלה', 'admin'),
  (NULL, 'emails.error.smtp_not_configured', 'en', 'SMTP not configured', 'admin'),
  (NULL, 'emails.error.smtp_not_configured', 'he', 'SMTP לא מוגדר', 'admin'),
  (NULL, 'emails.error.connection_failed', 'en', 'Connection test failed', 'admin'),
  (NULL, 'emails.error.connection_failed', 'he', 'בדיקת חיבור נכשלה', 'admin'),
  (NULL, 'emails.error.invalid_recipient', 'en', 'Invalid recipient email', 'admin'),
  (NULL, 'emails.error.invalid_recipient', 'he', 'כתובת אימייל נמען לא תקינה', 'admin');

END $$;

-- ============================================================================
-- Summary
-- ============================================================================
-- Total translation keys: ~140
-- Languages: English (en) and Hebrew (he)
-- Covers: Dashboard, Templates, Queue, Analytics, Triggers, Schedules, Settings, Actions, Messages
-- ============================================================================
