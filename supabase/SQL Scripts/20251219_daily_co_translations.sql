-- ============================================================================
-- Daily.co Integration Translations
-- ============================================================================
-- Description: Add English and Hebrew translations for Daily.co integration
-- Author: System
-- Date: 2025-12-19

DO $$
DECLARE
  v_tenant_id UUID := '70d86807-7e7c-49cd-8601-98235444e2ac';
BEGIN

  -- Delete existing translations if they exist to avoid duplicates
  DELETE FROM translations
  WHERE tenant_id = v_tenant_id
    AND translation_key IN (
      'admin.integrations.daily.description',
      'admin.integrations.daily.apiKey',
      'admin.integrations.daily.apiKeyPlaceholder',
      'admin.integrations.daily.subdomain',
      'admin.integrations.daily.subdomainPlaceholder',
      'admin.integrations.daily.roomPrivacy',
      'admin.integrations.daily.privacyPrivate',
      'admin.integrations.daily.privacyPublic',
      'admin.integrations.daily.enableRecording',
      'admin.integrations.daily.expiryHours',
      'admin.integrations.daily.connectionSuccessful',
      'admin.integrations.daily.connectionFailed',
      'lms.builder.add_daily',
      'lms.builder.daily_created',
      'lms.builder.daily_create_failed'
    );

  -- Insert English and Hebrew translations
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES
  -- Description
  (v_tenant_id, 'en', 'admin.integrations.daily.description', 'Video calling platform with automatic host assignment', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.daily.description', 'פלטפורמת שיחות וידאו עם הקצאת מארח אוטומטית', 'admin', NOW(), NOW()),

  -- API Key
  (v_tenant_id, 'en', 'admin.integrations.daily.apiKey', 'API Key', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.daily.apiKey', 'מפתח API', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.integrations.daily.apiKeyPlaceholder', 'Your Daily.co API Key', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.daily.apiKeyPlaceholder', 'מפתח ה-API שלך מ-Daily.co', 'admin', NOW(), NOW()),

  -- Subdomain
  (v_tenant_id, 'en', 'admin.integrations.daily.subdomain', 'Subdomain', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.daily.subdomain', 'תת-דומיין', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.integrations.daily.subdomainPlaceholder', 'yourname (for yourname.daily.co)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.daily.subdomainPlaceholder', 'השם שלך (עבור yourname.daily.co)', 'admin', NOW(), NOW()),

  -- Room Privacy
  (v_tenant_id, 'en', 'admin.integrations.daily.roomPrivacy', 'Default Room Privacy', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.daily.roomPrivacy', 'פרטיות חדר ברירת מחדל', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.integrations.daily.privacyPrivate', 'Private (requires token)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.daily.privacyPrivate', 'פרטי (דורש טוקן)', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.integrations.daily.privacyPublic', 'Public', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.daily.privacyPublic', 'ציבורי', 'admin', NOW(), NOW()),

  -- Recording
  (v_tenant_id, 'en', 'admin.integrations.daily.enableRecording', 'Enable Cloud Recording', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.daily.enableRecording', 'אפשר הקלטת ענן', 'admin', NOW(), NOW()),

  -- Expiry Hours
  (v_tenant_id, 'en', 'admin.integrations.daily.expiryHours', 'Room Expiry (hours)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.daily.expiryHours', 'תפוגת חדר (שעות)', 'admin', NOW(), NOW()),

  -- Connection Status
  (v_tenant_id, 'en', 'admin.integrations.daily.connectionSuccessful', 'Daily.co connection successful', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.daily.connectionSuccessful', 'החיבור ל-Daily.co הצליח', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.integrations.daily.connectionFailed', 'Daily.co connection failed', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.integrations.daily.connectionFailed', 'החיבור ל-Daily.co נכשל', 'admin', NOW(), NOW()),

  -- LMS Builder UI
  (v_tenant_id, 'en', 'lms.builder.add_daily', 'Add Daily.co', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.builder.add_daily', 'הוסף Daily.co', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'lms.builder.daily_created', 'Daily.co room created successfully', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.builder.daily_created', 'חדר Daily.co נוצר בהצלחה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'lms.builder.daily_create_failed', 'Failed to create Daily.co room', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.builder.daily_create_failed', 'יצירת חדר Daily.co נכשלה', 'admin', NOW(), NOW()),

  -- Lesson Creation Form
  (v_tenant_id, 'en', 'lms.lesson.meeting_integration_title', 'Video Meeting Integration', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.lesson.meeting_integration_title', 'אינטגרציה למפגש וידאו', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'lms.lesson.meeting_integration_desc', 'Create a video meeting automatically for this lesson', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.lesson.meeting_integration_desc', 'צור מפגש וידאו אוטומטית לשיעור זה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'lms.lesson.meeting_platform', 'Platform', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.lesson.meeting_platform', 'פלטפורמה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'lms.lesson.meeting_topic_label', 'Meeting Topic', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.lesson.meeting_topic_label', 'נושא המפגש', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'lms.lesson.meeting_topic_placeholder', 'e.g., Introduction to Parenting - Session 1', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.lesson.meeting_topic_placeholder', 'לדוגמה, מבוא להורות - מפגש 1', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'lms.lesson.meeting_agenda_label', 'Meeting Agenda (Optional)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.lesson.meeting_agenda_label', 'סדר יום (אופציונלי)', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'lms.lesson.meeting_agenda_placeholder', 'e.g., Today we will cover...', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.lesson.meeting_agenda_placeholder', 'לדוגמה, היום נכסה...', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'lms.lesson.daily_auto_config', 'Daily.co room will be created automatically. Instructors will be assigned as hosts automatically - no manual setup needed!', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.lesson.daily_auto_config', 'חדר Daily.co ייווצר אוטומטית. מרצים יוקצו כמארחים אוטומטית - אין צורך בהגדרה ידנית!', 'admin', NOW(), NOW()),

  -- Bulk Lesson Creation
  (v_tenant_id, 'en', 'lms.lesson.bulk_daily_info', 'A separate Daily.co room will be created for each lesson in the series.', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.lesson.bulk_daily_info', 'חדר Daily.co נפרד ייווצר עבור כל שיעור בסדרה.', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'lms.lesson.daily_room_name_pattern_label', 'Daily.co Room Name Pattern', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.lesson.daily_room_name_pattern_label', 'תבנית שם חדר Daily.co', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'lms.lesson.daily_room_name_pattern_placeholder', '{series_name}-session-{n}', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.lesson.daily_room_name_pattern_placeholder', '{series_name}-session-{n}', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'lms.builder.daily_room_pattern_required', 'Daily.co room name pattern is required when creating Daily.co rooms', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.builder.daily_room_pattern_required', 'תבנית שם חדר Daily.co נדרשת בעת יצירת חדרי Daily.co', 'admin', NOW(), NOW());

  RAISE NOTICE 'Daily.co integration translations added successfully';

END $$;
