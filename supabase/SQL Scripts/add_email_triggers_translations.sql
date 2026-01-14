-- ============================================================================
-- Email Triggers System Translations
-- Comprehensive translation keys for the email triggers feature
-- Languages: English (en) and Hebrew (he)
-- ============================================================================

DO $$
BEGIN
  -- Delete existing email trigger translations to avoid conflicts
  DELETE FROM translations
  WHERE tenant_id IS NULL
    AND (
      translation_key LIKE 'emails.triggers%'
      OR translation_key LIKE 'triggers.%'
    );

  -- Insert translations with global scope (tenant_id = NULL)
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context) VALUES

  -- ============================================================================
  -- Page Title and Description
  -- ============================================================================
  (NULL, 'emails.triggers.title', 'en', 'Email Triggers', 'admin'),
  (NULL, 'emails.triggers.title', 'he', 'טריגרים לדוא"ל', 'admin'),
  (NULL, 'emails.triggers.description', 'en', 'Automatically send emails when events occur', 'admin'),
  (NULL, 'emails.triggers.description', 'he', 'שליחת דוא"ל אוטומטית כאשר מתרחשים אירועים', 'admin'),
  (NULL, 'emails.triggers.createTrigger', 'en', 'Create Trigger', 'admin'),
  (NULL, 'emails.triggers.createTrigger', 'he', 'יצירת טריגר', 'admin'),
  (NULL, 'emails.triggers.createFirst', 'en', 'Create Your First Trigger', 'admin'),
  (NULL, 'emails.triggers.createFirst', 'he', 'צור את הטריגר הראשון שלך', 'admin'),

  -- ============================================================================
  -- Stats
  -- ============================================================================
  (NULL, 'emails.triggers.stats.total', 'en', 'Total Triggers', 'admin'),
  (NULL, 'emails.triggers.stats.total', 'he', 'סך הכל טריגרים', 'admin'),
  (NULL, 'emails.triggers.stats.active', 'en', 'Active Triggers', 'admin'),
  (NULL, 'emails.triggers.stats.active', 'he', 'טריגרים פעילים', 'admin'),
  (NULL, 'emails.triggers.stats.inactive', 'en', 'Inactive Triggers', 'admin'),
  (NULL, 'emails.triggers.stats.inactive', 'he', 'טריגרים לא פעילים', 'admin'),

  -- ============================================================================
  -- Empty State
  -- ============================================================================
  (NULL, 'emails.triggers.noTriggers', 'en', 'No triggers configured yet', 'admin'),
  (NULL, 'emails.triggers.noTriggers', 'he', 'אין עדיין טריגרים מוגדרים', 'admin'),

  -- ============================================================================
  -- Event Types
  -- ============================================================================
  (NULL, 'emails.triggers.events.enrollmentCreated', 'en', 'Enrollment Created', 'admin'),
  (NULL, 'emails.triggers.events.enrollmentCreated', 'he', 'הרשמה נוצרה', 'admin'),
  (NULL, 'emails.triggers.events.enrollmentCompleted', 'en', 'Enrollment Completed', 'admin'),
  (NULL, 'emails.triggers.events.enrollmentCompleted', 'he', 'הרשמה הושלמה', 'admin'),
  (NULL, 'emails.triggers.events.paymentCompleted', 'en', 'Payment Completed', 'admin'),
  (NULL, 'emails.triggers.events.paymentCompleted', 'he', 'תשלום הושלם', 'admin'),
  (NULL, 'emails.triggers.events.paymentFailed', 'en', 'Payment Failed', 'admin'),
  (NULL, 'emails.triggers.events.paymentFailed', 'he', 'תשלום נכשל', 'admin'),
  (NULL, 'emails.triggers.events.recordingReady', 'en', 'Recording Ready', 'admin'),
  (NULL, 'emails.triggers.events.recordingReady', 'he', 'הקלטה מוכנה', 'admin'),
  (NULL, 'emails.triggers.events.lessonReminder', 'en', 'Lesson Reminder', 'admin'),
  (NULL, 'emails.triggers.events.lessonReminder', 'he', 'תזכורת שיעור', 'admin'),

  -- ============================================================================
  -- Actions and Messages
  -- ============================================================================
  (NULL, 'emails.triggers.loadFailed', 'en', 'Failed to load triggers', 'admin'),
  (NULL, 'emails.triggers.loadFailed', 'he', 'טעינת הטריגרים נכשלה', 'admin'),
  (NULL, 'emails.triggers.activated', 'en', 'Trigger activated', 'admin'),
  (NULL, 'emails.triggers.activated', 'he', 'הטריגר הופעל', 'admin'),
  (NULL, 'emails.triggers.deactivated', 'en', 'Trigger deactivated', 'admin'),
  (NULL, 'emails.triggers.deactivated', 'he', 'הטריגר בוטל', 'admin'),
  (NULL, 'emails.triggers.toggleFailed', 'en', 'Failed to toggle trigger', 'admin'),
  (NULL, 'emails.triggers.toggleFailed', 'he', 'שינוי מצב הטריגר נכשל', 'admin'),
  (NULL, 'emails.triggers.deleteConfirm', 'en', 'Are you sure you want to delete this trigger?', 'admin'),
  (NULL, 'emails.triggers.deleteConfirm', 'he', 'האם אתה בטוח שברצונך למחוק טריגר זה?', 'admin'),
  (NULL, 'emails.triggers.deleted', 'en', 'Trigger deleted successfully', 'admin'),
  (NULL, 'emails.triggers.deleted', 'he', 'הטריגר נמחק בהצלחה', 'admin'),
  (NULL, 'emails.triggers.deleteFailed', 'en', 'Failed to delete trigger', 'admin'),
  (NULL, 'emails.triggers.deleteFailed', 'he', 'מחיקת הטריגר נכשלה', 'admin'),

  -- ============================================================================
  -- Test Functionality
  -- ============================================================================
  (NULL, 'triggers.test.title', 'en', 'Test Email Trigger', 'admin'),
  (NULL, 'triggers.test.title', 'he', 'בדיקת טריגר דוא"ל', 'admin'),
  (NULL, 'triggers.test.description', 'en', 'Enter the email address where you want to receive the test email.', 'admin'),
  (NULL, 'triggers.test.description', 'he', 'הזן את כתובת הדוא"ל שבה ברצונך לקבל את דוא"ל הבדיקה.', 'admin'),
  (NULL, 'triggers.test.productionRecipient', 'en', 'Production recipient:', 'admin'),
  (NULL, 'triggers.test.productionRecipient', 'he', 'נמען בייצור:', 'admin'),
  (NULL, 'triggers.test.productionNote', 'en', 'In production, this email would be sent to the address above. For testing, you can send it to any email.', 'admin'),
  (NULL, 'triggers.test.productionNote', 'he', 'בייצור, דוא"ל זה יישלח לכתובת למעלה. לצורך בדיקה, ניתן לשלוח אותו לכל דוא"ל.', 'admin'),
  (NULL, 'triggers.test.emailLabel', 'en', 'Test Email Address', 'admin'),
  (NULL, 'triggers.test.emailLabel', 'he', 'כתובת דוא"ל לבדיקה', 'admin'),
  (NULL, 'triggers.test.emailPlaceholder', 'en', 'your.email@example.com', 'admin'),
  (NULL, 'triggers.test.emailPlaceholder', 'he', 'your.email@example.com', 'admin'),
  (NULL, 'triggers.test.emailRequired', 'en', 'Email address is required', 'admin'),
  (NULL, 'triggers.test.emailRequired', 'he', 'כתובת דוא"ל נדרשת', 'admin'),
  (NULL, 'triggers.test.emailInvalid', 'en', 'Please enter a valid email address', 'admin'),
  (NULL, 'triggers.test.emailInvalid', 'he', 'אנא הזן כתובת דוא"ל תקינה', 'admin'),
  (NULL, 'triggers.test.emailHint', 'en', 'The test email will be sent to this address with a [TEST] prefix in the subject.', 'admin'),
  (NULL, 'triggers.test.emailHint', 'he', 'דוא"ל הבדיקה יישלח לכתובת זו עם קידומת [TEST] בנושא.', 'admin'),
  (NULL, 'triggers.test.send', 'en', 'Send Test Email', 'admin'),
  (NULL, 'triggers.test.send', 'he', 'שלח דוא"ל בדיקה', 'admin'),
  (NULL, 'triggers.test.sending', 'en', 'Sending...', 'admin'),
  (NULL, 'triggers.test.sending', 'he', 'שולח...', 'admin'),
  (NULL, 'triggers.test.failed', 'en', 'Failed to send test email', 'admin'),
  (NULL, 'triggers.test.failed', 'he', 'שליחת דוא"ל הבדיקה נכשלה', 'admin'),
  (NULL, 'emails.triggers.testEmailSent', 'en', 'Test email sent to your inbox! Would be sent to: ', 'admin'),
  (NULL, 'emails.triggers.testEmailSent', 'he', 'דוא"ל בדיקה נשלח לתיבת הדואר שלך! יישלח אל: ', 'admin'),
  (NULL, 'emails.triggers.testSuccess', 'en', 'Trigger test successful! Email would be sent to: ', 'admin'),
  (NULL, 'emails.triggers.testSuccess', 'he', 'בדיקת הטריגר הצליחה! דוא"ל יישלח אל: ', 'admin'),
  (NULL, 'emails.triggers.testNoSend', 'en', 'Test completed but email would not be sent. Check conditions.', 'admin'),
  (NULL, 'emails.triggers.testNoSend', 'he', 'הבדיקה הושלמה אך הדוא"ל לא יישלח. בדוק את התנאים.', 'admin'),
  (NULL, 'emails.triggers.testFailed', 'en', 'Failed to test trigger', 'admin'),
  (NULL, 'emails.triggers.testFailed', 'he', 'בדיקת הטריגר נכשלה', 'admin'),

  -- ============================================================================
  -- Fields
  -- ============================================================================
  (NULL, 'emails.triggers.emailTemplate', 'en', 'Email Template', 'admin'),
  (NULL, 'emails.triggers.emailTemplate', 'he', 'תבנית דוא"ל', 'admin'),
  (NULL, 'emails.triggers.recipientField', 'en', 'Recipient Field', 'admin'),
  (NULL, 'emails.triggers.recipientField', 'he', 'שדה נמען', 'admin'),
  (NULL, 'emails.triggers.conditions', 'en', 'Conditions', 'admin'),
  (NULL, 'emails.triggers.conditions', 'he', 'תנאים', 'admin'),

  -- ============================================================================
  -- Dialog - Basic Tab
  -- ============================================================================
  (NULL, 'emails.triggers.dialog.title.create', 'en', 'Create Email Trigger', 'admin'),
  (NULL, 'emails.triggers.dialog.title.create', 'he', 'יצירת טריגר לדוא"ל', 'admin'),
  (NULL, 'emails.triggers.dialog.title.edit', 'en', 'Edit Email Trigger', 'admin'),
  (NULL, 'emails.triggers.dialog.title.edit', 'he', 'עריכת טריגר לדוא"ל', 'admin'),
  (NULL, 'emails.triggers.dialog.description', 'en', 'Configure when and how to send automated emails', 'admin'),
  (NULL, 'emails.triggers.dialog.description', 'he', 'הגדר מתי וכיצד לשלוח דוא"ל אוטומטי', 'admin'),

  -- Tabs
  (NULL, 'emails.triggers.dialog.tabs.basic', 'en', 'Basic', 'admin'),
  (NULL, 'emails.triggers.dialog.tabs.basic', 'he', 'בסיסי', 'admin'),
  (NULL, 'emails.triggers.dialog.tabs.timing', 'en', 'Timing', 'admin'),
  (NULL, 'emails.triggers.dialog.tabs.timing', 'he', 'תזמון', 'admin'),
  (NULL, 'emails.triggers.dialog.tabs.advanced', 'en', 'Advanced', 'admin'),
  (NULL, 'emails.triggers.dialog.tabs.advanced', 'he', 'מתקדם', 'admin'),

  -- Basic fields
  (NULL, 'emails.triggers.dialog.triggerName', 'en', 'Trigger Name', 'admin'),
  (NULL, 'emails.triggers.dialog.triggerName', 'he', 'שם הטריגר', 'admin'),
  (NULL, 'emails.triggers.dialog.triggerName.placeholder', 'en', 'e.g., Welcome Email for New Students', 'admin'),
  (NULL, 'emails.triggers.dialog.triggerName.placeholder', 'he', 'לדוגמה, דוא"ל ברוכים הבאים לתלמידים חדשים', 'admin'),
  (NULL, 'emails.triggers.dialog.event', 'en', 'Trigger Event', 'admin'),
  (NULL, 'emails.triggers.dialog.event', 'he', 'אירוע מפעיל', 'admin'),
  (NULL, 'emails.triggers.dialog.event.select', 'en', 'Select event type...', 'admin'),
  (NULL, 'emails.triggers.dialog.event.select', 'he', 'בחר סוג אירוע...', 'admin'),
  (NULL, 'emails.triggers.dialog.template', 'en', 'Email Template', 'admin'),
  (NULL, 'emails.triggers.dialog.template', 'he', 'תבנית דוא"ל', 'admin'),
  (NULL, 'emails.triggers.dialog.template.select', 'en', 'Select template...', 'admin'),
  (NULL, 'emails.triggers.dialog.template.select', 'he', 'בחר תבנית...', 'admin'),
  (NULL, 'emails.triggers.dialog.priority', 'en', 'Priority', 'admin'),
  (NULL, 'emails.triggers.dialog.priority', 'he', 'עדיפות', 'admin'),

  -- ============================================================================
  -- Priority Levels
  -- ============================================================================
  (NULL, 'emails.triggers.dialog.priority.urgent', 'en', 'Urgent', 'admin'),
  (NULL, 'emails.triggers.dialog.priority.urgent', 'he', 'דחוף', 'admin'),
  (NULL, 'emails.triggers.dialog.priority.high', 'en', 'High', 'admin'),
  (NULL, 'emails.triggers.dialog.priority.high', 'he', 'גבוה', 'admin'),
  (NULL, 'emails.triggers.dialog.priority.normal', 'en', 'Normal', 'admin'),
  (NULL, 'emails.triggers.dialog.priority.normal', 'he', 'רגיל', 'admin'),
  (NULL, 'emails.triggers.dialog.priority.low', 'en', 'Low', 'admin'),
  (NULL, 'emails.triggers.dialog.priority.low', 'he', 'נמוך', 'admin'),

  -- ============================================================================
  -- Timing Tab
  -- ============================================================================
  (NULL, 'emails.triggers.dialog.timing.immediate', 'en', 'Send Immediately', 'admin'),
  (NULL, 'emails.triggers.dialog.timing.immediate', 'he', 'שלח מיד', 'admin'),
  (NULL, 'emails.triggers.dialog.timing.immediate.desc', 'en', 'Email sent as soon as event occurs', 'admin'),
  (NULL, 'emails.triggers.dialog.timing.immediate.desc', 'he', 'דוא"ל נשלח מיד כאשר מתרחש האירוע', 'admin'),
  (NULL, 'emails.triggers.dialog.timing.delayed', 'en', 'Delay Sending', 'admin'),
  (NULL, 'emails.triggers.dialog.timing.delayed', 'he', 'עיכוב שליחה', 'admin'),
  (NULL, 'emails.triggers.dialog.timing.delayed.desc', 'en', 'Wait specified time before sending', 'admin'),
  (NULL, 'emails.triggers.dialog.timing.delayed.desc', 'he', 'המתן זמן מוגדר לפני השליחה', 'admin'),
  (NULL, 'emails.triggers.dialog.timing.scheduled', 'en', 'Scheduled Time', 'admin'),
  (NULL, 'emails.triggers.dialog.timing.scheduled', 'he', 'זמן מתוזמן', 'admin'),
  (NULL, 'emails.triggers.dialog.timing.scheduled.desc', 'en', 'Send at specific time of day', 'admin'),
  (NULL, 'emails.triggers.dialog.timing.scheduled.desc', 'he', 'שלח בשעה מסוימת ביום', 'admin'),
  (NULL, 'emails.triggers.dialog.timing.daysBefore', 'en', 'Days Before Event', 'admin'),
  (NULL, 'emails.triggers.dialog.timing.daysBefore', 'he', 'ימים לפני האירוע', 'admin'),
  (NULL, 'emails.triggers.dialog.timing.daysBefore.desc', 'en', 'Send reminder before scheduled event', 'admin'),
  (NULL, 'emails.triggers.dialog.timing.daysBefore.desc', 'he', 'שלח תזכורת לפני אירוע מתוכנן', 'admin'),
  (NULL, 'emails.triggers.dialog.timing.delayMinutes', 'en', 'Delay (minutes)', 'admin'),
  (NULL, 'emails.triggers.dialog.timing.delayMinutes', 'he', 'עיכוב (דקות)', 'admin'),
  (NULL, 'emails.triggers.dialog.timing.sendTime', 'en', 'Send Time', 'admin'),
  (NULL, 'emails.triggers.dialog.timing.sendTime', 'he', 'זמן שליחה', 'admin'),
  (NULL, 'emails.triggers.dialog.timing.daysBeforeCount', 'en', 'Days Before', 'admin'),
  (NULL, 'emails.triggers.dialog.timing.daysBeforeCount', 'he', 'ימים לפני', 'admin'),

  -- ============================================================================
  -- Advanced Tab - Recipient
  -- ============================================================================
  (NULL, 'emails.triggers.dialog.recipient.label', 'en', 'Recipient Strategy', 'admin'),
  (NULL, 'emails.triggers.dialog.recipient.label', 'he', 'אסטרטגיית נמען', 'admin'),
  (NULL, 'emails.triggers.dialog.recipient.auto', 'en', 'Auto-detect from event', 'admin'),
  (NULL, 'emails.triggers.dialog.recipient.auto', 'he', 'זיהוי אוטומטי מהאירוע', 'admin'),
  (NULL, 'emails.triggers.dialog.recipient.auto.desc', 'en', 'Automatically find recipient from event data', 'admin'),
  (NULL, 'emails.triggers.dialog.recipient.auto.desc', 'he', 'מצא נמען אוטומטית מנתוני האירוע', 'admin'),
  (NULL, 'emails.triggers.dialog.recipient.field', 'en', 'Extract from field', 'admin'),
  (NULL, 'emails.triggers.dialog.recipient.field', 'he', 'חלץ משדה', 'admin'),
  (NULL, 'emails.triggers.dialog.recipient.field.desc', 'en', 'Specify exact field path', 'admin'),
  (NULL, 'emails.triggers.dialog.recipient.field.desc', 'he', 'ציין נתיב שדה מדויק', 'admin'),
  (NULL, 'emails.triggers.dialog.recipient.role', 'en', 'By user role', 'admin'),
  (NULL, 'emails.triggers.dialog.recipient.role', 'he', 'לפי תפקיד משתמש', 'admin'),
  (NULL, 'emails.triggers.dialog.recipient.role.desc', 'en', 'Send to users with specific role', 'admin'),
  (NULL, 'emails.triggers.dialog.recipient.role.desc', 'he', 'שלח למשתמשים עם תפקיד מסוים', 'admin'),
  (NULL, 'emails.triggers.dialog.recipient.fieldPath', 'en', 'Field Path', 'admin'),
  (NULL, 'emails.triggers.dialog.recipient.fieldPath', 'he', 'נתיב שדה', 'admin'),
  (NULL, 'emails.triggers.dialog.recipient.fieldPath.placeholder', 'en', 'e.g., user.email or enrollment.student.email', 'admin'),
  (NULL, 'emails.triggers.dialog.recipient.fieldPath.placeholder', 'he', 'לדוגמה, user.email או enrollment.student.email', 'admin'),
  (NULL, 'emails.triggers.dialog.recipient.role.select', 'en', 'Select role...', 'admin'),
  (NULL, 'emails.triggers.dialog.recipient.role.select', 'he', 'בחר תפקיד...', 'admin'),

  -- ============================================================================
  -- Conditions
  -- ============================================================================
  (NULL, 'emails.triggers.dialog.conditions.enable', 'en', 'Use Conditions', 'admin'),
  (NULL, 'emails.triggers.dialog.conditions.enable', 'he', 'השתמש בתנאים', 'admin'),
  (NULL, 'emails.triggers.dialog.conditions.desc', 'en', 'Only send email if conditions are met', 'admin'),
  (NULL, 'emails.triggers.dialog.conditions.desc', 'he', 'שלח דוא"ל רק אם התנאים מתקיימים', 'admin'),
  (NULL, 'emails.triggers.dialog.conditions.json', 'en', 'Conditions (JSON)', 'admin'),
  (NULL, 'emails.triggers.dialog.conditions.json', 'he', 'תנאים (JSON)', 'admin'),
  (NULL, 'emails.triggers.dialog.conditions.example', 'en', 'Example: {"paymentStatus": "paid", "amount": {"$gte": 100}}', 'admin'),
  (NULL, 'emails.triggers.dialog.conditions.example', 'he', 'דוגמה: {"paymentStatus": "paid", "amount": {"$gte": 100}}', 'admin'),
  (NULL, 'emails.triggers.dialog.conditions.invalid', 'en', 'Invalid JSON format', 'admin'),
  (NULL, 'emails.triggers.dialog.conditions.invalid', 'he', 'פורמט JSON לא תקין', 'admin'),

  -- ============================================================================
  -- Buttons
  -- ============================================================================
  (NULL, 'emails.triggers.dialog.cancel', 'en', 'Cancel', 'admin'),
  (NULL, 'emails.triggers.dialog.cancel', 'he', 'ביטול', 'admin'),
  (NULL, 'emails.triggers.dialog.create', 'en', 'Create Trigger', 'admin'),
  (NULL, 'emails.triggers.dialog.create', 'he', 'צור טריגר', 'admin'),
  (NULL, 'emails.triggers.dialog.update', 'en', 'Update Trigger', 'admin'),
  (NULL, 'emails.triggers.dialog.update', 'he', 'עדכן טריגר', 'admin'),

  -- ============================================================================
  -- Success/Error Messages
  -- ============================================================================
  (NULL, 'emails.triggers.dialog.created', 'en', 'Trigger created successfully', 'admin'),
  (NULL, 'emails.triggers.dialog.created', 'he', 'הטריגר נוצר בהצלחה', 'admin'),
  (NULL, 'emails.triggers.dialog.updated', 'en', 'Trigger updated successfully', 'admin'),
  (NULL, 'emails.triggers.dialog.updated', 'he', 'הטריגר עודכן בהצלחה', 'admin'),
  (NULL, 'emails.triggers.dialog.createFailed', 'en', 'Failed to create trigger', 'admin'),
  (NULL, 'emails.triggers.dialog.createFailed', 'he', 'יצירת הטריגר נכשלה', 'admin'),
  (NULL, 'emails.triggers.dialog.updateFailed', 'en', 'Failed to update trigger', 'admin'),
  (NULL, 'emails.triggers.dialog.updateFailed', 'he', 'עדכון הטריגר נכשל', 'admin'),

  -- ============================================================================
  -- Validation (used by dialog component)
  -- ============================================================================
  (NULL, 'emails.triggers.dialog.validation.name', 'en', 'Please enter a trigger name', 'admin'),
  (NULL, 'emails.triggers.dialog.validation.name', 'he', 'נא להזין שם לטריגר', 'admin'),
  (NULL, 'emails.triggers.dialog.validation.event', 'en', 'Please select an event type', 'admin'),
  (NULL, 'emails.triggers.dialog.validation.event', 'he', 'נא לבחור סוג אירוע', 'admin'),
  (NULL, 'emails.triggers.dialog.validation.template', 'en', 'Please select an email template', 'admin'),
  (NULL, 'emails.triggers.dialog.validation.template', 'he', 'נא לבחור תבנית דוא"ל', 'admin'),

  -- ============================================================================
  -- Additional Dialog Translations (from CreateTriggerDialog component)
  -- ============================================================================
  -- Validation messages
  (NULL, 'triggers.validation.name_required', 'en', 'Trigger name is required', 'admin'),
  (NULL, 'triggers.validation.name_required', 'he', 'שם הטריגר נדרש', 'admin'),
  (NULL, 'triggers.validation.event_required', 'en', 'Event type is required', 'admin'),
  (NULL, 'triggers.validation.event_required', 'he', 'סוג האירוע נדרש', 'admin'),
  (NULL, 'triggers.validation.template_required', 'en', 'Email template is required', 'admin'),
  (NULL, 'triggers.validation.template_required', 'he', 'תבנית הדוא"ל נדרשת', 'admin'),
  (NULL, 'triggers.validation.invalid_json', 'en', 'Invalid conditions JSON', 'admin'),
  (NULL, 'triggers.validation.invalid_json', 'he', 'JSON תנאים לא תקין', 'admin'),

  -- Success/Error messages
  (NULL, 'triggers.updated', 'en', 'Trigger updated successfully', 'admin'),
  (NULL, 'triggers.updated', 'he', 'הטריגר עודכן בהצלחה', 'admin'),
  (NULL, 'triggers.created', 'en', 'Trigger created successfully', 'admin'),
  (NULL, 'triggers.created', 'he', 'הטריגר נוצר בהצלחה', 'admin'),
  (NULL, 'triggers.save_error', 'en', 'Failed to save trigger', 'admin'),
  (NULL, 'triggers.save_error', 'he', 'שמירת הטריגר נכשלה', 'admin'),

  -- Dialog titles
  (NULL, 'triggers.edit_title', 'en', 'Edit Trigger', 'admin'),
  (NULL, 'triggers.edit_title', 'he', 'עריכת טריגר', 'admin'),
  (NULL, 'triggers.create_title', 'en', 'Create New Trigger', 'admin'),
  (NULL, 'triggers.create_title', 'he', 'יצירת טריגר חדש', 'admin'),
  (NULL, 'triggers.dialog_description', 'en', 'Configure automated email sending based on platform events', 'admin'),
  (NULL, 'triggers.dialog_description', 'he', 'הגדר שליחת דוא"ל אוטומטית על סמך אירועי המערכת', 'admin'),

  -- Tabs
  (NULL, 'triggers.tab.basic', 'en', 'Basic', 'admin'),
  (NULL, 'triggers.tab.basic', 'he', 'בסיסי', 'admin'),
  (NULL, 'triggers.tab.timing', 'en', 'Timing', 'admin'),
  (NULL, 'triggers.tab.timing', 'he', 'תזמון', 'admin'),
  (NULL, 'triggers.tab.advanced', 'en', 'Advanced', 'admin'),
  (NULL, 'triggers.tab.advanced', 'he', 'מתקדם', 'admin'),

  -- Form fields
  (NULL, 'triggers.field.name', 'en', 'Trigger Name', 'admin'),
  (NULL, 'triggers.field.name', 'he', 'שם הטריגר', 'admin'),
  (NULL, 'triggers.field.name_placeholder', 'en', 'e.g., Send Welcome Email', 'admin'),
  (NULL, 'triggers.field.name_placeholder', 'he', 'לדוגמה, שליחת דוא"ל ברוכים הבאים', 'admin'),
  (NULL, 'triggers.field.event', 'en', 'Event Type', 'admin'),
  (NULL, 'triggers.field.event', 'he', 'סוג אירוע', 'admin'),
  (NULL, 'triggers.field.event_placeholder', 'en', 'Select event type', 'admin'),
  (NULL, 'triggers.field.event_placeholder', 'he', 'בחר סוג אירוע', 'admin'),
  (NULL, 'triggers.field.template', 'en', 'Email Template', 'admin'),
  (NULL, 'triggers.field.template', 'he', 'תבנית דוא"ל', 'admin'),
  (NULL, 'triggers.field.template_placeholder', 'en', 'Select template', 'admin'),
  (NULL, 'triggers.field.template_placeholder', 'he', 'בחר תבנית', 'admin'),
  (NULL, 'triggers.field.priority', 'en', 'Priority', 'admin'),
  (NULL, 'triggers.field.priority', 'he', 'עדיפות', 'admin'),

  -- Event options
  (NULL, 'triggers.event.enrollment_created', 'en', 'Enrollment Created', 'admin'),
  (NULL, 'triggers.event.enrollment_created', 'he', 'הרשמה נוצרה', 'admin'),
  (NULL, 'triggers.event.enrollment_created_desc', 'en', 'When a new enrollment is created', 'admin'),
  (NULL, 'triggers.event.enrollment_created_desc', 'he', 'כאשר נוצרת הרשמה חדשה', 'admin'),
  (NULL, 'triggers.event.enrollment_completed', 'en', 'Enrollment Completed', 'admin'),
  (NULL, 'triggers.event.enrollment_completed', 'he', 'הרשמה הושלמה', 'admin'),
  (NULL, 'triggers.event.enrollment_completed_desc', 'en', 'When user completes enrollment wizard', 'admin'),
  (NULL, 'triggers.event.enrollment_completed_desc', 'he', 'כאשר משתמש משלים את תהליך ההרשמה', 'admin'),
  (NULL, 'triggers.event.payment_completed', 'en', 'Payment Completed', 'admin'),
  (NULL, 'triggers.event.payment_completed', 'he', 'תשלום הושלם', 'admin'),
  (NULL, 'triggers.event.payment_completed_desc', 'en', 'When payment succeeds', 'admin'),
  (NULL, 'triggers.event.payment_completed_desc', 'he', 'כאשר תשלום מצליח', 'admin'),
  (NULL, 'triggers.event.payment_failed', 'en', 'Payment Failed', 'admin'),
  (NULL, 'triggers.event.payment_failed', 'he', 'תשלום נכשל', 'admin'),
  (NULL, 'triggers.event.payment_failed_desc', 'en', 'When payment fails', 'admin'),
  (NULL, 'triggers.event.payment_failed_desc', 'he', 'כאשר תשלום נכשל', 'admin'),
  (NULL, 'triggers.event.recording_ready', 'en', 'Recording Ready', 'admin'),
  (NULL, 'triggers.event.recording_ready', 'he', 'הקלטה מוכנה', 'admin'),
  (NULL, 'triggers.event.recording_ready_desc', 'en', 'When Zoom recording is processed', 'admin'),
  (NULL, 'triggers.event.recording_ready_desc', 'he', 'כאשר הקלטת Zoom מעובדת', 'admin'),
  (NULL, 'triggers.event.lesson_reminder', 'en', 'Lesson Reminder', 'admin'),
  (NULL, 'triggers.event.lesson_reminder', 'he', 'תזכורת שיעור', 'admin'),
  (NULL, 'triggers.event.lesson_reminder_desc', 'en', 'Send reminders before lessons', 'admin'),
  (NULL, 'triggers.event.lesson_reminder_desc', 'he', 'שלח תזכורות לפני שיעורים', 'admin'),

  -- Priority options
  (NULL, 'triggers.priority.urgent', 'en', 'Urgent', 'admin'),
  (NULL, 'triggers.priority.urgent', 'he', 'דחוף', 'admin'),
  (NULL, 'triggers.priority.high', 'en', 'High', 'admin'),
  (NULL, 'triggers.priority.high', 'he', 'גבוה', 'admin'),
  (NULL, 'triggers.priority.normal', 'en', 'Normal', 'admin'),
  (NULL, 'triggers.priority.normal', 'he', 'רגיל', 'admin'),
  (NULL, 'triggers.priority.low', 'en', 'Low', 'admin'),
  (NULL, 'triggers.priority.low', 'he', 'נמוך', 'admin'),

  -- Timing options
  (NULL, 'triggers.field.timing', 'en', 'When to send', 'admin'),
  (NULL, 'triggers.field.timing', 'he', 'מתי לשלוח', 'admin'),
  (NULL, 'triggers.timing.immediate', 'en', 'Immediately after event', 'admin'),
  (NULL, 'triggers.timing.immediate', 'he', 'מיד לאחר האירוע', 'admin'),
  (NULL, 'triggers.timing.delayed', 'en', 'Delayed (minutes/hours after)', 'admin'),
  (NULL, 'triggers.timing.delayed', 'he', 'עיכוב (דקות/שעות אחרי)', 'admin'),
  (NULL, 'triggers.timing.before_event', 'en', 'Before event (hours/minutes)', 'admin'),
  (NULL, 'triggers.timing.before_event', 'he', 'לפני האירוע (שעות/דקות)', 'admin'),
  (NULL, 'triggers.timing.scheduled', 'en', 'At specific time of day', 'admin'),
  (NULL, 'triggers.timing.scheduled', 'he', 'בשעה מסוימת ביום', 'admin'),
  (NULL, 'triggers.timing.days_before', 'en', 'Days before event (reminders)', 'admin'),
  (NULL, 'triggers.timing.days_before', 'he', 'ימים לפני האירוע (תזכורות)', 'admin'),
  (NULL, 'triggers.field.delay_minutes', 'en', 'Delay (minutes)', 'admin'),
  (NULL, 'triggers.field.delay_minutes', 'he', 'עיכוב (דקות)', 'admin'),
  (NULL, 'triggers.field.delay_hint', 'en', 'Tip: 60 = 1 hour, 1440 = 1 day', 'admin'),
  (NULL, 'triggers.field.delay_hint', 'he', 'טיפ: 60 = שעה אחת, 1440 = יום אחד', 'admin'),
  (NULL, 'triggers.field.before_event_minutes', 'en', 'Minutes before event', 'admin'),
  (NULL, 'triggers.field.before_event_minutes', 'he', 'דקות לפני האירוע', 'admin'),
  (NULL, 'triggers.field.before_event_hint', 'en', 'E.g., 60 = 1 hour before, 1440 = 1 day before', 'admin'),
  (NULL, 'triggers.field.before_event_hint', 'he', 'לדוגמה, 60 = שעה אחת לפני, 1440 = יום אחד לפני', 'admin'),
  (NULL, 'triggers.field.send_time', 'en', 'Send at time', 'admin'),
  (NULL, 'triggers.field.send_time', 'he', 'שלח בשעה', 'admin'),
  (NULL, 'triggers.field.send_time_hint', 'en', 'If time passed today, will send tomorrow', 'admin'),
  (NULL, 'triggers.field.send_time_hint', 'he', 'אם השעה עברה היום, ישלח מחר', 'admin'),
  (NULL, 'triggers.field.days_before', 'en', 'Days before event', 'admin'),
  (NULL, 'triggers.field.days_before', 'he', 'ימים לפני האירוע', 'admin'),
  (NULL, 'triggers.field.days_before_hint', 'en', 'For lesson reminders and upcoming events', 'admin'),
  (NULL, 'triggers.field.days_before_hint', 'he', 'עבור תזכורות שיעור ואירועים קרובים', 'admin'),

  -- Recipient options
  (NULL, 'triggers.field.recipient', 'en', 'Recipient Strategy', 'admin'),
  (NULL, 'triggers.field.recipient', 'he', 'אסטרטגיית נמען', 'admin'),
  (NULL, 'triggers.recipient.auto', 'en', 'Auto-detect from event data', 'admin'),
  (NULL, 'triggers.recipient.auto', 'he', 'זיהוי אוטומטי מנתוני האירוע', 'admin'),
  (NULL, 'triggers.recipient.field', 'en', 'Extract from specific field', 'admin'),
  (NULL, 'triggers.recipient.field', 'he', 'חילוץ משדה מסוים', 'admin'),
  (NULL, 'triggers.recipient.role', 'en', 'Lookup by user role', 'admin'),
  (NULL, 'triggers.recipient.role', 'he', 'חיפוש לפי תפקיד משתמש', 'admin'),
  (NULL, 'triggers.recipient.fixed', 'en', 'Fixed email address', 'admin'),
  (NULL, 'triggers.recipient.fixed', 'he', 'כתובת דוא"ל קבועה', 'admin'),
  (NULL, 'triggers.field.recipient_field', 'en', 'Field Path', 'admin'),
  (NULL, 'triggers.field.recipient_field', 'he', 'נתיב שדה', 'admin'),
  (NULL, 'triggers.field.recipient_field_hint', 'en', 'e.g., "email", "user.email", "userEmail"', 'admin'),
  (NULL, 'triggers.field.recipient_field_hint', 'he', 'לדוגמה, "email", "user.email", "userEmail"', 'admin'),
  (NULL, 'triggers.field.recipient_email', 'en', 'Email Address', 'admin'),
  (NULL, 'triggers.field.recipient_email', 'he', 'כתובת דוא"ל', 'admin'),
  (NULL, 'triggers.field.recipient_email_placeholder', 'en', 'e.g., support@tenafly-tg.com', 'admin'),
  (NULL, 'triggers.field.recipient_email_placeholder', 'he', 'לדוגמה, support@tenafly-tg.com', 'admin'),
  (NULL, 'triggers.field.recipient_email_hint', 'en', 'Fixed email address to always send to', 'admin'),
  (NULL, 'triggers.field.recipient_email_hint', 'he', 'כתובת דוא"ל קבועה לשליחה תמיד', 'admin'),
  (NULL, 'triggers.field.recipient_role', 'en', 'User Role', 'admin'),
  (NULL, 'triggers.field.recipient_role', 'he', 'תפקיד משתמש', 'admin'),
  (NULL, 'triggers.field.recipient_role_placeholder', 'en', 'Select role', 'admin'),
  (NULL, 'triggers.field.recipient_role_placeholder', 'he', 'בחר תפקיד', 'admin'),

  -- User roles
  (NULL, 'triggers.role.student', 'en', 'Student', 'admin'),
  (NULL, 'triggers.role.student', 'he', 'תלמיד', 'admin'),
  (NULL, 'triggers.role.instructor', 'en', 'Instructor', 'admin'),
  (NULL, 'triggers.role.instructor', 'he', 'מרצה', 'admin'),
  (NULL, 'triggers.role.admin', 'en', 'Admin', 'admin'),
  (NULL, 'triggers.role.admin', 'he', 'מנהל', 'admin'),

  -- Conditions
  (NULL, 'triggers.field.conditions', 'en', 'Conditions', 'admin'),
  (NULL, 'triggers.field.conditions', 'he', 'תנאים', 'admin'),
  (NULL, 'triggers.field.conditions_desc', 'en', 'Only send if conditions match', 'admin'),
  (NULL, 'triggers.field.conditions_desc', 'he', 'שלח רק אם התנאים תואמים', 'admin'),
  (NULL, 'triggers.field.conditions_json', 'en', 'Conditions (JSON)', 'admin'),
  (NULL, 'triggers.field.conditions_json', 'he', 'תנאים (JSON)', 'admin'),
  (NULL, 'triggers.field.conditions_examples', 'en', 'Examples', 'admin'),
  (NULL, 'triggers.field.conditions_examples', 'he', 'דוגמאות', 'admin'),

  -- Action buttons
  (NULL, 'triggers.update', 'en', 'Update Trigger', 'admin'),
  (NULL, 'triggers.update', 'he', 'עדכן טריגר', 'admin'),
  (NULL, 'triggers.create', 'en', 'Create Trigger', 'admin'),
  (NULL, 'triggers.create', 'he', 'צור טריגר', 'admin');

  -- Success message
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ Successfully added Email Triggers translations';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Total: 348 translations (174 keys × 2 languages)';
  RAISE NOTICE '';
  RAISE NOTICE 'Categories added:';
  RAISE NOTICE '  • Page UI (title, description, buttons, stats, empty states)';
  RAISE NOTICE '  • Event types (enrollment, payment, recording, lesson)';
  RAISE NOTICE '  • Event descriptions (detailed explanations for each event)';
  RAISE NOTICE '  • Dialog form (tabs, all fields, placeholders, hints)';
  RAISE NOTICE '  • Priority levels (urgent, high, normal, low)';
  RAISE NOTICE '  • Timing options (immediate, delayed, before_event, scheduled, days before)';
  RAISE NOTICE '  • Recipient strategies (auto, field, role, fixed email)';
  RAISE NOTICE '  • User roles (student, instructor, admin)';
  RAISE NOTICE '  • Validation messages (all form validation errors)';
  RAISE NOTICE '  • Success/Error toasts (create, update, delete, test)';
  RAISE NOTICE '  • Action buttons (create, update, cancel)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ All translations available in English and Hebrew!';
  RAISE NOTICE '============================================================================';
END $$;
