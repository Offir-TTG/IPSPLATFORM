-- Add WhatsApp toggle translation
-- This adds the translation for the WhatsApp toggle in profile edit

DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Get the first tenant_id (assuming single tenant for now)
    SELECT tenant_id INTO v_tenant_id FROM public.translations LIMIT 1;

    -- Insert English translations
    INSERT INTO public.translations (language_code, translation_key, translation_value, context, tenant_id, created_at, updated_at)
    VALUES
        ('en', 'user.profile.edit.is_whatsapp', 'This number has WhatsApp', 'user', v_tenant_id, NOW(), NOW())
    ON CONFLICT (tenant_id, language_code, translation_key)
    DO UPDATE SET
        translation_value = EXCLUDED.translation_value,
        context = EXCLUDED.context,
        updated_at = NOW();

    -- Insert Hebrew translations
    INSERT INTO public.translations (language_code, translation_key, translation_value, context, tenant_id, created_at, updated_at)
    VALUES
        ('he', 'user.profile.edit.is_whatsapp', 'למספר זה יש ווטסאפ', 'user', v_tenant_id, NOW(), NOW())
    ON CONFLICT (tenant_id, language_code, translation_key)
    DO UPDATE SET
        translation_value = EXCLUDED.translation_value,
        context = EXCLUDED.context,
        updated_at = NOW();

    RAISE NOTICE 'WhatsApp toggle translations added successfully';
END $$;
