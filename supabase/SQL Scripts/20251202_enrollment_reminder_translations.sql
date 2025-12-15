-- Email Template Name Translations for Enrollment Reminder
-- Translations for enrollment.reminder template

DO $$
BEGIN
  -- enrollment.reminder (English)
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
  VALUES (NULL, 'email_template.enrollment_reminder.name', 'en', 'Enrollment Reminder', 'admin');
EXCEPTION WHEN unique_violation THEN
  UPDATE translations
  SET translation_value = 'Enrollment Reminder'
  WHERE translation_key = 'email_template.enrollment_reminder.name'
    AND language_code = 'en'
    AND context = 'admin'
    AND tenant_id IS NULL;
END $$;

DO $$
BEGIN
  -- enrollment.reminder (Hebrew)
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
  VALUES (NULL, 'email_template.enrollment_reminder.name', 'he', 'תזכורת הרשמה', 'admin');
EXCEPTION WHEN unique_violation THEN
  UPDATE translations
  SET translation_value = 'תזכורת הרשמה'
  WHERE translation_key = 'email_template.enrollment_reminder.name'
    AND language_code = 'he'
    AND context = 'admin'
    AND tenant_id IS NULL;
END $$;

DO $$
BEGIN
  -- enrollment.reminder description (English)
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
  VALUES (NULL, 'email_template.enrollment_reminder.description', 'en', 'Sent to remind users about pending enrollment or incomplete registration', 'admin');
EXCEPTION WHEN unique_violation THEN
  UPDATE translations
  SET translation_value = 'Sent to remind users about pending enrollment or incomplete registration'
  WHERE translation_key = 'email_template.enrollment_reminder.description'
    AND language_code = 'en'
    AND context = 'admin'
    AND tenant_id IS NULL;
END $$;

DO $$
BEGIN
  -- enrollment.reminder description (Hebrew)
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
  VALUES (NULL, 'email_template.enrollment_reminder.description', 'he', 'נשלח כדי להזכיר למשתמשים על הרשמה ממתינה או רישום לא מושלם', 'admin');
EXCEPTION WHEN unique_violation THEN
  UPDATE translations
  SET translation_value = 'נשלח כדי להזכיר למשתמשים על הרשמה ממתינה או רישום לא מושלם'
  WHERE translation_key = 'email_template.enrollment_reminder.description'
    AND language_code = 'he'
    AND context = 'admin'
    AND tenant_id IS NULL;
END $$;
