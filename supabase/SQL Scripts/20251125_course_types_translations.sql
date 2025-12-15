-- Course Types Translations
-- Adds translations for all course types: course, lecture, workshop, webinar, session

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
        -- Course Types
        ('en', 'lms.course.type_course', 'Course', 'admin', v_tenant_id, NOW(), NOW()),
        ('en', 'lms.course.type_lecture', 'Lecture', 'admin', v_tenant_id, NOW(), NOW()),
        ('en', 'lms.course.type_workshop', 'Workshop', 'admin', v_tenant_id, NOW(), NOW()),
        ('en', 'lms.course.type_webinar', 'Webinar', 'admin', v_tenant_id, NOW(), NOW()),
        ('en', 'lms.course.type_session', 'Session', 'admin', v_tenant_id, NOW(), NOW())
    ON CONFLICT (tenant_id, language_code, translation_key)
    DO UPDATE SET
        translation_value = EXCLUDED.translation_value,
        context = EXCLUDED.context,
        updated_at = NOW();

    -- Hebrew translations
    INSERT INTO public.translations (language_code, translation_key, translation_value, context, tenant_id, created_at, updated_at)
    VALUES
        -- Course Types
        ('he', 'lms.course.type_course', 'קורס', 'admin', v_tenant_id, NOW(), NOW()),
        ('he', 'lms.course.type_lecture', 'הרצאה', 'admin', v_tenant_id, NOW(), NOW()),
        ('he', 'lms.course.type_workshop', 'סדנה', 'admin', v_tenant_id, NOW(), NOW()),
        ('he', 'lms.course.type_webinar', 'וובינר', 'admin', v_tenant_id, NOW(), NOW()),
        ('he', 'lms.course.type_session', 'מפגש', 'admin', v_tenant_id, NOW(), NOW())
    ON CONFLICT (tenant_id, language_code, translation_key)
    DO UPDATE SET
        translation_value = EXCLUDED.translation_value,
        context = EXCLUDED.context,
        updated_at = NOW();

    RAISE NOTICE 'Successfully added/updated course type translations for tenant %', v_tenant_id;
END $$;
