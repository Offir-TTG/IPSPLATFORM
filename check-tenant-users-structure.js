require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStructure() {
  const { data: tenantUsers, error } = await supabase
    .from('tenant_users')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error:', error);
  } else if (tenantUsers && tenantUsers.length > 0) {
    console.log('tenant_users structure:');
    console.log(JSON.stringify(tenantUsers[0], null, 2));
  }
}

checkStructure();
