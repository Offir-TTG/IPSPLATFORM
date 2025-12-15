-- Email Template Content Translations
-- Translates the actual template names and descriptions shown in the cards

DO $$
BEGIN
  -- Delete existing template content translations
  DELETE FROM translations WHERE tenant_id IS NULL AND translation_key LIKE 'email_template.%';
  DELETE FROM translations WHERE tenant_id IS NULL AND translation_key LIKE 'emails.card.%';

  -- Insert template content translations
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context) VALUES

  -- Enrollment Confirmation Template
  (NULL, 'email_template.enrollment_confirmation.name', 'en', 'Enrollment Confirmation', 'admin'),
  (NULL, 'email_template.enrollment_confirmation.name', 'he', 'אישור הרשמה', 'admin'),
  (NULL, 'email_template.enrollment_confirmation.description', 'en', 'Sent when a user successfully enrolls in a course or program', 'admin'),
  (NULL, 'email_template.enrollment_confirmation.description', 'he', 'נשלח כאשר משתמש נרשם בהצלחה לקורס או תוכנית', 'admin'),

  -- Payment Receipt Template
  (NULL, 'email_template.payment_receipt.name', 'en', 'Payment Receipt', 'admin'),
  (NULL, 'email_template.payment_receipt.name', 'he', 'קבלה על תשלום', 'admin'),
  (NULL, 'email_template.payment_receipt.description', 'en', 'Sent when a payment is successfully processed', 'admin'),
  (NULL, 'email_template.payment_receipt.description', 'he', 'נשלח כאשר תשלום מעובד בהצלחה', 'admin'),

  -- Lesson Reminder Template
  (NULL, 'email_template.lesson_reminder.name', 'en', 'Lesson Reminder', 'admin'),
  (NULL, 'email_template.lesson_reminder.name', 'he', 'תזכורת שיעור', 'admin'),
  (NULL, 'email_template.lesson_reminder.description', 'en', 'Sent before a scheduled lesson starts', 'admin'),
  (NULL, 'email_template.lesson_reminder.description', 'he', 'נשלח לפני שיעור מתוכנן מתחיל', 'admin'),

  -- Parent Progress Report Template
  (NULL, 'email_template.parent_progress_report.name', 'en', 'Parent Progress Report', 'admin'),
  (NULL, 'email_template.parent_progress_report.name', 'he', 'דוח התקדמות להורים', 'admin'),
  (NULL, 'email_template.parent_progress_report.description', 'en', 'Sent to parents with student progress updates', 'admin'),
  (NULL, 'email_template.parent_progress_report.description', 'he', 'נשלח להורים עם עדכוני התקדמות תלמיד', 'admin'),

  -- Additional UI strings for cards
  (NULL, 'emails.card.variables_count', 'en', 'variables', 'admin'),
  (NULL, 'emails.card.variables_count', 'he', 'משתנים', 'admin'),
  (NULL, 'emails.card.system_template', 'en', 'System Template', 'admin'),
  (NULL, 'emails.card.system_template', 'he', 'תבנית מערכת', 'admin'),
  (NULL, 'emails.card.custom_template', 'en', 'Custom Template', 'admin'),
  (NULL, 'emails.card.custom_template', 'he', 'תבנית מותאמת', 'admin');

END $$;
