const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { data: users } = await supabase.auth.admin.listUsers();
  const userId = users?.users?.[0]?.id;
  
  if (!userId) {
    console.log('No user');
    return;
  }

  const { data } = await supabase.rpc('get_user_dashboard_v3', {
    p_user_id: userId
  });

  console.log('Dashboard stats:');
  console.log('  next_session_time:', data?.stats?.next_session_time);
  console.log('  upcoming_sessions_count:', data?.stats?.upcoming_sessions_count);
  console.log('');
  
  console.log('Upcoming sessions array:', data?.upcoming_sessions?.length || 0);
  
  if (data?.upcoming_sessions && data.upcoming_sessions.length > 0) {
    console.log('');
    data.upcoming_sessions.forEach((s, i) => {
      console.log('Session', i + 1);
      console.log('  Title:', s.title);
      console.log('  Course:', s.course_name);
      console.log('  Start:', s.start_time);
      console.log('  End:', s.end_time);
      
      // Parse and show local time
      const startDate = new Date(s.start_time);
      console.log('  Local time:', startDate.toLocaleString('en-US', { 
        timeZone: 'Asia/Jerusalem',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }));
      console.log('');
    });
  }
})();
