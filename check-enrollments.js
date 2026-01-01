const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { data: users } = await supabase.auth.admin.listUsers();
  const userId = users?.users?.[0]?.id;
  
  if (!userId) {
    console.log('No user');
    return;
  }

  const { data } = await supabase.rpc('get_user_dashboard_v3', {
    p_user_id: userId
  });

  console.log('Enrollments:', data?.enrollments?.length || 0);
  
  if (data?.enrollments && data.enrollments.length > 0) {
    console.log('\nEnrollment details:');
    data.enrollments.forEach((e, i) => {
      console.log(i + 1, '-', e.course_name);
      console.log('   total_lessons:', e.total_lessons);
      console.log('   total_hours:', e.total_hours);
    });
    
    const totalLessons = data.enrollments.reduce((sum, e) => sum + (e.total_lessons || 0), 0);
    let totalHours = data.enrollments.reduce((sum, e) => sum + (e.total_hours || 0), 0);
    
    if (totalHours === 0 && totalLessons > 0) {
      totalHours = Math.round((totalLessons * 90) / 60 * 10) / 10;
    }
    
    console.log('\nTotal lessons:', totalLessons);
    console.log('Total hours (calculated):', totalHours);
  }
})();
