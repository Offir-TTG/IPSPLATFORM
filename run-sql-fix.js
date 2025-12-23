const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);

async function runSQL() {
  try {
    console.log('📝 Reading SQL file...\n');
    const sqlContent = fs.readFileSync('supabase/SQL Scripts/20251222_fix_dashboard_counters.sql', 'utf8');

    console.log('⚠️  Please run this SQL script manually in your Supabase Dashboard SQL Editor:\n');
    console.log('supabase/SQL Scripts/20251222_fix_dashboard_counters.sql\n');
    console.log('After running it, press Enter to test the results...');

    // Wait for user to press enter
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

    console.log('\n✅ Testing the dashboard function...\n');

    // Get test user
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'offir.omer@gmail.com')
      .limit(1);

    if (users && users.length > 0) {
      const { data, error } = await supabase.rpc('get_user_dashboard_v3', {
        p_user_id: users[0].id
      });

      if (error) {
        console.error('❌ Dashboard test failed:', error);
        process.exit(1);
      } else {
        console.log('📊 Dashboard Stats:');
        console.log('  Total Courses:', data.stats.total_courses);
        console.log('  Completed Lessons:', data.stats.completed_lessons);
        console.log('  Total Attendance:', data.stats.total_attendance);
        console.log('  Attendance Present/Late/Excused:', data.stats.attendance_present, '(was 0, should be 3 now)');
        console.log('  Attendance Rate:', data.stats.attendance_rate + '%', '(was 0%, should be 75% now)');
        console.log('  Total Hours Spent:', data.stats.total_hours_spent + 'h');

        console.log('\n📚 First Enrollment:');
        if (data.enrollments && data.enrollments.length > 0) {
          const enrollment = data.enrollments[0];
          console.log('  Name:', enrollment.program_name || enrollment.course_name);
          console.log('  Total Lessons:', enrollment.total_lessons, '(was 0, should be 6 for program)');
          console.log('  Completed:', enrollment.completed_lessons);
        }

        console.log('\n✅ Dashboard function is working!');
        process.exit(0);
      }
    } else {
      console.error('❌ Test user not found');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runSQL();
