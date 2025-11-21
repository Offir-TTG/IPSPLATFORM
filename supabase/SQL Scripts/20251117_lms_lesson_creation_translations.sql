-- ============================================================================
-- LMS LESSON CREATION TRANSLATIONS
-- Hebrew translations for lesson and bulk lesson creation dialogs
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
    AND translation_key LIKE 'lms.lesson%';

  -- Insert Hebrew translations
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    -- ========================================================================
    -- SINGLE LESSON DIALOG
    -- ========================================================================
    (v_tenant_id, 'he', 'lms.lesson.add_to_module', 'הוסף שיעור ל-{module}', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.create_description', 'צור שיעור חדש בתוך מודול זה', 'admin', NOW(), NOW()),

    -- Lesson Details Section
    (v_tenant_id, 'he', 'lms.lesson.details_title', 'פרטי שיעור', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.title_label', 'כותרת שיעור', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.title_placeholder', 'למשל, מבוא להורות', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.description_label', 'תיאור', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.description_placeholder', 'מה התלמידים ילמדו בשיעור זה?', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.start_datetime_label', 'תאריך ושעת התחלה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.duration_label', 'משך (דקות)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.publish_immediately', 'פרסם מיד', 'admin', NOW(), NOW()),

    -- Zoom Integration Section
    (v_tenant_id, 'he', 'lms.lesson.zoom_integration_title', 'אינטגרציה עם Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.zoom_integration_desc', 'צור פגישת Zoom אוטומטית לשיעור זה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.zoom_topic_label', 'נושא פגישת Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.zoom_topic_placeholder', 'למשל, מבוא להורות - מפגש 1', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.zoom_topic_help', 'זה יהיה שם הפגישה הגלוי ב-Zoom למעקב', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.zoom_agenda_label', 'סדר יום פגישת Zoom (אופציונלי)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.zoom_agenda_placeholder', 'למשל, היום נעסוק בטכניקות הורות בסיסיות...', 'admin', NOW(), NOW()),

    -- Actions
    (v_tenant_id, 'he', 'lms.lesson.creating', 'יוצר...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.add_lesson', 'הוסף שיעור', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- BULK LESSON DIALOG
    -- ========================================================================
    (v_tenant_id, 'he', 'lms.lesson.bulk_create_title', 'צור סדרת שיעורים עבור {module}', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.bulk_create_description', 'הגדר סדרת שיעורים חוזרת עם תזמון חכם ואינטגרציה אופציונלית עם Zoom', 'admin', NOW(), NOW()),

    -- Series Information
    (v_tenant_id, 'he', 'lms.lesson.series_info_title', 'פרטי סדרה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.series_name_label', 'שם הסדרה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.series_name_placeholder', 'למשל, מבוא להורות', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.series_name_help', 'זה ישמש למתן שמות לשיעורים ולפגישות Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.title_pattern_label', 'תבנית כותרת שיעור', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.title_pattern_placeholder', 'מפגש {n}', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.title_pattern_help', 'השתמש ב-{n} למספר שיעור. דוגמה: "מפגש {n}" הופך ל"מפגש 1", "מפגש 2", וכו׳', 'admin', NOW(), NOW()),

    -- Schedule Settings
    (v_tenant_id, 'he', 'lms.lesson.schedule_settings_title', 'הגדרות תזמון', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.start_date_label', 'תאריך התחלה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.time_of_day_label', 'שעת היום', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.duration_minutes_label', 'משך (דקות)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.recurrence_pattern_label', 'תבנית חזרה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.recurrence_weekly', 'שבועי', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.recurrence_daily', 'יומי', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.day_of_week_label', 'יום בשבוע', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.day_sunday', 'ראשון', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.day_monday', 'שני', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.day_tuesday', 'שלישי', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.day_wednesday', 'רביעי', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.day_thursday', 'חמישי', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.day_friday', 'שישי', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.day_saturday', 'שבת', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.number_of_sessions_label', 'מספר מפגשים', 'admin', NOW(), NOW()),

    -- Zoom Integration (Bulk)
    (v_tenant_id, 'he', 'lms.lesson.bulk_zoom_title', 'אינטגרציה עם Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.bulk_zoom_desc', 'צור פגישות Zoom אוטומטית לכל שיעור', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.zoom_name_pattern_label', 'תבנית שם פגישת Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.zoom_name_pattern_placeholder', '{series_name} - מפגש {n}', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.zoom_name_pattern_help', 'השתמש ב-{series_name} וב-{n} לשמות דינמיים. דוגמה: "{series_name} - מפגש {n}" הופך ל"מבוא להורות - מפגש 1"', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.zoom_agenda_common_label', 'סדר יום פגישת Zoom (אופציונלי)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.zoom_agenda_common_placeholder', 'סדר יום משותף לכל המפגשים...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.zoom_recurring_option', 'צור כפגישת Zoom חוזרת (כל המפגשים מקושרים)', 'admin', NOW(), NOW()),

    -- Preview
    (v_tenant_id, 'he', 'lms.lesson.preview_title', 'תצוגה מקדימה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.preview_text', 'זה יצור {count} שיעורים {pattern} החל מ-{date} בשעה {time}{zoom}', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.preview_weekly', 'כל שבוע', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.preview_daily', 'יומי', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.preview_with_zoom', ', כל אחד עם פגישת Zoom', 'admin', NOW(), NOW()),

    -- Actions
    (v_tenant_id, 'he', 'lms.lesson.bulk_creating', 'יוצר...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.bulk_create_button', 'צור {count} שיעורים', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- VALIDATION MESSAGES
    -- ========================================================================
    (v_tenant_id, 'he', 'lms.lesson.error_title_required', 'כותרת נדרשת', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.error_zoom_topic_required', 'נושא פגישת Zoom נדרש כאשר יוצרים פגישת Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.error_series_name_required', 'שם סדרה נדרש', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.error_count_range', 'אנא הזן מספר בין 1 ל-50', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.error_zoom_pattern_required', 'תבנית נושא Zoom נדרשת כאשר יוצרים פגישות Zoom', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- SUCCESS MESSAGES
    -- ========================================================================
    (v_tenant_id, 'he', 'lms.lesson.success_created', 'שיעור נוצר בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.success_created_with_zoom', 'שיעור ופגישת Zoom נוצרו בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.success_bulk_created', '{count} שיעורים נוצרו בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.success_bulk_with_zoom', '{count} שיעורים נוצרו בהצלחה עם פגישות Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.warning_zoom_failed', 'שיעור נוצר אך פגישת Zoom נכשלה: {error}', 'admin', NOW(), NOW());

  RAISE NOTICE 'Successfully added % Hebrew translations for lesson creation', (
    SELECT COUNT(*)
    FROM translations
    WHERE translation_key LIKE 'lms.lesson.%'
      AND language_code = 'he'
      AND tenant_id = v_tenant_id
  );
END $$;
