const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugRemainingCalculation() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('='.repeat(80));
  console.log('DEBUGGING REMAINING CALCULATION');
  console.log('='.repeat(80));

  // Get user
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .eq('role', 'student')
    .limit(1);

  const user = users[0];
  console.log(`\nUser: ${user.email}`);

  // Get enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
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

  console.log(`Enrollment: ${product.title}\n`);

  // Get program courses
  const { data: programCourses } = await supabase
    .from('program_courses')
    .select(`
      course_id,
      courses!inner (
        id,
        title,
        is_published,
        is_active
      )
    `)
    .eq('program_id', product.program_id)
    .order('course_id', { ascending: true });

  for (const link of programCourses) {
    const course = Array.isArray(link.courses) ? link.courses[0] : link.courses;

    if (!course.is_published || !course.is_active) continue;

    console.log('='.repeat(80));
    console.log(`COURSE: ${course.title}`);
    console.log('='.repeat(80));

    // Get lessons
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, title, modules!inner(course_id)')
      .eq('modules.course_id', course.id);

    const totalLessons = lessons?.length || 0;
    console.log(`Total Lessons: ${totalLessons}`);

    // Get progress data for this enrollment
    const { data: progressData } = await supabase
      .from('user_progress')
      .select('lesson_id, status, created_at')
      .eq('user_id', user.id)
      .eq('enrollment_id', enrollment.id);

    console.log(`\nTotal Progress Records for Enrollment: ${progressData?.length || 0}`);

    // Filter to only this course's lessons
    const lessonIds = lessons?.map(l => l.id) || [];
    const courseProgress = progressData?.filter(p => lessonIds.includes(p.lesson_id)) || [];

    console.log(`Progress Records for THIS Course: ${courseProgress.length}`);

    // Count statuses
    const completedLessons = courseProgress.filter(p => p.status === 'completed').length;
    const inProgressLessons = courseProgress.filter(p => p.status === 'in_progress').length;
    const notStartedLessons = courseProgress.filter(p => p.status === 'not_started').length;

    console.log(`\nProgress Breakdown:`);
    console.log(`  Completed: ${completedLessons}`);
    console.log(`  In Progress: ${inProgressLessons}`);
    console.log(`  Not Started: ${notStartedLessons}`);

    // Calculate remaining
    const remaining = totalLessons - completedLessons - inProgressLessons;

    console.log(`\nCalculation:`);
    console.log(`  Remaining = ${totalLessons} - ${completedLessons} - ${inProgressLessons}`);
    console.log(`  Remaining = ${remaining}`);

    if (remaining < 0) {
      console.log(`\n🚨 NEGATIVE REMAINING! This is the bug!`);
      console.log(`\nPossible causes:`);
      console.log(`  1. Duplicate progress records (${courseProgress.length} records for ${totalLessons} lessons)`);
      console.log(`  2. Progress records for lessons that no longer exist`);
      console.log(`  3. Counting logic is wrong`);

      // Check for duplicates
      const progressByLesson = {};
      courseProgress.forEach(pr => {
        if (!progressByLesson[pr.lesson_id]) {
          progressByLesson[pr.lesson_id] = [];
        }
        progressByLesson[pr.lesson_id].push(pr);
      });

      console.log(`\nProgress Records by Lesson:`);
      for (const lessonId in progressByLesson) {
        const records = progressByLesson[lessonId];
        const lesson = lessons?.find(l => l.id === lessonId);
        console.log(`  ${lesson?.title || lessonId}: ${records.length} records`);
        if (records.length > 1) {
          console.log(`    🚨 DUPLICATE! ${records.length} records for 1 lesson`);
          records.forEach((r, i) => {
            console.log(`      ${i + 1}. ${r.status} (${r.created_at})`);
          });
        }
      }
    }

    console.log('\n');
  }
}

debugRemainingCalculation().catch(console.error);
