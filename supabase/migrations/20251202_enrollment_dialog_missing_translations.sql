-- Missing Enrollment Dialog Translations

DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Get the first tenant_id from existing data
    SELECT tenant_id INTO v_tenant_id FROM public.translations LIMIT 1;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No tenant_id found in translations table';
    END IF;

    -- Insert missing translations
    INSERT INTO public.translations (language_code, translation_key, translation_value, context, tenant_id, created_at, updated_at)
    VALUES
    -- Product help text
    ('en', 'admin.enrollments.create.productHelp', 'Products contain all program/course information including pricing and payment plans', 'admin', v_tenant_id, NOW(), NOW()),
    ('he', 'admin.enrollments.create.productHelp', 'מוצרים מכילים את כל המידע על תוכניות/קורסים כולל תמחור ותוכניות תשלום', 'admin', v_tenant_id, NOW(), NOW()),

    -- Product types (for display in dropdowns and cards)
    ('en', 'productType.program', 'Program', 'both', v_tenant_id, NOW(), NOW()),
    ('he', 'productType.program', 'תוכנית', 'both', v_tenant_id, NOW(), NOW()),
    ('en', 'productType.course', 'Course', 'both', v_tenant_id, NOW(), NOW()),
    ('he', 'productType.course', 'קורס', 'both', v_tenant_id, NOW(), NOW()),
    ('en', 'productType.bundle', 'Bundle', 'both', v_tenant_id, NOW(), NOW()),
    ('he', 'productType.bundle', 'חבילה', 'both', v_tenant_id, NOW(), NOW()),
    ('en', 'productType.session_pack', 'Session Pack', 'both', v_tenant_id, NOW(), NOW()),
    ('he', 'productType.session_pack', 'חבילת מפגשים', 'both', v_tenant_id, NOW(), NOW()),
    ('en', 'productType.workshop', 'Workshop', 'both', v_tenant_id, NOW(), NOW()),
    ('he', 'productType.workshop', 'סדנה', 'both', v_tenant_id, NOW(), NOW()),
    ('en', 'productType.webinar', 'Webinar', 'both', v_tenant_id, NOW(), NOW()),
    ('he', 'productType.webinar', 'וובינר', 'both', v_tenant_id, NOW(), NOW())

    ON CONFLICT (tenant_id, language_code, translation_key)
    DO UPDATE SET
      translation_value = EXCLUDED.translation_value,
      updated_at = NOW();

    RAISE NOTICE 'Successfully inserted missing enrollment dialog translations for tenant %', v_tenant_id;
END $$;

-- Verify insertions
SELECT
  language_code,
  translation_key,
  translation_value
FROM translations
WHERE translation_key IN ('admin.enrollments.create.productHelp', 'productType.program', 'productType.course', 'productType.bundle', 'productType.session_pack')
ORDER BY language_code, translation_key;
