-- ============================================================================
-- LMS DELETE DIALOGS TRANSLATIONS
-- Hebrew translations for module and lesson delete confirmation dialogs
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
      'lms.module.delete_title',
      'lms.module.delete_confirmation',
      'lms.module.deleted_success',
      'lms.module.delete_failed',
      'lms.lesson.delete_title',
      'lms.lesson.delete_confirmation',
      'lms.lesson.deleted_success',
      'lms.lesson.delete_failed',
      'common.delete'
    );

  -- Insert Hebrew translations
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    -- Module delete dialog
    (v_tenant_id, 'he', 'lms.module.delete_title', 'מחק מודול', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.module.delete_confirmation', 'האם אתה בטוח שברצונך למחוק מודול זה ואת כל השיעורים שבו? פעולה זו אינה הפיכה.', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.module.deleted_success', 'מודול נמחק בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.module.delete_failed', 'מחיקת מודול נכשלה', 'admin', NOW(), NOW()),

    -- Lesson delete dialog
    (v_tenant_id, 'he', 'lms.lesson.delete_title', 'מחק שיעור', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.delete_confirmation', 'האם אתה בטוח שברצונך למחוק שיעור זה? פעולה זו אינה הפיכה.', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.deleted_success', 'שיעור נמחק בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.delete_failed', 'מחיקת שיעור נכשלה', 'admin', NOW(), NOW()),

    -- Common delete button
    (v_tenant_id, 'he', 'common.delete', 'מחק', 'admin', NOW(), NOW());

  RAISE NOTICE 'Successfully added % Hebrew translations for delete dialogs', (
    SELECT COUNT(*)
    FROM translations
    WHERE translation_key IN (
      'lms.module.delete_title',
      'lms.module.delete_confirmation',
      'lms.module.deleted_success',
      'lms.module.delete_failed',
      'lms.lesson.delete_title',
      'lms.lesson.delete_confirmation',
      'lms.lesson.deleted_success',
      'lms.lesson.delete_failed',
      'common.delete'
    )
      AND language_code = 'he'
      AND tenant_id = v_tenant_id
  );
END $$;
