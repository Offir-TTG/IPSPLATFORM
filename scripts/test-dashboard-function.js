/**
 * Script to test the get_user_dashboard_v3 function
 * This helps diagnose dashboard errors
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
const envPath = path.join(__dirname, '..', '.env.local');
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Try to load from .env.local if not already set
if (!supabaseUrl || !supabaseServiceKey) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
        if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceKey = value;
      }
    });
  } catch (err) {
    console.error('Could not read .env.local file:', err.message);
  }
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testDashboard() {
  try {
    console.log('🔍 Testing get_user_dashboard_v3 function...\n');

    // First, get a user to test with
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role')
      .limit(5);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log('⚠️  No users found in database');
      return;
    }

    console.log('👥 Available users:');
    users.forEach((user, idx) => {
      const name = user.first_name || user.email;
      console.log(`   ${idx + 1}. ${name} (${user.email}) - Role: ${user.role}`);
    });
    console.log('');

    // Test with the first user
    const testUser = users[0];
    console.log(`🧪 Testing dashboard for: ${testUser.email}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Call the dashboard function
    const { data: dashboardData, error: dashboardError } = await supabase
      .rpc('get_user_dashboard_v3', {
        p_user_id: testUser.id
      });

    if (dashboardError) {
      console.error('❌ Dashboard function error:');
      console.error('   Message:', dashboardError.message);
      console.error('   Code:', dashboardError.code);
      console.error('   Details:', dashboardError.details);
      console.error('   Hint:', dashboardError.hint);
      return;
    }

    console.log('✅ Dashboard function executed successfully!\n');
    console.log('📊 Dashboard Data:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(JSON.stringify(dashboardData, null, 2));
    console.log('');

    // Summary
    console.log('📈 Summary:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Enrollments: ${dashboardData?.enrollments?.length || 0}`);
    console.log(`Upcoming Sessions: ${dashboardData?.upcoming_sessions?.length || 0}`);
    console.log(`Pending Assignments: ${dashboardData?.pending_assignments?.length || 0}`);
    console.log(`Recent Activities: ${dashboardData?.recent_activity?.length || 0}`);
    console.log('');
    console.log('Stats:');
    if (dashboardData?.stats) {
      console.log(`  Total Courses: ${dashboardData.stats.total_courses || 0}`);
      console.log(`  Completed Lessons: ${dashboardData.stats.completed_lessons || 0}`);
      console.log(`  In Progress Lessons: ${dashboardData.stats.in_progress_lessons || 0}`);
      console.log(`  Total Hours: ${dashboardData.stats.total_hours_spent || 0}`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testDashboard();
