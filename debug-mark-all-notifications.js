const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugMarkAll() {
  console.log('=== Debugging Mark All Notifications ===\n');

  // Get first user for testing
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email')
    .limit(1);

  if (userError || !users || users.length === 0) {
    console.error('Error getting user:', userError);
    return;
  }

  const userId = users[0].id;
  console.log('Testing with user:', users[0].email, '(', userId, ')\n');

  // Check all notifications for this user using the same logic as the function
  const { data: allNotifications, error: notifError } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (notifError) {
    console.error('Error getting notifications:', notifError);
    return;
  }

  console.log(`Total notifications in database: ${allNotifications?.length || 0}\n`);

  // Check which ones have been read
  const { data: readRecords, error: readError } = await supabase
    .from('notification_reads')
    .select('notification_id')
    .eq('user_id', userId);

  if (readError) {
    console.error('Error getting read records:', readError);
    return;
  }

  const readIds = new Set(readRecords?.map(r => r.notification_id) || []);
  console.log(`Notifications already marked as read: ${readIds.size}\n`);

  // Check user's enrollments
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('*, products(*)')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (enrollError) {
    console.error('Error getting enrollments:', enrollError);
  } else {
    console.log(`User's active enrollments: ${enrollments?.length || 0}`);
    if (enrollments && enrollments.length > 0) {
      enrollments.forEach(e => {
        console.log(`  - Product: ${e.products?.name}, Course: ${e.products?.course_id}, Program: ${e.products?.program_id}`);
      });
    }
    console.log();
  }

  // Check each notification's scope and whether it should be visible
  console.log('Notification Analysis:\n');
  let shouldBeVisible = 0;
  let shouldBeMarked = 0;

  for (const notif of allNotifications || []) {
    const isRead = readIds.has(notif.id);
    let visible = false;
    let reason = '';

    if (notif.scope === 'individual' && notif.target_user_id === userId) {
      visible = true;
      reason = 'individual scope - direct target';
    } else if (notif.scope === 'course' && enrollments) {
      const hasEnrollment = enrollments.some(e => e.products?.course_id === notif.target_course_id);
      if (hasEnrollment) {
        visible = true;
        reason = `course scope - enrolled via product`;
      }
    } else if (notif.scope === 'program' && enrollments) {
      const hasEnrollment = enrollments.some(e => e.products?.program_id === notif.target_program_id);
      if (hasEnrollment) {
        visible = true;
        reason = `program scope - enrolled via product`;
      }
    } else if (notif.scope === 'tenant') {
      visible = true;
      reason = 'tenant scope - all users';
    }

    if (visible) {
      shouldBeVisible++;
      if (!isRead) {
        shouldBeMarked++;
        console.log(`  ✓ [UNREAD] ${notif.title}`);
        console.log(`    Scope: ${notif.scope}, Reason: ${reason}`);
        console.log(`    Category: ${notif.category}, Priority: ${notif.priority}`);
        console.log();
      }
    }
  }

  console.log(`\nSummary:`);
  console.log(`  - Total notifications: ${allNotifications?.length || 0}`);
  console.log(`  - Visible to user: ${shouldBeVisible}`);
  console.log(`  - Already read: ${readIds.size}`);
  console.log(`  - Should be marked: ${shouldBeMarked}`);

  // Now call the actual function
  console.log(`\n=== Calling mark_all_notifications_as_read function ===\n`);

  const { data: markedCount, error: funcError } = await supabase.rpc(
    'mark_all_notifications_as_read',
    { p_user_id: userId }
  );

  if (funcError) {
    console.error('Error calling function:', funcError);
    console.error('Error details:', {
      code: funcError.code,
      message: funcError.message,
      details: funcError.details,
      hint: funcError.hint,
    });
  } else {
    console.log(`Function returned: ${markedCount} notifications marked`);
  }

  // Check again after calling function
  const { data: newReadRecords, error: newReadError } = await supabase
    .from('notification_reads')
    .select('notification_id')
    .eq('user_id', userId);

  if (!newReadError) {
    console.log(`\nAfter function call:`);
    console.log(`  - Read records count: ${newReadRecords?.length || 0}`);
    console.log(`  - New records added: ${(newReadRecords?.length || 0) - readIds.size}`);
  }
}

debugMarkAll();
