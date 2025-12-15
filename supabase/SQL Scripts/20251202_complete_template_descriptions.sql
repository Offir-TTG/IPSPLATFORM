-- Complete Template Description Translations
-- Ensures all template descriptions are translated in both English and Hebrew

DO $$
BEGIN
  -- Delete and re-insert all template description translations to ensure completeness
  DELETE FROM translations WHERE tenant_id IS NULL AND translation_key LIKE 'email_template.%description';

  -- Insert all template description translations
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context) VALUES

  -- Enrollment Confirmation
  (NULL, 'email_template.enrollment_confirmation.description', 'en', 'Sent when a user successfully enrolls in a course or program', 'admin'),
  (NULL, 'email_template.enrollment_confirmation.description', 'he', 'נשלח כאשר משתמש נרשם בהצלחה לקורס או תוכנית', 'admin'),

  -- Enrollment Invitation
  (NULL, 'email_template.enrollment_invitation.description', 'en', 'Sent when admin invites a user to enroll via enrollment link', 'admin'),
  (NULL, 'email_template.enrollment_invitation.description', 'he', 'נשלח כאשר מנהל מזמין משתמש להירשם דרך קישור הרשמה', 'admin'),

  -- Payment Receipt
  (NULL, 'email_template.payment_receipt.description', 'en', 'Sent when a payment is successfully processed', 'admin'),
  (NULL, 'email_template.payment_receipt.description', 'he', 'נשלח כאשר תשלום מעובד בהצלחה', 'admin'),

  -- Lesson Reminder
  (NULL, 'email_template.lesson_reminder.description', 'en', 'Sent before a scheduled lesson starts', 'admin'),
  (NULL, 'email_template.lesson_reminder.description', 'he', 'נשלח לפני שיעור מתוכנן מתחיל', 'admin'),

  -- Parent Progress Report
  (NULL, 'email_template.parent_progress_report.description', 'en', 'Sent to parents with student progress updates', 'admin'),
  (NULL, 'email_template.parent_progress_report.description', 'he', 'נשלח להורים עם עדכוני התקדמות תלמיד', 'admin');

END $$;
