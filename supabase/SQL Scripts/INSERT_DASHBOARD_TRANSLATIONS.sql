-- Insert User Dashboard Translations (English + Hebrew)
-- Run this SQL directly in your Supabase SQL Editor
-- Total: 67 translation keys (English + Hebrew = 134 rows)

DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the first tenant (or specify your tenant ID)
  SELECT id INTO tenant_uuid FROM tenants LIMIT 1;

  -- Delete existing dashboard translations to avoid duplicates
  DELETE FROM translations WHERE translation_key LIKE 'user.dashboard.%';

  -- ========================================
  -- ENGLISH TRANSLATIONS
  -- ========================================

  -- Dashboard Main Page (3 keys)
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('en', 'user.dashboard.errorTitle', 'Error loading dashboard', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.errorMessage', 'Failed to load your dashboard data. Please try again.', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.retry', 'Retry', 'user', NOW(), NOW(), tenant_uuid);

  -- WelcomeHero Component (11 keys)
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('en', 'user.dashboard.hero.greeting.morning', 'Good morning', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.hero.greeting.afternoon', 'Good afternoon', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.hero.greeting.evening', 'Good evening', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.hero.welcome', 'Welcome back', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.hero.subtitle', 'You''re making great progress! Let''s continue your learning journey today.', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.hero.stats.activeCourses', 'active courses', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.hero.stats.inProgress', 'in progress', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.hero.actions.programs', 'My Programs', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.hero.actions.courses', 'My Courses', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.hero.actions.notifications', 'Notifications', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.hero.actions.profile', 'Profile', 'user', NOW(), NOW(), tenant_uuid);

  -- StatsCards Component (4 keys)
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('en', 'user.dashboard.stats.activeCourses', 'Active Courses', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.stats.completed', 'Completed', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.stats.inProgress', 'In Progress', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.stats.assignments', 'Assignments', 'user', NOW(), NOW(), tenant_uuid);

  -- ContinueLearning Component (12 keys)
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('en', 'user.dashboard.continue.title', 'Continue Learning', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.continue.subtitle', 'Pick up where you left off', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.continue.viewAll', 'View all', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.continue.noCourses', 'No active courses', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.continue.startLearning', 'Start your learning journey by enrolling in a course', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.continue.browseCourses', 'Browse Courses', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.continue.lessons', 'lessons', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.continue.hoursLeft', 'hours left', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.continue.pointsEarned', 'points earned', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.continue.courseProgress', 'Course Progress', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.continue.complete', '% Complete', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.continue.continueButton', 'Continue Learning', 'user', NOW(), NOW(), tenant_uuid);

  -- UpcomingSessions Component (13 keys)
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('en', 'user.dashboard.sessions.title', 'Upcoming Sessions', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.sessions.viewCalendar', 'View Calendar', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.sessions.noSessions', 'No upcoming sessions', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.sessions.checkLater', 'Check back later for scheduled live sessions', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.sessions.sessionScheduled', 'session scheduled', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.sessions.sessionsScheduled', 'sessions scheduled', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.sessions.scheduled', 'scheduled', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.sessions.status.liveNow', 'Live Now', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.sessions.status.startingSoon', 'Starting Soon', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.sessions.instructor', 'Instructor', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.sessions.starts', 'Starts', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.sessions.joinSession', 'Join Session', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.sessions.viewAllSessions', 'View All Sessions', 'user', NOW(), NOW(), tenant_uuid);

  -- PendingAssignments Component (24 keys)
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('en', 'user.dashboard.assignments.title', 'Assignments', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.assignments.viewAll', 'View All', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.assignments.pendingCount', 'pending', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.assignments.overdueCount', 'overdue', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.assignments.tabs.all', 'All', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.assignments.tabs.pending', 'Pending', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.assignments.tabs.overdue', 'Overdue', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.assignments.tabs.done', 'Done', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.assignments.urgency.dueTomorrow', 'Due Tomorrow', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.assignments.urgency.dueSoon', 'Due Soon', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.assignments.status.graded', 'Graded', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.assignments.status.submitted', 'Submitted', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.assignments.status.overdue', 'Overdue', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.assignments.status.pending', 'Pending', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.assignments.points', 'points', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.assignments.actions.submitNow', 'Submit Now', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.assignments.actions.viewResults', 'View Results', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.assignments.actions.viewSubmission', 'View Submission', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.assignments.allCaughtUp', 'All caught up!', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.assignments.greatWork', 'Great work! No pending assignments.', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.assignments.viewAllAssignments', 'View All Assignments', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.assignments.empty.noPending', 'No pending assignments', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.assignments.empty.noOverdue', 'No overdue assignments', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.dashboard.assignments.empty.noSubmitted', 'No submitted assignments yet', 'user', NOW(), NOW(), tenant_uuid);

  -- ========================================
  -- HEBREW TRANSLATIONS
  -- ========================================

  -- Dashboard Main Page (3 keys)
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('he', 'user.dashboard.errorTitle', 'שגיאה בטעינת לוח הבקרה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.errorMessage', 'נכשל בטעינת נתוני לוח הבקרה. אנא נסה שוב.', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.retry', 'נסה שוב', 'user', NOW(), NOW(), tenant_uuid);

  -- WelcomeHero Component (11 keys)
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('he', 'user.dashboard.hero.greeting.morning', 'בוקר טוב', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.hero.greeting.afternoon', 'צהריים טובים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.hero.greeting.evening', 'ערב טוב', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.hero.welcome', 'ברוך שובך', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.hero.subtitle', 'אתה עושה התקדמות נהדרת! בוא נמשיך במסע הלמידה שלך היום.', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.hero.stats.activeCourses', 'קורסים פעילים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.hero.stats.inProgress', 'בתהליך', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.hero.actions.programs', 'התוכניות שלי', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.hero.actions.courses', 'הקורסים שלי', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.hero.actions.notifications', 'התראות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.hero.actions.profile', 'פרופיל', 'user', NOW(), NOW(), tenant_uuid);

  -- StatsCards Component (4 keys)
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('he', 'user.dashboard.stats.activeCourses', 'קורסים פעילים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.stats.completed', 'הושלמו', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.stats.inProgress', 'בתהליך', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.stats.assignments', 'מטלות', 'user', NOW(), NOW(), tenant_uuid);

  -- ContinueLearning Component (12 keys)
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('he', 'user.dashboard.continue.title', 'המשך למידה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.continue.subtitle', 'המשך מהמקום שבו הפסקת', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.continue.viewAll', 'צפה בהכל', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.continue.noCourses', 'אין קורסים פעילים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.continue.startLearning', 'התחל את מסע הלמידה שלך על ידי רישום לקורס', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.continue.browseCourses', 'עיין בקורסים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.continue.lessons', 'שיעורים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.continue.hoursLeft', 'שעות נותרו', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.continue.pointsEarned', 'נקודות שנצברו', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.continue.courseProgress', 'התקדמות בקורס', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.continue.complete', '% הושלם', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.continue.continueButton', 'המשך למידה', 'user', NOW(), NOW(), tenant_uuid);

  -- UpcomingSessions Component (13 keys)
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('he', 'user.dashboard.sessions.title', 'מפגשים קרובים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.sessions.viewCalendar', 'צפה ביומן', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.sessions.noSessions', 'אין מפגשים קרובים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.sessions.checkLater', 'בדוק מאוחר יותר עבור מפגשים חיים מתוזמנים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.sessions.sessionScheduled', 'מפגש מתוזמן', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.sessions.sessionsScheduled', 'מפגשים מתוזמנים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.sessions.scheduled', 'מתוזמן', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.sessions.status.liveNow', 'חי עכשיו', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.sessions.status.startingSoon', 'מתחיל בקרוב', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.sessions.instructor', 'מדריך', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.sessions.starts', 'מתחיל', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.sessions.joinSession', 'הצטרף למפגש', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.sessions.viewAllSessions', 'צפה בכל המפגשים', 'user', NOW(), NOW(), tenant_uuid);

  -- PendingAssignments Component (24 keys)
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('he', 'user.dashboard.assignments.title', 'מטלות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.assignments.viewAll', 'צפה בהכל', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.assignments.pendingCount', 'ממתינות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.assignments.overdueCount', 'באיחור', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.assignments.tabs.all', 'הכל', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.assignments.tabs.pending', 'ממתינות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.assignments.tabs.overdue', 'באיחור', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.assignments.tabs.done', 'בוצעו', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.assignments.urgency.dueTomorrow', 'תאריך יעד מחר', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.assignments.urgency.dueSoon', 'תאריך יעד בקרוב', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.assignments.status.graded', 'מדורג', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.assignments.status.submitted', 'נשלח', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.assignments.status.overdue', 'באיחור', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.assignments.status.pending', 'ממתין', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.assignments.points', 'נקודות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.assignments.actions.submitNow', 'שלח עכשיו', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.assignments.actions.viewResults', 'צפה בתוצאות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.assignments.actions.viewSubmission', 'צפה בהגשה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.assignments.allCaughtUp', 'הכל מעודכן!', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.assignments.greatWork', 'עבודה מצוינת! אין מטלות ממתינות.', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.assignments.viewAllAssignments', 'צפה בכל המטלות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.assignments.empty.noPending', 'אין מטלות ממתינות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.assignments.empty.noOverdue', 'אין מטלות באיחור', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.dashboard.assignments.empty.noSubmitted', 'עדיין לא הוגשו מטלות', 'user', NOW(), NOW(), tenant_uuid);

  RAISE NOTICE 'Dashboard translations inserted successfully for tenant: %', tenant_uuid;
  RAISE NOTICE 'Total: 67 translation keys × 2 languages = 134 rows inserted';
END $$;
