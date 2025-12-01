-- ============================================================================
-- Email System Translations
-- Comprehensive translation keys for the email management system
-- Languages: English (en) and Hebrew (he)
-- ============================================================================

-- Insert translations with proper conflict handling
INSERT INTO translations (translation_key, language_code, translation_value, context) VALUES

-- ============================================================================
-- Email Dashboard
-- ============================================================================
('emails.dashboard.title', 'en', 'Email Dashboard', 'admin'),
('emails.dashboard.title', 'he', 'לוח בקרה - אימיילים', 'admin'),
('emails.dashboard.overview', 'en', 'Overview', 'admin'),
('emails.dashboard.overview', 'he', 'סקירה כללית', 'admin'),
('emails.dashboard.stats.sent', 'en', 'Emails Sent', 'admin'),
('emails.dashboard.stats.sent', 'he', 'אימיילים שנשלחו', 'admin'),
('emails.dashboard.stats.delivered', 'en', 'Delivered', 'admin'),
('emails.dashboard.stats.delivered', 'he', 'נמסרו בהצלחה', 'admin'),
('emails.dashboard.stats.opened', 'en', 'Opened', 'admin'),
('emails.dashboard.stats.opened', 'he', 'נפתחו', 'admin'),
('emails.dashboard.stats.clicked', 'en', 'Clicked', 'admin'),
('emails.dashboard.stats.clicked', 'he', 'נלחצו', 'admin'),
('emails.dashboard.stats.failed', 'en', 'Failed', 'admin'),
('emails.dashboard.stats.failed', 'he', 'נכשלו', 'admin'),
('emails.dashboard.stats.pending', 'en', 'Pending', 'admin'),
('emails.dashboard.stats.pending', 'he', 'ממתינים', 'admin'),
('emails.dashboard.open_rate', 'en', 'Open Rate', 'admin'),
('emails.dashboard.open_rate', 'he', 'שיעור פתיחה', 'admin'),
('emails.dashboard.click_rate', 'en', 'Click Rate', 'admin'),
('emails.dashboard.click_rate', 'he', 'שיעור הקלקה', 'admin'),
('emails.dashboard.delivery_rate', 'en', 'Delivery Rate', 'admin'),
('emails.dashboard.delivery_rate', 'he', 'שיעור מסירה', 'admin'),

-- ============================================================================
-- Email Templates
-- ============================================================================
('emails.templates.title', 'en', 'Email Templates', 'admin'),
('emails.templates.title', 'he', 'תבניות אימייל', 'admin'),
('emails.templates.create', 'en', 'Create Template', 'admin'),
('emails.templates.create', 'he', 'יצירת תבנית', 'admin'),
('emails.templates.edit', 'en', 'Edit Template', 'admin'),
('emails.templates.edit', 'he', 'עריכת תבנית', 'admin'),
('emails.templates.delete', 'en', 'Delete Template', 'admin'),
('emails.templates.delete', 'he', 'מחיקת תבנית', 'admin'),
('emails.templates.duplicate', 'en', 'Duplicate Template', 'admin'),
('emails.templates.duplicate', 'he', 'שכפול תבנית', 'admin'),
('emails.templates.preview', 'en', 'Preview', 'admin'),
('emails.templates.preview', 'he', 'תצוגה מקדימה', 'admin'),
('emails.templates.key', 'en', 'Template Key', 'admin'),
('emails.templates.key', 'he', 'מפתח תבנית', 'admin'),
('emails.templates.name', 'en', 'Template Name', 'admin'),
('emails.templates.name', 'he', 'שם תבנית', 'admin'),
('emails.templates.category', 'en', 'Category', 'admin'),
('emails.templates.category', 'he', 'קטגוריה', 'admin'),
('emails.templates.description', 'en', 'Description', 'admin'),
('emails.templates.description', 'he', 'תיאור', 'admin'),
('emails.templates.subject', 'en', 'Subject', 'admin'),
('emails.templates.subject', 'he', 'נושא', 'admin'),
('emails.templates.body', 'en', 'Email Body', 'admin'),
('emails.templates.body', 'he', 'גוף האימייל', 'admin'),
('emails.templates.variables', 'en', 'Variables', 'admin'),
('emails.templates.variables', 'he', 'משתנים', 'admin'),
('emails.templates.is_active', 'en', 'Active', 'admin'),
('emails.templates.is_active', 'he', 'פעיל', 'admin'),
('emails.templates.is_system', 'en', 'System Template', 'admin'),
('emails.templates.is_system', 'he', 'תבנית מערכת', 'admin'),
('emails.templates.custom_styles', 'en', 'Custom Styles', 'admin'),
('emails.templates.custom_styles', 'he', 'עיצוב מותאם', 'admin'),
('emails.templates.version', 'en', 'Version', 'admin'),
('emails.templates.version', 'he', 'גרסה', 'admin'),

