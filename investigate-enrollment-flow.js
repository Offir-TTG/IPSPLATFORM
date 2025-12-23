const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function investigateEnrollmentFlow() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('='.repeat(80));
  console.log('INVESTIGATING ENROLLMENT FLOW');
  console.log('='.repeat(80));

  // Get user
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .eq('role', 'student')
    .limit(1);

  const user = users[0];
  console.log(`\nUser: ${user.email}`);

  // Get the program enrollment
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

  console.log(`\nEnrollment:`);
  console.log(`  Product: ${product.title}`);
  console.log(`  Enrollment ID: ${enrollment.id}`);
  console.log(`  Enrolled at: ${enrollment.enrolled_at}`);

  // Get ALL courses in the program (with timestamps)
  const { data: programCourses } = await supabase
    .from('program_courses')
    .select(`
      course_id,
      order,
      created_at,
      courses!inner (
        id,
        title,
        created_at,
        is_published,
        is_active
      )
    `)
    .eq('program_id', product.program_id)
    .order('order', { ascending: true });

  console.log(`\n${'='.repeat(80)}`);
  console.log('COURSES IN PROGRAM:');
  console.log('='.repeat(80));

  for (const link of programCourses) {
    const course = Array.isArray(link.courses) ? link.courses[0] : link.courses;

    console.log(`\n📚 ${course.title}`);
    console.log(`   Course ID: ${course.id}`);
    console.log(`   Course created: ${course.created_at}`);
    console.log(`   Added to program: ${link.created_at}`);
    console.log(`   Enrollment was: ${enrollment.enrolled_at}`);

    const wasAddedAfterEnrollment = new Date(link.created_at) > new Date(enrollment.enrolled_at);
    console.log(`   ⚠️  Added AFTER user enrollment: ${wasAddedAfterEnrollment ? 'YES' : 'NO'}`);

    // Get lessons in this course
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, title, created_at, module_id, modules!inner(id, course_id)')
      .eq('modules.course_id', course.id)
      .order('created_at', { ascending: true });

    console.log(`   Total lessons: ${lessons?.length || 0}`);

    if (lessons && lessons.length > 0) {
      console.log(`\n   Lessons:`);
      for (const lesson of lessons) {
        console.log(`     - ${lesson.title}`);
        console.log(`       ID: ${lesson.id}`);
        console.log(`       Created: ${lesson.created_at}`);

        // Check if there are progress records for this lesson
        const { data: progress } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('lesson_id', lesson.id);

        if (progress && progress.length > 0) {
          console.log(`       🔴 PROGRESS RECORDS: ${progress.length}`);
          progress.forEach((pr, i) => {
            console.log(`         ${i + 1}. Status: ${pr.status} | Created: ${pr.created_at} | Enrollment: ${pr.enrollment_id}`);
          });
        } else {
          console.log(`       ✅ No progress records (correct)`);
        }
      }
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('CHECKING FOR AUTO-CREATION MECHANISMS:');
  console.log('='.repeat(80));

  // Check for triggers
  const { data: triggers } = await supabase.rpc('get_triggers_for_table', { table_name: 'user_progress' }).catch(() => ({ data: null }));

  console.log('\nSearching for database triggers that might create progress records...');
  console.log('(This requires a custom SQL function - skipping for now)');

  // Check enrollment_id field in progress records
  const { data: allProgress } = await supabase
    .from('user_progress')
    .select('id, lesson_id, enrollment_id, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  console.log(`\n${'='.repeat(80)}`);
  console.log('ALL USER PROGRESS RECORDS (chronological):');
  console.log('='.repeat(80));

  for (const pr of allProgress || []) {
    // Get lesson info
    const { data: lesson } = await supabase
      .from('lessons')
      .select('id, title, modules!inner(courses!inner(id, title))')
      .eq('id', pr.lesson_id)
      .single();

    const course = lesson?.modules?.courses;

    console.log(`\n${pr.created_at}`);
    console.log(`  Lesson: ${lesson?.title || pr.lesson_id}`);
    console.log(`  Course: ${course?.title || 'Unknown'}`);
    console.log(`  Status: ${pr.status}`);
    console.log(`  Enrollment ID: ${pr.enrollment_id}`);
    console.log(`  Matches user enrollment: ${pr.enrollment_id === enrollment.id ? 'YES' : 'NO'}`);
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('ANALYSIS COMPLETE');
  console.log('='.repeat(80));
}

investigateEnrollmentFlow().catch(console.error);
