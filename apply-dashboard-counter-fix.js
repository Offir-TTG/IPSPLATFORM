const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyFix() {
  const sql = fs.readFileSync('supabase/SQL Scripts/20251222_fix_dashboard_counters.sql', 'utf8');
  
  console.log('Applying dashboard counter fixes...\n');
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('✅ Dashboard function updated successfully!\n');
  console.log('Fixed issues:');
  console.log('  1. Attendance rate now counts "late" and "excused" as attended');
  console.log('  2. Program enrollments now show correct total lesson count');
  console.log('  3. attendance_present now includes late and excused statuses\n');
}

applyFix();
