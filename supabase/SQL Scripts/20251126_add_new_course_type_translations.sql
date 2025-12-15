-- =====================================================
-- Add New Course Type Translations
-- =====================================================
-- Adds translations for new course types: session_pack, bundle, custom
-- (Note: program, course, lecture, workshop, webinar, session already exist)
-- =====================================================

DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Get the first tenant_id from existing data
    SELECT tenant_id INTO v_tenant_id FROM public.translations LIMIT 1;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No tenant_id found in translations table';
    END IF;

    -- English translations for new course types
    INSERT INTO public.translations (language_code, translation_key, translation_value, context, tenant_id, created_at, updated_at)
    VALUES
        ('en', 'lms.course.type_session_pack', 'Session Pack', 'admin', v_tenant_id, NOW(), NOW()),
        ('en', 'lms.course.type_bundle', 'Bundle', 'admin', v_tenant_id, NOW(), NOW()),
        ('en', 'lms.course.type_custom', 'Custom', 'admin', v_tenant_id, NOW(), NOW())
    ON CONFLICT (tenant_id, language_code, translation_key)
    DO UPDATE SET
        translation_value = EXCLUDED.translation_value,
        context = EXCLUDED.context,
        updated_at = NOW();

    -- Hebrew translations for new course types
    INSERT INTO public.translations (language_code, translation_key, translation_value, context, tenant_id, created_at, updated_at)
    VALUES
        ('he', 'lms.course.type_session_pack', 'חבילת מפגשים', 'admin', v_tenant_id, NOW(), NOW()),
        ('he', 'lms.course.type_bundle', 'חבילה', 'admin', v_tenant_id, NOW(), NOW()),
        ('he', 'lms.course.type_custom', 'מותאם אישית', 'admin', v_tenant_id, NOW(), NOW())
    ON CONFLICT (tenant_id, language_code, translation_key)
    DO UPDATE SET
        translation_value = EXCLUDED.translation_value,
        context = EXCLUDED.context,
        updated_at = NOW();

    RAISE NOTICE 'Successfully added/updated new course type translations for tenant %', v_tenant_id;
END $$;
