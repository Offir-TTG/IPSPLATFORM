-- Translations for the rewritten Notifications tab on /admin/users/[id].
-- Card + Table + platform-standard TabPagination. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'admin.users.activity.notifications.title',
      'admin.users.activity.notifications.count',
      'admin.users.activity.notifications.empty',
      'admin.users.activity.notifications.readBadge',
      'admin.users.activity.notifications.unreadBadge',
      'admin.users.activity.notifications.col.title',
      'admin.users.activity.notifications.col.category',
      'admin.users.activity.notifications.col.priority',
      'admin.users.activity.notifications.col.sent',
      'admin.users.activity.notifications.col.read'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'admin.users.activity.notifications.title',        'Notifications',          'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.notifications.title',        'התראות',                   'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.notifications.count',        '{{count}} notifications', 'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.notifications.count',        '{{count}} התראות',          'admin', NULL, 'admin'),

    -- Empty state
    ('en', 'admin.users.activity.notifications.empty',        'No notifications.',       'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.notifications.empty',        'אין התראות.',                'admin', NULL, 'admin'),

    -- Read / Unread row badges
    ('en', 'admin.users.activity.notifications.readBadge',    'Read',                    'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.notifications.readBadge',    'נקראה',                    'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.notifications.unreadBadge',  'Unread',                  'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.notifications.unreadBadge',  'לא נקראה',                  'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.notifications.col.title',    'Title',                   'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.notifications.col.title',    'כותרת',                    'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.notifications.col.category', 'Category',                'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.notifications.col.category', 'קטגוריה',                  'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.notifications.col.priority', 'Priority',                'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.notifications.col.priority', 'עדיפות',                   'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.notifications.col.sent',     'Sent',                    'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.notifications.col.sent',     'נשלח',                     'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.notifications.col.read',     'Read',                    'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.notifications.col.read',     'נקראה',                    'admin', NULL, 'admin');
END $$;
