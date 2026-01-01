-- ============================================================================
-- ADD COURSE-LEVEL INSTRUCTOR BRIDGE TRANSLATIONS
-- ============================================================================
-- Date: 2025-01-31
-- Purpose: Add translation keys for course-level instructor bridge UI
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
    'lms.course_detail.instructor_access_title',
    'lms.course_detail.instructor_access_description',
    'lms.course_detail.bridge_active',
    'lms.course_detail.bridge_inactive',
    'lms.course_detail.bridge_slug',
    'lms.course_detail.bridge_url_label',
    'lms.course_detail.bridge_instructor',
    'lms.course_detail.bridge_grace_before',
    'lms.course_detail.bridge_grace_after',
    'lms.course_detail.bridge_create',
    'lms.course_detail.bridge_creating',
    'lms.course_detail.bridge_created',
    'lms.course_detail.bridge_copied',
    'lms.course_detail.bridge_not_created',
    'lms.course_detail.bridge_error',
    'lms.course_detail.bridge_how_it_works',
    'lms.course_detail.bridge_explanation',
    'lms.program_detail.bridge_migration_notice',
    'lms.program_detail.bridge_migration_text'
  )
  AND language_code IN ('en', 'he');

  -- Insert translations for course-level instructor bridge
  INSERT INTO public.translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id)
  VALUES
    -- Instructor Access Section
    ('en', 'lms.course_detail.instructor_access_title', 'Instructor Access', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'lms.course_detail.instructor_access_title', 'גישת מדריך', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'lms.course_detail.instructor_access_description', 'Generate a permanent link for instructors to access their Zoom meetings', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'lms.course_detail.instructor_access_description', 'צור קישור קבוע למדריכים לגישה לפגישות Zoom שלהם', 'admin', NOW(), NOW(), tenant_uuid),

    -- Bridge Link States
    ('en', 'lms.course_detail.bridge_active', 'Active', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'lms.course_detail.bridge_active', 'פעיל', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'lms.course_detail.bridge_inactive', 'Inactive', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'lms.course_detail.bridge_inactive', 'לא פעיל', 'admin', NOW(), NOW(), tenant_uuid),

    -- Bridge Link Fields
    ('en', 'lms.course_detail.bridge_slug', 'Slug', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'lms.course_detail.bridge_slug', 'מזהה', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'lms.course_detail.bridge_url_label', 'Bridge URL', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'lms.course_detail.bridge_url_label', 'כתובת הגישה', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'lms.course_detail.bridge_instructor', 'Instructor', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'lms.course_detail.bridge_instructor', 'מדריך', 'admin', NOW(), NOW(), tenant_uuid),

    -- Grace Periods
    ('en', 'lms.course_detail.bridge_grace_before', 'Grace before', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'lms.course_detail.bridge_grace_before', 'זמן כניסה מוקדם', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'lms.course_detail.bridge_grace_after', 'Grace after', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'lms.course_detail.bridge_grace_after', 'זמן כניסה מאוחר', 'admin', NOW(), NOW(), tenant_uuid),

    -- Actions
    ('en', 'lms.course_detail.bridge_create', 'Create Bridge Link', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'lms.course_detail.bridge_create', 'צור קישור גישה', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'lms.course_detail.bridge_creating', 'Creating...', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'lms.course_detail.bridge_creating', 'יוצר...', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'lms.course_detail.bridge_created', 'Instructor bridge link created successfully', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'lms.course_detail.bridge_created', 'קישור הגישה למדריך נוצר בהצלחה', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'lms.course_detail.bridge_copied', 'Bridge link copied to clipboard!', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'lms.course_detail.bridge_copied', 'קישור הגישה הועתק ללוח', 'admin', NOW(), NOW(), tenant_uuid),

    -- Status Messages
    ('en', 'lms.course_detail.bridge_not_created', 'No instructor bridge link created yet', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'lms.course_detail.bridge_not_created', 'לא נוצר עדיין קישור גישה למדריך', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'lms.course_detail.bridge_error', 'Failed to create bridge link', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'lms.course_detail.bridge_error', 'יצירת קישור הגישה נכשלה', 'admin', NOW(), NOW(), tenant_uuid),

    -- Info Section
    ('en', 'lms.course_detail.bridge_how_it_works', 'How it works', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'lms.course_detail.bridge_how_it_works', 'איך זה עובד', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'lms.course_detail.bridge_explanation', 'The instructor can use this permanent link to automatically join the correct Zoom meeting based on the current time. The system will redirect them to the meeting that is currently active or upcoming within the grace period.', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'lms.course_detail.bridge_explanation', 'המדריך יכול להשתמש בקישור קבוע זה כדי להצטרף אוטומטית לפגישת Zoom הנכונה בהתאם לזמן הנוכחי. המערכת תפנה אותם לפגישה שפעילה כעת או עתידית בטווח הזמן המוגדר.', 'admin', NOW(), NOW(), tenant_uuid),

    -- Program-level migration notice (for program detail page)
    ('en', 'lms.program_detail.bridge_migration_notice', 'Note:', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'lms.program_detail.bridge_migration_notice', 'הערה:', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'lms.program_detail.bridge_migration_text', 'Instructor bridge links are now created at the course level. Navigate to individual courses to create bridge links for instructors.', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'lms.program_detail.bridge_migration_text', 'קישורי גישה למדריכים נוצרים כעת ברמת הקורס. נווט לקורסים בודדים כדי ליצור קישורי גישה למדריכים.', 'admin', NOW(), NOW(), tenant_uuid);
END $$;

-- ============================================================================
-- TRANSLATION INSERT COMPLETE
-- ============================================================================
-- Summary:
-- - Added 22 translation pairs (English + Hebrew)
-- - Covers all UI elements for course-level instructor bridge
-- - Includes migration notice for program-level pages
-- ============================================================================
