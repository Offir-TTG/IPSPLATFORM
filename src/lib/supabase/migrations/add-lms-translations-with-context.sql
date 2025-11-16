-- ============================================================================
-- LMS Translations Migration (WITH CONTEXT FIELD)
-- ============================================================================
-- This version includes the context field in the translations table
-- ============================================================================

-- Get tenant_id for insertions
DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Get the first tenant_id from existing data
    SELECT tenant_id INTO v_tenant_id FROM public.translation_keys LIMIT 1;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No tenant_id found in translation_keys table';
    END IF;

    -- Insert Navigation Keys
    INSERT INTO public.translation_keys (key, category, description, context, tenant_id)
    VALUES
        ('admin.nav.learning', 'admin', 'LMS section title in admin sidebar', 'admin', v_tenant_id),
        ('admin.nav.lms_courses', 'admin', 'LMS Courses menu item in admin sidebar', 'admin', v_tenant_id)
    ON CONFLICT (key) DO UPDATE SET
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        context = EXCLUDED.context,
        tenant_id = EXCLUDED.tenant_id;

    -- Insert Course List Keys
    INSERT INTO public.translation_keys (key, category, description, context, tenant_id)
    VALUES
        ('lms.courses.title', 'lms', 'Course list page title', 'admin', v_tenant_id),
        ('lms.courses.subtitle', 'lms', 'Course list page subtitle', 'admin', v_tenant_id),
        ('lms.courses.create', 'lms', 'Create course button text', 'admin', v_tenant_id),
        ('lms.courses.search_placeholder', 'lms', 'Search courses placeholder', 'admin', v_tenant_id),
        ('lms.courses.filter_by_status', 'lms', 'Filter by status placeholder', 'admin', v_tenant_id),
        ('lms.courses.all_courses', 'lms', 'All courses filter option', 'admin', v_tenant_id),
        ('lms.courses.active', 'lms', 'Active courses filter option', 'admin', v_tenant_id),
        ('lms.courses.inactive', 'lms', 'Inactive courses filter option', 'admin', v_tenant_id),
        ('lms.courses.loading', 'lms', 'Loading courses message', 'admin', v_tenant_id),
        ('lms.courses.no_courses', 'lms', 'Empty state message', 'admin', v_tenant_id),
        ('lms.courses.get_started', 'lms', 'Empty state description', 'admin', v_tenant_id),
        ('lms.courses.manage', 'lms', 'Manage course button text', 'admin', v_tenant_id),
        ('lms.courses.duplicate', 'lms', 'Duplicate course action', 'admin', v_tenant_id),
        ('lms.courses.delete', 'lms', 'Delete course action', 'admin', v_tenant_id),
        ('lms.courses.edit', 'lms', 'Edit course action', 'admin', v_tenant_id),
        ('lms.courses.activate', 'lms', 'Activate course action', 'admin', v_tenant_id),
        ('lms.courses.deactivate', 'lms', 'Deactivate course action', 'admin', v_tenant_id),
        ('lms.courses.no_instructor', 'lms', 'No instructor assigned message', 'admin', v_tenant_id),
        ('lms.courses.create_dialog_title', 'lms', 'Create course dialog title', 'admin', v_tenant_id),
        ('lms.courses.create_dialog_description', 'lms', 'Create course dialog description', 'admin', v_tenant_id),
        ('lms.courses.course_title', 'lms', 'Course title field label', 'admin', v_tenant_id),
        ('lms.courses.course_title_placeholder', 'lms', 'Course title placeholder', 'admin', v_tenant_id),
        ('lms.courses.description', 'lms', 'Description field label', 'admin', v_tenant_id),
        ('lms.courses.description_placeholder', 'lms', 'Description placeholder', 'admin', v_tenant_id),
        ('lms.courses.program', 'lms', 'Program field label', 'admin', v_tenant_id),
        ('lms.courses.select_program', 'lms', 'Select program placeholder', 'admin', v_tenant_id),
        ('lms.courses.no_programs', 'lms', 'No programs available message', 'admin', v_tenant_id),
        ('lms.courses.program_help', 'lms', 'Program field help text', 'admin', v_tenant_id),
        ('lms.courses.start_date', 'lms', 'Start date field label', 'admin', v_tenant_id),
        ('lms.courses.end_date', 'lms', 'End date field label', 'admin', v_tenant_id),
        ('lms.courses.activate_immediately', 'lms', 'Activate immediately checkbox label', 'admin', v_tenant_id),
        ('lms.courses.cancel', 'lms', 'Cancel button text', 'admin', v_tenant_id),
        ('lms.courses.creating', 'lms', 'Creating state text', 'admin', v_tenant_id),
        ('lms.courses.delete_dialog_title', 'lms', 'Delete dialog title', 'admin', v_tenant_id),
        ('lms.courses.delete_dialog_description', 'lms', 'Delete dialog description', 'admin', v_tenant_id),
        ('lms.courses.deleting', 'lms', 'Deleting state text', 'admin', v_tenant_id)
    ON CONFLICT (key) DO UPDATE SET
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        context = EXCLUDED.context,
        tenant_id = EXCLUDED.tenant_id;

    -- Insert Course Builder Keys
    INSERT INTO public.translation_keys (key, category, description, context, tenant_id)
    VALUES
        ('lms.builder.title', 'lms', 'Course builder page title', 'admin', v_tenant_id),
        ('lms.builder.back', 'lms', 'Back button text', 'admin', v_tenant_id),
        ('lms.builder.save', 'lms', 'Save changes button text', 'admin', v_tenant_id),
        ('lms.builder.preview', 'lms', 'Preview button text', 'admin', v_tenant_id),
        ('lms.builder.structure', 'lms', 'Course structure section title', 'admin', v_tenant_id),
        ('lms.builder.add', 'lms', 'Add button text', 'admin', v_tenant_id),
        ('lms.builder.details', 'lms', 'Course details tab title', 'admin', v_tenant_id),
        ('lms.builder.settings', 'lms', 'Settings tab title', 'admin', v_tenant_id)
    ON CONFLICT (key) DO UPDATE SET
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        context = EXCLUDED.context,
        tenant_id = EXCLUDED.tenant_id;
