/**
 * Test dashboard for student user specifically
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testStudentDashboard() {
  try {
    // Get student user
    const { data: students } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'student')
      .limit(1);

    if (!students || students.length === 0) {
      console.log('⚠️  No student users found');
      return;
    }

    const student = students[0];
    console.log(`🧪 Testing dashboard for student: ${student.email}\n`);

    // Call dashboard function
    const { data: dashboardData, error } = await supabase
      .rpc('get_user_dashboard_v3', { p_user_id: student.id });

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    console.log('✅ Dashboard loaded successfully!\n');
    console.log('📊 Data:');
    console.log(JSON.stringify(dashboardData, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testStudentDashboard();
