-- Add translations for course/lesson date validation
-- Adds both English and Hebrew translations for validation warnings and errors

DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Get the first tenant_id from existing data
    SELECT tenant_id INTO v_tenant_id FROM public.translations LIMIT 1;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No tenant_id found in translations table';
    END IF;

    -- English translations
    INSERT INTO public.translations (language_code, translation_key, translation_value, context, tenant_id, created_at, updated_at)
    VALUES
        -- Validation warnings
        ('en', 'lms.courses.validation.title', 'Date Validation Warnings', 'admin', v_tenant_id, NOW(), NOW()),
        ('en', 'lms.courses.validation.lessons_outside_range', 'Some lessons are scheduled outside the course date range', 'admin', v_tenant_id, NOW(), NOW()),
        ('en', 'lms.courses.validation.lessons_outside_detail', '{count} lesson(s) scheduled outside course dates ({start} - {end})', 'admin', v_tenant_id, NOW(), NOW()),
        ('en', 'lms.courses.validation.no_end_date', 'Course has no end date - lessons can extend indefinitely', 'admin', v_tenant_id, NOW(), NOW()),
        ('en', 'lms.courses.validation.lesson_overlap', 'Lesson time conflict detected', 'admin', v_tenant_id, NOW(), NOW()),
        ('en', 'lms.courses.validation.lesson_overlap_detail', 'Lessons overlap: "{lesson1}" and "{lesson2}" both scheduled at {time}', 'admin', v_tenant_id, NOW(), NOW()),
        ('en', 'lms.courses.validation.course_overlap', 'Course overlaps with other courses in the same program', 'admin', v_tenant_id, NOW(), NOW()),
        ('en', 'lms.courses.validation.course_overlap_detail', 'Overlaps with: {courses}', 'admin', v_tenant_id, NOW(), NOW()),
        ('en', 'lms.courses.validation.save_anyway', 'Save Anyway', 'admin', v_tenant_id, NOW(), NOW()),
        ('en', 'lms.courses.validation.review', 'Review Issues', 'admin', v_tenant_id, NOW(), NOW()),
        ('en', 'lms.courses.validation.cannot_save', 'Cannot save: Critical validation errors', 'admin', v_tenant_id, NOW(), NOW())
    ON CONFLICT (tenant_id, language_code, translation_key)
    DO UPDATE SET
        translation_value = EXCLUDED.translation_value,
        context = EXCLUDED.context,
        updated_at = NOW();

    -- Hebrew translations
    INSERT INTO public.translations (language_code, translation_key, translation_value, context, tenant_id, created_at, updated_at)
    VALUES
        -- Validation warnings
        ('he', 'lms.courses.validation.title', 'אזהרות תאימות תאריכים', 'admin', v_tenant_id, NOW(), NOW()),
        ('he', 'lms.courses.validation.lessons_outside_range', 'שיעורים מסוימים מתוזמנים מחוץ לטווח תאריכי הקורס', 'admin', v_tenant_id, NOW(), NOW()),
        ('he', 'lms.courses.validation.lessons_outside_detail', '{count} שיעור/ים מתוזמנים מחוץ לתאריכי הקורס ({start} - {end})', 'admin', v_tenant_id, NOW(), NOW()),
        ('he', 'lms.courses.validation.no_end_date', 'לקורס אין תאריך סיום - השיעורים יכולים להמשך ללא הגבלה', 'admin', v_tenant_id, NOW(), NOW()),
        ('he', 'lms.courses.validation.lesson_overlap', 'זוהתה התנגשות בין שיעורים', 'admin', v_tenant_id, NOW(), NOW()),
        ('he', 'lms.courses.validation.lesson_overlap_detail', 'שיעורים חופפים: "{lesson1}" ו-"{lesson2}" שניהם מתוזמנים ב-{time}', 'admin', v_tenant_id, NOW(), NOW()),
        ('he', 'lms.courses.validation.course_overlap', 'הקורס חופף לקורסים אחרים באותה תוכנית', 'admin', v_tenant_id, NOW(), NOW()),
        ('he', 'lms.courses.validation.course_overlap_detail', 'חופף עם: {courses}', 'admin', v_tenant_id, NOW(), NOW()),
        ('he', 'lms.courses.validation.save_anyway', 'שמור בכל זאת', 'admin', v_tenant_id, NOW(), NOW()),
        ('he', 'lms.courses.validation.review', 'סקור בעיות', 'admin', v_tenant_id, NOW(), NOW()),
        ('he', 'lms.courses.validation.cannot_save', 'לא ניתן לשמור: שגיאות קריטיות באימות', 'admin', v_tenant_id, NOW(), NOW())
    ON CONFLICT (tenant_id, language_code, translation_key)
    DO UPDATE SET
        translation_value = EXCLUDED.translation_value,
        context = EXCLUDED.context,
        updated_at = NOW();

    RAISE NOTICE 'Course validation translations added successfully for English and Hebrew';

END $$;
