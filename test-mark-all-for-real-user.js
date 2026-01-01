const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMarkAll() {
  console.log('=== Testing Mark All for offir.omer@tenafly-tg.com ===\n');

  const userId = 'c85f5987-8fc6-4315-8596-5c7521346ee0';

  // Get all notifications for this user
  const { data: notifications, error: notifError } = await supabase
    .from('notifications')
    .select('*')
    .eq('target_user_id', userId)
    .order('created_at', { ascending: false });

  if (notifError) {
    console.error('Error:', notifError);
    return;
  }

  console.log(`Found ${notifications?.length || 0} notifications for this user:\n`);
  notifications?.forEach((n, i) => {
    console.log(`${i + 1}. ${n.title}`);
    console.log(`   ID: ${n.id}`);
    console.log(`   Created: ${n.created_at}`);
  });

  // Check which ones are already marked as read
  const { data: readRecords, error: readError} = await supabase
    .from('notification_reads')
    .select('notification_id')
    .eq('user_id', userId);

  if (readError) {
    console.error('Read error:', readError);
    return;
  }

  const readIds = new Set(readRecords?.map(r => r.notification_id) || []);
  console.log(`\n${readIds.size} already marked as read`);

  const unreadNotifs = notifications?.filter(n => !readIds.has(n.id)) || [];
  console.log(`${unreadNotifs.length} unread notifications:\n`);
  unreadNotifs.forEach((n, i) => {
    console.log(`${i + 1}. ${n.title} (${n.id})`);
  });

  // Call the function
  console.log(`\n=== Calling mark_all_notifications_as_read ===\n`);

  const { data: markedCount, error: funcError } = await supabase.rpc(
    'mark_all_notifications_as_read',
    { p_user_id: userId }
  );

  if (funcError) {
    console.error('Function error:', funcError);
  } else {
    console.log(`✅ Function returned: ${markedCount} notifications marked`);
  }

  // Check again
  const { data: newReadRecords, error: newReadError } = await supabase
    .from('notification_reads')
    .select('notification_id')
    .eq('user_id', userId);

  if (!newReadError) {
    const newReadIds = new Set(newReadRecords?.map(r => r.notification_id) || []);
    console.log(`\nAfter mark all:`);
    console.log(`  - Read records: ${newReadIds.size}`);
    console.log(`  - New records added: ${newReadIds.size - readIds.size}`);

    // Check which ones are still unread
    const stillUnread = notifications?.filter(n => !newReadIds.has(n.id)) || [];
    if (stillUnread.length > 0) {
      console.log(`\n⚠️  ${stillUnread.length} notifications still unread:`);
      stillUnread.forEach((n, i) => {
        console.log(`${i + 1}. ${n.title} (${n.id})`);
      });
    } else {
      console.log(`\n✅ All notifications successfully marked as read!`);
    }
  }
}

testMarkAll();
