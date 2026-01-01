const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugCourseNotification() {
  console.log('\n=== DEBUGGING COURSE NOTIFICATION ===\n');

  // Get the most recent course notification
  const { data: notification, error: notifError } = await supabase
    .from('notifications')
    .select('*')
    .eq('scope', 'course')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (notifError || !notification) {
    console.log('❌ No course notification found');
    return;
  }

  console.log('📧 Latest Course Notification:');
  console.log(`   ID: ${notification.id}`);
  console.log(`   Title: ${notification.title}`);
  console.log(`   Course ID: ${notification.target_course_id}`);
  console.log(`   Created: ${notification.created_at}`);
  console.log('');

  // Check if there are products for this course
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('*')
    .eq('course_id', notification.target_course_id);

  if (prodError) {
    console.log('❌ Error fetching products:', prodError.message);
    return;
  }

  console.log(`📦 Products for this course: ${products?.length || 0}`);
  products?.forEach(p => {
    console.log(`   - ${p.name} (ID: ${p.id})`);
  });
  console.log('');

  // Check enrollments for these products
  if (products && products.length > 0) {
    const productIds = products.map(p => p.id);

    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('*, users!inner(id, first_name, last_name, email)')
      .in('product_id', productIds)
      .eq('status', 'active');

    if (enrollError) {
      console.log('❌ Error fetching enrollments:', enrollError.message);
      return;
    }

    console.log(`👥 Active Enrollments: ${enrollments?.length || 0}`);
    enrollments?.forEach(e => {
      console.log(`   - ${e.users.first_name} ${e.users.last_name} (${e.users.email})`);
      console.log(`     User ID: ${e.user_id}`);
      console.log(`     Product ID: ${e.product_id}`);
    });
    console.log('');

    // Test the get_user_notifications function for each enrolled user
    if (enrollments && enrollments.length > 0) {
      console.log('🔍 Testing get_user_notifications for each user:\n');

      for (const enrollment of enrollments) {
        const { data: userNotifs, error: userNotifsError } = await supabase
          .rpc('get_user_notifications', {
            p_user_id: enrollment.user_id,
            p_limit: 10,
            p_offset: 0
          });

        if (userNotifsError) {
          console.log(`   ❌ Error for ${enrollment.users.email}:`, userNotifsError.message);
        } else {
          const hasNotification = userNotifs?.some(n => n.id === notification.id);
          console.log(`   ${hasNotification ? '✅' : '❌'} ${enrollment.users.email}: ${hasNotification ? 'CAN' : 'CANNOT'} see notification`);
          if (!hasNotification) {
            console.log(`      Total notifications visible: ${userNotifs?.length || 0}`);
          }
        }
      }
    }
  } else {
    console.log('⚠️  No products found for this course!');
    console.log('   Users cannot receive notifications if there are no products for this course.');
  }

  console.log('\n=== DEBUG COMPLETE ===\n');
}

debugCourseNotification().catch(console.error);