-- Template Categories
('emails.category.enrollment', 'en', 'Enrollment', 'admin'),
('emails.category.enrollment', 'he', 'הרשמה', 'admin'),
('emails.category.payment', 'en', 'Payment', 'admin'),
('emails.category.payment', 'he', 'תשלום', 'admin'),
('emails.category.lesson', 'en', 'Lesson', 'admin'),
('emails.category.lesson', 'he', 'שיעור', 'admin'),
('emails.category.parent', 'en', 'Parent Communication', 'admin'),
('emails.category.parent', 'he', 'תקשורת הורים', 'admin'),
('emails.category.system', 'en', 'System', 'admin'),
('emails.category.system', 'he', 'מערכת', 'admin'),

-- ============================================================================
-- Email Queue
-- ============================================================================
('emails.queue.title', 'en', 'Email Queue', 'admin'),
('emails.queue.title', 'he', 'תור אימיילים', 'admin'),
('emails.queue.view', 'en', 'View Queue', 'admin'),
('emails.queue.view', 'he', 'צפייה בתור', 'admin'),
('emails.queue.retry', 'en', 'Retry', 'admin'),
('emails.queue.retry', 'he', 'נסה שוב', 'admin'),
('emails.queue.cancel', 'en', 'Cancel', 'admin'),
('emails.queue.cancel', 'he', 'ביטול', 'admin'),
('emails.queue.recipient', 'en', 'Recipient', 'admin'),
('emails.queue.recipient', 'he', 'נמען', 'admin'),
('emails.queue.status', 'en', 'Status', 'admin'),
('emails.queue.status', 'he', 'סטטוס', 'admin'),
('emails.queue.priority', 'en', 'Priority', 'admin'),
('emails.queue.priority', 'he', 'עדיפות', 'admin'),
('emails.queue.scheduled_for', 'en', 'Scheduled For', 'admin'),
('emails.queue.scheduled_for', 'he', 'מתוזמן ל', 'admin'),
('emails.queue.sent_at', 'en', 'Sent At', 'admin'),
('emails.queue.sent_at', 'he', 'נשלח ב', 'admin'),
('emails.queue.attempts', 'en', 'Attempts', 'admin'),
('emails.queue.attempts', 'he', 'ניסיונות', 'admin'),

-- Queue Status
('emails.status.pending', 'en', 'Pending', 'admin'),
('emails.status.pending', 'he', 'ממתין', 'admin'),
('emails.status.processing', 'en', 'Processing', 'admin'),
('emails.status.processing', 'he', 'מעבד', 'admin'),
('emails.status.sent', 'en', 'Sent', 'admin'),
('emails.status.sent', 'he', 'נשלח', 'admin'),
('emails.status.failed', 'en', 'Failed', 'admin'),
('emails.status.failed', 'he', 'נכשל', 'admin'),
('emails.status.cancelled', 'en', 'Cancelled', 'admin'),
('emails.status.cancelled', 'he', 'בוטל', 'admin'),
('emails.status.expired', 'en', 'Expired', 'admin'),
('emails.status.expired', 'he', 'פג תוקף', 'admin'),

-- Priority Levels
('emails.priority.urgent', 'en', 'Urgent', 'admin'),
('emails.priority.urgent', 'he', 'דחוף', 'admin'),
('emails.priority.high', 'en', 'High', 'admin'),
('emails.priority.high', 'he', 'גבוה', 'admin'),
('emails.priority.normal', 'en', 'Normal', 'admin'),
('emails.priority.normal', 'he', 'רגיל', 'admin'),
('emails.priority.low', 'en', 'Low', 'admin'),
('emails.priority.low', 'he', 'נמוך', 'admin'),

