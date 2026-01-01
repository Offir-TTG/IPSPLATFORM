-- ============================================================================
-- ADD BRIDGE ACCESS PAGE TRANSLATIONS
-- ============================================================================
-- Date: 2025-01-31
-- Purpose: Add translations for instructor bridge access page messages
-- Languages: English (en) and Hebrew (he)
-- ============================================================================

DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the first tenant UUID
  SELECT id INTO tenant_uuid FROM tenants LIMIT 1;

  -- Delete existing translations if they exist
  DELETE FROM public.translations
  WHERE translation_key IN (
    'bridge.loading',
    'bridge.checking_session',
    'bridge.session_found',
    'bridge.redirecting',
    'bridge.no_active_session',
    'bridge.no_active_session_message',
    'bridge.use_same_link',
    'bridge.bookmark_page',
    'bridge.next_session',
    'bridge.error',
    'bridge.try_again'
  )
  AND language_code IN ('en', 'he');

  -- Insert translations for bridge access page
  INSERT INTO public.translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id)
  VALUES
    -- Loading states
    ('en', 'bridge.loading', 'Loading...', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'bridge.loading', 'טוען...', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'bridge.checking_session', 'Checking for your live session', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'bridge.checking_session', 'בודק את המפגש הפעיל שלך', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'bridge.session_found', 'Session Found!', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'bridge.session_found', 'מפגש נמצא!', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'bridge.redirecting', 'Redirecting to your Zoom meeting...', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'bridge.redirecting', 'מעביר אותך לפגישת Zoom...', 'user', NOW(), NOW(), tenant_uuid),

    -- No Active Session
    ('en', 'bridge.no_active_session', 'No Active Session', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'bridge.no_active_session', 'אין מפגש פעיל', 'user', NOW(), NOW(), tenant_uuid),

    -- No active session message
    ('en', 'bridge.no_active_session_message', 'No active session right now', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'bridge.no_active_session_message', 'אין מפגש פעיל כרגע', 'user', NOW(), NOW(), tenant_uuid),

    -- Use same link instruction
    ('en', 'bridge.use_same_link', 'Please use this same link when it is time for your session.', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'bridge.use_same_link', 'אנא השתמש באותו קישור זה כשיגיע זמן המפגש שלך.', 'user', NOW(), NOW(), tenant_uuid),

    -- Bookmark instruction
    ('en', 'bridge.bookmark_page', 'You can bookmark this page for easy access.', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'bridge.bookmark_page', 'ניתן לשמור דף זה במועדפים לגישה נוחה.', 'user', NOW(), NOW(), tenant_uuid),

    -- Next session label
    ('en', 'bridge.next_session', 'Your next session:', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'bridge.next_session', 'המפגש הבא שלך:', 'user', NOW(), NOW(), tenant_uuid),

    -- Error state
    ('en', 'bridge.error', 'Error', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'bridge.error', 'שגיאה', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'bridge.try_again', 'Try Again', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'bridge.try_again', 'נסה שוב', 'user', NOW(), NOW(), tenant_uuid);
END $$;

-- ============================================================================
-- TRANSLATION INSERT COMPLETE
-- ============================================================================
-- Summary:
-- - Added 11 translation pairs (English + Hebrew)
-- - Used for bridge access page (loading, redirecting, waiting, and error states)
-- - Context: 'user' (instructor-facing page)
-- ============================================================================
