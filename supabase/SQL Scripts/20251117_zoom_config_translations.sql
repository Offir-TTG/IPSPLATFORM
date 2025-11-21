-- ============================================================================
-- ZOOM MEETING CONFIGURATION TRANSLATIONS
-- Hebrew translations for Zoom security, video/audio, and recording settings
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
      -- Security Settings
      'lms.zoom.security_settings_title',
      'lms.zoom.passcode_label',
      'lms.zoom.passcode_placeholder',
      'lms.zoom.passcode_help',
      'lms.zoom.waiting_room_label',
      'lms.zoom.join_before_host_label',
      'lms.zoom.mute_upon_entry_label',
      'lms.zoom.require_authentication_label',

      -- Video/Audio Settings
      'lms.zoom.video_audio_settings_title',
      'lms.zoom.host_video_label',
      'lms.zoom.participant_video_label',
      'lms.zoom.audio_options_label',
      'lms.zoom.audio_both',
      'lms.zoom.audio_telephony',
      'lms.zoom.audio_voip',

      -- Recording Settings
      'lms.zoom.recording_settings_title',
      'lms.zoom.auto_recording_label',
      'lms.zoom.recording_none',
      'lms.zoom.recording_local',
      'lms.zoom.recording_cloud',
      'lms.zoom.record_speaker_view_label',
      'lms.zoom.recording_disclaimer_label'
    );

  -- Insert Hebrew translations
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    -- Security Settings Section
    (v_tenant_id, 'he', 'lms.zoom.security_settings_title', 'הגדרות אבטחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.zoom.passcode_label', 'סיסמת פגישה (אופציונלי)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.zoom.passcode_placeholder', 'הזן סיסמה...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.zoom.passcode_help', 'סיסמה למניעת גישה לא מורשית (6-10 תווים)', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.zoom.waiting_room_label', 'חדר המתנה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.zoom.join_before_host_label', 'אפשר משתתפים להצטרף לפני המארח', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.zoom.mute_upon_entry_label', 'השתק משתתפים בכניסה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.zoom.require_authentication_label', 'דרוש אימות להצטרפות', 'admin', NOW(), NOW()),

    -- Video/Audio Settings Section
    (v_tenant_id, 'he', 'lms.zoom.video_audio_settings_title', 'הגדרות וידאו ואודיו', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.zoom.host_video_label', 'הפעל וידאו מארח בכניסה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.zoom.participant_video_label', 'הפעל וידאו משתתפים בכניסה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.zoom.audio_options_label', 'אפשרויות שמע', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.zoom.audio_both', 'טלפון ומחשב', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.zoom.audio_telephony', 'טלפון בלבד', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.zoom.audio_voip', 'מחשב בלבד', 'admin', NOW(), NOW()),

    -- Recording Settings Section
    (v_tenant_id, 'he', 'lms.zoom.recording_settings_title', 'הגדרות הקלטה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.zoom.auto_recording_label', 'הקלטה אוטומטית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.zoom.recording_none', 'ללא הקלטה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.zoom.recording_local', 'הקלטה מקומית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.zoom.recording_cloud', 'הקלטה בענן', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.zoom.record_speaker_view_label', 'הקלט דובר פעיל עם שיתוף מסך', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.zoom.recording_disclaimer_label', 'הצג הצהרת הקלטה', 'admin', NOW(), NOW());

  RAISE NOTICE 'Successfully added % Hebrew translations for Zoom configuration settings', (
    SELECT COUNT(*)
    FROM translations
    WHERE translation_key LIKE 'lms.zoom.%'
      AND language_code = 'he'
      AND tenant_id = v_tenant_id
  );
END $$;
