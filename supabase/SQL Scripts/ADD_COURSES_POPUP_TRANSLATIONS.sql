-- ============================================================================
-- ADD COURSES POPUP - HEBREW TRANSLATIONS
-- Run this in Supabase SQL Editor
-- ============================================================================

DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get the first tenant (for single-tenant setup, or adjust as needed)
  SELECT id INTO v_tenant_id FROM public.tenants ORDER BY created_at LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No tenant found. Please create a tenant first.';
  END IF;

  -- Delete existing translations for Add Courses popup to avoid duplicates
  DELETE FROM public.translations
  WHERE language_code = 'he'
    AND translation_key LIKE 'lms.program_detail.add_courses%'
    AND tenant_id = v_tenant_id;

  -- Insert Hebrew translations for Add Courses popup
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    -- Dialog title and description
    (v_tenant_id, 'he', 'lms.program_detail.add_courses_title', 'הוסף קורסים לתוכנית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.add_courses_description', 'בחר קורס אחד או יותר להוספה לתוכנית זו', 'admin', NOW(), NOW()),

    -- Search and bulk actions
    (v_tenant_id, 'he', 'lms.program_detail.search_courses', 'חפש קורסים...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.select_all', 'בחר הכל', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.deselect_all', 'בטל בחירת הכל', 'admin', NOW(), NOW()),

    -- Selection feedback
    (v_tenant_id, 'he', 'lms.program_detail.courses_selected', '{count} קורסים נבחרו', 'admin', NOW(), NOW()),

    -- Empty states
    (v_tenant_id, 'he', 'lms.program_detail.no_courses_found', 'לא נמצאו קורסים התואמים לחיפוש', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.no_available_courses', 'אין קורסים זמינים להוספה', 'admin', NOW(), NOW()),

    -- Action buttons
    (v_tenant_id, 'he', 'lms.program_detail.add_courses_button', 'הוסף קורסים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.add_courses_count', 'הוסף {count} קורסים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.cancel', 'ביטול', 'admin', NOW(), NOW()),

    -- Success message
    (v_tenant_id, 'he', 'lms.program_detail.courses_added', '{count} קורסים נוספו לתוכנית', 'admin', NOW(), NOW()),

    -- Error messages
    (v_tenant_id, 'he', 'lms.program_detail.toast_error', 'שגיאה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.toast_success', 'הצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.course_add_error', 'נכשל להוסיף קורסים', 'admin', NOW(), NOW());

  -- Show success message
  RAISE NOTICE 'Successfully added % Hebrew translations for Add Courses popup', (
    SELECT COUNT(*)
    FROM translations
    WHERE translation_key LIKE 'lms.program_detail.add_courses%'
      AND language_code = 'he'
      AND tenant_id = v_tenant_id
  );
END $$;
