const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testActualAPI() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get a student user
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .eq('role', 'student')
    .limit(1);

  const user = users[0];

  console.log('Testing API /api/user/courses');
  console.log(`User: ${user.email}\n`);

  // Call the actual API endpoint (simulating the API logic)
  const response = await fetch('http://localhost:3000/api/user/courses', {
    headers: {
      'Cookie': `sb-access-token=${supabaseServiceKey}` // This won't work, but let's try direct DB query
    }
  });

  // Since we can't easily call the API with auth, let's replicate the API logic here
  console.log('='.repeat(80));
  console.log('REPLICATING API LOGIC:');
  console.log('='.repeat(80));

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      product_id,
      status,
      enrolled_at,
      products!inner (
        id,
        type,
        title,
        course_id,
        program_id
      )
    `)
    .eq('user_id', user.id)
    .in('status', ['active', 'completed']);

  console.log(`\nFound ${enrollments.length} enrollments\n`);

  const courses = [];

  for (const enrollment of enrollments) {
    const product = Array.isArray(enrollment.products) ? enrollment.products[0] : enrollment.products;

    console.log(`Processing: ${product.title} (${product.type})`);

    if (product.type === 'program' && product.program_id) {
      // Get program details
      const { data: program } = await supabase
        .from('programs')
        .select('id, name')
        .eq('id', product.program_id)
        .single();

      // Get courses in program
      const { data: programCourseLinks } = await supabase
        .from('program_courses')
        .select(`
          course_id,
          courses!inner (
            id,
            title,
            description,
            image_url,
            is_published,
            is_active
          )
        `)
        .eq('program_id', product.program_id)
        .order('order', { ascending: true });

      const programCourses = programCourseLinks
        ?.map(link => Array.isArray(link.courses) ? link.courses[0] : link.courses)
        .filter(course => course?.is_published && course?.is_active) || [];

      console.log(`  Program contains ${programCourses.length} active courses\n`);

      // Process each course
      for (const course of programCourses) {
        console.log(`  📚 Processing: ${course.title}`);

        // Get lessons for THIS SPECIFIC COURSE
        const { data: lessonData } = await supabase
          .from('lessons')
          .select('id, module_id, modules!inner(id, course_id)')
          .eq('modules.course_id', course.id);

        const totalLessons = lessonData?.length || 0;
        const lessonIds = lessonData?.map(l => l.id) || [];

        console.log(`     Total lessons: ${totalLessons}`);
        console.log(`     Lesson IDs: ${lessonIds.join(', ')}`);

        // Get ALL progress for the enrollment
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('lesson_id, status, completed_at')
          .eq('user_id', user.id)
          .eq('enrollment_id', enrollment.id);

        console.log(`     Total progress records for enrollment: ${progressData?.length || 0}`);

        // CRITICAL: Filter to only THIS course's lessons
        const courseProgressData = progressData?.filter(p => lessonIds.includes(p.lesson_id)) || [];
        const completedLessons = courseProgressData.filter(p => p.status === 'completed').length;
        const progress = totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

        console.log(`     Filtered progress records for THIS course: ${courseProgressData.length}`);
        console.log(`     Completed lessons: ${completedLessons}`);
        console.log(`     Progress: ${progress}%`);

        // Determine status
        let status = 'not_started';
        if (completedLessons === 0) {
          status = 'not_started';
        } else if (progress === 100 && totalLessons > 0 && completedLessons === totalLessons) {
          status = 'completed';
        } else {
          status = 'in_progress';
        }

        console.log(`     Status: ${status.toUpperCase()}\n`);

        courses.push({
          id: enrollment.id,
          course_id: course.id,
          course_name: course.title,
          program_name: program.name,
          total_lessons: totalLessons,
          completed_lessons: completedLessons,
          overall_progress: progress,
          status
        });
      }
    }
  }

  console.log('='.repeat(80));
  console.log('FINAL RESULTS:');
  console.log('='.repeat(80));
  courses.forEach((course, i) => {
    console.log(`\n${i + 1}. ${course.course_name}`);
    console.log(`   Program: ${course.program_name}`);
    console.log(`   Total Lessons: ${course.total_lessons}`);
    console.log(`   Completed: ${course.completed_lessons}`);
    console.log(`   Progress: ${course.overall_progress}%`);
    console.log(`   Status: ${course.status}`);
  });
}

testActualAPI().catch(console.error);
