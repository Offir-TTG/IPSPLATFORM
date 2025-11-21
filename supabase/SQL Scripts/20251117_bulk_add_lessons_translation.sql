-- ============================================================================
-- BULK ADD LESSONS TRANSLATION
-- Hebrew translation for bulk add lessons menu item
-- ============================================================================

DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get the first tenant
  SELECT id INTO v_tenant_id FROM public.tenants ORDER BY created_at LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No tenant found. Please create a tenant first.';
  END IF;

  -- Delete existing translation to avoid duplicates
  DELETE FROM public.translations
  WHERE language_code = 'he'
    AND translation_key = 'lms.builder.bulk_add_lessons';

  -- Insert Hebrew translation
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    (v_tenant_id, 'he', 'lms.builder.bulk_add_lessons', 'הוסף שיעורים בכמות', 'admin', NOW(), NOW());

  RAISE NOTICE 'Successfully added Hebrew translation for bulk add lessons';
END $$;
