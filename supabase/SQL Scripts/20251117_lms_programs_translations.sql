-- ============================================================================
-- LMS PROGRAMS TRANSLATIONS
-- Adds Hebrew translations for LMS programs page
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

  -- Delete existing Hebrew translations for LMS programs to avoid duplicates
  DELETE FROM public.translations
  WHERE language_code = 'he'
    AND translation_key LIKE 'lms.programs.%';

  -- Insert Hebrew translations for LMS programs
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    -- Page header
    (v_tenant_id, 'he', 'lms.programs.title', 'תוכניות', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.subtitle', 'נהל את התוכניות שלך', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.create', 'צור תוכנית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.search_placeholder', 'חפש תוכניות...', 'admin', NOW(), NOW()),

    -- Program actions
    (v_tenant_id, 'he', 'lms.programs.manage', 'נהל תוכנית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.edit', 'ערוך תוכנית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.duplicate', 'שכפל', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.delete', 'מחק', 'admin', NOW(), NOW()),

    -- Program info
    (v_tenant_id, 'he', 'lms.programs.active', 'פעיל', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.inactive', 'לא פעיל', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.courses', 'קורסים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.students', 'סטודנטים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.weeks', 'שבועות', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.max_students_label', 'מקסימום', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.loading', 'טוען תוכניות...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.no_programs', 'לא נמצאו תוכניות', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.get_started', 'התחל על ידי יצירת התוכנית הראשונה שלך', 'admin', NOW(), NOW()),

    -- View modes and filters
    (v_tenant_id, 'he', 'lms.programs.view_grid', 'תצוגת כרטיסים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.view_list', 'תצוגת רשימה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.filter_status', 'סנן לפי סטטוס', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.all_statuses', 'הכל', 'admin', NOW(), NOW()),

    -- Dialog titles
    (v_tenant_id, 'he', 'lms.programs.create_dialog_title', 'צור תוכנית חדשה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.create_dialog_description', 'הזן את פרטי התוכנית למטה. תוכל להוסיף קורסים לאחר יצירת התוכנית.', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.edit_dialog_title', 'ערוך תוכנית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.edit_dialog_description', 'עדכן את פרטי התוכנית למטה.', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.duplicate_dialog_title', 'שכפל תוכנית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.duplicate_dialog_description', 'התאם את הפרטים עבור התוכנית המשוכפלת.', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.delete_dialog_title', 'מחק תוכנית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.delete_dialog_description', 'האם אתה בטוח שברצונך למחוק את "{name}"? פעולה זו תמחק גם את כל הקורסים, המודולים, השיעורים והתקדמות הסטודנטים. לא ניתן לבטל פעולה זו.', 'admin', NOW(), NOW()),

    -- Form fields
    (v_tenant_id, 'he', 'lms.programs.name', 'שם התוכנית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.name_placeholder', 'לדוגמה, תוכנית פיתוח אתרים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.program_name', 'שם התוכנית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.program_name_placeholder', 'לדוגמה, תוכנית פיתוח אתרים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.image', 'תמונת התוכנית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.image_preview', 'תצוגה מקדימה של התוכנית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.upload_image', 'לחץ להעלאת תמונה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.image_formats', 'PNG, JPG, GIF עד 5MB', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.description', 'תיאור', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.description_placeholder', 'תיאור התוכנית...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.price', 'מחיר', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.currency', 'מטבע', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.select_currency', 'בחר מטבע', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.duration', 'משך זמן (שבועות)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.max_students', 'מקסימום סטודנטים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.docusign_template', 'מזהה תבנית DocuSign', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.docusign_placeholder', 'אופציונלי', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.activate_immediately', 'הפעל מיד', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.is_active', 'פעיל', 'admin', NOW(), NOW()),

    -- Buttons
    (v_tenant_id, 'he', 'lms.programs.cancel', 'ביטול', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.creating', 'יוצר...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.updating', 'מעדכן...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.update', 'עדכן תוכנית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.duplicating', 'משכפל...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.deleting', 'מוחק...', 'admin', NOW(), NOW()),

    -- Success/error messages
    (v_tenant_id, 'he', 'lms.programs.name_required', 'שם התוכנית נדרש', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.load_error', 'נכשל בטעינת תוכניות', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.create_error', 'נכשל ביצירת תוכנית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.update_error', 'נכשל בעדכון תוכנית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.delete_error', 'נכשל במחיקת תוכנית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.image_upload_error', 'נכשל בהעלאת תמונה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.created', 'התוכנית נוצרה בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.updated', 'התוכנית עודכנה בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.deleted', 'התוכנית נמחקה בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.program_created', 'התוכנית נוצרה בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.program_updated', 'התוכנית עודכנה בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.program_deleted', 'התוכנית נמחקה בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.program_duplicated', 'התוכנית שוכפלה בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.no_results', 'לא נמצאו תוכניות התואמות לחיפוש', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.programs.create_first', 'צור את התוכנית הראשונה שלך', 'admin', NOW(), NOW());

  -- Show success message
  RAISE NOTICE 'Successfully added/updated % Hebrew translations for LMS programs', (
    SELECT COUNT(*)
    FROM translations
    WHERE translation_key LIKE 'lms.programs.%'
      AND language_code = 'he'
      AND tenant_id = v_tenant_id
  );
END $$;
