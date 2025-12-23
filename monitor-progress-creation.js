const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function monitorProgressCreation() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('='.repeat(80));
  console.log('MONITORING PROGRESS RECORD CREATION');
  console.log('='.repeat(80));

  // Get user
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .eq('role', 'student')
    .limit(1);

  const user = users[0];
  console.log(`\nMonitoring user: ${user.email} (${user.id})`);

  // Get current timestamp for reference
  const startTime = new Date();
  console.log(`Start time: ${startTime.toISOString()}\n`);

  // Get the enrollment
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      enrolled_at,
      products!inner (
        id,
        title,
        program_id
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'active');

  const enrollment = enrollments[0];
  const product = Array.isArray(enrollment.products) ? enrollment.products[0] : enrollment.products;

  console.log(`Enrollment ID: ${enrollment.id}`);
  console.log(`Program: ${product.title}`);
  console.log(`Program ID: ${product.program_id}`);

  // Get all courses in the program
  const { data: programCourses } = await supabase
    .from('program_courses')
    .select(`
      course_id,
      courses!inner (
        id,
        title,
        created_at
      )
    `)
    .eq('program_id', product.program_id)
    .order('created_at', { ascending: false });

  console.log(`\n${'='.repeat(80)}`);
  console.log('COURSES IN PROGRAM:');
  console.log('='.repeat(80));

  for (const link of programCourses) {
    const course = Array.isArray(link.courses) ? link.courses[0] : link.courses;
    console.log(`\n📚 ${course.title}`);
    console.log(`   Course ID: ${course.id}`);
    console.log(`   Created: ${course.created_at}`);

    // Get lessons
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, title, created_at, modules!inner(course_id)')
      .eq('modules.course_id', course.id)
      .order('created_at', { ascending: true });

    console.log(`   Lessons: ${lessons?.length || 0}`);

    if (lessons && lessons.length > 0) {
      for (const lesson of lessons) {
        console.log(`   - ${lesson.title} (${lesson.id})`);
        console.log(`     Created: ${lesson.created_at}`);

        // Check progress records for this lesson
        const { data: progress } = await supabase
          .from('user_progress')
          .select('id, status, created_at, enrollment_id')
          .eq('user_id', user.id)
          .eq('lesson_id', lesson.id)
          .order('created_at', { ascending: true });

        if (progress && progress.length > 0) {
          console.log(`     ⚠️  PROGRESS RECORDS: ${progress.length}`);
          progress.forEach((pr, i) => {
            const timeDiff = new Date(pr.created_at) - startTime;
            const isNew = timeDiff > -60000; // Created in last minute
            console.log(`       ${i + 1}. Status: ${pr.status} | Created: ${pr.created_at} ${isNew ? '🔴 NEW!' : ''}`);
          });

          // Check for duplicates
          if (progress.length > 1) {
            console.log(`     🚨 DUPLICATE DETECTED! ${progress.length} records for same lesson`);

            // Analyze the timing
            for (let i = 1; i < progress.length; i++) {
              const prev = new Date(progress[i - 1].created_at);
              const curr = new Date(progress[i].created_at);
              const diff = curr - prev;
              console.log(`       Gap between record ${i} and ${i + 1}: ${diff}ms`);
            }
          }
        } else {
          console.log(`     ✅ No progress records`);
        }
      }
    }
  }

  // Summary of all progress records for this enrollment
  const { data: allProgress } = await supabase
    .from('user_progress')
    .select('id, lesson_id, status, created_at, course_id')
    .eq('user_id', user.id)
    .eq('enrollment_id', enrollment.id)
    .order('created_at', { ascending: true });

  console.log(`\n${'='.repeat(80)}`);
  console.log('SUMMARY - ALL PROGRESS RECORDS:');
  console.log('='.repeat(80));
  console.log(`Total: ${allProgress?.length || 0}`);

  // Group by lesson_id to find duplicates
  const byLesson = {};
  allProgress?.forEach(pr => {
    if (!byLesson[pr.lesson_id]) {
      byLesson[pr.lesson_id] = [];
    }
    byLesson[pr.lesson_id].push(pr);
  });

  let duplicateCount = 0;
  for (const lessonId in byLesson) {
    const records = byLesson[lessonId];
    if (records.length > 1) {
      duplicateCount++;
      console.log(`\n🚨 Lesson ${lessonId.substring(0, 8)}... has ${records.length} duplicate records`);
      records.forEach((pr, i) => {
        console.log(`   ${i + 1}. ${pr.status} | ${pr.created_at}`);
      });
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`Total lessons with duplicates: ${duplicateCount}`);
  console.log('='.repeat(80));
}

monitorProgressCreation().catch(console.error);
