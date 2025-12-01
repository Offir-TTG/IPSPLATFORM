-- Notifications Page Translations
-- Add translations for user notifications page

-- Insert English translations
INSERT INTO translations (language_code, key, value) VALUES
-- Title and subtitle
('en', 'user.notifications.title', 'Notifications'),
('en', 'user.notifications.subtitle', 'Stay updated with your learning activities and upcoming events'),

-- Actions
('en', 'user.notifications.markAllRead', 'Mark All as Read'),

-- Stats
('en', 'user.notifications.stats.total', 'Total Notifications'),
('en', 'user.notifications.stats.unread', 'Unread'),
('en', 'user.notifications.stats.zoom', 'Zoom Sessions'),

-- Tabs
('en', 'user.notifications.tabs.all', 'All'),
('en', 'user.notifications.tabs.unread', 'Unread'),
('en', 'user.notifications.tabs.zoom', 'Zoom'),

-- Badges
('en', 'user.notifications.badge.new', 'New'),
('en', 'user.notifications.badge.urgent', 'Urgent'),

-- Actions
('en', 'user.notifications.actions.markRead', 'Mark as read'),
('en', 'user.notifications.actions.delete', 'Delete'),

-- Empty state
('en', 'user.notifications.empty.title', 'No notifications'),
('en', 'user.notifications.empty.allCaughtUp', 'You''re all caught up!'),
('en', 'user.notifications.empty.noFilteredNotifications', 'No {filter} notifications')

ON CONFLICT (language_code, key) DO UPDATE
SET value = EXCLUDED.value;

-- Insert Hebrew translations
INSERT INTO translations (language_code, key, value) VALUES
-- Title and subtitle
('he', 'user.notifications.title', 'התראות'),
('he', 'user.notifications.subtitle', 'הישארו מעודכנים בפעילות הלמידה והאירועים הקרובים שלכם'),

-- Actions
('he', 'user.notifications.markAllRead', 'סמן הכל כנקרא'),

-- Stats
('he', 'user.notifications.stats.total', 'סה״כ התראות'),
('he', 'user.notifications.stats.unread', 'לא נקרא'),
('he', 'user.notifications.stats.zoom', 'מפגשי Zoom'),

-- Tabs
('he', 'user.notifications.tabs.all', 'הכל'),
('he', 'user.notifications.tabs.unread', 'לא נקרא'),
('he', 'user.notifications.tabs.zoom', 'Zoom'),

-- Badges
('he', 'user.notifications.badge.new', 'חדש'),
('he', 'user.notifications.badge.urgent', 'דחוף'),

-- Actions
('he', 'user.notifications.actions.markRead', 'סמן כנקרא'),
('he', 'user.notifications.actions.delete', 'מחק'),

-- Empty state
('he', 'user.notifications.empty.title', 'אין התראות'),
('he', 'user.notifications.empty.allCaughtUp', 'הכל מעודכן!'),
('he', 'user.notifications.empty.noFilteredNotifications', 'אין התראות {filter}')

ON CONFLICT (language_code, key) DO UPDATE
SET value = EXCLUDED.value;
