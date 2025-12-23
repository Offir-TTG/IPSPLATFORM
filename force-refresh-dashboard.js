const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFunction() {
  console.log('Checking if function was updated...\n');
  
  // Get function definition
  const { data: functions, error } = await supabase
    .from('pg_proc')
    .select('*')
    .ilike('proname', 'get_user_dashboard_v3')
    .limit(1);
  
  if (error) {
    console.log('Could not check function directly');
  }
  
  // Try to call the function and see the result
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'offir.omer@gmail.com')
    .single();
  
  if (!users) {
    console.error('User not found');
    return;
  }
  
  console.log('Calling function...\n');
  const { data, error: rpcError } = await supabase.rpc('get_user_dashboard_v3', {
    p_user_id: users.id
  });
  
  if (rpcError) {
    console.error('RPC Error:', rpcError);
    return;
  }
  
  console.log('Stats keys:', Object.keys(data.stats || {}));
  console.log('\nLooking for total_lessons in stats:', data.stats.total_lessons);
  
  if (data.stats.total_lessons === undefined) {
    console.log('\n❌ total_lessons NOT FOUND in stats!');
    console.log('This means the SQL function was not updated properly.');
    console.log('\nPlease verify you ran the correct SQL script in Supabase Dashboard:');
    console.log('  supabase/SQL Scripts/20251222_add_total_lessons_to_stats.sql');
  } else {
    console.log('\n✅ total_lessons FOUND:', data.stats.total_lessons);
  }
}

checkFunction();
