const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkProgressData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('='.repeat(80));
  console.log('CHECKING USER PROGRESS DATA');
  console.log('='.repeat(80));

  // Get all users with enrollments
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, role')
    .eq('role', 'student')
    .limit(5);

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  console.log(`\nFound ${users.length} student users to check\n`);

  for (const user of users) {
    console.log('\n' + '='.repeat(80));
    console.log(`USER: ${user.first_name} ${user.last_name} (${user.email})`);
    console.log('='.repeat(80));

    // Get enrollments for this user
    const { data: enrollments, error: enrollError } = await supabase
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

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError);
      continue;
    }

    console.log(`\nEnrollments: ${enrollments?.length || 0}`);

    for (const enrollment of enrollments || []) {
      const product = Array.isArray(enrollment.products) ? enrollment.products[0] : enrollment.products;

      console.log(`\n  📦 Product: ${product.title} (${product.type})`);
      console.log(`  📋 Enrollment ID: ${enrollment.id}`);
      console.log(`  ✅ Status: ${enrollment.status}`);

      // Handle both course and program enrollments
      let coursesToCheck = [];

      if (product.type === 'course' && product.course_id) {
        const { data: course } = await supabase
          .from('courses')
          .select('id, title')
          .eq('id', product.course_id)
          .single();

        if (course) {
          coursesToCheck.push(course);
        }
      } else if (product.type === 'program' && product.program_id) {
        // Get all courses in this program
        const { data: programCourseLinks } = await supabase
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
          .order('order', { ascending: true });

        const programCourses = programCourseLinks
          ?.map(link => link.courses)
          .filter((course) => {
            if (Array.isArray(course)) {
              return course[0]?.is_published && course[0]?.is_active;
            }
            return course?.is_published && course?.is_active;
          })
          .map((course) => Array.isArray(course) ? course[0] : course) || [];

        coursesToCheck = programCourses;
        console.log(`  📚 Program contains ${coursesToCheck.length} active courses`);
      }

      // Check each course
      for (const course of coursesToCheck) {
        console.log(`\n  📚 Course: ${course.title}`);

        // Get all lessons in this course
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id, title, module_id, modules!inner(id, course_id)')
          .eq('modules.course_id', course.id);

        console.log(`  📖 Total Lessons: ${lessons?.length || 0}`);

        // Get user progress for this enrollment
        const { data: progressRecords } = await supabase
          .from('user_progress')
          .select('id, lesson_id, status, created_at, completed_at')
          .eq('user_id', user.id)
          .eq('enrollment_id', enrollment.id);

        // Filter progress records for this course only
        const courseProgressRecords = progressRecords?.filter(pr =>
          lessons?.some(l => l.id === pr.lesson_id)
        ) || [];

        console.log(`  ✏️  Progress Records: ${courseProgressRecords.length}`);

        if (courseProgressRecords.length > 0) {
          console.log('\n  📊 Progress Details:');
          const statusCounts = {
            not_started: 0,
            in_progress: 0,
            completed: 0
          };

          courseProgressRecords.forEach(pr => {
            statusCounts[pr.status]++;
          });

          console.log(`     - Not Started: ${statusCounts.not_started}`);
          console.log(`     - In Progress: ${statusCounts.in_progress}`);
          console.log(`     - Completed: ${statusCounts.completed}`);

          // Show individual completed records with timestamps
          const completedRecords = courseProgressRecords.filter(pr => pr.status === 'completed');
          if (completedRecords.length > 0) {
            console.log('\n  ⚠️  COMPLETED RECORDS:');
            for (const pr of completedRecords) {
              const lesson = lessons?.find(l => l.id === pr.lesson_id);
              console.log(`     - Lesson: ${lesson?.title || pr.lesson_id}`);
              console.log(`       Created: ${pr.created_at}`);
              console.log(`       Completed: ${pr.completed_at || 'NULL'}`);
            }
          }
        }

        // Calculate what the API would return
        const completedCount = courseProgressRecords.filter(p => p.status === 'completed').length;
        const totalLessons = lessons?.length || 0;
        const calculatedProgress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

        console.log(`\n  🎯 CALCULATED STATUS:`);
        console.log(`     - Completed Lessons: ${completedCount}`);
        console.log(`     - Total Lessons: ${totalLessons}`);
        console.log(`     - Progress: ${calculatedProgress}%`);

        // Determine status
        let status = 'not_started';
        if (completedCount === 0) {
          status = 'not_started';
        } else if (calculatedProgress === 100 && totalLessons > 0 && completedCount === totalLessons) {
          status = 'completed';
        } else {
          status = 'in_progress';
        }
        console.log(`     - Status: ${status.toUpperCase()}`);

        // Check for anomalies
        if (completedCount > 0 && completedCount < totalLessons && calculatedProgress === 100) {
          console.log('\n  🚨 ANOMALY DETECTED: Progress is 100% but not all lessons completed!');
        }
        if (completedCount === totalLessons && totalLessons > 0 && courseProgressRecords.length === 0) {
          console.log('\n  🚨 ANOMALY DETECTED: No progress records but course shows as completed!');
        }
        if (completedCount > totalLessons) {
          console.log('\n  🚨 ANOMALY DETECTED: More completed lessons than total lessons!');
        }
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('SCRIPT COMPLETED');
  console.log('='.repeat(80));
}

checkProgressData().catch(console.error);
