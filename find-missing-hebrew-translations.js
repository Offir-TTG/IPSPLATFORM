const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findMissing() {
  const requiredKeys = [
    'user.notifications.title',
    'user.notifications.subtitle',
    'user.notifications.category.lesson',
    'user.notifications.category.assignment',
    'user.notifications.category.payment',
    'user.notifications.category.enrollment',
    'user.notifications.category.attendance',
    'user.notifications.category.achievement',
    'user.notifications.category.announcement',
    'user.notifications.category.system',
    'user.notifications.stats.total',
    'user.notifications.stats.unread',
    'user.notifications.stats.read',
    'user.notifications.tabs.all',
    'user.notifications.tabs.unread',
    'user.notifications.tabs.read',
    'user.notifications.markRead',
    'user.notifications.delete',
    'user.notifications.viewDetails',
    'user.notifications.markAllRead',
    'user.notifications.markingAllRead',
    'user.notifications.time.justNow',
    'user.notifications.time.minutesAgo',
    'user.notifications.time.hoursAgo',
    'user.notifications.time.daysAgo',
    'user.notifications.noNotifications',
    'user.notifications.error',
  ];

  const { data: heTranslations, error } = await supabase
    .from('translations')
    .select('translation_key')
    .eq('language_code', 'he')
    .in('translation_key', requiredKeys);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const existingKeys = new Set(heTranslations.map(t => t.translation_key));
  const missingKeys = requiredKeys.filter(key => !existingKeys.has(key));

  console.log(`Checking ${requiredKeys.length} required keys...\n`);
  console.log(`Found: ${existingKeys.size}`);
  console.log(`Missing: ${missingKeys.length}\n`);

  if (missingKeys.length > 0) {
    console.log('Missing Hebrew translations:');
    missingKeys.forEach(key => console.log(`  - ${key}`));
  } else {
    console.log('✅ All required Hebrew translations are present!');
  }
}

findMissing();