END $$;

-- Insert English Translations WITH CONTEXT
DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Get the first tenant_id from existing translations
    SELECT tenant_id INTO v_tenant_id FROM public.translations LIMIT 1;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No tenant_id found in translations table';
    END IF;

    -- Navigation translations
    INSERT INTO public.translations (language_code, translation_key, translation_value, category, context, tenant_id)
    VALUES
        ('en', 'admin.nav.learning', 'Learning', 'admin', 'admin', v_tenant_id),
        ('en', 'admin.nav.lms_courses', 'LMS Courses', 'admin', 'admin', v_tenant_id)
    ON CONFLICT (language_code, translation_key) DO UPDATE
    SET translation_value = EXCLUDED.translation_value,
        category = EXCLUDED.category,
        context = EXCLUDED.context,
        tenant_id = EXCLUDED.tenant_id,
        updated_at = NOW();

    -- Course List translations
    INSERT INTO public.translations (language_code, translation_key, translation_value, category, context, tenant_id)
    VALUES
        ('en', 'lms.courses.title', 'Courses', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.subtitle', 'Manage your courses, modules, and lessons', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.create', 'Create Course', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.search_placeholder', 'Search courses...', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.filter_by_status', 'Filter by status', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.all_courses', 'All Courses', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.active', 'Active', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.inactive', 'Inactive', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.loading', 'Loading courses...', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.no_courses', 'No courses found', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.get_started', 'Get started by creating your first course', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.manage', 'Manage Course', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.duplicate', 'Duplicate', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.delete', 'Delete', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.edit', 'Edit Course', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.activate', 'Activate', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.deactivate', 'Deactivate', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.no_instructor', 'No instructor', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.create_dialog_title', 'Create New Course', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.create_dialog_description', 'Enter the course details below. You can add modules and lessons after creating the course.', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.course_title', 'Course Title', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.course_title_placeholder', 'e.g., Introduction to Programming', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.description', 'Description', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.description_placeholder', 'Course description...', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.program', 'Program', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.select_program', 'Select a program', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.no_programs', 'No programs available', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.program_help', 'Select the program this course belongs to', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.start_date', 'Start Date', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.end_date', 'End Date', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.activate_immediately', 'Activate course immediately', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.cancel', 'Cancel', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.creating', 'Creating...', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.delete_dialog_title', 'Delete Course', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.delete_dialog_description', 'Are you sure you want to delete this course? This will also delete all modules, lessons, and student progress. This action cannot be undone.', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.courses.deleting', 'Deleting...', 'lms', 'admin', v_tenant_id)
    ON CONFLICT (language_code, translation_key) DO UPDATE
    SET translation_value = EXCLUDED.translation_value,
        category = EXCLUDED.category,
        context = EXCLUDED.context,
        tenant_id = EXCLUDED.tenant_id,
        updated_at = NOW();

    -- Course Builder translations
    INSERT INTO public.translations (language_code, translation_key, translation_value, category, context, tenant_id)
    VALUES
        ('en', 'lms.builder.title', 'Course Builder', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.builder.back', 'Back', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.builder.save', 'Save Changes', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.builder.preview', 'Preview', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.builder.structure', 'Course Structure', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.builder.add', 'Add', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.builder.details', 'Course Details', 'lms', 'admin', v_tenant_id),
        ('en', 'lms.builder.settings', 'Settings', 'lms', 'admin', v_tenant_id)
    ON CONFLICT (language_code, translation_key) DO UPDATE
    SET translation_value = EXCLUDED.translation_value,
        category = EXCLUDED.category,
        context = EXCLUDED.context,
        tenant_id = EXCLUDED.tenant_id,
        updated_at = NOW();
END $$;

-- Insert Hebrew Translations WITH CONTEXT
DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Get the first tenant_id from existing translations
    SELECT tenant_id INTO v_tenant_id FROM public.translations LIMIT 1;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No tenant_id found in translations table';
    END IF;

    -- Navigation translations
    INSERT INTO public.translations (language_code, translation_key, translation_value, category, context, tenant_id)
    VALUES
        ('he', 'admin.nav.learning', 'למידה', 'admin', 'admin', v_tenant_id),
        ('he', 'admin.nav.lms_courses', 'קורסי LMS', 'admin', 'admin', v_tenant_id)
    ON CONFLICT (language_code, translation_key) DO UPDATE
    SET translation_value = EXCLUDED.translation_value,
        category = EXCLUDED.category,
        context = EXCLUDED.context,
        tenant_id = EXCLUDED.tenant_id,
        updated_at = NOW();

    -- Course List translations
    INSERT INTO public.translations (language_code, translation_key, translation_value, category, context, tenant_id)
    VALUES
        ('he', 'lms.courses.title', 'קורסים', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.subtitle', 'נהל את הקורסים, המודולים והשיעורים שלך', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.create', 'צור קורס', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.search_placeholder', 'חפש קורסים...', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.filter_by_status', 'סנן לפי סטטוס', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.all_courses', 'כל הקורסים', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.active', 'פעיל', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.inactive', 'לא פעיל', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.loading', 'טוען קורסים...', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.no_courses', 'לא נמצאו קורסים', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.get_started', 'התחל ביצירת הקורס הראשון שלך', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.manage', 'נהל קורס', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.duplicate', 'שכפל', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.delete', 'מחק', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.edit', 'ערוך קורס', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.activate', 'הפעל', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.deactivate', 'השבת', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.no_instructor', 'אין מדריך', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.create_dialog_title', 'צור קורס חדש', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.create_dialog_description', 'הזן את פרטי הקורס למטה. תוכל להוסיף מודולים ושיעורים לאחר יצירת הקורס.', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.course_title', 'כותרת הקורס', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.course_title_placeholder', 'לדוגמה, מבוא לתכנות', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.description', 'תיאור', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.description_placeholder', 'תיאור הקורס...', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.program', 'תוכנית', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.select_program', 'בחר תוכנית', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.no_programs', 'אין תוכניות זמינות', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.program_help', 'בחר את התוכנית שאליה שייך הקורס', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.start_date', 'תאריך התחלה', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.end_date', 'תאריך סיום', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.activate_immediately', 'הפעל קורס מיד', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.cancel', 'ביטול', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.creating', 'יוצר...', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.delete_dialog_title', 'מחק קורס', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.delete_dialog_description', 'האם אתה בטוח שברצונך למחוק קורס זה? פעולה זו תמחק גם את כל המודולים, השיעורים והתקדמות התלמידים. לא ניתן לבטל פעולה זו.', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.courses.deleting', 'מוחק...', 'lms', 'admin', v_tenant_id)
    ON CONFLICT (language_code, translation_key) DO UPDATE
    SET translation_value = EXCLUDED.translation_value,
        category = EXCLUDED.category,
        context = EXCLUDED.context,
        tenant_id = EXCLUDED.tenant_id,
        updated_at = NOW();

    -- Course Builder translations
    INSERT INTO public.translations (language_code, translation_key, translation_value, category, context, tenant_id)
    VALUES
        ('he', 'lms.builder.title', 'בונה קורסים', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.builder.back', 'חזור', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.builder.save', 'שמור שינויים', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.builder.preview', 'תצוגה מקדימה', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.builder.structure', 'מבנה הקורס', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.builder.add', 'הוסף', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.builder.details', 'פרטי הקורס', 'lms', 'admin', v_tenant_id),
        ('he', 'lms.builder.settings', 'הגדרות', 'lms', 'admin', v_tenant_id)
    ON CONFLICT (language_code, translation_key) DO UPDATE
    SET translation_value = EXCLUDED.translation_value,
        category = EXCLUDED.category,
        context = EXCLUDED.context,
        tenant_id = EXCLUDED.tenant_id,
        updated_at = NOW();
END $$;

-- Verify the results
SELECT 'Translation keys added:' as status, COUNT(*) as count
FROM public.translation_keys
WHERE key LIKE 'admin.nav.l%' OR key LIKE 'lms.%';

SELECT 'Translations by language:' as status, language_code, COUNT(*) as count
FROM public.translations
WHERE translation_key LIKE 'admin.nav.l%' OR translation_key LIKE 'lms.%'
GROUP BY language_code;