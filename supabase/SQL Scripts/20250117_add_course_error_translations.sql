-- ============================================================================
-- Course Form Error Translations Migration
-- ============================================================================
-- Adds translations for course form validation error messages
-- ============================================================================

DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Get the first tenant_id from existing data
    SELECT tenant_id INTO v_tenant_id FROM public.translations LIMIT 1;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No tenant_id found in translations table';
    END IF;

    -- ========================================================================
    -- INSERT ENGLISH TRANSLATIONS
    -- ========================================================================

    INSERT INTO public.translations (language_code, translation_key, translation_value, context, tenant_id, category)
    VALUES
        ('en', 'lms.courses.error.title_required', 'Course title is required', 'admin', v_tenant_id, 'lms'),
        ('en', 'lms.courses.error.program_required', 'Please select a program', 'admin', v_tenant_id, 'lms'),
        ('en', 'lms.courses.error.start_date_required', 'Start date is required', 'admin', v_tenant_id, 'lms'),
        ('en', 'lms.courses.error.end_date_invalid', 'End date must be after start date', 'admin', v_tenant_id, 'lms')
    ON CONFLICT (language_code, translation_key) DO UPDATE SET
        translation_value = EXCLUDED.translation_value,
        context = EXCLUDED.context;

    -- ========================================================================
    -- INSERT HEBREW TRANSLATIONS
    -- ========================================================================

    INSERT INTO public.translations (language_code, translation_key, translation_value, context, tenant_id, category)
    VALUES
        ('he', 'lms.courses.error.title_required', 'יש להזין שם קורס', 'admin', v_tenant_id, 'lms'),
        ('he', 'lms.courses.error.program_required', 'יש לבחור תוכנית', 'admin', v_tenant_id, 'lms'),
        ('he', 'lms.courses.error.start_date_required', 'יש להזין תאריך התחלה', 'admin', v_tenant_id, 'lms'),
        ('he', 'lms.courses.error.end_date_invalid', 'תאריך סיום חייב להיות אחרי תאריך ההתחלה', 'admin', v_tenant_id, 'lms')
    ON CONFLICT (language_code, translation_key) DO UPDATE SET
        translation_value = EXCLUDED.translation_value,
        context = EXCLUDED.context;

    RAISE NOTICE 'Course error translations added successfully for English and Hebrew';

END $$;
