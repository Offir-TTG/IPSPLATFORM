-- Add translations for course image upload UI
-- Adds both English and Hebrew translations for the image upload section

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
        ('en', 'lms.courses.upload_image', 'Click to upload image', 'admin', v_tenant_id, NOW(), NOW()),
        ('en', 'lms.courses.image_formats', 'PNG, JPG, GIF up to 5MB', 'admin', v_tenant_id, NOW(), NOW()),
        ('en', 'lms.courses.start_date', 'Start Date', 'admin', v_tenant_id, NOW(), NOW()),
        ('en', 'lms.courses.end_date', 'End Date', 'admin', v_tenant_id, NOW(), NOW()),
        ('en', 'lms.courses.date_separator', '-', 'admin', v_tenant_id, NOW(), NOW()),
        ('en', 'lms.courses.loading', 'Loading courses...', 'admin', v_tenant_id, NOW(), NOW()),
        ('en', 'lms.courses.creating', 'Creating...', 'admin', v_tenant_id, NOW(), NOW()),
        ('en', 'lms.courses.updating', 'Updating...', 'admin', v_tenant_id, NOW(), NOW()),
        ('en', 'lms.courses.duplicating', 'Duplicating...', 'admin', v_tenant_id, NOW(), NOW())
    ON CONFLICT (tenant_id, language_code, translation_key)
    DO UPDATE SET
        translation_value = EXCLUDED.translation_value,
        context = EXCLUDED.context,
        updated_at = NOW();

    -- Hebrew translations
    INSERT INTO public.translations (language_code, translation_key, translation_value, context, tenant_id, created_at, updated_at)
    VALUES
        ('he', 'lms.courses.upload_image', 'לחץ להעלאת תמונה', 'admin', v_tenant_id, NOW(), NOW()),
        ('he', 'lms.courses.image_formats', 'PNG, JPG, GIF עד 5MB', 'admin', v_tenant_id, NOW(), NOW()),
        ('he', 'lms.courses.start_date', 'תאריך התחלה', 'admin', v_tenant_id, NOW(), NOW()),
        ('he', 'lms.courses.end_date', 'תאריך סיום', 'admin', v_tenant_id, NOW(), NOW()),
        ('he', 'lms.courses.date_separator', 'עד', 'admin', v_tenant_id, NOW(), NOW()),
        ('he', 'lms.courses.loading', 'טוען קורסים...', 'admin', v_tenant_id, NOW(), NOW()),
        ('he', 'lms.courses.creating', 'יוצר...', 'admin', v_tenant_id, NOW(), NOW()),
        ('he', 'lms.courses.updating', 'מעדכן...', 'admin', v_tenant_id, NOW(), NOW()),
        ('he', 'lms.courses.duplicating', 'משכפל...', 'admin', v_tenant_id, NOW(), NOW())
    ON CONFLICT (tenant_id, language_code, translation_key)
    DO UPDATE SET
        translation_value = EXCLUDED.translation_value,
        context = EXCLUDED.context,
        updated_at = NOW();

    RAISE NOTICE 'Course UI translations added successfully for English and Hebrew (image upload and dates)';

END $$;
