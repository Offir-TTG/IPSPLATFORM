-- Enrollment Reset Translations
-- Adds translations for the admin enrollment reset functionality

DELETE FROM translations WHERE translation_key LIKE 'admin.enrollments.reset%';

INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
VALUES
  -- Reset button
  ('admin.enrollments.reset', 'en', 'Reset enrollment wizard', 'admin', NULL),
  ('admin.enrollments.reset', 'he', 'אפס את אשף ההרשמה', 'admin', NULL),

  -- Reset dialog
  ('admin.enrollments.reset.title', 'en', 'Reset Enrollment Wizard', 'admin', NULL),
  ('admin.enrollments.reset.title', 'he', 'אפס את אשף ההרשמה', 'admin', NULL),

  ('admin.enrollments.reset.description', 'en', 'Reset the enrollment wizard for {user} to allow them to go through the steps again', 'admin', NULL),
  ('admin.enrollments.reset.description', 'he', 'אפס את אשף ההרשמה עבור {user} כדי לאפשר להם לעבור שוב על השלבים', 'admin', NULL),

  ('admin.enrollments.reset.info', 'en', 'This will reset the enrollment status to "pending" and allow the user to restart the enrollment wizard.', 'admin', NULL),
  ('admin.enrollments.reset.info', 'he', 'פעולה זו תאפס את סטטוס ההרשמה ל"ממתין" ותאפשר למשתמש להתחיל מחדש את אשף ההרשמה.', 'admin', NULL),

  ('admin.enrollments.reset.resetSignature', 'en', 'Reset DocuSign signature status', 'admin', NULL),
  ('admin.enrollments.reset.resetSignature', 'he', 'אפס את סטטוס חתימת DocuSign', 'admin', NULL),

  ('admin.enrollments.reset.resetPayment', 'en', 'Reset payment status (paid amount to 0)', 'admin', NULL),
  ('admin.enrollments.reset.resetPayment', 'he', 'אפס את סטטוס התשלום (סכום ששולם ל-0)', 'admin', NULL),

  ('admin.enrollments.reset.resetProfile', 'en', 'Reset profile onboarding flags', 'admin', NULL),
  ('admin.enrollments.reset.resetProfile', 'he', 'אפס דגלי הכנסה לפרופיל', 'admin', NULL),

  ('admin.enrollments.reset.always', 'en', 'always enabled', 'admin', NULL),
  ('admin.enrollments.reset.always', 'he', 'תמיד מופעל', 'admin', NULL),

  ('admin.enrollments.reset.warning', 'en', 'Warning: Resetting payment will set paid_amount to 0. This cannot be undone!', 'admin', NULL),
  ('admin.enrollments.reset.warning', 'he', 'אזהרה: איפוס התשלום יקבע את הסכום ששולם ל-0. לא ניתן לבטל פעולה זו!', 'admin', NULL),

  ('admin.enrollments.reset.button', 'en', 'Reset Enrollment', 'admin', NULL),
  ('admin.enrollments.reset.button', 'he', 'אפס הרשמה', 'admin', NULL),

  ('admin.enrollments.reset.resetting', 'en', 'Resetting...', 'admin', NULL),
  ('admin.enrollments.reset.resetting', 'he', 'מאפס...', 'admin', NULL),

  -- Toast messages
  ('admin.enrollments.reset.success', 'en', 'Enrollment reset successfully', 'admin', NULL),
  ('admin.enrollments.reset.success', 'he', 'ההרשמה אופסה בהצלחה', 'admin', NULL),

  ('admin.enrollments.reset.wizardInfo', 'en', 'User can now restart at: ', 'admin', NULL),
  ('admin.enrollments.reset.wizardInfo', 'he', 'המשתמש יכול כעת להתחיל מחדש ב: ', 'admin', NULL),

  ('admin.enrollments.reset.error', 'en', 'Failed to reset enrollment', 'admin', NULL),
  ('admin.enrollments.reset.error', 'he', 'נכשל באיפוס ההרשמה', 'admin', NULL);
