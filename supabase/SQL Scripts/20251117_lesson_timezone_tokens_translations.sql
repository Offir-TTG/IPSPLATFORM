-- ============================================================================
-- LESSON TIMEZONE AND TOKEN TRANSLATIONS
-- Hebrew translations for timezone selector and placeholder token helpers
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
      -- Timezone labels
      'lms.lesson.timezone_label',
      'lms.lesson.timezone_jerusalem',
      'lms.lesson.timezone_utc',
      'lms.lesson.timezone_newyork',
      'lms.lesson.timezone_losangeles',
      'lms.lesson.timezone_london',

      -- Timezone groups
      'lms.lesson.timezone_group_common',
      'lms.lesson.timezone_group_americas',
      'lms.lesson.timezone_group_europe',
      'lms.lesson.timezone_group_asia',
      'lms.lesson.timezone_group_pacific',
      'lms.lesson.timezone_group_africa',
      'lms.lesson.timezone_group_other',

      -- Token inserter
      'lms.lesson.token_insert_help',

      -- Token labels and descriptions
      'lms.lesson.token_n',
      'lms.lesson.token_n_desc',
      'lms.lesson.token_series_name',
      'lms.lesson.token_series_name_desc',
      'lms.lesson.token_date',
      'lms.lesson.token_date_desc',
      'lms.lesson.token_date_short',
      'lms.lesson.token_date_short_desc',
      'lms.lesson.token_date_long',
      'lms.lesson.token_date_long_desc',
      'lms.lesson.token_time',
      'lms.lesson.token_time_desc',
      'lms.lesson.token_time_12h',
      'lms.lesson.token_time_12h_desc',
      'lms.lesson.token_day',
      'lms.lesson.token_day_desc',
      'lms.lesson.token_month',
      'lms.lesson.token_month_desc',
      'lms.lesson.token_year',
      'lms.lesson.token_year_desc',
      'lms.lesson.token_duration',
      'lms.lesson.token_duration_desc',
      'lms.lesson.token_timezone',
      'lms.lesson.token_timezone_desc',
      'lms.lesson.token_instructor',
      'lms.lesson.token_instructor_desc',
      'lms.lesson.token_course_name',
      'lms.lesson.token_course_name_desc'
    );

  -- Insert Hebrew translations
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    -- Timezone field
    (v_tenant_id, 'he', 'lms.lesson.timezone_label', 'אזור זמן', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.timezone_jerusalem', 'ירושלים (GMT+2/+3)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.timezone_utc', 'UTC', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.timezone_newyork', 'ניו יורק (GMT-5/-4)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.timezone_losangeles', 'לוס אנג''לס (GMT-8/-7)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.timezone_london', 'לונדון (GMT+0/+1)', 'admin', NOW(), NOW()),

    -- Timezone groups
    (v_tenant_id, 'he', 'lms.lesson.timezone_group_common', 'נפוצים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.timezone_group_americas', 'אמריקה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.timezone_group_europe', 'אירופה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.timezone_group_asia', 'אסיה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.timezone_group_pacific', 'אוקיינוסיה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.timezone_group_africa', 'אפריקה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.timezone_group_other', 'אחר', 'admin', NOW(), NOW()),

    -- Token inserter help text
    (v_tenant_id, 'he', 'lms.lesson.token_insert_help', 'לחץ להוספת מציין מיקום:', 'admin', NOW(), NOW()),

    -- Token translations - Basic
    (v_tenant_id, 'he', 'lms.lesson.token_n', 'מספר', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.token_n_desc', 'מספר השיעור', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.token_series_name', 'שם הסדרה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.token_series_name_desc', 'שם סדרת השיעורים', 'admin', NOW(), NOW()),

    -- Token translations - Date
    (v_tenant_id, 'he', 'lms.lesson.token_date', 'תאריך', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.token_date_desc', 'תאריך השיעור (YYYY-MM-DD)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.token_date_short', 'תאריך קצר', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.token_date_short_desc', 'פורמט תאריך קצר (DD/MM)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.token_date_long', 'תאריך ארוך', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.token_date_long_desc', 'תאריך מלא עם שם יום', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.token_day', 'שם היום', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.token_day_desc', 'שם יום בשבוע', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.token_month', 'חודש', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.token_month_desc', 'שם החודש', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.token_year', 'שנה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.token_year_desc', 'שנה (YYYY)', 'admin', NOW(), NOW()),

    -- Token translations - Time
    (v_tenant_id, 'he', 'lms.lesson.token_time', 'שעה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.token_time_desc', 'שעת השיעור (HH:MM)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.token_time_12h', 'שעה 12 שעות', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.token_time_12h_desc', 'שעה בפורמט 12 שעות', 'admin', NOW(), NOW()),

    -- Token translations - Zoom specific
    (v_tenant_id, 'he', 'lms.lesson.token_duration', 'משך', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.token_duration_desc', 'משך הפגישה בדקות', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.token_timezone', 'אזור זמן', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.token_timezone_desc', 'אזור זמן של הפגישה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.token_instructor', 'מרצה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.token_instructor_desc', 'שם המרצה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.token_course_name', 'שם הקורס', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.token_course_name_desc', 'שם הקורס', 'admin', NOW(), NOW());

  RAISE NOTICE 'Successfully added % Hebrew translations for timezone and tokens', (
    SELECT COUNT(*)
    FROM translations
    WHERE translation_key IN (
      'lms.lesson.timezone_label',
      'lms.lesson.timezone_jerusalem',
      'lms.lesson.timezone_utc',
      'lms.lesson.timezone_newyork',
      'lms.lesson.timezone_losangeles',
      'lms.lesson.timezone_london',
      'lms.lesson.timezone_group_common',
      'lms.lesson.timezone_group_americas',
      'lms.lesson.timezone_group_europe',
      'lms.lesson.timezone_group_asia',
      'lms.lesson.timezone_group_pacific',
      'lms.lesson.timezone_group_africa',
      'lms.lesson.timezone_group_other'
    )
      AND language_code = 'he'
      AND tenant_id = v_tenant_id
  );
END $$;
