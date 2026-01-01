const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('Current date/time:');
  const now = new Date();
  console.log('  UTC:', now.toISOString());
  console.log('  Local:', now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
  console.log('');
  
  // Check what the dashboard function is returning
  const { data: users } = await supabase.auth.admin.listUsers();
  const userId = users?.users?.[0]?.id;
  
  if (!userId) {
    console.log('No user');
    return;
  }

  const { data, error } = await supabase.rpc('get_user_dashboard_v3', {
    p_user_id: userId
  });

  if (error) {
    console.log('Error:', error);
    return;
  }

  console.log('Dashboard function results:');
  console.log('  next_session_time:', data?.stats?.next_session_time);
  console.log('  upcoming_sessions_count:', data?.stats?.upcoming_sessions_count);
  console.log('  upcoming_sessions array:', data?.upcoming_sessions?.length || 0);
  
  if (data?.stats?.next_session_time) {
    const sessionDate = new Date(data.stats.next_session_time);
    console.log('');
    console.log('Next session parsed:');
    console.log('  UTC:', sessionDate.toISOString());
    console.log('  Local:', sessionDate.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
    console.log('  Is today?', sessionDate.toDateString() === now.toDateString());
  }
})();
