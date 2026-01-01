const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTenantRPC() {
  try {
    const { data, error } = await supabase
      .rpc('get_tenant_by_slug', { p_slug: 'default' })
      .single();

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('\nRPC get_tenant_by_slug result:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\nFields returned:');
    console.log(Object.keys(data));
  } catch (err) {
    console.error('Error:', err);
  }
}

checkTenantRPC();