-- ============================================================================
-- Email Analytics
-- ============================================================================
('emails.analytics.title', 'en', 'Email Analytics', 'admin'),
('emails.analytics.title', 'he', 'ניתוח אימיילים', 'admin'),
('emails.analytics.performance', 'en', 'Performance', 'admin'),
('emails.analytics.performance', 'he', 'ביצועים', 'admin'),
('emails.analytics.engagement', 'en', 'Engagement', 'admin'),
('emails.analytics.engagement', 'he', 'מעורבות', 'admin'),
('emails.analytics.template_stats', 'en', 'Template Statistics', 'admin'),
('emails.analytics.template_stats', 'he', 'סטטיסטיקות תבניות', 'admin'),
('emails.analytics.opens', 'en', 'Opens', 'admin'),
('emails.analytics.opens', 'he', 'פתיחות', 'admin'),
('emails.analytics.clicks', 'en', 'Clicks', 'admin'),
('emails.analytics.clicks', 'he', 'הקלקות', 'admin'),
('emails.analytics.bounces', 'en', 'Bounces', 'admin'),
('emails.analytics.bounces', 'he', 'החזרות', 'admin'),
('emails.analytics.first_opened', 'en', 'First Opened', 'admin'),
('emails.analytics.first_opened', 'he', 'נפתח לראשונה', 'admin'),
('emails.analytics.last_opened', 'en', 'Last Opened', 'admin'),
('emails.analytics.last_opened', 'he', 'נפתח לאחרונה', 'admin'),
('emails.analytics.device_type', 'en', 'Device Type', 'admin'),
('emails.analytics.device_type', 'he', 'סוג מכשיר', 'admin'),
('emails.analytics.bounce_hard', 'en', 'Hard Bounce', 'admin'),
('emails.analytics.bounce_hard', 'he', 'החזרה קבועה', 'admin'),
('emails.analytics.bounce_soft', 'en', 'Soft Bounce', 'admin'),
('emails.analytics.bounce_soft', 'he', 'החזרה זמנית', 'admin'),

-- ============================================================================
-- Email Triggers
-- ============================================================================
('emails.triggers.title', 'en', 'Email Triggers', 'admin'),
('emails.triggers.title', 'he', 'טריגרים לאימייל', 'admin'),
('emails.triggers.create', 'en', 'Create Trigger', 'admin'),
('emails.triggers.create', 'he', 'יצירת טריגר', 'admin'),
('emails.triggers.edit', 'en', 'Edit Trigger', 'admin'),
('emails.triggers.edit', 'he', 'עריכת טריגר', 'admin'),
('emails.triggers.delete', 'en', 'Delete Trigger', 'admin'),
('emails.triggers.delete', 'he', 'מחיקת טריגר', 'admin'),
('emails.triggers.name', 'en', 'Trigger Name', 'admin'),
('emails.triggers.name', 'he', 'שם טריגר', 'admin'),
('emails.triggers.event', 'en', 'Trigger Event', 'admin'),
('emails.triggers.event', 'he', 'אירוע מפעיל', 'admin'),
('emails.triggers.template', 'en', 'Email Template', 'admin'),
('emails.triggers.template', 'he', 'תבנית אימייל', 'admin'),
('emails.triggers.conditions', 'en', 'Conditions', 'admin'),
('emails.triggers.conditions', 'he', 'תנאים', 'admin'),
('emails.triggers.delay', 'en', 'Delay (minutes)', 'admin'),
('emails.triggers.delay', 'he', 'עיכוב (דקות)', 'admin'),
('emails.triggers.send_time', 'en', 'Send Time', 'admin'),
('emails.triggers.send_time', 'he', 'זמן שליחה', 'admin'),

-- Trigger Events
('emails.event.enrollment_created', 'en', 'Enrollment Created', 'admin'),
('emails.event.enrollment_created', 'he', 'הרשמה נוצרה', 'admin'),
('emails.event.payment_completed', 'en', 'Payment Completed', 'admin'),
('emails.event.payment_completed', 'he', 'תשלום הושלם', 'admin'),
('emails.event.payment_failed', 'en', 'Payment Failed', 'admin'),
('emails.event.payment_failed', 'he', 'תשלום נכשל', 'admin'),
('emails.event.payment_upcoming', 'en', 'Payment Upcoming', 'admin'),
('emails.event.payment_upcoming', 'he', 'תשלום מתקרב', 'admin'),
('emails.event.lesson_reminder', 'en', 'Lesson Reminder', 'admin'),
('emails.event.lesson_reminder', 'he', 'תזכורת לשיעור', 'admin'),
('emails.event.lesson_cancelled', 'en', 'Lesson Cancelled', 'admin'),
('emails.event.lesson_cancelled', 'he', 'שיעור בוטל', 'admin'),
('emails.event.course_completed', 'en', 'Course Completed', 'admin'),
('emails.event.course_completed', 'he', 'קורס הושלם', 'admin'),

