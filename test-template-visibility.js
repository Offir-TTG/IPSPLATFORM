const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTemplateVisibility() {
  console.log('\n🧪 Testing Email Template Visibility\n');
  console.log('This simulates what the templates page does...\n');

  // Get tenant ID (using the same one from previous tests)
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name')
    .limit(1)
    .single();

  if (!tenants) {
    console.log('❌ No tenant found');
    return;
  }

  const tenantId = tenants.id;
  console.log(`📋 Testing for tenant: ${tenants.name} (${tenantId})\n`);

  // Simulate the exact query from the templates page
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('template_category', { ascending: true })
    .order('template_name', { ascending: true });

  if (error) {
    console.log('❌ Error:', error);
    return;
  }

  console.log(`✅ Query returned ${data.length} templates\n`);
  console.log('Templates that WILL appear on the page:\n');

  // Group by category like the UI does
  const byCategory = {};
  data.forEach(t => {
    if (!byCategory[t.template_category]) {
      byCategory[t.template_category] = [];
    }
    byCategory[t.template_category].push(t);
  });

  Object.entries(byCategory).forEach(([category, templates]) => {
    console.log(`\n📁 ${category.toUpperCase()}:`);
    templates.forEach(t => {
      const marker = t.template_key === 'notification.generic' ? ' ⭐ NOTIFICATION TEMPLATE' : '';
      console.log(`   ${t.template_key}${marker}`);
      console.log(`      Name: ${t.template_name}`);
      console.log(`      Category: ${t.template_category}`);
      console.log(`      Active: ${t.is_active}`);
      console.log(`      System: ${t.is_system}`);
    });
  });

  console.log('\n' + '='.repeat(60));

  const hasNotification = data.some(t => t.template_key === 'notification.generic');
  if (hasNotification) {
    console.log('✅ notification.generic WILL APPEAR in the templates page');
    console.log('\nIf you don\'t see it in the browser:');
    console.log('  1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)');
    console.log('  2. Check browser console for JavaScript errors');
    console.log('  3. Clear localStorage: localStorage.clear()');
  } else {
    console.log('❌ notification.generic is NOT in the query results');
    console.log('This means there\'s a database issue');
  }
  console.log('='.repeat(60) + '\n');
}

testTemplateVisibility();
