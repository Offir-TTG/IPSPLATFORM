-- Enrollment Wizard Translations
-- Adds all necessary translations for the multi-step enrollment wizard

-- Delete existing translations if any
DELETE FROM translations WHERE translation_key LIKE 'enrollment.wizard%';

-- Wizard general translations
INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
VALUES
  -- Loading and headers
  ('enrollment.wizard.loading', 'en', 'Loading enrollment...', 'user', NULL),
  ('enrollment.wizard.loading', 'he', 'טוען רישום...', 'user', NULL),

  ('enrollment.wizard.header.title', 'en', 'Complete Your Enrollment', 'user', NULL),
  ('enrollment.wizard.header.title', 'he', 'השלם את ההרשמה שלך', 'user', NULL),

  ('enrollment.wizard.progress', 'en', 'Progress', 'user', NULL),
  ('enrollment.wizard.progress', 'he', 'התקדמות', 'user', NULL),

  -- Error messages
  ('enrollment.wizard.error.title', 'en', 'Error', 'user', NULL),
  ('enrollment.wizard.error.title', 'he', 'שגיאה', 'user', NULL),

  ('enrollment.wizard.error.dashboard', 'en', 'Go to Dashboard', 'user', NULL),
  ('enrollment.wizard.error.dashboard', 'he', 'עבור ללוח הבקרה', 'user', NULL),

  -- Signature step
  ('enrollment.wizard.signature.title', 'en', 'Sign Agreement', 'user', NULL),
  ('enrollment.wizard.signature.title', 'he', 'חתימה על הסכם', 'user', NULL),

  ('enrollment.wizard.signature.description', 'en', 'Please sign the enrollment agreement to continue', 'user', NULL),
  ('enrollment.wizard.signature.description', 'he', 'אנא חתום על הסכם ההרשמה כדי להמשיך', 'user', NULL),

  ('enrollment.wizard.signature.info', 'en', 'You need to sign the enrollment agreement before proceeding.', 'user', NULL),
  ('enrollment.wizard.signature.info', 'he', 'עליך לחתום על הסכם ההרשמה לפני שתמשיך.', 'user', NULL),

  ('enrollment.wizard.signature.button', 'en', 'Sign Agreement', 'user', NULL),
  ('enrollment.wizard.signature.button', 'he', 'חתום על ההסכם', 'user', NULL),

  ('enrollment.wizard.signature.sending', 'en', 'Opening signature...', 'user', NULL),
  ('enrollment.wizard.signature.sending', 'he', 'פותח חתימה...', 'user', NULL),

  -- Profile step
  ('enrollment.wizard.profile.title', 'en', 'Complete Profile', 'user', NULL),
  ('enrollment.wizard.profile.title', 'he', 'השלם פרופיל', 'user', NULL),

  ('enrollment.wizard.profile.description', 'en', 'Complete your profile information', 'user', NULL),
  ('enrollment.wizard.profile.description', 'he', 'השלם את פרטי הפרופיל שלך', 'user', NULL),

  ('enrollment.wizard.profile.info', 'en', 'Please complete your profile to continue with enrollment.', 'user', NULL),
  ('enrollment.wizard.profile.info', 'he', 'אנא השלם את הפרופיל שלך כדי להמשיך עם ההרשמה.', 'user', NULL),

  ('enrollment.wizard.profile.button', 'en', 'Complete Profile', 'user', NULL),
  ('enrollment.wizard.profile.button', 'he', 'השלם פרופיל', 'user', NULL),

  -- Payment step
  ('enrollment.wizard.payment.title', 'en', 'Payment', 'user', NULL),
  ('enrollment.wizard.payment.title', 'he', 'תשלום', 'user', NULL),

  ('enrollment.wizard.payment.description', 'en', 'Complete payment to activate your enrollment', 'user', NULL),
  ('enrollment.wizard.payment.description', 'he', 'השלם תשלום כדי להפעיל את ההרשמה שלך', 'user', NULL),

  ('enrollment.wizard.payment.info', 'en', 'Complete payment to activate your enrollment.', 'user', NULL),
  ('enrollment.wizard.payment.info', 'he', 'השלם תשלום כדי להפעיל את ההרשמה שלך.', 'user', NULL),

  ('enrollment.wizard.payment.total', 'en', 'Total Amount', 'user', NULL),
  ('enrollment.wizard.payment.total', 'he', 'סכום כולל', 'user', NULL),

  ('enrollment.wizard.payment.button', 'en', 'Proceed to Payment', 'user', NULL),
  ('enrollment.wizard.payment.button', 'he', 'המשך לתשלום', 'user', NULL),

  -- Complete step
  ('enrollment.wizard.complete.title', 'en', 'Complete!', 'user', NULL),
  ('enrollment.wizard.complete.title', 'he', 'הושלם!', 'user', NULL),

  ('enrollment.wizard.complete.description', 'en', 'Your enrollment is complete!', 'user', NULL),
  ('enrollment.wizard.complete.description', 'he', 'ההרשמה שלך הושלמה!', 'user', NULL),

  ('enrollment.wizard.complete.success', 'en', 'Your enrollment is complete! You can now access your content.', 'user', NULL),
  ('enrollment.wizard.complete.success', 'he', 'ההרשמה שלך הושלמה! כעת תוכל לגשת לתוכן שלך.', 'user', NULL),

  ('enrollment.wizard.complete.button', 'en', 'Go to Dashboard', 'user', NULL),
  ('enrollment.wizard.complete.button', 'he', 'עבור ללוח הבקרה', 'user', NULL),

  ('enrollment.wizard.complete.finishing', 'en', 'Finishing...', 'user', NULL),
  ('enrollment.wizard.complete.finishing', 'he', 'מסיים...', 'user', NULL),

  -- Step indicators
  ('enrollment.wizard.steps.signature', 'en', 'Signature', 'user', NULL),
  ('enrollment.wizard.steps.signature', 'he', 'חתימה', 'user', NULL),

  ('enrollment.wizard.steps.profile', 'en', 'Profile', 'user', NULL),
  ('enrollment.wizard.steps.profile', 'he', 'פרופיל', 'user', NULL),

  ('enrollment.wizard.steps.payment', 'en', 'Payment', 'user', NULL),
  ('enrollment.wizard.steps.payment', 'he', 'תשלום', 'user', NULL);
