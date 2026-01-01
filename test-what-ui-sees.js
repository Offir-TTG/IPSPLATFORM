const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const userId = 'c85f5987-8fc6-4315-8596-5c7521346ee0';

  console.log('Calling get_user_notifications as the API does...\n');

  const { data: notifications, error } = await supabase.rpc('get_user_notifications', {
    p_user_id: userId,
    p_limit: 50,
    p_offset: 0,
    p_category: null,
    p_priority: null,
    p_unread_only: false,
  });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Total:', notifications?.length || 0, '\n');

  if (notifications && notifications.length > 0) {
    notifications.forEach((n, i) => {
      console.log((i + 1) + '. ' + n.title);
      console.log('   Scope:', n.scope, '| Read:', n.is_read);
    });
  }

  const c1 = '97ded8a4-30b0-4ce9-8060-5ca71b08063d';
  const c2 = 'a981dff2-056d-4da9-bcf5-dc88ab949d8d';

  console.log('\nCourse notifications:');
  console.log('aaaaaaaaaaaaaa:', notifications?.some(n => n.id === c1) ? 'VISIBLE' : 'NOT VISIBLE');
  console.log('ששששששש:', notifications?.some(n => n.id === c2) ? 'VISIBLE' : 'NOT VISIBLE');
}

test();
