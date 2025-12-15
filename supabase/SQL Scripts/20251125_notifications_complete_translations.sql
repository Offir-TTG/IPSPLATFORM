-- Add complete notifications page translations (replaces 20251125_notifications_page_translations.sql)
DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the default tenant UUID
  SELECT id INTO tenant_uuid FROM tenants WHERE slug = 'default' LIMIT 1;

  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'Default tenant not found';
  END IF;

  -- Delete existing translations to avoid duplicates
  DELETE FROM translations WHERE translation_key IN (
    -- Page header
    'user.notifications.title',
    'user.notifications.subtitle',
    'user.notifications.markAllRead',

    -- Stats cards
    'user.notifications.stats.total',
    'user.notifications.stats.unread',
    'user.notifications.stats.zoom',

    -- Tabs
    'user.notifications.tabs.all',
    'user.notifications.tabs.unread',
    'user.notifications.tabs.zoom',

    -- Badges
    'user.notifications.badge.new',
    'user.notifications.badge.urgent',

    -- Action buttons
    'user.notifications.actions.markRead',
    'user.notifications.actions.delete',
    'user.notifications.actions.joinMeeting',
    'user.notifications.actions.viewDetails',
    'user.notifications.actions.startAssignment',
    'user.notifications.actions.viewAchievements',
    'user.notifications.actions.viewCourse',
    'user.notifications.actions.watchRecording',
    'user.notifications.actions.viewMessage',
    'user.notifications.actions.downloadCertificate',

    -- Time formatting
    'user.notifications.time.inMinutes',
    'user.notifications.time.inHours',
    'user.notifications.time.inDays',
    'user.notifications.time.tomorrow',
    'user.notifications.time.minutesAgo',
    'user.notifications.time.hoursAgo',
    'user.notifications.time.daysAgo',
    'user.notifications.time.yesterday',

    -- Empty states
    'user.notifications.empty.title',
    'user.notifications.empty.allCaughtUp',
    'user.notifications.empty.noFilteredNotifications'
  );

  -- Insert English translations
  INSERT INTO translations (language_code, translation_key, translation_value, category, created_at, updated_at, tenant_id) VALUES
    -- Page Header (English)
    ('en', 'user.notifications.title', 'Notifications', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.subtitle', 'Stay updated with your latest course activities and announcements', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.markAllRead', 'Mark All as Read', 'user', NOW(), NOW(), tenant_uuid),

    -- Stats Cards (English)
    ('en', 'user.notifications.stats.total', 'Total Notifications', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.stats.unread', 'Unread', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.stats.zoom', 'Zoom Meetings', 'user', NOW(), NOW(), tenant_uuid),

    -- Tabs (English)
    ('en', 'user.notifications.tabs.all', 'All', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.tabs.unread', 'Unread', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.tabs.zoom', 'Zoom', 'user', NOW(), NOW(), tenant_uuid),

    -- Badges (English)
    ('en', 'user.notifications.badge.new', 'New', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.badge.urgent', 'Urgent', 'user', NOW(), NOW(), tenant_uuid),

    -- Action Buttons (English)
    ('en', 'user.notifications.actions.markRead', 'Mark as read', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.actions.delete', 'Delete notification', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.actions.joinMeeting', 'Join Meeting', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.actions.viewDetails', 'View Details', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.actions.startAssignment', 'Start Assignment', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.actions.viewAchievements', 'View Achievements', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.actions.viewCourse', 'View Course', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.actions.watchRecording', 'Watch Recording', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.actions.viewMessage', 'View Message', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.actions.downloadCertificate', 'Download Certificate', 'user', NOW(), NOW(), tenant_uuid),

    -- Time Formatting (English)
    ('en', 'user.notifications.time.inMinutes', 'in {count} minutes', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.time.inHours', 'in {count} hours', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.time.inDays', 'in {count} days', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.time.tomorrow', 'tomorrow', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.time.minutesAgo', '{count} minutes ago', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.time.hoursAgo', '{count} hours ago', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.time.daysAgo', '{count} days ago', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.time.yesterday', 'yesterday', 'user', NOW(), NOW(), tenant_uuid),

    -- Empty States (English)
    ('en', 'user.notifications.empty.title', 'No Notifications', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.empty.allCaughtUp', 'You''re all caught up! Check back later for new updates.', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.empty.noFilteredNotifications', 'No notifications in this category', 'user', NOW(), NOW(), tenant_uuid),

    -- Page Header (Hebrew)
    ('he', 'user.notifications.title', 'התראות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.subtitle', 'הישאר מעודכן עם הפעילויות וההכרזות האחרונות בקורסים שלך', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.markAllRead', 'סמן הכל כנקרא', 'user', NOW(), NOW(), tenant_uuid),

    -- Stats Cards (Hebrew)
    ('he', 'user.notifications.stats.total', 'סך כל ההתראות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.stats.unread', 'לא נקראו', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.stats.zoom', 'פגישות Zoom', 'user', NOW(), NOW(), tenant_uuid),

    -- Tabs (Hebrew)
    ('he', 'user.notifications.tabs.all', 'הכל', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.tabs.unread', 'לא נקרא', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.tabs.zoom', 'Zoom', 'user', NOW(), NOW(), tenant_uuid),

    -- Badges (Hebrew)
    ('he', 'user.notifications.badge.new', 'חדש', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.badge.urgent', 'דחוף', 'user', NOW(), NOW(), tenant_uuid),

    -- Action Buttons (Hebrew)
    ('he', 'user.notifications.actions.markRead', 'סמן כנקרא', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.actions.delete', 'מחק התראה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.actions.joinMeeting', 'הצטרף לפגישה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.actions.viewDetails', 'הצג פרטים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.actions.startAssignment', 'התחל מטלה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.actions.viewAchievements', 'הצג הישגים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.actions.viewCourse', 'הצג קורס', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.actions.watchRecording', 'צפה בהקלטה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.actions.viewMessage', 'הצג הודעה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.actions.downloadCertificate', 'הורד תעודה', 'user', NOW(), NOW(), tenant_uuid),

    -- Time Formatting (Hebrew)
    ('he', 'user.notifications.time.inMinutes', 'בעוד {count} דקות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.time.inHours', 'בעוד {count} שעות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.time.inDays', 'בעוד {count} ימים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.time.tomorrow', 'מחר', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.time.minutesAgo', 'לפני {count} דקות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.time.hoursAgo', 'לפני {count} שעות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.time.daysAgo', 'לפני {count} ימים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.time.yesterday', 'אתמול', 'user', NOW(), NOW(), tenant_uuid),

    -- Empty States (Hebrew)
    ('he', 'user.notifications.empty.title', 'אין התראות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.empty.allCaughtUp', 'הכל מעודכן! חזור מאוחר יותר לעדכונים חדשים.', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.empty.noFilteredNotifications', 'אין התראות בקטגוריה זו', 'user', NOW(), NOW(), tenant_uuid);

  RAISE NOTICE 'Complete notifications page translations added successfully';
END$$;
