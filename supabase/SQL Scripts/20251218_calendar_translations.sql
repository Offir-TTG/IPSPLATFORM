-- ============================================================================
-- CALENDAR PAGE TRANSLATIONS
-- Adds English and Hebrew translations for the calendar page
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

  -- Delete existing translations for calendar to avoid duplicates
  DELETE FROM public.translations
  WHERE translation_key LIKE 'user.calendar.%';

  -- Insert English translations
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    -- Page title and header
    (v_tenant_id, 'en', 'user.calendar.title', 'My Calendar', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.calendar.subtitle', 'View all your upcoming sessions and meetings', 'user', NOW(), NOW()),

    -- Filters
    (v_tenant_id, 'en', 'user.calendar.filter.all', 'All Sessions', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.calendar.filter.today', 'Today', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.calendar.filter.next24h', 'Next 24h', 'user', NOW(), NOW()),

    -- Session info
    (v_tenant_id, 'en', 'user.calendar.instructor', 'Instructor', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.calendar.starts', 'Starts', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.calendar.joinSession', 'Join Session', 'user', NOW(), NOW()),

    -- Empty states
    (v_tenant_id, 'en', 'user.calendar.noSessions', 'No sessions found', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.calendar.noSessionsAll', 'You have no upcoming sessions scheduled', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.calendar.noSessionsToday', 'You have no sessions scheduled for today', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.calendar.noSessionsNext24h', 'You have no sessions in the next 24 hours', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.calendar.browseCourses', 'Browse Courses', 'user', NOW(), NOW()),

    -- Summary
    (v_tenant_id, 'en', 'user.calendar.showing', 'Showing', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.calendar.session', 'session', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.calendar.sessions', 'sessions', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.calendar.viewAll', 'View All', 'user', NOW(), NOW()),

    -- Error states
    (v_tenant_id, 'en', 'user.calendar.errorTitle', 'Error loading calendar', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.calendar.errorMessage', 'Failed to load your calendar data. Please try again.', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.calendar.retry', 'Retry', 'user', NOW(), NOW());

  -- Insert Hebrew translations
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    -- Page title and header
    (v_tenant_id, 'he', 'user.calendar.title', 'היומן שלי', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.calendar.subtitle', 'צפה בכל המפגשים והפגישות הקרובים שלך', 'user', NOW(), NOW()),

    -- Filters
    (v_tenant_id, 'he', 'user.calendar.filter.all', 'כל המפגשים', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.calendar.filter.today', 'היום', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.calendar.filter.next24h', '24 השעות הקרובות', 'user', NOW(), NOW()),

    -- Session info
    (v_tenant_id, 'he', 'user.calendar.instructor', 'מרצה', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.calendar.starts', 'מתחיל', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.calendar.joinSession', 'הצטרף למפגש', 'user', NOW(), NOW()),

    -- Empty states
    (v_tenant_id, 'he', 'user.calendar.noSessions', 'לא נמצאו מפגשים', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.calendar.noSessionsAll', 'אין לך מפגשים קרובים מתוזמנים', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.calendar.noSessionsToday', 'אין לך מפגשים מתוזמנים להיום', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.calendar.noSessionsNext24h', 'אין לך מפגשים ב-24 השעות הקרובות', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.calendar.browseCourses', 'עיין בקורסים', 'user', NOW(), NOW()),

    -- Summary
    (v_tenant_id, 'he', 'user.calendar.showing', 'מציג', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.calendar.session', 'מפגש', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.calendar.sessions', 'מפגשים', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.calendar.viewAll', 'הצג הכל', 'user', NOW(), NOW()),

    -- Error states
    (v_tenant_id, 'he', 'user.calendar.errorTitle', 'שגיאה בטעינת היומן', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.calendar.errorMessage', 'נכשל בטעינת נתוני היומן. אנא נסה שנית.', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.calendar.retry', 'נסה שוב', 'user', NOW(), NOW());

END $$;
