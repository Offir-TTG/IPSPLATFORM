const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugProgressRecords() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('='.repeat(80));
  console.log('DEBUG PROGRESS RECORDS');
  console.log('='.repeat(80));

  // Get user
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .eq('role', 'student')
    .limit(1);

  const user = users[0];
  console.log(`\nUser: ${user.email}`);

  // Get the enrollment
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      product_id,
      products!inner (
        id,
        type,
        title,
        program_id
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'active');

  const enrollment = enrollments[0];
  const product = Array.isArray(enrollment.products) ? enrollment.products[0] : enrollment.products;

  console.log(`\nProgram: ${product.title}`);
  console.log(`Enrollment ID: ${enrollment.id}`);

  // Get the parenting course
  const { data: programCourses } = await supabase
    .from('program_courses')
    .select(`
      course_id,
      courses!inner (
        id,
        title
      )
    `)
    .eq('program_id', product.program_id)
    .order('order', { ascending: true });

  const parentingCourse = programCourses.find(pc => {
    const course = Array.isArray(pc.courses) ? pc.courses[0] : pc.courses;
    return course.title.includes('הנחיית הורים');
  });

  const course = Array.isArray(parentingCourse.courses) ? parentingCourse.courses[0] : parentingCourse.courses;

  console.log(`\nCourse: ${course.title}`);
  console.log(`Course ID: ${course.id}`);

  // Get ALL lessons in this course
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, module_id, modules!inner(id, course_id)')
    .eq('modules.course_id', course.id);

  console.log(`\n${'='.repeat(80)}`);
  console.log('LESSONS IN COURSE:');
  console.log('='.repeat(80));
  lessons.forEach((lesson, i) => {
    console.log(`${i + 1}. ${lesson.title}`);
    console.log(`   ID: ${lesson.id}`);
    console.log(`   Module ID: ${lesson.module_id}`);
  });

  // Get ALL progress records for this enrollment
  const { data: allProgress } = await supabase
    .from('user_progress')
    .select('id, lesson_id, status, created_at, enrollment_id, course_id')
    .eq('user_id', user.id)
    .eq('enrollment_id', enrollment.id);

  console.log(`\n${'='.repeat(80)}`);
  console.log('ALL PROGRESS RECORDS FOR THIS ENROLLMENT:');
  console.log('='.repeat(80));
  console.log(`Total: ${allProgress?.length || 0}`);

  for (const pr of allProgress || []) {
    const i = allProgress.indexOf(pr);
    console.log(`\n${i + 1}. Progress Record ID: ${pr.id}`);
    console.log(`   Lesson ID: ${pr.lesson_id}`);
    console.log(`   Status: ${pr.status}`);
    console.log(`   Course ID in record: ${pr.course_id}`);
    console.log(`   Created: ${pr.created_at}`);

    // Check if this lesson ID exists in the parenting course
    const lessonInCourse = lessons.find(l => l.id === pr.lesson_id);
    if (lessonInCourse) {
      console.log(`   ✅ MATCHES LESSON: ${lessonInCourse.title}`);
    } else {
      console.log(`   ❌ DOES NOT MATCH ANY LESSON IN THIS COURSE`);

      // Find which course this lesson belongs to
      const { data: actualLesson } = await supabase
        .from('lessons')
        .select('id, title, module_id, modules!inner(id, course_id, courses!inner(id, title))')
        .eq('id', pr.lesson_id)
        .single();

      if (actualLesson) {
        const actualCourse = actualLesson.modules.courses;
        console.log(`   ⚠️  BELONGS TO: ${actualCourse.title} (${actualCourse.id})`);
      }
    }
  }

  // Filter to only this course
  const lessonIds = lessons.map(l => l.id);
  const courseProgress = allProgress?.filter(pr => lessonIds.includes(pr.lesson_id)) || [];

  console.log(`\n${'='.repeat(80)}`);
  console.log('FILTERED PROGRESS (ONLY FOR PARENTING COURSE):');
  console.log('='.repeat(80));
  console.log(`Total: ${courseProgress.length}`);

  courseProgress.forEach((pr, i) => {
    const lesson = lessons.find(l => l.id === pr.lesson_id);
    console.log(`${i + 1}. ${lesson?.title || pr.lesson_id} - ${pr.status}`);
  });

  console.log(`\n${'='.repeat(80)}`);
  console.log('COMPLETED');
  console.log('='.repeat(80));
}

debugProgressRecords().catch(console.error);
