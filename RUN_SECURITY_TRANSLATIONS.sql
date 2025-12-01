-- Add security-related translations for profile page
DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the default tenant UUID
  SELECT id INTO tenant_uuid FROM tenants WHERE slug = 'default' LIMIT 1;

  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'Default tenant not found';
  END IF;

  -- Delete existing translations to avoid duplicates
  DELETE FROM translations WHERE translation_key IN (
    -- Password management
    'user.profile.security.last_changed_date',
    'user.profile.security.never_changed',
    'user.profile.security.change_password_desc',
    'user.profile.security.current_password',
    'user.profile.security.new_password',
    'user.profile.security.confirm_password',
    'user.profile.security.password_changed_success',
    'user.profile.security.password_error.all_fields_required',
    'user.profile.security.password_error.passwords_dont_match',
    'user.profile.security.password_error.password_too_short',
    'user.profile.security.password_error.current_password_incorrect',

    -- Account deactivation
    'user.profile.security.deactivate_account',
    'user.profile.security.deactivating',
    'user.profile.security.deactivate_confirm',
    'user.profile.security.deactivate_warning',
    'user.profile.security.account_deactivated_success',

    -- Session information
    'user.profile.security.session_device',
    'user.profile.security.session_location',
    'user.profile.security.no_active_sessions',

    -- Common
    'common.cancel'
  );

  -- Insert English translations
  INSERT INTO translations (language_code, translation_key, translation_value, category, created_at, updated_at, tenant_id) VALUES
    -- Password Management (English)
    ('en', 'user.profile.security.last_changed_date', 'Last changed on {date}', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.never_changed', 'Never changed', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.change_password_desc', 'Enter your current password and choose a new one. Your new password must be at least 8 characters long.', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.current_password', 'Current Password', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.new_password', 'New Password', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.confirm_password', 'Confirm New Password', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.password_changed_success', 'Password changed successfully', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.password_error.all_fields_required', 'All fields are required', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.password_error.passwords_dont_match', 'Passwords do not match', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.password_error.password_too_short', 'Password must be at least 8 characters long', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.password_error.current_password_incorrect', 'Current password is incorrect', 'user', NOW(), NOW(), tenant_uuid),

    -- Account Deactivation (English)
    ('en', 'user.profile.security.deactivate_account', 'Deactivate Account', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.deactivating', 'Deactivating...', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.deactivate_confirm', 'Are you sure you want to deactivate your account? You can contact support to reactivate it later.', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.deactivate_warning', 'Deactivating your account will log you out and prevent you from accessing the platform. You can contact support to reactivate your account.', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.account_deactivated_success', 'Your account has been deactivated successfully', 'user', NOW(), NOW(), tenant_uuid),

    -- Session Information (English)
    ('en', 'user.profile.security.session_device', 'Device', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.session_location', 'Location', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.security.no_active_sessions', 'No active sessions found', 'user', NOW(), NOW(), tenant_uuid),

    -- Password Management (Hebrew)
    ('he', 'user.profile.security.last_changed_date', 'שונה לאחרונה ב-{date}', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.never_changed', 'מעולם לא שונתה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.change_password_desc', 'הזן את הסיסמה הנוכחית שלך ובחר סיסמה חדשה. הסיסמה החדשה חייבת להיות לפחות 8 תווים.', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.current_password', 'סיסמה נוכחית', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.new_password', 'סיסמה חדשה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.confirm_password', 'אימות סיסמה חדשה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.password_changed_success', 'הסיסמה שונתה בהצלחה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.password_error.all_fields_required', 'כל השדות הם חובה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.password_error.passwords_dont_match', 'הסיסמאות אינן תואמות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.password_error.password_too_short', 'הסיסמה חייבת להיות לפחות 8 תווים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.password_error.current_password_incorrect', 'הסיסמה הנוכחית שגויה', 'user', NOW(), NOW(), tenant_uuid),

    -- Account Deactivation (Hebrew)
    ('he', 'user.profile.security.deactivate_account', 'השבת חשבון', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.deactivating', 'משבית...', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.deactivate_confirm', 'האם אתה בטוח שברצונך להשבית את החשבון שלך? תוכל ליצור קשר עם התמיכה כדי להפעיל אותו מחדש מאוחר יותר.', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.deactivate_warning', 'השבתת החשבון תנתק אותך ותמנע ממך גישה לפלטפורמה. תוכל ליצור קשר עם התמיכה כדי להפעיל מחדש את החשבון שלך.', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.account_deactivated_success', 'החשבון שלך הושבת בהצלחה', 'user', NOW(), NOW(), tenant_uuid),

    -- Session Information (Hebrew)
    ('he', 'user.profile.security.session_device', 'מכשיר', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.session_location', 'מיקום', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.no_active_sessions', 'לא נמצאו הפעלות פעילות', 'user', NOW(), NOW(), tenant_uuid),

    -- Common (English & Hebrew)
    ('en', 'common.cancel', 'Cancel', 'common', NOW(), NOW(), tenant_uuid),
    ('he', 'common.cancel', 'ביטול', 'common', NOW(), NOW(), tenant_uuid);

  RAISE NOTICE 'Security translations added successfully';
END$$;
