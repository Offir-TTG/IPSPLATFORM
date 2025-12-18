const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDashboardData() {
  console.log('Checking dashboard data...\n');

  try {
    // Get the first user
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, tenant_id')
      .eq('role', 'student')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.error('Error getting user:', userError);
      return;
    }

    const user = users[0];
    console.log('User:', user.email);
    console.log('User ID:', user.id);
    console.log('Tenant ID:', user.tenant_id);
    console.log('\n--- ENROLLMENTS ---');

    // Get all enrollments for this user (enrollments link to products, not courses directly)
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        id,
        status,
        product_id,
        enrolled_at,
        completed_at,
        products (
          id,
          type,
          course_id,
          program_id
        )
      `)
      .eq('user_id', user.id)
      .eq('tenant_id', user.tenant_id);

    if (enrollError) {
      console.error('Error getting enrollments:', enrollError);
      return;
    }

    console.log(`Total enrollments: ${enrollments.length}\n`);

    // Get course details for each enrollment
    for (const e of enrollments) {
      let courseName = 'N/A';
      if (e.products?.course_id) {
        const { data: course } = await supabase
          .from('courses')
          .select('id, title')
          .eq('id', e.products.course_id)
          .single();
        courseName = course?.title || 'Unknown';
      }

      console.log(`- Product Type: ${e.products?.type || 'N/A'}`);
      console.log(`  Course: ${courseName}`);
      console.log(`  Status: ${e.status}`);
      console.log(`  Course ID: ${e.products?.course_id || 'N/A'}`);
      console.log(`  Program ID: ${e.products?.program_id || 'N/A'}`);
      console.log(`  Enrolled: ${e.enrolled_at}`);
      console.log(`  Completed: ${e.completed_at || 'N/A'}`);
      console.log('');
    }

    // Count by status
    const statusCounts = enrollments.reduce((acc, e) => {
      acc[e.status] = (acc[e.status] || 0) + 1;
      return acc;
    }, {});

    console.log('Enrollment counts by status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // Get course enrollments only
    const courseEnrollments = enrollments.filter(e => e.products?.course_id);
    console.log(`\nTotal course enrollments: ${courseEnrollments.length}`);

    const activeCourseEnrollments = courseEnrollments.filter(e => e.status === 'active');
    const completedCourseEnrollments = courseEnrollments.filter(e => e.status === 'completed');
    console.log(`  Active: ${activeCourseEnrollments.length}`);
    console.log(`  Completed: ${completedCourseEnrollments.length}`);

    console.log('\n--- USER PROGRESS ---');

    // Get user progress
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select(`
        id,
        status,
        enrollment_id,
        lesson_id,
        progress_percentage
      `)
      .eq('user_id', user.id)
      .eq('tenant_id', user.tenant_id);

    if (progressError) {
      console.error('Error getting progress:', progressError);
      return;
    }

    console.log(`Total user_progress records: ${progress.length}\n`);

    // Group by enrollment
    const progressByEnrollment = {};
    progress.forEach((p) => {
      if (!progressByEnrollment[p.enrollment_id]) {
        progressByEnrollment[p.enrollment_id] = [];
      }
      progressByEnrollment[p.enrollment_id].push(p);
    });

    console.log('Progress by enrollment:');
    Object.entries(progressByEnrollment).forEach(([enrollmentId, records]) => {
      const enrollment = enrollments.find(e => e.id === enrollmentId);
      console.log(`  Enrollment ID: ${enrollmentId} (${enrollment?.status})`);
      console.log(`    Total progress records: ${records.length}`);

      const statusCounts = records.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {});

      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`      ${status}: ${count}`);
      });
    });

    // Count enrollments with progress
    const enrollmentsWithProgress = enrollments.filter(e =>
      progressByEnrollment[e.id] && progressByEnrollment[e.id].length > 0
    );
    console.log(`\nEnrollments with progress: ${enrollmentsWithProgress.length}`);

    console.log('\n--- DASHBOARD FUNCTION RESULT ---');

    // Call the dashboard function
    const { data: dashboardData, error: dashboardError } = await supabase
      .rpc('get_user_dashboard_v3', {
        p_user_id: user.id,
      });

    if (dashboardError) {
      console.error('Error calling dashboard function:', dashboardError);
      return;
    }

    console.log('Stats from dashboard function:');
    console.log(`  total_courses: ${dashboardData.stats.total_courses}`);
    console.log(`  completed_lessons: ${dashboardData.stats.completed_lessons}`);
    console.log(`  in_progress_lessons: ${dashboardData.stats.in_progress_lessons}`);
    console.log(`  pending_assignments: ${dashboardData.stats.pending_assignments}`);

    console.log('\n--- ANALYSIS ---');
    console.log('What you expect:');
    console.log('  Active courses: 1 (total_courses currently shows: ' + dashboardData.stats.total_courses + ')');
    console.log('  Completed: 0 (completed_lessons currently shows: ' + dashboardData.stats.completed_lessons + ')');
    console.log('  In Progress: 1 (in_progress_lessons currently shows: ' + dashboardData.stats.in_progress_lessons + ')');
    console.log('  Assignments: 0 (pending_assignments currently shows: ' + dashboardData.stats.pending_assignments + ')');

    console.log('\nWhat the dashboard function is actually counting:');
    console.log('  total_courses: COUNT of course_id from active enrollments');
    console.log('  completed_lessons: COUNT of user_progress with status=completed');
    console.log('  in_progress_lessons: COUNT of user_progress with status=in_progress');
    console.log('  pending_assignments: hardcoded to 0');

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  }
}

checkDashboardData();
