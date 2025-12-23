const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('Testing dashboard function...\n');

  // Get a real user ID from the database
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email')
    .eq('role', 'student')
    .limit(1);

  if (userError || !users || users.length === 0) {
    console.error('Could not find a student user:', userError);
    return;
  }

  const userId = users[0].id;
  console.log(`Testing with user: ${users[0].email} (${userId})\n`);

  // Call the dashboard function
  const { data, error } = await supabase.rpc('get_user_dashboard_v3', {
    p_user_id: userId
  });

  if (error) {
    console.error('Dashboard function error:', error);
    return;
  }

  console.log('Dashboard Stats:', JSON.stringify(data.stats, null, 2));
  console.log('\nAttendance fields:');
  console.log('- total_attendance:', data.stats.total_attendance);
  console.log('- attendance_present:', data.stats.attendance_present);
  console.log('- attendance_rate:', data.stats.attendance_rate);

  console.log('\nRecent attendance count:', data.recent_attendance?.length || 0);
})();
