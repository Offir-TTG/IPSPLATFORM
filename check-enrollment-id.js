const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkEnrollmentId() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get user
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .eq('role', 'student')
    .limit(1);

  const user = users[0];
  console.log(`User: ${user.email}\n`);

  // Get ALL user_progress records for this user
  const { data: allProgress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id);

  console.log('='.repeat(80));
  console.log(`TOTAL USER_PROGRESS RECORDS: ${allProgress?.length || 0}`);
  console.log('='.repeat(80));

  // Group by enrollment_id
  const byEnrollment = {};
  allProgress?.forEach(pr => {
    if (!byEnrollment[pr.enrollment_id]) {
      byEnrollment[pr.enrollment_id] = [];
    }
    byEnrollment[pr.enrollment_id].push(pr);
  });

  for (const enrollmentId in byEnrollment) {
    const records = byEnrollment[enrollmentId];
    console.log(`\nEnrollment ID: ${enrollmentId}`);
    console.log(`Records: ${records.length}`);

    records.forEach((pr, i) => {
      console.log(`  ${i + 1}. Lesson: ${pr.lesson_id.substring(0, 8)}... | Status: ${pr.status} | Course: ${pr.course_id ? pr.course_id.substring(0, 8) + '...' : 'NULL'}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('CHECKING LESSON OWNERSHIP:');
  console.log('='.repeat(80));

  // For the enrollment we care about, check each lesson
  const targetEnrollmentId = Object.keys(byEnrollment)[0];
  const targetRecords = byEnrollment[targetEnrollmentId];

  for (const pr of targetRecords) {
    const { data: lesson } = await supabase
      .from('lessons')
      .select('id, title, modules!inner(id, course_id, courses!inner(id, title))')
      .eq('id', pr.lesson_id)
      .single();

    if (lesson) {
      const course = lesson.modules.courses;
      console.log(`\nLesson: ${lesson.title}`);
      console.log(`  Belongs to course: ${course.title} (${course.id})`);
      console.log(`  Progress status: ${pr.status}`);
      console.log(`  Progress course_id field: ${pr.course_id}`);
      console.log(`  Match: ${pr.course_id === course.id ? '✅' : '❌'}`);
    }
  }
}

checkEnrollmentId().catch(console.error);
