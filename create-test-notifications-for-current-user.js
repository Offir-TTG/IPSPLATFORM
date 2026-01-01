const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestNotifications() {
  console.log('Creating test notifications for current user...\n');

  try {
    // Get the user with email offir.omer@tenafly-tg.com
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, tenant_id')
      .eq('email', 'offir.omer@tenafly-tg.com')
      .single();

    if (userError || !users) {
      console.error('Error finding user:', userError);
      return;
    }

    console.log('Found user:', users.email);
    console.log('User ID:', users.id);
    console.log('Tenant ID:', users.tenant_id);

    // Create 3 test notifications
    const notifications = [
      {
        tenant_id: users.tenant_id,
        scope: 'individual',
        target_user_id: users.id,
        category: 'system',
        priority: 'medium',
        title: 'Welcome to the Notifications System',
        message: 'This is a test notification to verify the mark all as read functionality works correctly.',
      },
      {
        tenant_id: users.tenant_id,
        scope: 'individual',
        target_user_id: users.id,
        category: 'announcement',
        priority: 'high',
        title: 'Important Update',
        message: 'Please review the latest changes to your courses.',
      },
      {
        tenant_id: users.tenant_id,
        scope: 'individual',
        target_user_id: users.id,
        category: 'achievement',
        priority: 'low',
        title: 'Achievement Unlocked!',
        message: 'Congratulations on testing the notification system.',
      },
    ];

    const { data: created, error: createError } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (createError) {
      console.error('Error creating notifications:', createError);
      return;
    }

    console.log(`\n✅ Successfully created ${created.length} test notifications!`);
    console.log('\nYou should now see these notifications in your notifications page.');
    console.log('Try clicking "Mark All as Read" to test the functionality.\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestNotifications();