-- ============================================================================
-- Email Schedules (Campaigns)
-- ============================================================================
('emails.schedules.title', 'en', 'Email Schedules', 'admin'),
('emails.schedules.title', 'he', 'תזמון אימיילים', 'admin'),
('emails.schedules.create', 'en', 'Create Schedule', 'admin'),
('emails.schedules.create', 'he', 'יצירת תזמון', 'admin'),
('emails.schedules.edit', 'en', 'Edit Schedule', 'admin'),
('emails.schedules.edit', 'he', 'עריכת תזמון', 'admin'),
('emails.schedules.delete', 'en', 'Delete Schedule', 'admin'),
('emails.schedules.delete', 'he', 'מחיקת תזמון', 'admin'),
('emails.schedules.name', 'en', 'Schedule Name', 'admin'),
('emails.schedules.name', 'he', 'שם תזמון', 'admin'),
('emails.schedules.recipients', 'en', 'Recipients', 'admin'),
('emails.schedules.recipients', 'he', 'נמענים', 'admin'),
('emails.schedules.filter', 'en', 'Recipient Filter', 'admin'),
('emails.schedules.filter', 'he', 'סינון נמענים', 'admin'),
('emails.schedules.scheduled_for', 'en', 'Scheduled For', 'admin'),
('emails.schedules.scheduled_for', 'he', 'מתוזמן ל', 'admin'),
('emails.schedules.recurrence', 'en', 'Recurrence', 'admin'),
('emails.schedules.recurrence', 'he', 'חזרה', 'admin'),
('emails.schedules.last_run', 'en', 'Last Run', 'admin'),
('emails.schedules.last_run', 'he', 'הרצה אחרונה', 'admin'),
('emails.schedules.next_run', 'en', 'Next Run', 'admin'),
('emails.schedules.next_run', 'he', 'הרצה הבאה', 'admin'),
('emails.schedules.emails_sent', 'en', 'Emails Sent', 'admin'),
('emails.schedules.emails_sent', 'he', 'אימיילים שנשלחו', 'admin'),

-- ============================================================================
-- Email Settings
-- ============================================================================
('emails.settings.title', 'en', 'Email Settings', 'admin'),
('emails.settings.title', 'he', 'הגדרות אימייל', 'admin'),
('emails.settings.smtp', 'en', 'SMTP Configuration', 'admin'),
('emails.settings.smtp', 'he', 'הגדרות SMTP', 'admin'),
('emails.settings.smtp_host', 'en', 'SMTP Host', 'admin'),
('emails.settings.smtp_host', 'he', 'שרת SMTP', 'admin'),
('emails.settings.smtp_port', 'en', 'SMTP Port', 'admin'),
('emails.settings.smtp_port', 'he', 'פורט SMTP', 'admin'),
('emails.settings.smtp_user', 'en', 'SMTP Username', 'admin'),
('emails.settings.smtp_user', 'he', 'שם משתמש SMTP', 'admin'),
('emails.settings.smtp_password', 'en', 'SMTP Password', 'admin'),
('emails.settings.smtp_password', 'he', 'סיסמת SMTP', 'admin'),
('emails.settings.smtp_from', 'en', 'From Email', 'admin'),
('emails.settings.smtp_from', 'he', 'כתובת שולח', 'admin'),
('emails.settings.smtp_secure', 'en', 'Use SSL/TLS', 'admin'),
('emails.settings.smtp_secure', 'he', 'שימוש ב-SSL/TLS', 'admin'),
('emails.settings.test_connection', 'en', 'Test Connection', 'admin'),
('emails.settings.test_connection', 'he', 'בדיקת חיבור', 'admin'),
('emails.settings.tracking_enabled', 'en', 'Enable Tracking', 'admin'),
('emails.settings.tracking_enabled', 'he', 'הפעלת מעקב', 'admin'),
('emails.settings.rate_limit', 'en', 'Rate Limit (per hour)', 'admin'),
('emails.settings.rate_limit', 'he', 'הגבלת קצב (לשעה)', 'admin'),

