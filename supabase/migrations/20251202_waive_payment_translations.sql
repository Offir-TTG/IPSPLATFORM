-- =====================================================
-- Waive Payment Translation
-- =====================================================
-- Translation for the new "Waive Payment" checkbox
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

    -- Insert waive payment translation
    INSERT INTO public.translations (language_code, translation_key, translation_value, context, tenant_id, created_at, updated_at)
    VALUES
    ('en', 'admin.enrollments.create.waivePayment', 'Waive payment requirement (scholarship, staff, or free enrollment)', 'admin', v_tenant_id, NOW(), NOW()),
    ('he', 'admin.enrollments.create.waivePayment', 'ויתור על דרישת תשלום (מלגה, צוות, או רישום חינם)', 'admin', v_tenant_id, NOW(), NOW())

    ON CONFLICT (tenant_id, language_code, translation_key)
    DO UPDATE SET
      translation_value = EXCLUDED.translation_value,
      updated_at = NOW();

    RAISE NOTICE 'Successfully inserted waive payment translation for tenant %', v_tenant_id;
END $$;

-- Verify insertion
SELECT
  language_code,
  translation_key,
  translation_value
FROM translations
WHERE translation_key = 'admin.enrollments.create.waivePayment'
ORDER BY language_code;
