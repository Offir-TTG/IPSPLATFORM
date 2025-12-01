-- =====================================================
-- User Profile Page Translations
-- =====================================================
-- This migration adds all base translation keys for the Profile page
-- Total: 56 keys × 2 languages = 112 rows
-- =====================================================

DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the first tenant UUID
  SELECT id INTO tenant_uuid FROM tenants LIMIT 1;

  -- Insert profile translations
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    -- =====================================================
    -- MAIN HEADING AND TABS (6 keys)
    -- =====================================================
    -- English
    ('en', 'user.profile.title', 'Account Settings', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.subtitle', 'Manage your profile, billing, and preferences', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.tabs.profile', 'Profile', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.tabs.billing', 'Billing', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.tabs.security', 'Security', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.tabs.preferences', 'Preferences', 'user', NOW(), NOW(), tenant_uuid),
    -- Hebrew
    ('he', 'user.profile.title', 'הגדרות חשבון', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.subtitle', 'נהל את הפרופיל, החיוב וההעדפות שלך', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.tabs.profile', 'פרופיל', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.tabs.billing', 'חיוב', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.tabs.security', 'אבטחה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.tabs.preferences', 'העדפות', 'user', NOW(), NOW(), tenant_uuid),

    -- =====================================================
    -- PROFILE TAB (6 keys)
    -- =====================================================
    -- English
    ('en', 'user.profile.verified', 'Verified', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.buttons.edit_profile', 'Edit Profile', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.buttons.change_avatar', 'Change Avatar', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.contact_info', 'Contact Information', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.joined', 'Joined', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.social_links', 'Social Links', 'user', NOW(), NOW(), tenant_uuid),
    -- Hebrew
    ('he', 'user.profile.verified', 'מאומת', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.buttons.edit_profile', 'ערוך פרופיל', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.buttons.change_avatar', 'שנה תמונת פרופיל', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.contact_info', 'פרטי קשר', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.joined', 'הצטרף', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.social_links', 'קישורים חברתיים', 'user', NOW(), NOW(), tenant_uuid),

    -- =====================================================
    -- BILLING TAB (16 keys)
    -- =====================================================
    -- English
    ('en', 'user.profile.billing.current_subscription', 'Current Subscription', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.manage_subscription_text', 'Manage your subscription and billing', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.plan', 'Plan', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.billing_cycle', 'Billing Cycle', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.amount', 'Amount', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.next_billing_date', 'Next Billing Date', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.auto_renewal', 'Auto-renewal is', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.enabled', 'enabled', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.disabled', 'disabled', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.manage_subscription', 'Manage Subscription', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.upgrade_plan', 'Upgrade Plan', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.cancel_subscription', 'Cancel Subscription', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.payment_method', 'Payment Method', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.update', 'Update', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.expires', 'Expires', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.default', 'Default', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.billing_address', 'Billing Address', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.billing_history', 'Billing History', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.export', 'Export', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.program_enrollments', 'Program Enrollments', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.enrolled', 'Enrolled', 'user', NOW(), NOW(), tenant_uuid),
    -- Hebrew
    ('he', 'user.profile.billing.current_subscription', 'מנוי נוכחי', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.manage_subscription_text', 'נהל את המנוי והחיוב שלך', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.plan', 'תוכנית', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.billing_cycle', 'מחזור חיוב', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.amount', 'סכום', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.next_billing_date', 'תאריך חיוב הבא', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.auto_renewal', 'חידוש אוטומטי', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.enabled', 'מופעל', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.disabled', 'מושבת', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.manage_subscription', 'נהל מנוי', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.upgrade_plan', 'שדרג תוכנית', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.cancel_subscription', 'בטל מנוי', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.payment_method', 'אמצעי תשלום', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.update', 'עדכן', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.expires', 'תוקף', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.default', 'ברירת מחדל', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.billing_address', 'כתובת לחיוב', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.billing_history', 'היסטוריית חיוב', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.export', 'יצא', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.program_enrollments', 'רישום לתוכניות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.enrolled', 'נרשם', 'user', NOW(), NOW(), tenant_uuid),

    -- =====================================================
    -- SECURITY TAB (10 keys)
    -- =====================================================
    -- English
    ('en', 'user.profile.security.password_auth', 'Password & Authentication', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.password', 'Password', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.last_changed', 'Last changed 3 months ago', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.change_password', 'Change Password', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.two_factor', 'Two-Factor Authentication', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.two_factor_desc', 'Add an extra layer of security', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.enable_2fa', 'Enable 2FA', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.active_sessions', 'Active Sessions', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.current_session', 'Current Session', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.active', 'Active', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.danger_zone', 'Danger Zone', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.delete_warning', 'Once you delete your account, there is no going back. Please be certain.', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.delete_account', 'Delete Account', 'user', NOW(), NOW(), tenant_uuid),
    -- Hebrew
    ('he', 'user.profile.security.password_auth', 'סיסמה ואימות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.password', 'סיסמה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.last_changed', 'שונה לאחרונה לפני 3 חודשים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.change_password', 'שנה סיסמה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.two_factor', 'אימות דו-שלבי', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.two_factor_desc', 'הוסף שכבת אבטחה נוספת', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.enable_2fa', 'הפעל אימות דו-שלבי', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.active_sessions', 'הפעלות פעילות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.current_session', 'הפעלה נוכחית', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.active', 'פעיל', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.danger_zone', 'אזור מסוכן', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.delete_warning', 'לאחר מחיקת החשבון שלך, אין דרך חזרה. אנא היה בטוח.', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.delete_account', 'מחק חשבון', 'user', NOW(), NOW(), tenant_uuid),

    -- =====================================================
    -- PREFERENCES TAB (12 keys)
    -- =====================================================
    -- English
    ('en', 'user.profile.preferences.notifications', 'Notifications', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.preferences.lesson_reminders', 'Lesson reminders', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.preferences.lesson_reminders_desc', 'Get notified about upcoming lessons', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.preferences.achievement_updates', 'Achievement updates', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.preferences.achievement_updates_desc', 'Celebrate your learning milestones', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.preferences.assignment_due_dates', 'Assignment due dates', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.preferences.assignment_due_dates_desc', 'Never miss a deadline', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.preferences.course_announcements', 'Course announcements', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.preferences.course_announcements_desc', 'Important updates from instructors', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.preferences.regional_settings', 'Regional Settings', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.preferences.language', 'Language', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.preferences.timezone', 'Timezone', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.preferences.change', 'Change', 'user', NOW(), NOW(), tenant_uuid),
    -- Hebrew
    ('he', 'user.profile.preferences.notifications', 'התראות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.preferences.lesson_reminders', 'תזכורות לשיעורים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.preferences.lesson_reminders_desc', 'קבל התראות על שיעורים קרובים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.preferences.achievement_updates', 'עדכוני הישגים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.preferences.achievement_updates_desc', 'חגוג את אבני הדרך הלימודיות שלך', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.preferences.assignment_due_dates', 'מועדי הגשת מטלות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.preferences.assignment_due_dates_desc', 'לעולם אל תפספס מועד אחרון', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.preferences.course_announcements', 'הכרזות קורס', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.preferences.course_announcements_desc', 'עדכונים חשובים ממדריכים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.preferences.regional_settings', 'הגדרות אזוריות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.preferences.language', 'שפה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.preferences.timezone', 'אזור זמן', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.preferences.change', 'שנה', 'user', NOW(), NOW(), tenant_uuid)
  ON CONFLICT (tenant_id, language_code, translation_key)
  DO UPDATE SET
    translation_value = EXCLUDED.translation_value,
    updated_at = NOW();

  RAISE NOTICE 'Successfully added 56 Profile page translation keys (112 total rows)';

END $$;
