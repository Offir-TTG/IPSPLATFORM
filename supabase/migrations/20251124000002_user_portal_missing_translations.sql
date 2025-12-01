-- =====================================================
-- Missing User Portal Translations
-- =====================================================
-- This migration adds missing translation keys found in user portal pages
-- that were not included in the initial translations
--
-- Programs: 12 keys
-- Courses: 21 keys
-- Notifications: 8 keys
-- Total: 41 keys × 2 languages = 82 rows
-- =====================================================

DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the first tenant UUID
  SELECT id INTO tenant_uuid FROM tenants LIMIT 1;

  -- Insert missing translations
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    -- =====================================================
    -- PROGRAMS PAGE - Missing keys (12)
    -- =====================================================
    -- English
    ('en', 'user.programs.activePrograms', 'Active Programs', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.programs.stats.certificates', 'Certificates', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.programs.card.completed', 'Completed', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.programs.card.started', 'Started', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.programs.card.hours', 'hours', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.programs.card.overallProgress', 'Overall Progress', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.programs.card.coursesCompleted', 'courses completed', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.programs.card.estCompletion', 'Est. completion', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.programs.card.more', 'more', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.programs.card.continueLearning', 'Continue Learning', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.programs.card.viewDetails', 'View Details', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.programs.empty.browseButton', 'Browse Programs', 'user', NOW(), NOW(), tenant_uuid),

    -- Hebrew
    ('he', 'user.programs.activePrograms', 'תוכניות פעילות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.programs.stats.certificates', 'תעודות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.programs.card.completed', 'הושלם', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.programs.card.started', 'התחיל', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.programs.card.hours', 'שעות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.programs.card.overallProgress', 'התקדמות כללית', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.programs.card.coursesCompleted', 'קורסים הושלמו', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.programs.card.estCompletion', 'השלמה משוערת', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.programs.card.more', 'נוספים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.programs.card.continueLearning', 'המשך למידה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.programs.card.viewDetails', 'צפה בפרטים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.programs.empty.browseButton', 'עיין בתוכניות', 'user', NOW(), NOW(), tenant_uuid),

    -- =====================================================
    -- COURSES PAGE - Missing keys (21)
    -- =====================================================
    -- English
    ('en', 'user.courses.errorMessage', 'An error occurred while loading your courses', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.courses.stats.inProgress', 'In Progress', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.courses.stats.notStarted', 'Not Started', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.courses.tabs.notStarted', 'Not Started', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.courses.status.completed', 'Completed', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.courses.status.inProgress', 'In Progress', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.courses.status.notStarted', 'Not Started', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.courses.certificate', 'Certificate', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.courses.progress', 'Progress', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.courses.lessons', 'lessons', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.courses.lessonsCount', 'lessons', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.courses.enrolled', 'Enrolled', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.courses.enrolledOn', 'Enrolled on', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.courses.actions.review', 'Review Course', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.courses.actions.getCertificate', 'Get Certificate', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.courses.actions.startLearning', 'Start Learning', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.courses.actions.continueLearning', 'Continue Learning', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.courses.empty.title', 'No courses found', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.courses.empty.noEnrollments', 'You haven''t enrolled in any courses yet', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.courses.empty.noFilteredCourses', 'No courses match the selected filter', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.courses.empty.browseCourses', 'Browse Courses', 'user', NOW(), NOW(), tenant_uuid),

    -- Hebrew
    ('he', 'user.courses.errorMessage', 'אירעה שגיאה בטעינת הקורסים שלך', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.courses.stats.inProgress', 'בתהליך', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.courses.stats.notStarted', 'לא התחיל', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.courses.tabs.notStarted', 'לא התחיל', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.courses.status.completed', 'הושלם', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.courses.status.inProgress', 'בתהליך', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.courses.status.notStarted', 'לא התחיל', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.courses.certificate', 'תעודה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.courses.progress', 'התקדמות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.courses.lessons', 'שיעורים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.courses.lessonsCount', 'שיעורים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.courses.enrolled', 'נרשם', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.courses.enrolledOn', 'נרשם ב', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.courses.actions.review', 'סקור קורס', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.courses.actions.getCertificate', 'קבל תעודה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.courses.actions.startLearning', 'התחל למידה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.courses.actions.continueLearning', 'המשך למידה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.courses.empty.title', 'לא נמצאו קורסים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.courses.empty.noEnrollments', 'עדיין לא נרשמת לאף קורס', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.courses.empty.noFilteredCourses', 'אין קורסים התואמים לסינון שנבחר', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.courses.empty.browseCourses', 'עיין בקורסים', 'user', NOW(), NOW(), tenant_uuid),

    -- =====================================================
    -- NOTIFICATIONS PAGE - Missing keys (8)
    -- =====================================================
    -- English
    ('en', 'user.notifications.subtitle', 'Stay updated with your learning activities and important updates', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.stats.zoom', 'Zoom Meetings', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.tabs.zoom', 'Zoom', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.badge.urgent', 'Urgent', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.actions.markRead', 'Mark as read', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.actions.delete', 'Delete notification', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.empty.allCaughtUp', 'You''re all caught up! No notifications at the moment.', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.empty.noFilteredNotifications', 'No notifications in this category', 'user', NOW(), NOW(), tenant_uuid),

    -- Hebrew
    ('he', 'user.notifications.subtitle', 'הישאר מעודכן עם פעילויות הלמידה והעדכונים החשובים שלך', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.stats.zoom', 'פגישות Zoom', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.tabs.zoom', 'Zoom', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.badge.urgent', 'דחוף', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.actions.markRead', 'סמן כנקרא', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.actions.delete', 'מחק התראה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.empty.allCaughtUp', 'הכל מעודכן! אין התראות כרגע.', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.empty.noFilteredNotifications', 'אין התראות בקטגוריה זו', 'user', NOW(), NOW(), tenant_uuid)
  ON CONFLICT (tenant_id, language_code, translation_key)
  DO UPDATE SET
    translation_value = EXCLUDED.translation_value,
    updated_at = NOW();

  RAISE NOTICE 'Successfully added 41 missing translation keys (82 total rows): Programs (12), Courses (21), Notifications (8)';

END $$;
