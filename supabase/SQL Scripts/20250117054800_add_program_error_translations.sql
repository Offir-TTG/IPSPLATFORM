-- ============================================================================
-- Program Form Error Translations Migration
-- ============================================================================
-- Adds translations for program form validation error messages
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
        ('en', 'lms.programs.error.name_required', 'Program name is required', 'admin', v_tenant_id, 'lms'),
        ('en', 'common.required_fields', 'Please fill in all required fields correctly', 'both', v_tenant_id, 'common')
    ON CONFLICT (language_code, translation_key) DO UPDATE SET
        translation_value = EXCLUDED.translation_value,
        context = EXCLUDED.context;

    -- ========================================================================
    -- INSERT HEBREW TRANSLATIONS
    -- ========================================================================

    INSERT INTO public.translations (language_code, translation_key, translation_value, context, tenant_id, category)
    VALUES
        ('he', 'lms.programs.error.name_required', 'יש להזין שם תוכנית', 'admin', v_tenant_id, 'lms'),
        ('he', 'common.required_fields', 'נא למלא את כל השדות הנדרשים כראוי', 'both', v_tenant_id, 'common')
    ON CONFLICT (language_code, translation_key) DO UPDATE SET
        translation_value = EXCLUDED.translation_value,
        context = EXCLUDED.context;

    RAISE NOTICE 'Program error translations added successfully for English and Hebrew';

END $$;
