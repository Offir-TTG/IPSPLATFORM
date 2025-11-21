-- Hebrew translations for Zoom Lesson UI Integration
-- Adds Hebrew translations for the Zoom meeting management UI in lesson builder
-- Run this migration to add Hebrew translations for all Zoom lesson UI elements

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

  -- Delete existing Hebrew translations for these keys to avoid duplicates
  DELETE FROM translations
  WHERE language_code = 'he'
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

  -- Insert Hebrew translations for Zoom lesson UI
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    -- Zoom sync indicators
    (v_tenant_id, 'he', 'lms.lesson.syncs_to_zoom', 'מסתנכרן ל-Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.zoom_connected', 'מחובר ל-Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.zoom_auto_sync', 'שינויים בתאריך, זמן ומשך יתעדכנו אוטומטית בפגישת Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.zoom_meeting_id', 'מזהה פגישה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.open_zoom', 'פתח ב-Zoom', 'admin', NOW(), NOW()),

    -- Zoom integration section
    (v_tenant_id, 'he', 'lms.lesson.zoom_integration_title', 'אינטגרציה עם Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.zoom_integration_desc', 'צור פגישת Zoom אוטומטית לשיעור זה', 'admin', NOW(), NOW()),

    -- Zoom meeting fields
    (v_tenant_id, 'he', 'lms.lesson.zoom_topic_label', 'נושא פגישת Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.zoom_topic_placeholder', 'למשל, מבוא להורות - מפגש 1', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.zoom_topic_help', 'זה יהיה שם הפגישה הגלוי ב-Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.zoom_agenda_label', 'סדר יום פגישת Zoom (אופציונלי)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.zoom_agenda_placeholder', 'למשל, היום נעסוק בטכניקות הורות בסיסיות...', 'admin', NOW(), NOW()),

    -- Lesson form fields
    (v_tenant_id, 'he', 'lms.lesson.start_datetime_label', 'תאריך ושעת התחלה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.duration_label', 'משך (דקות)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.lesson.publish_immediately', 'פרסם מיד', 'admin', NOW(), NOW());

  -- Show success message
  RAISE NOTICE 'Successfully added Hebrew translations for Zoom lesson UI integration';

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
AND language_code = 'he'
ORDER BY translation_key;
