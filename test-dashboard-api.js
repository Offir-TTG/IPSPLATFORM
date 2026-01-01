const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  // First, sign in as a user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'offir.omer@gmail.com',
    password: 'Aa123456'
  });

  if (authError) {
    console.log('Auth error:', authError.message);
    return;
  }

  console.log('Authenticated as:', authData.user.email);
  
  // Now fetch dashboard data via the API
  const response = await fetch('http://localhost:3000/api/user/dashboard', {
    headers: {
      'Authorization': 'Bearer ' + authData.session.access_token,
      'Content-Type': 'application/json'
    }
  });

  const result = await response.json();
  
  console.log('');
  console.log('API Response:');
  console.log('  stats.next_session_time:', result.data?.stats?.next_session_time);
  console.log('  stats.upcoming_sessions_count:', result.data?.stats?.upcoming_sessions_count);
  console.log('  upcoming_sessions.length:', result.data?.upcoming_sessions?.length);
  
  if (result.data?.upcoming_sessions?.length > 0) {
    console.log('');
    console.log('Sessions:');
    result.data.upcoming_sessions.forEach((s, i) => {
      console.log(i + 1, '-', s.title, '@', s.start_time);
    });
  }
})();
