-- ============================================================================
-- Add All Email Template Name Translations
-- ============================================================================
-- This script ensures all email templates have translated names
-- for display in dropdowns, cards, and UI elements
-- ============================================================================

DO $$
BEGIN
  -- ============================================================================
  -- ENROLLMENT TEMPLATES
  -- ============================================================================

  -- enrollment.confirmation
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
  VALUES
    (NULL, 'email_template.enrollment_confirmation.name', 'en', 'Enrollment Confirmation', 'admin'),
    (NULL, 'email_template.enrollment_confirmation.name', 'he', 'אישור הרשמה', 'admin')
  ON CONFLICT (translation_key, language_code, context) WHERE tenant_id IS NULL
  DO UPDATE SET translation_value = EXCLUDED.translation_value;

  -- enrollment.invitation
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
  VALUES
    (NULL, 'email_template.enrollment_invitation.name', 'en', 'Enrollment Invitation', 'admin'),
    (NULL, 'email_template.enrollment_invitation.name', 'he', 'הזמנה להרשמה', 'admin')
  ON CONFLICT (translation_key, language_code, context) WHERE tenant_id IS NULL
  DO UPDATE SET translation_value = EXCLUDED.translation_value;

  -- enrollment.reminder
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
  VALUES
    (NULL, 'email_template.enrollment_reminder.name', 'en', 'Enrollment Reminder', 'admin'),
    (NULL, 'email_template.enrollment_reminder.name', 'he', 'תזכורת הרשמה', 'admin')
  ON CONFLICT (translation_key, language_code, context) WHERE tenant_id IS NULL
  DO UPDATE SET translation_value = EXCLUDED.translation_value;

  -- ============================================================================
  -- LESSON TEMPLATES
  -- ============================================================================

  -- lesson.reminder
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
  VALUES
    (NULL, 'email_template.lesson_reminder.name', 'en', 'Lesson Reminder', 'admin'),
    (NULL, 'email_template.lesson_reminder.name', 'he', 'תזכורת שיעור', 'admin')
  ON CONFLICT (translation_key, language_code, context) WHERE tenant_id IS NULL
  DO UPDATE SET translation_value = EXCLUDED.translation_value;

  -- recording.available
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
  VALUES
    (NULL, 'email_template.recording_available.name', 'en', 'Recording Available', 'admin'),
    (NULL, 'email_template.recording_available.name', 'he', 'הקלטה זמינה', 'admin')
  ON CONFLICT (translation_key, language_code, context) WHERE tenant_id IS NULL
  DO UPDATE SET translation_value = EXCLUDED.translation_value;

  -- ============================================================================
  -- PARENT TEMPLATES
  -- ============================================================================

  -- parent.progress_report
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
  VALUES
    (NULL, 'email_template.parent_progress_report.name', 'en', 'Parent Progress Report', 'admin'),
    (NULL, 'email_template.parent_progress_report.name', 'he', 'דוח התקדמות להורים', 'admin')
  ON CONFLICT (translation_key, language_code, context) WHERE tenant_id IS NULL
  DO UPDATE SET translation_value = EXCLUDED.translation_value;

  -- ============================================================================
  -- PAYMENT TEMPLATES
  -- ============================================================================

  -- payment.failed
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
  VALUES
    (NULL, 'email_template.payment_failed.name', 'en', 'Payment Failed', 'admin'),
    (NULL, 'email_template.payment_failed.name', 'he', 'תשלום נכשל', 'admin')
  ON CONFLICT (translation_key, language_code, context) WHERE tenant_id IS NULL
  DO UPDATE SET translation_value = EXCLUDED.translation_value;

  -- payment.receipt
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
  VALUES
    (NULL, 'email_template.payment_receipt.name', 'en', 'Payment Receipt', 'admin'),
    (NULL, 'email_template.payment_receipt.name', 'he', 'קבלה על תשלום', 'admin')
  ON CONFLICT (translation_key, language_code, context) WHERE tenant_id IS NULL
  DO UPDATE SET translation_value = EXCLUDED.translation_value;

  -- ============================================================================
  -- SYSTEM TEMPLATES
  -- ============================================================================

  -- notification.generic
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
  VALUES
    (NULL, 'email_template.notification_generic.name', 'en', 'Generic Notification', 'admin'),
    (NULL, 'email_template.notification_generic.name', 'he', 'התראה כללית', 'admin')
  ON CONFLICT (translation_key, language_code, context) WHERE tenant_id IS NULL
  DO UPDATE SET translation_value = EXCLUDED.translation_value;

  -- system.password_reset
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
  VALUES
    (NULL, 'email_template.system_password_reset.name', 'en', 'Password Reset', 'admin'),
    (NULL, 'email_template.system_password_reset.name', 'he', 'איפוס סיסמה', 'admin')
  ON CONFLICT (translation_key, language_code, context) WHERE tenant_id IS NULL
  DO UPDATE SET translation_value = EXCLUDED.translation_value;

  -- system.user_invitation
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
  VALUES
    (NULL, 'email_template.system_user_invitation.name', 'en', 'User Invitation', 'admin'),
    (NULL, 'email_template.system_user_invitation.name', 'he', 'הזמנת משתמש', 'admin')
  ON CONFLICT (translation_key, language_code, context) WHERE tenant_id IS NULL
  DO UPDATE SET translation_value = EXCLUDED.translation_value;

  -- ============================================================================
  -- SUCCESS MESSAGE
  -- ============================================================================

  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ Successfully added/updated all email template name translations';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Templates translated:';
  RAISE NOTICE '  ✓ enrollment.confirmation';
  RAISE NOTICE '  ✓ enrollment.invitation';
  RAISE NOTICE '  ✓ enrollment.reminder';
  RAISE NOTICE '  ✓ lesson.reminder';
  RAISE NOTICE '  ✓ recording.available';
  RAISE NOTICE '  ✓ parent.progress_report';
  RAISE NOTICE '  ✓ payment.failed';
  RAISE NOTICE '  ✓ payment.receipt';
  RAISE NOTICE '  ✓ notification.generic';
  RAISE NOTICE '  ✓ system.password_reset';
  RAISE NOTICE '  ✓ system.user_invitation';
  RAISE NOTICE '';
  RAISE NOTICE 'Total: 11 templates × 2 languages = 22 translations';
  RAISE NOTICE '============================================================================';

END $$;
