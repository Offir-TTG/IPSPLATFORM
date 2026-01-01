const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigateCourseAccess() {
  console.log('\n=== INVESTIGATING COURSE ACCESS ===\n');

  // Get the course from the notification
  const courseId = '321f0bb3-c0c6-43a1-a1c0-8810e317fdf6';

  console.log('📚 Course ID:', courseId);

  // Check if this course belongs to any program
  const { data: programCourses, error: pcError } = await supabase
    .from('program_courses')
    .select('*, programs(*)')
    .eq('course_id', courseId);

  if (pcError) {
    console.log('❌ Error checking program_courses:', pcError.message);
    return;
  }

  console.log(`\n🔗 Programs containing this course: ${programCourses?.length || 0}`);
  programCourses?.forEach(pc => {
    console.log(`   - ${pc.programs.name} (ID: ${pc.program_id})`);
  });

  // For each program, check products and enrollments
  if (programCourses && programCourses.length > 0) {
    for (const pc of programCourses) {
      console.log(`\n📦 Products for program "${pc.programs.name}":`);

      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('*')
        .eq('program_id', pc.program_id);

      if (prodError) {
        console.log('   ❌ Error:', prodError.message);
        continue;
      }

      console.log(`   Found ${products?.length || 0} products`);
      products?.forEach(p => console.log(`   - ${p.name} (ID: ${p.id})`));

      if (products && products.length > 0) {
        const productIds = products.map(p => p.id);

        const { data: enrollments, error: enrollError } = await supabase
          .from('enrollments')
          .select('*, users!inner(id, first_name, last_name, email)')
          .in('product_id', productIds)
          .eq('status', 'active');

        if (enrollError) {
          console.log('   ❌ Error:', enrollError.message);
          continue;
        }

        console.log(`\n   👥 Active Enrollments: ${enrollments?.length || 0}`);
        enrollments?.forEach(e => {
          console.log(`      - ${e.users.first_name} ${e.users.last_name} (${e.users.email})`);
          console.log(`        User ID: ${e.user_id}`);
          console.log(`        Product ID: ${e.product_id}`);
        });

        // Test if these users can see the course notification
        if (enrollments && enrollments.length > 0) {
          console.log(`\n   🔍 Testing notification visibility:\n`);

          for (const enrollment of enrollments) {
            const { data: userNotifs, error: userNotifsError } = await supabase
              .rpc('get_user_notifications', {
                p_user_id: enrollment.user_id,
                p_limit: 100,
                p_offset: 0
              });

            if (userNotifsError) {
              console.log(`      ❌ Error for ${enrollment.users.email}:`, userNotifsError.message);
            } else {
              const courseNotif = userNotifs?.find(n => n.scope === 'course' && n.target_course_id === courseId);
              console.log(`      ${courseNotif ? '✅' : '❌'} ${enrollment.users.email}: ${courseNotif ? 'CAN' : 'CANNOT'} see course notification`);
            }
          }
        }
      }
    }
  }

  // Also check for direct product → course links
  console.log('\n\n📦 Direct Products for this course:');
  const { data: directProducts, error: dpError } = await supabase
    .from('products')
    .select('*')
    .eq('course_id', courseId);

  if (dpError) {
    console.log('❌ Error:', dpError.message);
  } else {
    console.log(`Found ${directProducts?.length || 0} direct products`);
    directProducts?.forEach(p => console.log(`   - ${p.name} (ID: ${p.id})`));
  }

  console.log('\n=== INVESTIGATION COMPLETE ===\n');
}

investigateCourseAccess().catch(console.error);
