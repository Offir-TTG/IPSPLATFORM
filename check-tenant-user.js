const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const userId = 'a018e2ea-ac21-4564-8f43-39e7d58e9bb2';
  const tenantId = '70d86807-7e7c-49cd-8601-98235444e2ac';
  
  console.log('Checking tenant_users for user:', userId);
  
  const { data: tenantUsers, error } = await supabase
    .from('tenant_users')
    .select('*')
    .eq('user_id', userId);
  
  console.log('Tenant Users records:', tenantUsers);
  
  if (tenantUsers && tenantUsers.length === 0) {
    console.log('\n❌ User has NO tenant_users records!');
    console.log('Adding user to tenant...');
    
    const { data: inserted, error: insertError } = await supabase
      .from('tenant_users')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        role: 'admin'
      })
      .select();
    
    if (insertError) {
      console.error('Error adding user to tenant:', insertError);
    } else {
      console.log('✅ User added to tenant successfully!', inserted);
    }
  } else {
    console.log('\n✅ User already has tenant_users records');
  }
})();
