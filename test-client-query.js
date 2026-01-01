const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use the ANON key like the browser does
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  // This is what the browser uses!
);

async function testClientQuery() {
  const tenantId = '70d86807-7e7c-49cd-8601-98235444e2ac';

  console.log('\n🌐 Testing with CLIENT/ANON key (same as browser):\n');
  console.log('NOTE: This is unauthenticated, so RLS will block results\n');

  // This is what the browser does - without auth
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('template_category', { ascending: true })
    .order('template_name', { ascending: true });

  if (error) {
    console.error('❌ Error:', error.message);
    console.log('\nThis is expected if you\'re not authenticated.');
    console.log('The browser MUST be authenticated as an admin to see templates.');
    return;
  }

  console.log(`Found ${data?.length || 0} templates\n`);

  if (data && data.length > 0) {
    data.forEach(t => {
      const marker = t.template_key === 'notification.generic' ? ' ⭐' : '';
      console.log(`- ${t.template_key}${marker}`);
    });

    const hasNotification = data.some(t => t.template_key === 'notification.generic');
    console.log(hasNotification ? '\n✅ notification.generic is visible' : '\n❌ notification.generic NOT visible');
  } else {
    console.log('No templates returned (RLS blocking unauthenticated access)');
  }
}

testClientQuery();
