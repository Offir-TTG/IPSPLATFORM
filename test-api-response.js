const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testAPI() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  console.log('Testing API response...\n');

  // Make a request to the API
  const response = await fetch(`${supabaseUrl.replace('/v1', '')}/api/user/courses`, {
    headers: {
      'Authorization': `Bearer ${supabaseServiceKey}`
    }
  });

  const data = await response.json();

  console.log('API Response:');
  console.log(JSON.stringify(data, null, 2));

  if (data.success && data.data) {
    console.log('\n========================================');
    console.log('COURSES SUMMARY:');
    console.log('========================================\n');

    data.data.forEach((course, index) => {
      console.log(`${index + 1}. ${course.course_name}`);
      console.log(`   - Total Lessons: ${course.total_lessons}`);
      console.log(`   - Completed Lessons: ${course.completed_lessons}`);
      console.log(`   - Progress: ${course.overall_progress}%`);
      console.log(`   - Program: ${course.program_name || 'N/A'}`);

      // Calculate expected status
      let expectedStatus = 'not_started';
      if (course.completed_lessons === 0) {
        expectedStatus = 'NOT_STARTED';
      } else if (course.overall_progress === 100 && course.total_lessons > 0 && course.completed_lessons === course.total_lessons) {
        expectedStatus = 'COMPLETED';
      } else {
        expectedStatus = 'IN_PROGRESS';
      }

      console.log(`   - Expected Status: ${expectedStatus}`);
      console.log('');
    });
  }
}

testAPI().catch(console.error);
