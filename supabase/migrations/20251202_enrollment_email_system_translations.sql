-- Enrollment Email System - Complete Translations (English + Hebrew)
-- Includes: Send Link Dialog, Email Content, Public Enrollment Page, Dashboard Widgets

DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the first tenant (or specify your tenant ID)
  SELECT id INTO tenant_uuid FROM tenants LIMIT 1;

  -- Delete existing translations to avoid duplicates
  DELETE FROM translations WHERE translation_key IN (
    -- Send Link Dialog
    'admin.enrollments.sendLink.title',
    'admin.enrollments.sendLink.description',
    'admin.enrollments.sendLink.user',
    'admin.enrollments.sendLink.product',
    'admin.enrollments.sendLink.language',
    'admin.enrollments.sendLink.languageHelp',
    'admin.enrollments.sendLink.info',
    'admin.enrollments.sendLink.send',
    'admin.enrollments.sendLink.sending',
    'admin.enrollments.sendLink.success',
    'admin.enrollments.sendLink.error',
    'admin.enrollments.sendLink',

    -- Email Content
    'email.enrollment.subject',
    'email.enrollment.title',
    'email.enrollment.greeting',
    'email.enrollment.invitation',
    'email.enrollment.message',
    'email.enrollment.cta',
    'email.enrollment.fallback',
    'email.enrollment.expiry',
    'email.enrollment.org',
    'email.enrollment.footer',
    'email.enrollment.totalAmount',
    'email.enrollment.paymentPlan',

    -- Public Enrollment Page
    'enrollment.public.inviteTitle',
    'enrollment.public.inviteDescription',
    'enrollment.public.productLabel',
    'enrollment.public.totalAmount',
    'enrollment.public.paymentPlan',
    'enrollment.public.freeEnrollment',
    'enrollment.public.sentTo',
    'enrollment.public.expiresWarning',
    'enrollment.public.expiringSoon',
    'enrollment.public.acceptButton',
    'enrollment.public.processing',
    'enrollment.public.termsAgree',
    'enrollment.public.needHelp',
    'enrollment.public.invalidLink',
    'enrollment.public.goToLogin',

    -- Dashboard Pending Enrollments
    'dashboard.pendingEnrollments.title',
    'dashboard.pendingEnrollments.description',
    'dashboard.pendingEnrollments.viewDetails',
    'dashboard.pendingEnrollments.expired',
    'dashboard.pendingEnrollments.expiresSoon',
    'dashboard.pendingEnrollments.sent',
    'dashboard.pendingEnrollments.expires',
    'dashboard.pendingEnrollments.expiredMessage',
    'dashboard.pendingEnrollments.totalAmount',
    'dashboard.pendingEnrollments.paymentPlan'
  );

  -- ============================================
  -- ENGLISH TRANSLATIONS
  -- ============================================

  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES

  -- Send Link Dialog (English)
  ('en', 'admin.enrollments.sendLink.title', 'Send Enrollment Link', 'admin', NOW(), NOW(), tenant_uuid),
  ('en', 'admin.enrollments.sendLink.description', 'Send enrollment invitation email to the user with a secure link', 'admin', NOW(), NOW(), tenant_uuid),
  ('en', 'admin.enrollments.sendLink.user', 'User', 'admin', NOW(), NOW(), tenant_uuid),
  ('en', 'admin.enrollments.sendLink.product', 'Product', 'admin', NOW(), NOW(), tenant_uuid),
  ('en', 'admin.enrollments.sendLink.language', 'Email Language', 'admin', NOW(), NOW(), tenant_uuid),
  ('en', 'admin.enrollments.sendLink.languageHelp', 'The invitation email will be sent in this language', 'admin', NOW(), NOW(), tenant_uuid),
  ('en', 'admin.enrollments.sendLink.info', 'The user will receive an email with a secure link valid for 7 days. The enrollment status will change to "pending".', 'admin', NOW(), NOW(), tenant_uuid),
  ('en', 'admin.enrollments.sendLink.send', 'Send Link', 'admin', NOW(), NOW(), tenant_uuid),
  ('en', 'admin.enrollments.sendLink.sending', 'Sending...', 'admin', NOW(), NOW(), tenant_uuid),
  ('en', 'admin.enrollments.sendLink.success', 'Enrollment link sent successfully', 'admin', NOW(), NOW(), tenant_uuid),
  ('en', 'admin.enrollments.sendLink.error', 'Failed to send enrollment link', 'admin', NOW(), NOW(), tenant_uuid),
  ('en', 'admin.enrollments.sendLink', 'Send enrollment link', 'admin', NOW(), NOW(), tenant_uuid),

  -- Email Content (English)
  ('en', 'email.enrollment.subject', 'Enrollment Invitation: {product}', 'admin', NOW(), NOW(), tenant_uuid),
  ('en', 'email.enrollment.title', 'You''re Invited to Enroll!', 'admin', NOW(), NOW(), tenant_uuid),
  ('en', 'email.enrollment.greeting', 'Hello {name}', 'admin', NOW(), NOW(), tenant_uuid),
  ('en', 'email.enrollment.invitation', 'You have been invited to enroll in:', 'admin', NOW(), NOW(), tenant_uuid),
  ('en', 'email.enrollment.message', 'Click the button below to view details and complete your enrollment:', 'admin', NOW(), NOW(), tenant_uuid),
  ('en', 'email.enrollment.cta', 'View Enrollment', 'admin', NOW(), NOW(), tenant_uuid),
  ('en', 'email.enrollment.fallback', 'Or copy this link:', 'admin', NOW(), NOW(), tenant_uuid),
  ('en', 'email.enrollment.expiry', 'This invitation expires in {days} days', 'admin', NOW(), NOW(), tenant_uuid),
  ('en', 'email.enrollment.org', 'From {organization}', 'admin', NOW(), NOW(), tenant_uuid),
  ('en', 'email.enrollment.footer', 'If you have questions, please contact support.', 'admin', NOW(), NOW(), tenant_uuid),
  ('en', 'email.enrollment.totalAmount', 'Total Amount', 'admin', NOW(), NOW(), tenant_uuid),
  ('en', 'email.enrollment.paymentPlan', 'Payment Plan', 'admin', NOW(), NOW(), tenant_uuid),

  -- Public Enrollment Page (English)
  ('en', 'enrollment.public.inviteTitle', 'You''re Invited!', 'user', NOW(), NOW(), tenant_uuid),
  ('en', 'enrollment.public.inviteDescription', 'You''ve been invited to enroll in the following:', 'user', NOW(), NOW(), tenant_uuid),
  ('en', 'enrollment.public.productLabel', 'Product', 'user', NOW(), NOW(), tenant_uuid),
  ('en', 'enrollment.public.totalAmount', 'Total Amount', 'user', NOW(), NOW(), tenant_uuid),
  ('en', 'enrollment.public.paymentPlan', 'Payment Plan', 'user', NOW(), NOW(), tenant_uuid),
  ('en', 'enrollment.public.freeEnrollment', '🎉 This enrollment is completely free!', 'user', NOW(), NOW(), tenant_uuid),
  ('en', 'enrollment.public.sentTo', 'Invitation sent to:', 'user', NOW(), NOW(), tenant_uuid),
  ('en', 'enrollment.public.expiresWarning', 'This invitation expires', 'user', NOW(), NOW(), tenant_uuid),
  ('en', 'enrollment.public.expiringSoon', '⚠️ Expiring soon!', 'user', NOW(), NOW(), tenant_uuid),
  ('en', 'enrollment.public.acceptButton', 'Accept Enrollment', 'user', NOW(), NOW(), tenant_uuid),
  ('en', 'enrollment.public.processing', 'Processing...', 'user', NOW(), NOW(), tenant_uuid),
  ('en', 'enrollment.public.termsAgree', 'By accepting, you agree to the terms and conditions', 'user', NOW(), NOW(), tenant_uuid),
  ('en', 'enrollment.public.needHelp', 'Need help? Contact support for assistance.', 'user', NOW(), NOW(), tenant_uuid),
  ('en', 'enrollment.public.invalidLink', 'Invalid Link', 'user', NOW(), NOW(), tenant_uuid),
  ('en', 'enrollment.public.goToLogin', 'Go to Login', 'user', NOW(), NOW(), tenant_uuid),

  -- Dashboard Pending Enrollments (English)
  ('en', 'dashboard.pendingEnrollments.title', 'Pending Enrollments', 'user', NOW(), NOW(), tenant_uuid),
  ('en', 'dashboard.pendingEnrollments.description', 'You have {count} enrollment invitation waiting', 'user', NOW(), NOW(), tenant_uuid),
  ('en', 'dashboard.pendingEnrollments.viewDetails', 'View Details', 'user', NOW(), NOW(), tenant_uuid),
  ('en', 'dashboard.pendingEnrollments.expired', 'Expired', 'user', NOW(), NOW(), tenant_uuid),
  ('en', 'dashboard.pendingEnrollments.expiresSoon', 'Expires soon', 'user', NOW(), NOW(), tenant_uuid),
  ('en', 'dashboard.pendingEnrollments.sent', 'Sent', 'user', NOW(), NOW(), tenant_uuid),
  ('en', 'dashboard.pendingEnrollments.expires', 'Expires', 'user', NOW(), NOW(), tenant_uuid),
  ('en', 'dashboard.pendingEnrollments.expiredMessage', 'Some invitations have expired. Please contact your administrator for a new link.', 'user', NOW(), NOW(), tenant_uuid),
  ('en', 'dashboard.pendingEnrollments.totalAmount', 'Total Amount', 'user', NOW(), NOW(), tenant_uuid),
  ('en', 'dashboard.pendingEnrollments.paymentPlan', 'Payment Plan', 'user', NOW(), NOW(), tenant_uuid);

  -- ============================================
  -- HEBREW TRANSLATIONS
  -- ============================================

  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES

  -- Send Link Dialog (Hebrew)
  ('he', 'admin.enrollments.sendLink.title', 'שלח קישור הרשמה', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'admin.enrollments.sendLink.description', 'שלח למשתמש הזמנה להרשמה עם קישור מאובטח', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'admin.enrollments.sendLink.user', 'משתמש', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'admin.enrollments.sendLink.product', 'מוצר', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'admin.enrollments.sendLink.language', 'שפת האימייל', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'admin.enrollments.sendLink.languageHelp', 'ההזמנה תישלח בשפה זו', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'admin.enrollments.sendLink.info', 'המשתמש יקבל אימייל עם קישור מאובטח תקף ל-7 ימים. סטטוס ההרשמה ישתנה ל"ממתין".', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'admin.enrollments.sendLink.send', 'שלח קישור', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'admin.enrollments.sendLink.sending', 'שולח...', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'admin.enrollments.sendLink.success', 'קישור ההרשמה נשלח בהצלחה', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'admin.enrollments.sendLink.error', 'שליחת קישור ההרשמה נכשלה', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'admin.enrollments.sendLink', 'שלח קישור הרשמה', 'admin', NOW(), NOW(), tenant_uuid),

  -- Email Content (Hebrew)
  ('he', 'email.enrollment.subject', 'הזמנה להרשמה: {product}', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'email.enrollment.title', 'הוזמנת להירשם!', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'email.enrollment.greeting', 'שלום {name}', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'email.enrollment.invitation', 'הוזמנת להירשם ל:', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'email.enrollment.message', 'לחץ על הכפתור למטה כדי לראות פרטים ולהשלים את ההרשמה:', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'email.enrollment.cta', 'צפה בהרשמה', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'email.enrollment.fallback', 'או העתק את הקישור:', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'email.enrollment.expiry', 'ההזמנה תפוג בעוד {days} ימים', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'email.enrollment.org', 'מאת {organization}', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'email.enrollment.footer', 'אם יש לך שאלות, אנא צור קשר עם התמיכה.', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'email.enrollment.totalAmount', 'סכום כולל', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'email.enrollment.paymentPlan', 'תוכנית תשלום', 'admin', NOW(), NOW(), tenant_uuid),

  -- Public Enrollment Page (Hebrew)
  ('he', 'enrollment.public.inviteTitle', 'הוזמנת!', 'user', NOW(), NOW(), tenant_uuid),
  ('he', 'enrollment.public.inviteDescription', 'הוזמנת להירשם למוצר הבא:', 'user', NOW(), NOW(), tenant_uuid),
  ('he', 'enrollment.public.productLabel', 'מוצר', 'user', NOW(), NOW(), tenant_uuid),
  ('he', 'enrollment.public.totalAmount', 'סכום כולל', 'user', NOW(), NOW(), tenant_uuid),
  ('he', 'enrollment.public.paymentPlan', 'תוכנית תשלום', 'user', NOW(), NOW(), tenant_uuid),
  ('he', 'enrollment.public.freeEnrollment', '🎉 ההרשמה הזו חינמית לחלוטין!', 'user', NOW(), NOW(), tenant_uuid),
  ('he', 'enrollment.public.sentTo', 'ההזמנה נשלחה אל:', 'user', NOW(), NOW(), tenant_uuid),
  ('he', 'enrollment.public.expiresWarning', 'ההזמנה תפוג', 'user', NOW(), NOW(), tenant_uuid),
  ('he', 'enrollment.public.expiringSoon', '⚠️ תפוג בקרוב!', 'user', NOW(), NOW(), tenant_uuid),
  ('he', 'enrollment.public.acceptButton', 'אשר הרשמה', 'user', NOW(), NOW(), tenant_uuid),
  ('he', 'enrollment.public.processing', 'מעבד...', 'user', NOW(), NOW(), tenant_uuid),
  ('he', 'enrollment.public.termsAgree', 'באישור, אתה מסכים לתנאים וההגבלות', 'user', NOW(), NOW(), tenant_uuid),
  ('he', 'enrollment.public.needHelp', 'צריך עזרה? צור קשר עם התמיכה לסיוע.', 'user', NOW(), NOW(), tenant_uuid),
  ('he', 'enrollment.public.invalidLink', 'קישור לא חוקי', 'user', NOW(), NOW(), tenant_uuid),
  ('he', 'enrollment.public.goToLogin', 'עבור להתחברות', 'user', NOW(), NOW(), tenant_uuid),

  -- Dashboard Pending Enrollments (Hebrew)
  ('he', 'dashboard.pendingEnrollments.title', 'הרשמות ממתינות', 'user', NOW(), NOW(), tenant_uuid),
  ('he', 'dashboard.pendingEnrollments.description', 'יש לך {count} הזמנות הרשמה ממתינות', 'user', NOW(), NOW(), tenant_uuid),
  ('he', 'dashboard.pendingEnrollments.viewDetails', 'צפה בפרטים', 'user', NOW(), NOW(), tenant_uuid),
  ('he', 'dashboard.pendingEnrollments.expired', 'פג תוקף', 'user', NOW(), NOW(), tenant_uuid),
  ('he', 'dashboard.pendingEnrollments.expiresSoon', 'תפוג בקרוב', 'user', NOW(), NOW(), tenant_uuid),
  ('he', 'dashboard.pendingEnrollments.sent', 'נשלח', 'user', NOW(), NOW(), tenant_uuid),
  ('he', 'dashboard.pendingEnrollments.expires', 'תפוג', 'user', NOW(), NOW(), tenant_uuid),
  ('he', 'dashboard.pendingEnrollments.expiredMessage', 'חלק מההזמנות פגו תוקף. אנא צור קשר עם המנהל לקבלת קישור חדש.', 'user', NOW(), NOW(), tenant_uuid),
  ('he', 'dashboard.pendingEnrollments.totalAmount', 'סכום כולל', 'user', NOW(), NOW(), tenant_uuid),
  ('he', 'dashboard.pendingEnrollments.paymentPlan', 'תוכנית תשלום', 'user', NOW(), NOW(), tenant_uuid);

END $$;

-- Verify the insertions
SELECT
  language_code,
  translation_key,
  translation_value,
  context
FROM translations
WHERE translation_key LIKE 'admin.enrollments.sendLink%'
   OR translation_key LIKE 'email.enrollment%'
   OR translation_key LIKE 'enrollment.public%'
   OR translation_key LIKE 'dashboard.pendingEnrollments%'
ORDER BY language_code, translation_key;
