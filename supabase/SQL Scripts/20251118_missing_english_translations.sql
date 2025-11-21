-- ============================================================================
-- MISSING ENGLISH TRANSLATIONS FOR BULK LESSON DIALOG
-- Adds the translation keys that were missing from the previous migration
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

  -- Delete any existing entries first to avoid duplicates
  DELETE FROM public.translations
  WHERE language_code = 'en'
    AND translation_key IN (
      'lms.lesson.series_info_title',
      'lms.lesson.title_pattern_label',
      'lms.lesson.title_pattern_placeholder',
      'lms.lesson.title_pattern_help',
      'lms.lesson.start_date_label',
      'lms.lesson.time_of_day_label',
      'lms.lesson.duration_minutes_label',
      'lms.lesson.recurrence_pattern_label',
      'lms.lesson.recurrence_daily',
      'lms.lesson.recurrence_weekly',
      'lms.lesson.day_of_week_label',
      'lms.lesson.number_of_sessions_label',
      'lms.lesson.bulk_zoom_title',
      'lms.lesson.bulk_zoom_desc',
      'lms.lesson.preview_text',
      'lms.lesson.preview_daily',
      'lms.lesson.preview_weekly',
      'lms.lesson.preview_with_zoom',
      'lms.lesson.bulk_create_button',
      'lms.lesson.bulk_creating',
      'lms.lesson.delete_title',
      'lms.lesson.delete_confirmation',
      'lms.lesson.zoom_name_pattern_label',
      'lms.lesson.zoom_recurring_option',
      'lms.lesson.zoom_agenda_common_label',
      'lms.lesson.zoom_agenda_common_placeholder'
    );

  -- Insert missing English translations
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    -- Series Info (different key than series_details)
    (v_tenant_id, 'en', 'lms.lesson.series_info_title', 'Series Information', 'admin', NOW(), NOW()),

    -- Title Pattern (different key than lesson_title_pattern)
    (v_tenant_id, 'en', 'lms.lesson.title_pattern_label', 'Lesson Title Pattern', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.title_pattern_placeholder', 'e.g., Session {n}', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.title_pattern_help', 'Click to insert placeholder', 'admin', NOW(), NOW()),

    -- Schedule Settings
    (v_tenant_id, 'en', 'lms.lesson.start_date_label', 'Start Date', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.time_of_day_label', 'Time of Day', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.duration_minutes_label', 'Duration (minutes)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.recurrence_pattern_label', 'Recurrence Pattern', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.recurrence_daily', 'Daily', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.recurrence_weekly', 'Weekly', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.day_of_week_label', 'Day of Week', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.number_of_sessions_label', 'Number of Sessions', 'admin', NOW(), NOW()),

    -- Zoom Integration
    (v_tenant_id, 'en', 'lms.lesson.bulk_zoom_title', 'Zoom Integration', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.bulk_zoom_desc', 'Automatically create Zoom meetings for all lessons', 'admin', NOW(), NOW()),

    -- Preview
    (v_tenant_id, 'en', 'lms.lesson.preview_text', 'This will create {count} lessons {pattern} starting from {date} at {time}{zoom}', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.preview_daily', 'every day', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.preview_weekly', 'every week', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.preview_with_zoom', 'each with a Zoom meeting', 'admin', NOW(), NOW()),

    -- Buttons
    (v_tenant_id, 'en', 'lms.lesson.bulk_create_button', 'Create {count} Lessons', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.bulk_creating', 'Creating lessons...', 'admin', NOW(), NOW()),

    -- Delete confirmation
    (v_tenant_id, 'en', 'lms.lesson.delete_title', 'Delete Lesson', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.delete_confirmation', 'Are you sure you want to delete this lesson? This action cannot be undone.', 'admin', NOW(), NOW()),

    -- Zoom Meeting Pattern
    (v_tenant_id, 'en', 'lms.lesson.zoom_name_pattern_label', 'Zoom Meeting Name Pattern', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.zoom_recurring_option', 'Create as recurring Zoom meeting (all sessions linked)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.zoom_agenda_common_label', 'Zoom Meeting Agenda (Optional)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.zoom_agenda_common_placeholder', 'Common agenda for all sessions...', 'admin', NOW(), NOW());

  RAISE NOTICE 'Successfully added missing English translations for bulk lesson dialog';

END $$;
