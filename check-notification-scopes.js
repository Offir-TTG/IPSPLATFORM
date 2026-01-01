const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkScopes() {
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('id, scope, target_user_id, target_course_id, target_program_id, title, category')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('All Notifications:\n');
  notifications.forEach((n, i) => {
    console.log(`${i + 1}. ${n.title}`);
    console.log(`   Scope: ${n.scope}`);
    console.log(`   Category: ${n.category}`);
    if (n.target_user_id) console.log(`   Target User: ${n.target_user_id}`);
    if (n.target_course_id) console.log(`   Target Course: ${n.target_course_id}`);
    if (n.target_program_id) console.log(`   Target Program: ${n.target_program_id}`);
    console.log();
  });
}

checkScopes();
