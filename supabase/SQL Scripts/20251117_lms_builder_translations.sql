-- ============================================================================
-- LMS COURSE BUILDER TRANSLATIONS
-- Adds Hebrew translations for Course Builder (Drag & Drop Canvas) page
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

  -- Delete existing Hebrew translations for LMS builder to avoid duplicates
  DELETE FROM public.translations
  WHERE language_code = 'he'
    AND translation_key LIKE 'lms.builder.%';

  -- Insert Hebrew translations for LMS Course Builder
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    -- Page header and navigation
    (v_tenant_id, 'he', 'lms.builder.back', 'חזרה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.title', 'בונה קורסים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.subtitle', 'לוח גרירה ושחרור', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.preview', 'תצוגה מקדימה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.save', 'שמור שינויים', 'admin', NOW(), NOW()),

    -- Course structure section
    (v_tenant_id, 'he', 'lms.builder.course_structure', 'מבנה הקורס', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.bulk_add_modules', 'הוסף מודולים בכמות', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.add_module', 'הוסף מודול', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.no_modules', 'אין מודולים עדיין', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.start_building', 'התחל לבנות את הקורס שלך על ידי הוספת מודולים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.create_first_module', 'צור את המודול הראשון שלך', 'admin', NOW(), NOW()),

    -- Module actions
    (v_tenant_id, 'he', 'lms.builder.add_lesson', 'הוסף שיעור', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.edit_module', 'ערוך מודול', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.delete_module', 'מחק מודול', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.no_lessons', 'אין שיעורים עדיין', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.add_first_lesson', 'הוסף שיעור ראשון', 'admin', NOW(), NOW()),

    -- Course overview statistics
    (v_tenant_id, 'he', 'lms.builder.course_overview', 'סקירת קורס', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.total_modules', 'סך כל המודולים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.total_lessons', 'סך כל השיעורים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.total_duration', 'משך זמן כולל', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.published_modules', 'מודולים מפורסמים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.minutes_abbr', 'דק׳', 'admin', NOW(), NOW()),

    -- Module dialog
    (v_tenant_id, 'he', 'lms.builder.create_module', 'צור מודול', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.dialog_create_module', 'צור מודול', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.dialog_module_description', 'הוסף מודול חדש כדי לארגן את תוכן הקורס שלך', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.module_title', 'כותרת המודול', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.module_title_placeholder', 'לדוגמה, מבוא ל-HTML', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.module_description', 'תיאור', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.module_description_placeholder', 'תיאור קצר של המודול...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.duration_minutes', 'משך זמן (דקות)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.published', 'מפורסם', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.optional', 'אופציונלי', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.cancel', 'ביטול', 'admin', NOW(), NOW()),

    -- Lesson dialog
    (v_tenant_id, 'he', 'lms.builder.add_lesson_to', 'הוסף שיעור ל-{module}', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.dialog_add_lesson_to', 'הוסף שיעור ל-{module}', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.dialog_lesson_description', 'צור שיעור חדש במודול זה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.lesson_title', 'כותרת השיעור', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.lesson_title_placeholder', 'לדוגמה, מבוא למשתנים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.lesson_description', 'תיאור', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.lesson_description_placeholder', 'מה התלמידים ילמדו בשיעור זה?', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.publish_immediately', 'פרסם מיד', 'admin', NOW(), NOW()),

    -- Bulk module dialog
    (v_tenant_id, 'he', 'lms.builder.bulk_create_modules', 'צור מודולים בכמות', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.dialog_bulk_create', 'צור מודולים בכמות', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.dialog_bulk_description', 'צור מספר מודולים בבת אחת כדי למבנה את הקורס שלך במהירות', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.number_of_modules', 'מספר מודולים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.title_pattern', 'תבנית כותרת', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.use_n_for_number', 'השתמש ב-{n} עבור מספר המודול', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.title_pattern_help', 'השתמש ב-{n} עבור המספר', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.preview_label', 'תצוגה מקדימה:', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.and_more', '...ועוד', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.create_modules_count', 'צור {count} מודולים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.dialog_create_count_modules', 'צור {count} מודולים', 'admin', NOW(), NOW()),

    -- Success/error messages
    (v_tenant_id, 'he', 'lms.builder.title_required', 'כותרת נדרשת', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.module_created', 'המודול נוצר בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.module_updated', 'המודול עודכן בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.module_deleted', 'המודול נמחק בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.lesson_created', 'השיעור נוצר בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.lesson_deleted', 'השיעור נמחק בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.invalid_count', 'אנא הזן מספר בין 1 ל-20', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.modules_created', '{count} מודולים נוצרו בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.module_order_updated', 'סדר המודולים עודכן', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.created_locally', 'נוצר מקומית (שמור לסנכרון)', 'admin', NOW(), NOW()),

    -- Badges and labels
    (v_tenant_id, 'he', 'lms.builder.lessons_count', '{count} שיעורים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.lesson_singular', 'שיעור', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.module_singular', 'מודול', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.draft', 'טיוטה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.recorded', 'מוקלט', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.zoom', 'Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.add_zoom', 'הוסף Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.builder.creating_zoom', 'יוצר Zoom...', 'admin', NOW(), NOW());

  -- Show success message
  RAISE NOTICE 'Successfully added/updated % Hebrew translations for LMS builder', (
    SELECT COUNT(*)
    FROM translations
    WHERE translation_key LIKE 'lms.builder.%'
      AND language_code = 'he'
      AND tenant_id = v_tenant_id
  );
END $$;
