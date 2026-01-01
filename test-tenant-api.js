const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTenantAPI() {
  try {
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('id, name, slug, admin_email, logo_url, status, subscription_tier, max_users, max_courses, primary_color, default_language, timezone, currency, enabled_features, created_at')
      .limit(1);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('\nTenant Data:');
    console.log(JSON.stringify(tenants[0], null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

testTenantAPI();
