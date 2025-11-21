-- ============================================================================
-- COMPLETE ENGLISH TRANSLATIONS FOR LMS PLATFORM
-- All English translations for Course Builder, Lessons, Zoom Integration
-- Run this in Supabase SQL Editor to add English language support
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

  -- Delete existing English translations to avoid duplicates
  DELETE FROM public.translations
  WHERE language_code = 'en'
    AND (
      translation_key LIKE 'lms.lesson.%' OR
      translation_key LIKE 'lms.builder.%' OR
      translation_key LIKE 'lms.zoom.%' OR
      translation_key LIKE 'lms.module.%' OR
      translation_key LIKE 'common.%' OR
      translation_key LIKE 'admin.integrations.%'
    );

  -- Insert all English translations
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    -- ========================================================================
    -- COMMON UI ELEMENTS
    -- ========================================================================
    (v_tenant_id, 'en', 'common.cancel', 'Cancel', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'common.save', 'Save', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'common.delete', 'Delete', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'common.edit', 'Edit', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'common.creating', 'Creating...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'common.saving', 'Saving...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'common.loading', 'Loading...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'common.error', 'Error', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- COURSE BUILDER - Page Header and Navigation
    -- ========================================================================
    (v_tenant_id, 'en', 'lms.builder.back', 'Back', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.title', 'Course Builder', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.subtitle', 'Drag & Drop Canvas', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.preview', 'Preview', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.save', 'Save Changes', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- COURSE BUILDER - Course Structure Section
    -- ========================================================================
    (v_tenant_id, 'en', 'lms.builder.course_structure', 'Course Structure', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.bulk_add_modules', 'Bulk Add Modules', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.bulk_add_lessons', 'Bulk Add Lessons', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.add_module', 'Add Module', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.no_modules', 'No modules yet', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.start_building', 'Start building your course by adding modules', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.create_first_module', 'Create your first module', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- COURSE BUILDER - Module Actions
    -- ========================================================================
    (v_tenant_id, 'en', 'lms.builder.add_lesson', 'Add Lesson', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.edit_module', 'Edit Module', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.delete_module', 'Delete Module', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.no_lessons', 'No lessons yet', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.add_first_lesson', 'Add first lesson', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- COURSE BUILDER - Course Overview Statistics
    -- ========================================================================
    (v_tenant_id, 'en', 'lms.builder.course_overview', 'Course Overview', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.total_modules', 'Total Modules', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.total_lessons', 'Total Lessons', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.total_duration', 'Total Duration', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.published_modules', 'Published Modules', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.minutes_abbr', 'min', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- COURSE BUILDER - Module Dialog
    -- ========================================================================
    (v_tenant_id, 'en', 'lms.builder.create_module', 'Create Module', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.dialog_create_module', 'Create Module', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.dialog_module_description', 'Add a new module to organize your course content', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.module_title', 'Module Title', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.module_title_placeholder', 'e.g., Introduction to HTML', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.module_description', 'Description', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.module_description_placeholder', 'Brief description of the module...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.duration_minutes', 'Duration (minutes)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.published', 'Published', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.optional', 'Optional', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.cancel', 'Cancel', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- COURSE BUILDER - Bulk Module Dialog
    -- ========================================================================
    (v_tenant_id, 'en', 'lms.builder.bulk_create_modules', 'Bulk Create Modules', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.dialog_bulk_create', 'Bulk Create Modules', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.dialog_bulk_description', 'Create multiple modules at once to structure your course quickly', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.number_of_modules', 'Number of Modules', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.title_pattern', 'Title Pattern', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.use_n_for_number', 'Use {n} for module number', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.title_pattern_help', 'Use {n} for the number', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.preview_label', 'Preview:', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.and_more', '...and more', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.create_modules_count', 'Create {count} Modules', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.dialog_create_count_modules', 'Create {count} Modules', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- COURSE BUILDER - Success/Error Messages
    -- ========================================================================
    (v_tenant_id, 'en', 'lms.builder.title_required', 'Title is required', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.module_created', 'Module created successfully', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.module_updated', 'Module updated successfully', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.module_deleted', 'Module deleted successfully', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.lesson_created', 'Lesson created successfully', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.lesson_deleted', 'Lesson deleted successfully', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.invalid_count', 'Please enter a number between 1 and 20', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.modules_created', '{count} modules created successfully', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.module_order_updated', 'Module order updated', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.created_locally', 'Created locally (save to sync)', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- COURSE BUILDER - Badges and Labels
    -- ========================================================================
    (v_tenant_id, 'en', 'lms.builder.lessons_count', '{count} lessons', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.lesson_singular', 'lesson', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.module_singular', 'module', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.draft', 'Draft', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.recorded', 'Recorded', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.zoom', 'Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.add_zoom', 'Add Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.builder.creating_zoom', 'Creating Zoom...', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- SINGLE LESSON DIALOG
    -- ========================================================================
    (v_tenant_id, 'en', 'lms.lesson.add_lesson', 'Add Lesson', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.add_to_module', 'Add Lesson to {module}', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.create_description', 'Create a new lesson in this module', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.details_title', 'Lesson Details', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.title_label', 'Lesson Title', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.title_placeholder', 'e.g., Introduction to Variables', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.description_label', 'Description', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.description_placeholder', 'What will students learn in this lesson?', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.start_datetime_label', 'Start Date & Time', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.duration_label', 'Duration (minutes)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.publish_immediately', 'Publish Immediately', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.creating', 'Creating...', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- BULK LESSON DIALOG - Header
    -- ========================================================================
    (v_tenant_id, 'en', 'lms.lesson.bulk_create_title', 'Create Lesson Series for {module}', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.bulk_create_description', 'Generate multiple lessons at once with consistent scheduling', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- BULK LESSON DIALOG - Series Details Section
    -- ========================================================================
    (v_tenant_id, 'en', 'lms.lesson.series_details_title', 'Series Details', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.series_name_label', 'Series Name', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.series_name_placeholder', 'e.g., Weekly JavaScript Workshop', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.series_name_help', 'Used in lesson titles - e.g., "JavaScript Workshop - Lesson 1"', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.number_of_lessons_label', 'Number of Lessons', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.lesson_title_pattern_label', 'Lesson Title Pattern', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.lesson_title_pattern_placeholder', 'e.g., {series_name} - Lesson {n}', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.lesson_title_pattern_help', 'Use {n} for lesson number, {series_name} for series name, {date} for date', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- BULK LESSON DIALOG - Schedule Settings Section
    -- ========================================================================
    (v_tenant_id, 'en', 'lms.lesson.schedule_settings_title', 'Schedule Settings', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.first_lesson_date_label', 'First Lesson Date', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.first_lesson_time_label', 'Lesson Time', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.lesson_duration_label', 'Lesson Duration (minutes)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.repeat_pattern_label', 'Repeat Pattern', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.repeat_daily', 'Daily', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.repeat_weekly', 'Weekly', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.repeat_biweekly', 'Bi-weekly', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.repeat_custom', 'Custom Days', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.days_of_week_label', 'Days of Week', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- BULK LESSON DIALOG - Days of Week
    -- ========================================================================
    (v_tenant_id, 'en', 'lms.lesson.day_sunday', 'Sunday', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.day_monday', 'Monday', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.day_tuesday', 'Tuesday', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.day_wednesday', 'Wednesday', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.day_thursday', 'Thursday', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.day_friday', 'Friday', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.day_saturday', 'Saturday', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- BULK LESSON DIALOG - Timezone
    -- ========================================================================
    (v_tenant_id, 'en', 'lms.lesson.timezone_label', 'Timezone', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.timezone_jerusalem', 'Jerusalem (GMT+2/+3)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.timezone_utc', 'UTC', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.timezone_newyork', 'New York (GMT-5/-4)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.timezone_losangeles', 'Los Angeles (GMT-8/-7)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.timezone_london', 'London (GMT+0/+1)', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- BULK LESSON DIALOG - Timezone Groups
    -- ========================================================================
    (v_tenant_id, 'en', 'lms.lesson.timezone_group_common', 'Common', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.timezone_group_americas', 'Americas', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.timezone_group_europe', 'Europe', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.timezone_group_asia', 'Asia', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.timezone_group_pacific', 'Pacific', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.timezone_group_africa', 'Africa', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.timezone_group_other', 'Other', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- BULK LESSON DIALOG - Token Inserter
    -- ========================================================================
    (v_tenant_id, 'en', 'lms.lesson.token_insert_help', 'Click to insert placeholder:', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_n', 'Number', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_n_desc', 'Lesson number', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_series_name', 'Series Name', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_series_name_desc', 'Lesson series name', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_date', 'Date', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_date_desc', 'Lesson date (YYYY-MM-DD)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_date_short', 'Short Date', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_date_short_desc', 'Short date format (MM/DD)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_date_long', 'Long Date', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_date_long_desc', 'Full date with day name', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_day', 'Day Name', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_day_desc', 'Day of week name', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_month', 'Month', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_month_desc', 'Month name', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_year', 'Year', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_year_desc', 'Year (YYYY)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_time', 'Time', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_time_desc', 'Lesson time (HH:MM)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_time_12h', '12-Hour Time', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_time_12h_desc', '12-hour format time', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_duration', 'Duration', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_duration_desc', 'Meeting duration in minutes', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_timezone', 'Timezone', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_timezone_desc', 'Meeting timezone', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_instructor', 'Instructor', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_instructor_desc', 'Instructor name', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_course_name', 'Course Name', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.token_course_name_desc', 'Course name', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- BULK LESSON DIALOG - Preview Section
    -- ========================================================================
    (v_tenant_id, 'en', 'lms.lesson.preview_title', 'Preview', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.preview_description', 'Preview of the first 3 lessons:', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- BULK LESSON DIALOG - Buttons
    -- ========================================================================
    (v_tenant_id, 'en', 'lms.lesson.create_series', 'Create Lesson Series', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.creating_lessons', 'Creating lessons...', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- ZOOM INTEGRATION - Main Section
    -- ========================================================================
    (v_tenant_id, 'en', 'lms.lesson.zoom_integration_title', 'Zoom Meeting Integration', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.zoom_integration_desc', 'Automatically create Zoom meetings for each lesson', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.enable_zoom_label', 'Create Zoom Meetings', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.zoom_topic_label', 'Meeting Topic Pattern', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.zoom_topic_placeholder', 'e.g., {series_name} - Lesson {n}', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.zoom_topic_help', 'Use placeholders like {n}, {series_name}, {date}, {time}', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.zoom_agenda_label', 'Meeting Agenda', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.zoom_agenda_placeholder', 'Enter meeting agenda (optional)...', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- ZOOM CONFIGURATION - Security Settings
    -- ========================================================================
    (v_tenant_id, 'en', 'lms.zoom.security_settings_title', 'Security Settings', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.zoom.passcode_label', 'Meeting Passcode (Optional)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.zoom.passcode_placeholder', 'Enter passcode...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.zoom.passcode_help', 'Passcode to prevent unauthorized access (6-10 characters)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.zoom.waiting_room_label', 'Waiting Room', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.zoom.join_before_host_label', 'Allow Participants to Join Before Host', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.zoom.mute_upon_entry_label', 'Mute Participants Upon Entry', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.zoom.require_authentication_label', 'Require Authentication to Join', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- ZOOM CONFIGURATION - Video/Audio Settings
    -- ========================================================================
    (v_tenant_id, 'en', 'lms.zoom.video_audio_settings_title', 'Video & Audio Settings', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.zoom.host_video_label', 'Start Host Video on Join', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.zoom.participant_video_label', 'Start Participant Video on Join', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.zoom.audio_options_label', 'Audio Options', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.zoom.audio_both', 'Both Telephony and Computer', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.zoom.audio_telephony', 'Telephony Only', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.zoom.audio_voip', 'Computer Audio Only', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- ZOOM CONFIGURATION - Recording Settings
    -- ========================================================================
    (v_tenant_id, 'en', 'lms.zoom.recording_settings_title', 'Recording Settings', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.zoom.auto_recording_label', 'Automatic Recording', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.zoom.recording_none', 'No Recording', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.zoom.recording_local', 'Local Recording', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.zoom.recording_cloud', 'Cloud Recording', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.zoom.record_speaker_view_label', 'Record Active Speaker with Shared Screen', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.zoom.recording_disclaimer_label', 'Show Recording Disclaimer', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- INTEGRATIONS - Common Terms
    -- ========================================================================
    (v_tenant_id, 'en', 'admin.integrations.title', 'Integrations', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.description', 'Connect and configure third-party services to extend platform capabilities', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.active', 'Active', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.credentials', 'API Credentials', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.hide', 'Hide', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.show', 'Show', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- INTEGRATIONS - Status Messages
    -- ========================================================================
    (v_tenant_id, 'en', 'admin.integrations.status.connected', 'Connected', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.status.disconnected', 'Disconnected', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.status.error', 'Error', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- INTEGRATIONS - Success Messages
    -- ========================================================================
    (v_tenant_id, 'en', 'admin.integrations.success.saved', 'Settings saved successfully', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.success.testPassed', 'Connection test successful', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- INTEGRATIONS - Error Messages
    -- ========================================================================
    (v_tenant_id, 'en', 'admin.integrations.errors.loadFailed', 'Failed to load integrations', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.errors.saveFailed', 'Failed to save settings', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.errors.testFailed', 'Connection test failed', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- INTEGRATIONS - Security and Environment
    -- ========================================================================
    (v_tenant_id, 'en', 'admin.integrations.securityNote', 'All credentials are encrypted and stored securely. We recommend using API keys with the minimum required permissions.', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.environment.sandbox', 'Sandbox Environment', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.environment.production', 'Production Environment', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- INTEGRATIONS - Zoom
    -- ========================================================================
    (v_tenant_id, 'en', 'admin.integrations.zoom.description', 'Video conferencing and online meetings', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.zoom.accountId', 'Account ID', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.zoom.accountIdPlaceholder', 'Your Zoom Account ID', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.zoom.clientId', 'Client ID', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.zoom.clientIdPlaceholder', 'Your Zoom Client ID', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.zoom.clientSecret', 'Client Secret', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.zoom.clientSecretPlaceholder', 'Your Zoom Client Secret', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.zoom.sdkKey', 'SDK Key', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.zoom.sdkKeyPlaceholder', 'Your Zoom SDK Key', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.zoom.sdkSecret', 'SDK Secret', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.zoom.sdkSecretPlaceholder', 'Your Zoom SDK Secret', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.zoom.defaultDuration', 'Default Meeting Duration (minutes)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.zoom.autoRecording', 'Auto Recording', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.zoom.recordingNone', 'None', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.zoom.recordingLocal', 'Local', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.zoom.recordingCloud', 'Cloud', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- INTEGRATIONS - DocuSign
    -- ========================================================================
    (v_tenant_id, 'en', 'admin.integrations.docusign.description', 'E-signature platform and cloud-based agreements', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.docusign.accountId', 'Account ID', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.docusign.accountIdPlaceholder', 'Your DocuSign Account ID', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.docusign.integrationKey', 'Integration Key', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.docusign.integrationKeyPlaceholder', 'Your DocuSign Integration Key', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.docusign.userId', 'User ID (GUID)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.docusign.userIdPlaceholder', 'Your DocuSign User ID', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.docusign.privateKey', 'RSA Private Key', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.docusign.privateKeyPlaceholder', 'Paste RSA private key (including BEGIN/END lines)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.docusign.oauthBasePath', 'OAuth Base Path', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.docusign.apiBasePath', 'API Base Path', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.docusign.webhookSecret', 'Webhook Secret (HMAC Key)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.docusign.webhookSecretPlaceholder', 'Optional: HMAC key from DocuSign Connect', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.docusign.autoSend', 'Auto-send Envelopes', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.docusign.reminderDays', 'Reminder After (days)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.docusign.expirationDays', 'Expiration After (days)', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- INTEGRATIONS - Stripe
    -- ========================================================================
    (v_tenant_id, 'en', 'admin.integrations.stripe.description', 'Online payment processing platform', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.stripe.secretKey', 'Secret Key', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.stripe.publishableKey', 'Publishable Key', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.stripe.webhookSecret', 'Webhook Secret', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.stripe.currency', 'Default Currency', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.stripe.statementDescriptor', 'Statement Descriptor', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.stripe.statementDescriptorPlaceholder', 'Your company name', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- INTEGRATIONS - SendGrid
    -- ========================================================================
    (v_tenant_id, 'en', 'admin.integrations.sendgrid.description', 'Email delivery service', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.sendgrid.apiKey', 'API Key', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.sendgrid.fromEmail', 'From Email Address', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.sendgrid.fromName', 'From Name', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.sendgrid.fromNamePlaceholder', 'Your Company', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.sendgrid.sandboxMode', 'Sandbox Mode', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.sendgrid.emailTracking', 'Email Tracking', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- INTEGRATIONS - Twilio
    -- ========================================================================
    (v_tenant_id, 'en', 'admin.integrations.twilio.description', 'SMS and voice communications', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.twilio.accountSid', 'Account SID', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.twilio.authToken', 'Auth Token', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.twilio.authTokenPlaceholder', 'Your auth token', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.twilio.phoneNumber', 'Phone Number', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.twilio.messagingServiceSid', 'Messaging Service SID', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- INTEGRATIONS - UI Elements (Buttons and Actions)
    -- ========================================================================
    (v_tenant_id, 'en', 'admin.integrations.select', 'Select', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.settings', 'Integration Settings', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.webhookUrl', 'Webhook URL', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.webhookDescription', 'Configure this URL in the webhook settings of', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.copy', 'Copy', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.copied', 'Webhook URL copied to clipboard', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.testing', 'Testing...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.testConnection', 'Test Connection', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.saving', 'Saving...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'admin.integrations.save', 'Save Settings', 'admin', NOW(), NOW());

  -- Show success message
  RAISE NOTICE 'Successfully added % English translations', (
    SELECT COUNT(*)
    FROM translations
    WHERE language_code = 'en'
      AND tenant_id = v_tenant_id
  );

END $$;

-- Verify the insertions
SELECT
  COUNT(*) as total_translations,
  language_code,
  context
FROM translations
WHERE language_code = 'en'
GROUP BY language_code, context;
