-- ============================================================================
-- LMS COURSES TRANSLATIONS
-- Adds Hebrew translations for LMS courses page including view toggle tooltips
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

  -- Delete existing Hebrew translations for LMS courses to avoid duplicates
  DELETE FROM public.translations
  WHERE language_code = 'he'
    AND translation_key LIKE 'lms.courses.%';

  -- Insert Hebrew translations for LMS courses
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    -- View toggle tooltips
    (v_tenant_id, 'he', 'lms.courses.view_grid', 'תצוגת כרטיסים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.view_list', 'תצוגת רשימה', 'admin', NOW(), NOW()),

    -- Course page titles and labels
    (v_tenant_id, 'he', 'lms.courses.title', 'קורסים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.subtitle', 'נהל את הקורסים, המודולים והשיעורים שלך', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.create', 'צור קורס', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.search_placeholder', 'חפש קורסים...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.filter_by_status', 'סנן לפי סטטוס', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.all_courses', 'כל הקורסים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.active', 'פעיל', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.inactive', 'לא פעיל', 'admin', NOW(), NOW()),

    -- Course actions
    (v_tenant_id, 'he', 'lms.courses.edit', 'ערוך קורס', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.duplicate', 'שכפל', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.activate', 'הפעל', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.deactivate', 'השבת', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.delete', 'מחק', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.manage', 'נהל קורס', 'admin', NOW(), NOW()),

    -- Course info
    (v_tenant_id, 'he', 'lms.courses.no_instructor', 'ללא מדריך', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.loading', 'טוען קורסים...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.no_courses', 'לא נמצאו קורסים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.get_started', 'התחל על ידי יצירת הקורס הראשון שלך', 'admin', NOW(), NOW()),

    -- Dialog titles
    (v_tenant_id, 'he', 'lms.courses.create_dialog_title', 'צור קורס חדש', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.create_dialog_description', 'הזן את פרטי הקורס למטה. תוכל להוסיף מודולים ושיעורים לאחר יצירת הקורס.', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.edit_dialog_title', 'ערוך קורס', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.edit_dialog_description', 'עדכן את פרטי הקורס למטה.', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.duplicate_dialog_title', 'שכפל קורס', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.duplicate_dialog_description', 'התאם את הפרטים עבור הקורס המשוכפל.', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.delete_dialog_title', 'מחק קורס', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.delete_dialog_description', 'האם אתה בטוח שברצונך למחוק את "{title}"? פעולה זו תמחק גם את כל המודולים, השיעורים והתקדמות הסטודנטים. לא ניתן לבטל פעולה זו.', 'admin', NOW(), NOW()),

    -- Form fields
    (v_tenant_id, 'he', 'lms.courses.course_title', 'כותרת הקורס', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.course_title_placeholder', 'לדוגמה, מבוא לתכנות', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.description', 'תיאור', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.description_placeholder', 'תיאור הקורס...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.program', 'תוכנית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.select_program', 'בחר תוכנית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.no_programs', 'אין תוכניות זמינות', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.program_help', 'בחר את התוכנית אליה שייך הקורס', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.start_date', 'תאריך התחלה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.end_date', 'תאריך סיום', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.activate_immediately', 'הפעל קורס מיד', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.course_active', 'הקורס פעיל', 'admin', NOW(), NOW()),

    -- Buttons
    (v_tenant_id, 'he', 'lms.courses.cancel', 'ביטול', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.creating', 'יוצר...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.updating', 'מעדכן...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.update', 'עדכן קורס', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.duplicating', 'משכפל...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.courses.deleting', 'מוחק...', 'admin', NOW(), NOW());

  -- Show success message
  RAISE NOTICE 'Successfully added/updated % Hebrew translations for LMS courses', (
    SELECT COUNT(*)
    FROM translations
    WHERE translation_key LIKE 'lms.courses.%'
      AND language_code = 'he'
      AND tenant_id = v_tenant_id
  );
END $$;
