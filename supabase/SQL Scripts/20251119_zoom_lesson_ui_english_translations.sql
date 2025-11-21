-- English translations for Zoom Lesson UI Integration
-- Adds English translations for the Zoom meeting management UI in lesson builder
-- Run this migration to add English translations for all Zoom lesson UI elements

DO $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- Get the first tenant ID (or you can specify a specific tenant)
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;

  -- If no tenant exists, raise an error
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No tenant found. Please create a tenant first.';
  END IF;

  -- Delete existing English translations for these keys to avoid duplicates
  DELETE FROM translations
  WHERE language_code = 'en'
    AND translation_key IN (
      'lms.lesson.syncs_to_zoom',
      'lms.lesson.zoom_connected',
      'lms.lesson.zoom_auto_sync',
      'lms.lesson.zoom_meeting_id',
      'lms.lesson.open_zoom',
      'lms.lesson.zoom_integration_title',
      'lms.lesson.zoom_integration_desc',
      'lms.lesson.zoom_topic_label',
      'lms.lesson.zoom_topic_placeholder',
      'lms.lesson.zoom_topic_help',
      'lms.lesson.zoom_agenda_label',
      'lms.lesson.zoom_agenda_placeholder',
      'lms.lesson.start_datetime_label',
      'lms.lesson.duration_label',
      'lms.lesson.publish_immediately'
    )
    AND tenant_id = v_tenant_id;

  -- Insert English translations for Zoom lesson UI
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    -- Zoom sync indicators
    (v_tenant_id, 'en', 'lms.lesson.syncs_to_zoom', 'Syncs to Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.zoom_connected', 'Connected to Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.zoom_auto_sync', 'Changes to date, time and duration will automatically sync to the Zoom meeting', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.zoom_meeting_id', 'Meeting ID', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.open_zoom', 'Open in Zoom', 'admin', NOW(), NOW()),

    -- Zoom integration section
    (v_tenant_id, 'en', 'lms.lesson.zoom_integration_title', 'Zoom Integration', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.zoom_integration_desc', 'Create a Zoom meeting automatically for this lesson', 'admin', NOW(), NOW()),

    -- Zoom meeting fields
    (v_tenant_id, 'en', 'lms.lesson.zoom_topic_label', 'Zoom Meeting Topic', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.zoom_topic_placeholder', 'e.g., Introduction to Parenting - Session 1', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.zoom_topic_help', 'This will be the visible meeting name in Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.zoom_agenda_label', 'Zoom Meeting Agenda (Optional)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.zoom_agenda_placeholder', 'e.g., Today we will cover basic parenting techniques...', 'admin', NOW(), NOW()),

    -- Lesson form fields
    (v_tenant_id, 'en', 'lms.lesson.start_datetime_label', 'Start Date & Time', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.duration_label', 'Duration (minutes)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'en', 'lms.lesson.publish_immediately', 'Publish Immediately', 'admin', NOW(), NOW());

  -- Show success message
  RAISE NOTICE 'Successfully added English translations for Zoom lesson UI integration';

END $$;

-- Verify the insertions
SELECT
  translation_key,
  translation_value,
  language_code
FROM translations
WHERE translation_key IN (
  'lms.lesson.syncs_to_zoom',
  'lms.lesson.zoom_connected',
  'lms.lesson.zoom_auto_sync',
  'lms.lesson.zoom_meeting_id',
  'lms.lesson.open_zoom',
  'lms.lesson.zoom_integration_title',
  'lms.lesson.zoom_integration_desc',
  'lms.lesson.zoom_topic_label',
  'lms.lesson.zoom_topic_placeholder',
  'lms.lesson.zoom_topic_help',
  'lms.lesson.zoom_agenda_label',
  'lms.lesson.zoom_agenda_placeholder',
  'lms.lesson.start_datetime_label',
  'lms.lesson.duration_label',
  'lms.lesson.publish_immediately'
)
AND language_code = 'en'
ORDER BY translation_key;
