-- Insert User Navigation Translations (English + Hebrew)
-- Run this SQL directly in your Supabase SQL Editor
-- Covers: UserLayout, Sidebar, and all navigation items
-- Total: 32 translation keys (English + Hebrew = 64 rows)

DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the first tenant (or specify your tenant ID)
  SELECT id INTO tenant_uuid FROM tenants LIMIT 1;

  -- Delete existing navigation translations to avoid duplicates
  DELETE FROM translations WHERE translation_key LIKE 'user.nav.%';
  DELETE FROM translations WHERE translation_key LIKE 'user.layout.%';
  DELETE FROM translations WHERE translation_key LIKE 'user.sidebar.%';

  -- ========================================
  -- ENGLISH TRANSLATIONS
  -- ========================================

  -- UserLayout - Navigation Items (5 keys)
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('en', 'user.nav.dashboard', 'Dashboard', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.nav.chat', 'Chat', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.nav.myPrograms', 'My Programs', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.nav.myCourses', 'My Courses', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.nav.notifications', 'Notifications', 'user', NOW(), NOW(), tenant_uuid);

  -- UserLayout - General UI (15 keys)
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('en', 'user.layout.learningPortal', 'Learning Portal', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.layout.loading', 'Loading...', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.layout.notifications', 'Notifications', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.layout.viewAllNotifications', 'View all notifications', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.layout.zoomMeetingSoon', 'Zoom Meeting Starting Soon', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.layout.zoomMeetingDesc', 'Server Components Deep Dive - in 15 minutes', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.layout.assignmentDueTomorrow', 'Assignment Due Tomorrow', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.layout.assignmentDesc', 'Complete your REST API project', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.layout.activeLearner', 'Active Learner', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.layout.profileSettings', 'Profile & Settings', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.layout.manageAccount', 'Manage your account', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.layout.billing', 'Billing', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.layout.manageSubscriptions', 'Manage subscriptions', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.layout.reports', 'Reports', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.layout.viewAnalytics', 'View analytics', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.layout.logout', 'Log out', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.layout.signOut', 'Sign out of your account', 'user', NOW(), NOW(), tenant_uuid);

  -- Sidebar - Section Titles (4 keys)
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('en', 'user.sidebar.sections.learning', 'Learning', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.sidebar.sections.schedule', 'Schedule', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.sidebar.sections.community', 'Community', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.sidebar.sections.profile', 'Profile', 'user', NOW(), NOW(), tenant_uuid);

  -- Sidebar - Navigation Items (10 keys)
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('en', 'user.sidebar.dashboard', 'Dashboard', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.sidebar.myLearning', 'My Learning', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.sidebar.assignments', 'Assignments', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.sidebar.progress', 'Progress', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.sidebar.calendar', 'Calendar', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.sidebar.community', 'Community', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.sidebar.discussions', 'Discussions', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.sidebar.achievements', 'Achievements', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.sidebar.certificates', 'Certificates', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.sidebar.collapse', 'Collapse', 'user', NOW(), NOW(), tenant_uuid);

  -- ========================================
  -- HEBREW TRANSLATIONS
  -- ========================================

  -- UserLayout - Navigation Items (5 keys)
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('he', 'user.nav.dashboard', 'לוח בקרה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.nav.chat', 'צ''אט', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.nav.myPrograms', 'התוכניות שלי', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.nav.myCourses', 'הקורסים שלי', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.nav.notifications', 'התראות', 'user', NOW(), NOW(), tenant_uuid);

  -- UserLayout - General UI (15 keys)
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('he', 'user.layout.learningPortal', 'פורטל למידה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.layout.loading', 'טוען...', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.layout.notifications', 'התראות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.layout.viewAllNotifications', 'צפה בכל ההתראות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.layout.zoomMeetingSoon', 'מפגש Zoom מתחיל בקרוב', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.layout.zoomMeetingDesc', 'Server Components Deep Dive - בעוד 15 דקות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.layout.assignmentDueTomorrow', 'מטלה תאריך יעד מחר', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.layout.assignmentDesc', 'השלם את פרויקט ה-REST API', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.layout.activeLearner', 'לומד פעיל', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.layout.profileSettings', 'פרופיל והגדרות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.layout.manageAccount', 'נהל את החשבון שלך', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.layout.billing', 'חיוב', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.layout.manageSubscriptions', 'נהל מנויים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.layout.reports', 'דוחות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.layout.viewAnalytics', 'צפה בניתוח נתונים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.layout.logout', 'התנתק', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.layout.signOut', 'התנתק מהחשבון', 'user', NOW(), NOW(), tenant_uuid);

  -- Sidebar - Section Titles (4 keys)
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('he', 'user.sidebar.sections.learning', 'למידה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.sidebar.sections.schedule', 'לוח זמנים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.sidebar.sections.community', 'קהילה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.sidebar.sections.profile', 'פרופיל', 'user', NOW(), NOW(), tenant_uuid);

  -- Sidebar - Navigation Items (10 keys)
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('he', 'user.sidebar.dashboard', 'לוח בקרה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.sidebar.myLearning', 'הלמידה שלי', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.sidebar.assignments', 'מטלות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.sidebar.progress', 'התקדמות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.sidebar.calendar', 'יומן', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.sidebar.community', 'קהילה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.sidebar.discussions', 'דיונים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.sidebar.achievements', 'הישגים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.sidebar.certificates', 'תעודות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.sidebar.collapse', 'כווץ', 'user', NOW(), NOW(), tenant_uuid);

  RAISE NOTICE 'Navigation translations inserted successfully for tenant: %', tenant_uuid;
  RAISE NOTICE 'Total: 32 translation keys × 2 languages = 64 rows inserted';
END $$;
