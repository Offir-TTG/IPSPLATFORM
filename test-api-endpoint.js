const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('Testing via direct Supabase function call...\n');

  // First, sign in as a test user
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .eq('role', 'student')
    .limit(1);

  if (!users || users.length === 0) {
    console.error('No student user found');
    return;
  }

  const userId = users[0].id;
  console.log(`User: ${users[0].email}\n`);

  // Call function using different approaches
  console.log('Approach 1: Using .rpc()');
  const { data: data1, error: error1 } = await supabase
    .rpc('get_user_dashboard_v3', { p_user_id: userId });

  if (error1) {
    console.error('Error:', error1);
  } else {
    console.log('Stats keys:', Object.keys(data1.stats || {}));
    console.log('Has attendance_rate?', 'attendance_rate' in (data1.stats || {}));
  }

  // Try with fresh client
  console.log('\nApproach 2: Fresh client connection');
  const freshClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      db: { schema: 'public' },
      global: {
        headers: {
          'Prefer': 'return=representation',
        }
      }
    }
  );

  const { data: data2, error: error2 } = await freshClient
    .rpc('get_user_dashboard_v3', { p_user_id: userId });

  if (error2) {
    console.error('Error:', error2);
  } else {
    console.log('Stats:', JSON.stringify(data2.stats, null, 2));
  }
})();
