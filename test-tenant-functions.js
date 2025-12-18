const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFunctions() {
  console.log('Testing tenant functions...\n');

  // Test get_current_tenant_id function
  const { data, error } = await supabase.rpc('get_current_tenant_id');
  
  if (error) {
    console.log('❌ get_current_tenant_id error:', error);
  } else {
    console.log('✅ get_current_tenant_id works, returned:', data);
  }

  // Get a test tenant
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id')
    .eq('status', 'active')
    .limit(1);

  if (tenants && tenants.length > 0) {
    const testTenantId = tenants[0].id;
    console.log('\nTesting with tenant:', testTenantId);

    // Test set_current_tenant function
    const { error: setError } = await supabase.rpc('set_current_tenant', {
      p_tenant_id: testTenantId
    });

    if (setError) {
      console.log('❌ set_current_tenant error:', setError);
    } else {
      console.log('✅ set_current_tenant works');
    }
  }
}

testFunctions();
