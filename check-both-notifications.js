const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const userId = 'c85f5987-8fc6-4315-8596-5c7521346ee0';
  const notif1 = '97ded8a4-30b0-4ce9-8060-5ca71b08063d'; // aaaaaaaaaaaaaa
  const notif2 = 'a981dff2-056d-4da9-bcf5-dc88ab949d8d'; // ששששששש

  console.log('Checking notification read status...\n');

  const { data: reads } = await supabase
    .from('notification_reads')
    .select('notification_id, user_id, read_at')
    .eq('user_id', userId)
    .in('notification_id', [notif1, notif2]);

  console.log('Read records for these notifications:', reads?.length || 0);

  if (reads && reads.length > 0) {
    reads.forEach(r => {
      const title = r.notification_id === notif1 ? 'aaaaaaaaaaaaaa' : 'ששששששש';
      console.log('  -', title, '- Read at:', r.read_at);
    });
  } else {
    console.log('  (None marked as read)');
  }

  // Check if they appear in the get_user_notifications function
  console.log('\nCalling get_user_notifications function...');
  const { data: notifications, error } = await supabase.rpc('get_user_notifications', {
    p_user_id: userId,
    p_limit: 100
  });

  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Total notifications returned:', notifications?.length || 0);

    const hasNotif1 = notifications?.some(n => n.id === notif1);
    const hasNotif2 = notifications?.some(n => n.id === notif2);

    console.log('\nCourse notifications visibility:');
    console.log('  - aaaaaaaaaaaaaa (97ded8...):', hasNotif1 ? 'VISIBLE' : 'NOT VISIBLE');
    console.log('  - ששששששש (a981dff...):', hasNotif2 ? 'VISIBLE' : 'NOT VISIBLE');

    if (hasNotif1 || hasNotif2) {
      console.log('\nNotifications that ARE visible:');
      notifications.filter(n => n.id === notif1 || n.id === notif2).forEach(n => {
        console.log('  - Title:', n.title);
        console.log('    ID:', n.id);
        console.log('    Is Read:', n.is_read);
        console.log('    Scope:', n.scope);
        console.log('    Course ID:', n.target_course_id);
      });
    }
  }

  // List all visible notifications
  console.log('\n=== All Visible Notifications ===');
  if (notifications && notifications.length > 0) {
    notifications.forEach((n, i) => {
      console.log(`${i + 1}. ${n.title} - Scope: ${n.scope}, Read: ${n.is_read}`);
    });
  }
}

check();
