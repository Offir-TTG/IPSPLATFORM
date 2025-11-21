-- ============================================================================
-- USER DASHBOARD TRANSLATIONS
-- Adds English and Hebrew translations for user dashboard
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

  -- Delete existing translations for user dashboard to avoid duplicates
  DELETE FROM public.translations
  WHERE translation_key LIKE 'user.dashboard.%';

  -- Insert English translations
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    -- Page title
    (v_tenant_id, 'en', 'user.dashboard.title', 'Dashboard', 'user', NOW(), NOW()),

    -- Welcome section
    (v_tenant_id, 'en', 'user.dashboard.welcome.morning', 'Good morning', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.welcome.afternoon', 'Good afternoon', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.welcome.evening', 'Good evening', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.welcome.subtitle', 'Ready to continue your learning journey?', 'user', NOW(), NOW()),

    -- Stats
    (v_tenant_id, 'en', 'user.dashboard.stats.completed', 'Lessons completed', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.stats.time_spent', 'Time spent learning', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.stats.active_courses', 'Active Courses', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.stats.completed_lessons', 'Completed Lessons', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.stats.in_progress', 'In Progress', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.stats.pending_assignments', 'Pending Assignments', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.stats.enrolled', 'Currently enrolled', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.stats.finished', 'Finished successfully', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.stats.continue', 'Continue learning', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.stats.attention', 'Need your attention', 'user', NOW(), NOW()),

    -- Learning section
    (v_tenant_id, 'en', 'user.dashboard.learning.title', 'Continue Learning', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.learning.view_all', 'View all', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.learning.no_courses', 'No active courses', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.learning.no_courses_desc', 'Start your learning journey by enrolling in a course', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.learning.browse', 'Browse Courses', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.learning.progress', 'Progress', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.learning.lessons_of', 'of', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.learning.lessons_completed', 'lessons completed', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.learning.continue_btn', 'Continue Learning', 'user', NOW(), NOW()),

    -- Sessions section
    (v_tenant_id, 'en', 'user.dashboard.sessions.title', 'Upcoming Sessions', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.sessions.view_calendar', 'View calendar', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.sessions.no_sessions', 'No upcoming sessions', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.sessions.no_sessions_desc', 'Check back later for scheduled live sessions', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.sessions.join', 'Join', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.sessions.starts', 'Starts', 'user', NOW(), NOW()),

    -- Assignments section
    (v_tenant_id, 'en', 'user.dashboard.assignments.title', 'Pending Assignments', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.assignments.view_all', 'View all', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.assignments.no_pending', 'No pending assignments', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.assignments.all_caught_up', 'All caught up! Great work!', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.assignments.due', 'Due', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.assignments.status.pending', 'Pending', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.assignments.status.submitted', 'Submitted', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.assignments.status.overdue', 'Overdue', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.assignments.points', 'points', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.assignments.submit', 'Submit', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.assignments.view_submission', 'View Submission', 'user', NOW(), NOW()),

    -- Error states
    (v_tenant_id, 'en', 'user.dashboard.error.title', 'Error loading dashboard', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.error.description', 'Failed to load your dashboard data. Please try again.', 'user', NOW(), NOW()),
    (v_tenant_id, 'en', 'user.dashboard.error.retry', 'Retry', 'user', NOW(), NOW());

  -- Insert Hebrew translations
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    -- Page title
    (v_tenant_id, 'he', 'user.dashboard.title', 'לוח בקרה', 'user', NOW(), NOW()),

    -- Welcome section
    (v_tenant_id, 'he', 'user.dashboard.welcome.morning', 'בוקר טוב', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.welcome.afternoon', 'אחר צהריים טובים', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.welcome.evening', 'ערב טוב', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.welcome.subtitle', 'מוכן להמשיך במסע הלמידה שלך?', 'user', NOW(), NOW()),

    -- Stats
    (v_tenant_id, 'he', 'user.dashboard.stats.completed', 'שיעורים שהושלמו', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.stats.time_spent', 'זמן למידה', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.stats.active_courses', 'קורסים פעילים', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.stats.completed_lessons', 'שיעורים שהושלמו', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.stats.in_progress', 'בתהליך', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.stats.pending_assignments', 'משימות ממתינות', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.stats.enrolled', 'רשום כרגע', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.stats.finished', 'הושלם בהצלחה', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.stats.continue', 'המשך למידה', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.stats.attention', 'דורש תשומת לב', 'user', NOW(), NOW()),

    -- Learning section
    (v_tenant_id, 'he', 'user.dashboard.learning.title', 'המשך בלמידה', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.learning.view_all', 'צפה בהכל', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.learning.no_courses', 'אין קורסים פעילים', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.learning.no_courses_desc', 'התחל את מסע הלמידה שלך על ידי הרשמה לקורס', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.learning.browse', 'עיין בקורסים', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.learning.progress', 'התקדמות', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.learning.lessons_of', 'מתוך', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.learning.lessons_completed', 'שיעורים הושלמו', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.learning.continue_btn', 'המשך בלמידה', 'user', NOW(), NOW()),

    -- Sessions section
    (v_tenant_id, 'he', 'user.dashboard.sessions.title', 'מפגשים קרובים', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.sessions.view_calendar', 'צפה ביומן', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.sessions.no_sessions', 'אין מפגשים קרובים', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.sessions.no_sessions_desc', 'בדוק שוב מאוחר יותר עבור מפגשים מתוזמנים', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.sessions.join', 'הצטרף', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.sessions.starts', 'מתחיל', 'user', NOW(), NOW()),

    -- Assignments section
    (v_tenant_id, 'he', 'user.dashboard.assignments.title', 'משימות ממתינות', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.assignments.view_all', 'צפה בהכל', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.assignments.no_pending', 'אין משימות ממתינות', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.assignments.all_caught_up', 'הכל מעודכן! עבודה מצוינת!', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.assignments.due', 'תאריך יעד', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.assignments.status.pending', 'ממתין', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.assignments.status.submitted', 'הוגש', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.assignments.status.overdue', 'באיחור', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.assignments.points', 'נקודות', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.assignments.submit', 'הגש', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.assignments.view_submission', 'צפה בהגשה', 'user', NOW(), NOW()),

    -- Error states
    (v_tenant_id, 'he', 'user.dashboard.error.title', 'שגיאה בטעינת לוח הבקרה', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.error.description', 'נכשל בטעינת נתוני לוח הבקרה. אנא נסה שנית.', 'user', NOW(), NOW()),
    (v_tenant_id, 'he', 'user.dashboard.error.retry', 'נסה שוב', 'user', NOW(), NOW());

END $$;
