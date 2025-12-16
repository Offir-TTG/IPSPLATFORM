/**
 * Complete user deletion script for development/testing
 * This uses the Supabase Admin API to properly delete users
 *
 * Usage: npx tsx delete-user-completely.ts <email>
 * Example: npx tsx delete-user-completely.ts offir.omer@gmail.com
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: npx tsx delete-user-completely.ts <email>');
  console.error('Example: npx tsx delete-user-completely.ts test@example.com');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteUserCompletely(email: string) {
  console.log(`🗑️  Deleting user: ${email}`);
  console.log('');

  try {
    // Step 1: Find the user
    console.log('Step 1: Finding user...');
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const user = authUsers.users.find(u => u.email === email);

    if (!user) {
      console.log('✅ User not found - nothing to delete');
      return;
    }

    const userId = user.id;
    console.log(`✓ Found user: ${userId}`);
    console.log('');

    // Step 2: Delete from public schema tables (manually, to avoid FK issues)
    console.log('Step 2: Deleting from public schema...');

    // Delete payment schedules (child of enrollments)
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId);

    if (enrollments && enrollments.length > 0) {
      const enrollmentIds = enrollments.map(e => e.id);

      const { error: schedulesError } = await supabase
        .from('payment_schedules')
        .delete()
        .in('enrollment_id', enrollmentIds);

      if (schedulesError) {
        console.log(`⚠ payment_schedules: ${schedulesError.message}`);
      } else {
        console.log('✓ Deleted payment_schedules');
      }

      const { error: paymentsError } = await supabase
        .from('payments')
        .delete()
        .in('enrollment_id', enrollmentIds);

      if (paymentsError) {
        console.log(`⚠ payments: ${paymentsError.message}`);
      } else {
        console.log('✓ Deleted payments');
      }
    }

    // Delete enrollments
    const { error: enrollmentsError } = await supabase
      .from('enrollments')
      .delete()
      .eq('user_id', userId);

    if (enrollmentsError) {
      console.log(`⚠ enrollments: ${enrollmentsError.message}`);
    } else {
      console.log('✓ Deleted enrollments');
    }

    // Delete user programs
    const { error: programsError } = await supabase
      .from('user_programs')
      .delete()
      .eq('user_id', userId);

    if (programsError && !programsError.message.includes('relation "user_programs" does not exist')) {
      console.log(`⚠ user_programs: ${programsError.message}`);
    } else {
      console.log('✓ Deleted user_programs');
    }

    // Delete from public.users
    const { error: publicUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (publicUserError) {
      console.log(`⚠ public.users: ${publicUserError.message}`);
    } else {
      console.log('✓ Deleted from public.users');
    }

    console.log('');

    // Step 3: Delete from auth using Admin API
    console.log('Step 3: Deleting from auth.users...');

    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error(`❌ Failed to delete from auth.users: ${authDeleteError.message}`);
      console.log('');
      console.log('💡 The user may have auth-level constraints. Try manual deletion:');
      console.log(`   1. Go to Supabase Dashboard > Authentication > Users`);
      console.log(`   2. Find user: ${email}`);
      console.log(`   3. Click "..." menu > Delete user`);
      process.exit(1);
    }

    console.log('✓ Deleted from auth.users');
    console.log('');
    console.log('🎉 User successfully deleted!');
    console.log('');

    // Verify deletion
    console.log('Verification:');
    const { data: verifyAuth } = await supabase.auth.admin.listUsers();
    const stillExists = verifyAuth.users.find(u => u.email === email);

    if (stillExists) {
      console.log('❌ User still exists in auth.users');
    } else {
      console.log('✅ User completely removed from database');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the deletion
deleteUserCompletely(email);
