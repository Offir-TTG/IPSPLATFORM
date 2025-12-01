-- Add notifications page translations
-- Run this in Supabase SQL Editor

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

    -- Actions
    'user.notifications.actions.markRead',
    'user.notifications.actions.delete',

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

    -- Actions (English)
    ('en', 'user.notifications.actions.markRead', 'Mark as read', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.actions.delete', 'Delete notification', 'user', NOW(), NOW(), tenant_uuid),

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

    -- Actions (Hebrew)
    ('he', 'user.notifications.actions.markRead', 'סמן כנקרא', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.actions.delete', 'מחק התראה', 'user', NOW(), NOW(), tenant_uuid),

    -- Empty States (Hebrew)
    ('he', 'user.notifications.empty.title', 'אין התראות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.empty.allCaughtUp', 'הכל מעודכן! חזור מאוחר יותר לעדכונים חדשים.', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.empty.noFilteredNotifications', 'אין התראות בקטגוריה זו', 'user', NOW(), NOW(), tenant_uuid);

  RAISE NOTICE 'Notifications page translations added successfully';
END$$;
