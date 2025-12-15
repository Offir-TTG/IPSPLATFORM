-- =====================================================
-- Product Validation Translations
-- =====================================================
-- Adds translation for product form validation message
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

    -- English translation
    INSERT INTO public.translations (language_code, translation_key, translation_value, context, tenant_id, created_at, updated_at)
    VALUES
        ('en', 'products.validation.complete_required', 'Please complete all required fields before proceeding', 'admin', v_tenant_id, NOW(), NOW())
    ON CONFLICT (tenant_id, language_code, translation_key)
    DO UPDATE SET
        translation_value = EXCLUDED.translation_value,
        context = EXCLUDED.context,
        updated_at = NOW();

    -- Hebrew translation
    INSERT INTO public.translations (language_code, translation_key, translation_value, context, tenant_id, created_at, updated_at)
    VALUES
        ('he', 'products.validation.complete_required', 'אנא השלם את כל השדות הנדרשים לפני המשך', 'admin', v_tenant_id, NOW(), NOW())
    ON CONFLICT (tenant_id, language_code, translation_key)
    DO UPDATE SET
        translation_value = EXCLUDED.translation_value,
        context = EXCLUDED.context,
        updated_at = NOW();

    RAISE NOTICE 'Successfully added/updated product validation translation for tenant %', v_tenant_id;
END $$;
