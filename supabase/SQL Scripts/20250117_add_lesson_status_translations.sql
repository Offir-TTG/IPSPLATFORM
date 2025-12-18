-- ============================================================================
-- LESSON STATUS AND DURATION TRANSLATIONS
-- Adds translations for lesson status badges and duration units
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

  -- Delete existing translations to avoid duplicates
  DELETE FROM public.translations
  WHERE translation_key IN (
    'user.courses.status.completed',
    'user.courses.status.notCompleted',
    'user.courses.status.inProgress',
    'user.courses.status.notStarted',
    'user.courses.duration.hours',
    'user.courses.duration.minutes',
    'user.courses.duration.hoursShort',
    'user.courses.duration.minutesShort'
  );

  -- Insert English translations
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    -- Status translations
    (v_tenant_id, 'en', 'user.courses.status.completed', 'Completed', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.courses.status.notCompleted', 'Not Completed', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.courses.status.inProgress', 'In Progress', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.courses.status.notStarted', 'Not Started', 'user', NOW(), NOW()),

    -- Duration unit translations
    (v_tenant_id, 'en', 'user.courses.duration.hours', 'hours', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.courses.duration.minutes', 'minutes', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.courses.duration.hoursShort', 'h', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.courses.duration.minutesShort', 'm', 'user', NOW(), NOW());

  -- Insert Hebrew translations
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    -- Status translations
    (v_tenant_id, 'he', 'user.courses.status.completed', 'הושלם', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.courses.status.notCompleted', 'לא הושלם', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.courses.status.inProgress', 'בתהליך', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.courses.status.notStarted', 'לא התחיל', 'user', NOW(), NOW()),

    -- Duration unit translations
    (v_tenant_id, 'he', 'user.courses.duration.hours', 'שעות', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.courses.duration.minutes', 'דקות', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.courses.duration.hoursShort', 'שעה', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.courses.duration.minutesShort', 'דק\'', 'user', NOW(), NOW());

  RAISE NOTICE '✅ Lesson status and duration translations added successfully';
  RAISE NOTICE '   - Added status translations: completed, notCompleted, inProgress, notStarted';
  RAISE NOTICE '   - Added duration unit translations for both English and Hebrew';
END $$;
