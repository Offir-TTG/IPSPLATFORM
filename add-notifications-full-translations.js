const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addTranslations() {
  console.log('Adding notifications page translations...\n');

  try {
    // Get tenant ID
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .order('created_at')
      .limit(1);

    if (tenantError || !tenants || tenants.length === 0) {
      throw new Error('No tenant found');
    }

    const tenantId = tenants[0].id;
    console.log('Using tenant:', tenantId);

    // Delete existing translations - just skip on error and let insert handle conflicts
    console.log(`Clearing existing translations...`);

    // Try to delete but don't fail if it errors
    await supabase
      .from('translations')
      .delete()
      .like('translation_key', 'user.notifications.category.%');

    await supabase
      .from('translations')
      .delete()
      .like('translation_key', 'user.notifications.stats.%');

    await supabase
      .from('translations')
      .delete()
      .like('translation_key', 'user.notifications.tabs.%');

    await supabase
      .from('translations')
      .delete()
      .like('translation_key', 'user.notifications.time.%');

    await supabase
      .from('translations')
      .delete()
      .eq('translation_key', 'user.notifications.title');

    await supabase
      .from('translations')
      .delete()
      .eq('translation_key', 'user.notifications.subtitle');

    await supabase
      .from('translations')
      .delete()
      .like('translation_key', 'admin.notifications.categories.%');

    // Prepare translations
    const translations = [
      // English - Page header
      { lang: 'en', key: 'user.notifications.title', value: 'Notifications', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.subtitle', value: 'Stay updated with your learning journey', ctx: 'user' },

      // English - Categories (user)
      { lang: 'en', key: 'user.notifications.category.lesson', value: 'Lesson', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.category.assignment', value: 'Assignment', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.category.payment', value: 'Payment', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.category.enrollment', value: 'Enrollment', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.category.attendance', value: 'Attendance', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.category.achievement', value: 'Achievement', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.category.announcement', value: 'Announcement', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.category.system', value: 'System', ctx: 'user' },

      // English - Categories (admin)
      { lang: 'en', key: 'admin.notifications.categories.lesson', value: 'Lesson', ctx: 'admin' },
      { lang: 'en', key: 'admin.notifications.categories.assignment', value: 'Assignment', ctx: 'admin' },
      { lang: 'en', key: 'admin.notifications.categories.payment', value: 'Payment', ctx: 'admin' },
      { lang: 'en', key: 'admin.notifications.categories.enrollment', value: 'Enrollment', ctx: 'admin' },
      { lang: 'en', key: 'admin.notifications.categories.attendance', value: 'Attendance', ctx: 'admin' },
      { lang: 'en', key: 'admin.notifications.categories.achievement', value: 'Achievement', ctx: 'admin' },
      { lang: 'en', key: 'admin.notifications.categories.announcement', value: 'Announcement', ctx: 'admin' },
      { lang: 'en', key: 'admin.notifications.categories.system', value: 'System', ctx: 'admin' },

      // English - Stats & Tabs
      { lang: 'en', key: 'user.notifications.stats.total', value: 'Total', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.stats.unread', value: 'Unread', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.stats.read', value: 'Read', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.tabs.all', value: 'All', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.tabs.unread', value: 'Unread', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.tabs.read', value: 'Read', ctx: 'user' },

      // English - Actions
      { lang: 'en', key: 'user.notifications.markRead', value: 'Mark as read', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.delete', value: 'Delete', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.viewDetails', value: 'View Details', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.markAllRead', value: 'Mark All as Read', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.markingAllRead', value: 'Marking...', ctx: 'user' },

      // English - Time
      { lang: 'en', key: 'user.notifications.time.justNow', value: 'Just now', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.time.minutesAgo', value: '{count} minutes ago', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.time.hoursAgo', value: '{count} hours ago', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.time.daysAgo', value: '{count} days ago', ctx: 'user' },

      // English - Empty states
      { lang: 'en', key: 'user.notifications.noNotifications', value: 'No notifications', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.error', value: 'Failed to load notifications', ctx: 'user' },

      // Hebrew - Page header
      { lang: 'he', key: 'user.notifications.title', value: 'התראות', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.subtitle', value: 'הישאר מעודכן במסע הלמידה שלך', ctx: 'user' },

      // Hebrew - Categories (user)
      { lang: 'he', key: 'user.notifications.category.lesson', value: 'שיעור', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.category.assignment', value: 'מטלה', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.category.payment', value: 'תשלום', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.category.enrollment', value: 'רישום', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.category.attendance', value: 'נוכחות', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.category.achievement', value: 'הישג', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.category.announcement', value: 'הכרזה', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.category.system', value: 'מערכת', ctx: 'user' },

      // Hebrew - Categories (admin)
      { lang: 'he', key: 'admin.notifications.categories.lesson', value: 'שיעור', ctx: 'admin' },
      { lang: 'he', key: 'admin.notifications.categories.assignment', value: 'מטלה', ctx: 'admin' },
      { lang: 'he', key: 'admin.notifications.categories.payment', value: 'תשלום', ctx: 'admin' },
      { lang: 'he', key: 'admin.notifications.categories.enrollment', value: 'רישום', ctx: 'admin' },
      { lang: 'he', key: 'admin.notifications.categories.attendance', value: 'נוכחות', ctx: 'admin' },
      { lang: 'he', key: 'admin.notifications.categories.achievement', value: 'הישג', ctx: 'admin' },
      { lang: 'he', key: 'admin.notifications.categories.announcement', value: 'הכרזה', ctx: 'admin' },
      { lang: 'he', key: 'admin.notifications.categories.system', value: 'מערכת', ctx: 'admin' },

      // Hebrew - Stats & Tabs
      { lang: 'he', key: 'user.notifications.stats.total', value: 'סה"כ', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.stats.unread', value: 'לא נקרא', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.stats.read', value: 'נקרא', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.tabs.all', value: 'הכל', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.tabs.unread', value: 'לא נקרא', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.tabs.read', value: 'נקרא', ctx: 'user' },

      // Hebrew - Actions
      { lang: 'he', key: 'user.notifications.markRead', value: 'סמן כנקרא', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.delete', value: 'מחק', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.viewDetails', value: 'הצג פרטים', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.markAllRead', value: 'סמן הכל כנקרא', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.markingAllRead', value: 'מסמן...', ctx: 'user' },

      // Hebrew - Time
      { lang: 'he', key: 'user.notifications.time.justNow', value: 'ממש עכשיו', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.time.minutesAgo', value: 'לפני {count} דקות', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.time.hoursAgo', value: 'לפני {count} שעות', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.time.daysAgo', value: 'לפני {count} ימים', ctx: 'user' },

      // Hebrew - Empty states
      { lang: 'he', key: 'user.notifications.noNotifications', value: 'אין התראות', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.error', value: 'נכשל בטעינת ההתראות', ctx: 'user' },

      // English - Success messages
      { lang: 'en', key: 'user.notifications.success.markedAllRead', value: 'Marked {count} notifications as read', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.success.deleted', value: 'Notification deleted', ctx: 'user' },

      // English - Error messages
      { lang: 'en', key: 'user.notifications.errors.markReadFailed', value: 'Failed to mark notification as read', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.errors.markUnreadFailed', value: 'Failed to mark notification as unread', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.errors.markAllReadFailed', value: 'Failed to mark all notifications as read', ctx: 'user' },
      { lang: 'en', key: 'user.notifications.errors.deleteFailed', value: 'Failed to delete notification', ctx: 'user' },

      // Hebrew - Success messages
      { lang: 'he', key: 'user.notifications.success.markedAllRead', value: 'סומנו {count} התראות כנקראו', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.success.deleted', value: 'ההתראה נמחקה', ctx: 'user' },

      // Hebrew - Error messages
      { lang: 'he', key: 'user.notifications.errors.markReadFailed', value: 'נכשל בסימון ההתראה כנקראה', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.errors.markUnreadFailed', value: 'נכשל בסימון ההתראה כלא נקראה', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.errors.markAllReadFailed', value: 'נכשל בסימון כל ההתראות כנקראו', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.errors.deleteFailed', value: 'נכשל במחיקת ההתראה', ctx: 'user' },

      // English - Info messages
      { lang: 'en', key: 'user.notifications.info.noUnreadNotifications', value: 'No unread notifications to mark', ctx: 'user' },

      // Hebrew - Info messages
      { lang: 'he', key: 'user.notifications.info.noUnreadNotifications', value: 'אין התראות שלא נקראו לסימון', ctx: 'user' },
    ];

    console.log(`\nInserting ${translations.length} translations...`);

    const records = translations.map(t => ({
      language_code: t.lang,
      translation_key: t.key,
      translation_value: t.value,
      context: t.ctx,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from('translations')
      .insert(records);

    if (insertError) {
      console.error('Error inserting translations:', insertError);
      throw insertError;
    }

    console.log('\n✅ All notifications translations added successfully!');
    console.log(`\nSummary:`);
    console.log(`- Total: ${translations.length} translations`);
    console.log(`- Categories: 16 (8 user + 8 admin)`);
    console.log(`- Stats & Tabs: 12`);
    console.log(`- Actions: 10`);
    console.log(`- Time: 8`);
    console.log(`- Success messages: 4`);
    console.log(`- Error messages: 8`);
    console.log(`- Other: 4`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addTranslations();
