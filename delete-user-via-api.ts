/**
 * Delete user via Supabase Auth Admin API
 * This bypasses all database constraints by using the Auth API
 *
 * Run with: npx tsx delete-user-via-api.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteUser(email: string) {
  console.log(`🗑️  Attempting to delete user: ${email}`);
  console.log('');

  try {
    // 1. Find the user
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const user = users.users.find(u => u.email === email);

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`✓ Found user: ${user.id}`);
    console.log('');

    // 2. Delete from public.users first
    console.log('Step 1: Deleting from public.users...');
    const { error: publicDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);

    if (publicDeleteError) {
      console.log(`⚠ Warning: Could not delete from public.users: ${publicDeleteError.message}`);
      console.log('Continuing anyway...');
    } else {
      console.log('✓ Deleted from public.users');
    }
    console.log('');

    // 3. Delete from auth.users using Admin API
    console.log('Step 2: Deleting from auth.users...');
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id);

    if (authDeleteError) {
      throw new Error(`Failed to delete from auth.users: ${authDeleteError.message}`);
    }

    console.log('✓ Deleted from auth.users');
    console.log('');
    console.log('🎉 User successfully deleted!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Delete the test user
deleteUser('offir.omer@gmail.com');
