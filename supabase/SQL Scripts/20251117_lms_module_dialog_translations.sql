-- ============================================================================
-- LMS MODULE DIALOG TRANSLATIONS
-- Hebrew translations for module creation and editing
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

  -- Delete existing translations to avoid duplicates
  DELETE FROM public.translations
  WHERE language_code = 'he'
    AND translation_key IN (
      'lms.builder.module_description',
      'lms.builder.update_module',
      'lms.builder.module_updated',
      'lms.builder.dialog_edit_module_description',
      'lms.builder.published_description',
      'lms.builder.optional_description',
      'common.saving'
    );

  -- Insert Hebrew translations
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    -- Module dialog
    (v_tenant_id, 'he', 'lms.builder.module_description', 'תיאור', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.update_module', 'עדכן מודול', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.module_updated', 'מודול עודכן בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.dialog_edit_module_description', 'עדכן את פרטי המודול', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.published_description', 'הפוך מודול זה לגלוי לתלמידים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.optional_description', 'תלמידים יכולים לדלג על מודול זה', 'admin', NOW(), NOW()),

    -- Common
    (v_tenant_id, 'he', 'common.saving', 'שומר...', 'admin', NOW(), NOW());

  RAISE NOTICE 'Successfully added % Hebrew translations for module dialog', (
    SELECT COUNT(*)
    FROM translations
    WHERE translation_key IN (
      'lms.builder.module_description',
      'lms.builder.update_module',
      'lms.builder.module_updated',
      'lms.builder.dialog_edit_module_description',
      'lms.builder.published_description',
      'lms.builder.optional_description',
      'common.saving'
    )
      AND language_code = 'he'
      AND tenant_id = v_tenant_id
  );
END $$;
