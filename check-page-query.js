const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);

async function checkPageQuery() {
  const tenantId = '70d86807-7e7c-49cd-8601-98235444e2ac';

  console.log('\n📊 Exact query from templates page:\n');

  // This is the EXACT query from line 88-93 of the templates page
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('template_category', { ascending: true })
    .order('template_name', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} templates:\n`);

  data.forEach((t, idx) => {
    const marker = t.template_key === 'notification.generic' ? ' ⭐⭐⭐' : '';
    console.log(`${idx + 1}. ${t.template_key}${marker}`);
    console.log(`   Name: ${t.template_name}`);
    console.log(`   Category: ${t.template_category}`);
    console.log(`   Is Active: ${t.is_active}`);
    console.log(`   Is System: ${t.is_system}`);
    console.log('');
  });

  const hasNotification = data.some(t => t.template_key === 'notification.generic');
  console.log(hasNotification ? '✅ notification.generic IS in the results' : '❌ notification.generic NOT in results');
  console.log('\nIf it\'s in the results but not showing in the browser,');
  console.log('check the browser console for JavaScript errors.\n');
}

checkPageQuery();
