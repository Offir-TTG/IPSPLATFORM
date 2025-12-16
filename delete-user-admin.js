/**
 * Delete user using Supabase Admin API
 * Usage: node delete-user-admin.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteUser(userId) {
  console.log(`🗑️  Attempting to delete user: ${userId}`);
  console.log('');

  const { data, error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    console.error('❌ Error deleting user:', error);
    console.error('');
    console.error('Error details:');
    console.error('  Code:', error.code);
    console.error('  Message:', error.message);
    console.error('  Status:', error.status);
    console.error('  Full error:', JSON.stringify(error, null, 2));
    return { success: false, error };
  }

  console.log('✅ User deleted successfully!');
  console.log('Response:', data);
  return { success: true, data };
}

// Delete the problematic user
deleteUser('d7cb0921-4af6-4641-bdbd-c14c59eba9dc')
  .then(result => {
    if (result.success) {
      console.log('');
      console.log('🎉 Done!');
      process.exit(0);
    } else {
      console.log('');
      console.log('💡 User could not be deleted via API.');
      console.log('This is a Supabase-level restriction that cannot be bypassed.');
      console.log('');
      console.log('Options:');
      console.log('1. Delete manually from Supabase Dashboard');
      console.log('2. Use email alias for testing: offir.omer+test1@gmail.com');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