-- ============================================================================
-- Email Composer / Send
-- ============================================================================
('emails.send.title', 'en', 'Send Email', 'admin'),
('emails.send.title', 'he', 'שליחת אימייל', 'admin'),
('emails.send.to', 'en', 'To', 'admin'),
('emails.send.to', 'he', 'אל', 'admin'),
('emails.send.cc', 'en', 'CC', 'admin'),
('emails.send.cc', 'he', 'עותק', 'admin'),
('emails.send.bcc', 'en', 'BCC', 'admin'),
('emails.send.bcc', 'he', 'עותק סמוי', 'admin'),
('emails.send.select_template', 'en', 'Select Template', 'admin'),
('emails.send.select_template', 'he', 'בחר תבנית', 'admin'),
('emails.send.language', 'en', 'Language', 'admin'),
('emails.send.language', 'he', 'שפה', 'admin'),
('emails.send.schedule', 'en', 'Schedule Send', 'admin'),
('emails.send.schedule', 'he', 'תזמון שליחה', 'admin'),
('emails.send.send_now', 'en', 'Send Now', 'admin'),
('emails.send.send_now', 'he', 'שלח עכשיו', 'admin'),
('emails.send.send_later', 'en', 'Send Later', 'admin'),
('emails.send.send_later', 'he', 'שלח מאוחר יותר', 'admin'),

-- ============================================================================
-- Common Actions & Messages
-- ============================================================================
('emails.action.save', 'en', 'Save', 'admin'),
('emails.action.save', 'he', 'שמור', 'admin'),
('emails.action.cancel', 'en', 'Cancel', 'admin'),
('emails.action.cancel', 'he', 'ביטול', 'admin'),
('emails.action.send', 'en', 'Send', 'admin'),
('emails.action.send', 'he', 'שלח', 'admin'),
('emails.action.test', 'en', 'Send Test', 'admin'),
('emails.action.test', 'he', 'שלח בדיקה', 'admin'),
('emails.action.preview', 'en', 'Preview', 'admin'),
('emails.action.preview', 'he', 'תצוגה מקדימה', 'admin'),
('emails.action.activate', 'en', 'Activate', 'admin'),
('emails.action.activate', 'he', 'הפעל', 'admin'),
('emails.action.deactivate', 'en', 'Deactivate', 'admin'),
('emails.action.deactivate', 'he', 'השבת', 'admin'),

-- Success Messages
('emails.message.template_created', 'en', 'Template created successfully', 'admin'),
('emails.message.template_created', 'he', 'תבנית נוצרה בהצלחה', 'admin'),
('emails.message.template_updated', 'en', 'Template updated successfully', 'admin'),
('emails.message.template_updated', 'he', 'תבנית עודכנה בהצלחה', 'admin'),
('emails.message.template_deleted', 'en', 'Template deleted successfully', 'admin'),
('emails.message.template_deleted', 'he', 'תבנית נמחקה בהצלחה', 'admin'),
('emails.message.email_sent', 'en', 'Email sent successfully', 'admin'),
('emails.message.email_sent', 'he', 'אימייל נשלח בהצלחה', 'admin'),
('emails.message.email_scheduled', 'en', 'Email scheduled successfully', 'admin'),
('emails.message.email_scheduled', 'he', 'אימייל תוזמן בהצלחה', 'admin'),
('emails.message.trigger_created', 'en', 'Trigger created successfully', 'admin'),
('emails.message.trigger_created', 'he', 'טריגר נוצר בהצלחה', 'admin'),
('emails.message.connection_verified', 'en', 'SMTP connection verified', 'admin'),
('emails.message.connection_verified', 'he', 'חיבור SMTP אומת בהצלחה', 'admin'),

-- Error Messages
('emails.error.template_not_found', 'en', 'Template not found', 'admin'),
('emails.error.template_not_found', 'he', 'תבנית לא נמצאה', 'admin'),
('emails.error.send_failed', 'en', 'Failed to send email', 'admin'),
('emails.error.send_failed', 'he', 'שליחת אימייל נכשלה', 'admin'),
('emails.error.smtp_not_configured', 'en', 'SMTP not configured', 'admin'),
('emails.error.smtp_not_configured', 'he', 'SMTP לא מוגדר', 'admin'),
('emails.error.connection_failed', 'en', 'Connection test failed', 'admin'),
('emails.error.connection_failed', 'he', 'בדיקת חיבור נכשלה', 'admin'),
('emails.error.invalid_recipient', 'en', 'Invalid recipient email', 'admin'),
('emails.error.invalid_recipient', 'he', 'כתובת אימייל נמען לא תקינה', 'admin')

ON CONFLICT (translation_key, language_code) DO UPDATE
SET
  translation_value = EXCLUDED.translation_value,
  context = EXCLUDED.context,
  updated_at = now();

-- ============================================================================
-- Summary
-- ============================================================================
-- Total translation keys: ~140
-- Languages: English (en) and Hebrew (he)
-- Covers: Dashboard, Templates, Queue, Analytics, Triggers, Schedules, Settings, Actions, Messages
-- ============================================================================
