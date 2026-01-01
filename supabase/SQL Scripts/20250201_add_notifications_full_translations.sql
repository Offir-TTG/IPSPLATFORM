-- ============================================================================
-- ADD COMPLETE NOTIFICATIONS PAGE TRANSLATIONS
-- ============================================================================
-- Date: 2025-02-01
-- Purpose: Add comprehensive translations for notifications page including
--          category labels, time formatting, and all UI elements
-- Languages: English (en) and Hebrew (he)
-- ============================================================================

DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the first tenant UUID
  SELECT id INTO tenant_uuid FROM tenants LIMIT 1;

  -- Delete existing translations if they exist to avoid duplicates
  DELETE FROM public.translations
  WHERE translation_key IN (
    -- Category labels (user context)
    'user.notifications.category.lesson',
    'user.notifications.category.assignment',
    'user.notifications.category.payment',
    'user.notifications.category.enrollment',
    'user.notifications.category.attendance',
    'user.notifications.category.achievement',
    'user.notifications.category.announcement',
    'user.notifications.category.system',

    -- Category labels (admin context)
    'admin.notifications.categories.lesson',
    'admin.notifications.categories.assignment',
    'admin.notifications.categories.payment',
    'admin.notifications.categories.enrollment',
    'admin.notifications.categories.attendance',
    'admin.notifications.categories.achievement',
    'admin.notifications.categories.announcement',
    'admin.notifications.categories.system',

    -- Stats cards
    'user.notifications.stats.total',
    'user.notifications.stats.unread',
    'user.notifications.stats.read',

    -- Tabs
    'user.notifications.tabs.all',
    'user.notifications.tabs.unread',
    'user.notifications.tabs.read',

    -- Actions
    'user.notifications.markRead',
    'user.notifications.delete',
    'user.notifications.viewDetails',
    'user.notifications.markAllRead',
    'user.notifications.markingAllRead',

    -- Time formatting
    'user.notifications.time.justNow',
    'user.notifications.time.minutesAgo',
    'user.notifications.time.hoursAgo',
    'user.notifications.time.daysAgo',

    -- Empty states
    'user.notifications.noNotifications',
    'user.notifications.error',

    -- Existing keys
    'user.notifications.title',
    'user.notifications.subtitle'
  )
  AND language_code IN ('en', 'he');

  -- Insert translations
  INSERT INTO public.translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id)
  VALUES
    -- ========================================================================
    -- ENGLISH TRANSLATIONS
    -- ========================================================================

    -- Page header
    ('en', 'user.notifications.title', 'Notifications', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.subtitle', 'Stay updated with your learning journey', 'user', NOW(), NOW(), tenant_uuid),

    -- Category labels (user context)
    ('en', 'user.notifications.category.lesson', 'Lesson', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.category.assignment', 'Assignment', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.category.payment', 'Payment', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.category.enrollment', 'Enrollment', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.category.attendance', 'Attendance', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.category.achievement', 'Achievement', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.category.announcement', 'Announcement', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.category.system', 'System', 'user', NOW(), NOW(), tenant_uuid),

    -- Category labels (admin context)
    ('en', 'admin.notifications.categories.lesson', 'Lesson', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.notifications.categories.assignment', 'Assignment', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.notifications.categories.payment', 'Payment', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.notifications.categories.enrollment', 'Enrollment', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.notifications.categories.attendance', 'Attendance', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.notifications.categories.achievement', 'Achievement', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.notifications.categories.announcement', 'Announcement', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.notifications.categories.system', 'System', 'admin', NOW(), NOW(), tenant_uuid),

    -- Stats cards
    ('en', 'user.notifications.stats.total', 'Total', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.stats.unread', 'Unread', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.stats.read', 'Read', 'user', NOW(), NOW(), tenant_uuid),

    -- Tabs
    ('en', 'user.notifications.tabs.all', 'All', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.tabs.unread', 'Unread', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.tabs.read', 'Read', 'user', NOW(), NOW(), tenant_uuid),

    -- Actions
    ('en', 'user.notifications.markRead', 'Mark as read', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.delete', 'Delete', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.viewDetails', 'View Details', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.markAllRead', 'Mark All as Read', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.markingAllRead', 'Marking...', 'user', NOW(), NOW(), tenant_uuid),

    -- Time formatting
    ('en', 'user.notifications.time.justNow', 'Just now', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.time.minutesAgo', '{count} minutes ago', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.time.hoursAgo', '{count} hours ago', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.time.daysAgo', '{count} days ago', 'user', NOW(), NOW(), tenant_uuid),

    -- Empty states
    ('en', 'user.notifications.noNotifications', 'No notifications', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.notifications.error', 'Failed to load notifications', 'user', NOW(), NOW(), tenant_uuid),

    -- ========================================================================
    -- HEBREW TRANSLATIONS
    -- ========================================================================

    -- Page header
    ('he', 'user.notifications.title', 'התראות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.subtitle', 'הישאר מעודכן במסע הלמידה שלך', 'user', NOW(), NOW(), tenant_uuid),

    -- Category labels (user context)
    ('he', 'user.notifications.category.lesson', 'שיעור', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.category.assignment', 'מטלה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.category.payment', 'תשלום', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.category.enrollment', 'רישום', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.category.attendance', 'נוכחות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.category.achievement', 'הישג', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.category.announcement', 'הכרזה', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.category.system', 'מערכת', 'user', NOW(), NOW(), tenant_uuid),

    -- Category labels (admin context)
    ('he', 'admin.notifications.categories.lesson', 'שיעור', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.notifications.categories.assignment', 'מטלה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.notifications.categories.payment', 'תשלום', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.notifications.categories.enrollment', 'רישום', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.notifications.categories.attendance', 'נוכחות', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.notifications.categories.achievement', 'הישג', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.notifications.categories.announcement', 'הכרזה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.notifications.categories.system', 'מערכת', 'admin', NOW(), NOW(), tenant_uuid),

    -- Stats cards
    ('he', 'user.notifications.stats.total', 'סה"כ', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.stats.unread', 'לא נקרא', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.stats.read', 'נקרא', 'user', NOW(), NOW(), tenant_uuid),

    -- Tabs
    ('he', 'user.notifications.tabs.all', 'הכל', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.tabs.unread', 'לא נקרא', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.tabs.read', 'נקרא', 'user', NOW(), NOW(), tenant_uuid),

    -- Actions
    ('he', 'user.notifications.markRead', 'סמן כנקרא', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.delete', 'מחק', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.viewDetails', 'הצג פרטים', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.markAllRead', 'סמן הכל כנקרא', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.markingAllRead', 'מסמן...', 'user', NOW(), NOW(), tenant_uuid),

    -- Time formatting
    ('he', 'user.notifications.time.justNow', 'ממש עכשיו', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.time.minutesAgo', 'לפני {count} דקות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.time.hoursAgo', 'לפני {count} שעות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.time.daysAgo', 'לפני {count} ימים', 'user', NOW(), NOW(), tenant_uuid),

    -- Empty states
    ('he', 'user.notifications.noNotifications', 'אין התראות', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.notifications.error', 'נכשל בטעינת ההתראות', 'user', NOW(), NOW(), tenant_uuid);

  RAISE NOTICE 'Successfully added complete notifications translations';
END $$;

-- ============================================================================
-- TRANSLATION INSERT COMPLETE
-- ============================================================================
-- Summary:
-- - Added 68 translation pairs (34 English + 34 Hebrew)
-- - Category labels for both user and admin contexts (consistent naming)
-- - Stats cards, tabs, actions, time formatting, and empty states
-- - All translations use consistent terminology matching admin patterns
-- ============================================================================
