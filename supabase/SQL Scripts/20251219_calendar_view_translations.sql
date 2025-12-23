-- ============================================================================
-- Calendar View Translations
-- ============================================================================
-- Description: Add English and Hebrew translations for calendar view components
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
      'user.dashboard.calendar.today',
      'user.dashboard.calendar.sun',
      'user.dashboard.calendar.mon',
      'user.dashboard.calendar.tue',
      'user.dashboard.calendar.wed',
      'user.dashboard.calendar.thu',
      'user.dashboard.calendar.fri',
      'user.dashboard.calendar.sat',
      'user.dashboard.calendar.moreEvents',
      'user.dashboard.sessions.viewList',
      'user.dashboard.sessions.viewWeek',
      'user.dashboard.sessions.viewMonth',
      'user.dashboard.sessions.duration.minutes',
      'user.dashboard.sessions.duration.minutesShort',
      'user.dashboard.sessions.duration.hours',
      'user.dashboard.sessions.duration.hoursShort',
      'user.dashboard.sessions.duration.daysShort'
    );

  -- Insert English and Hebrew translations
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES

  -- Calendar Navigation
  (v_tenant_id, 'en', 'user.dashboard.calendar.today', 'Today', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.dashboard.calendar.today', 'היום', 'user', NOW(), NOW()),

  -- Day Names (Short)
  (v_tenant_id, 'en', 'user.dashboard.calendar.sun', 'Sun', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.dashboard.calendar.sun', 'א׳', 'user', NOW(), NOW()),

  (v_tenant_id, 'en', 'user.dashboard.calendar.mon', 'Mon', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.dashboard.calendar.mon', 'ב׳', 'user', NOW(), NOW()),

  (v_tenant_id, 'en', 'user.dashboard.calendar.tue', 'Tue', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.dashboard.calendar.tue', 'ג׳', 'user', NOW(), NOW()),

  (v_tenant_id, 'en', 'user.dashboard.calendar.wed', 'Wed', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.dashboard.calendar.wed', 'ד׳', 'user', NOW(), NOW()),

  (v_tenant_id, 'en', 'user.dashboard.calendar.thu', 'Thu', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.dashboard.calendar.thu', 'ה׳', 'user', NOW(), NOW()),

  (v_tenant_id, 'en', 'user.dashboard.calendar.fri', 'Fri', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.dashboard.calendar.fri', 'ו׳', 'user', NOW(), NOW()),

  (v_tenant_id, 'en', 'user.dashboard.calendar.sat', 'Sat', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.dashboard.calendar.sat', 'ש׳', 'user', NOW(), NOW()),

  -- View Mode Toggle
  (v_tenant_id, 'en', 'user.dashboard.sessions.viewList', 'List', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.dashboard.sessions.viewList', 'רשימה', 'user', NOW(), NOW()),

  (v_tenant_id, 'en', 'user.dashboard.sessions.viewWeek', 'Week', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.dashboard.sessions.viewWeek', 'שבוע', 'user', NOW(), NOW()),

  (v_tenant_id, 'en', 'user.dashboard.sessions.viewMonth', 'Month', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.dashboard.sessions.viewMonth', 'חודש', 'user', NOW(), NOW()),

  -- More events indicator
  (v_tenant_id, 'en', 'user.dashboard.calendar.moreEvents', 'more', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.dashboard.calendar.moreEvents', 'נוספים', 'user', NOW(), NOW()),

  -- Duration/Time formats
  (v_tenant_id, 'en', 'user.dashboard.sessions.duration.minutes', 'min', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.dashboard.sessions.duration.minutes', 'דק׳', 'user', NOW(), NOW()),

  (v_tenant_id, 'en', 'user.dashboard.sessions.duration.minutesShort', 'm', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.dashboard.sessions.duration.minutesShort', 'ד׳', 'user', NOW(), NOW()),

  (v_tenant_id, 'en', 'user.dashboard.sessions.duration.hours', 'h', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.dashboard.sessions.duration.hours', 'ש׳', 'user', NOW(), NOW()),

  (v_tenant_id, 'en', 'user.dashboard.sessions.duration.hoursShort', 'h', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.dashboard.sessions.duration.hoursShort', 'ש׳', 'user', NOW(), NOW()),

  (v_tenant_id, 'en', 'user.dashboard.sessions.duration.daysShort', 'd', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.dashboard.sessions.duration.daysShort', 'י׳', 'user', NOW(), NOW());

  RAISE NOTICE 'Calendar view translations added successfully';

END $$;
