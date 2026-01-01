import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNavigationData() {
  try {
    // Get first tenant
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);

    if (!tenants || tenants.length === 0) {
      console.log('❌ No tenants found');
      return;
    }

    const tenantId = tenants[0].id;
    console.log(`📦 Checking navigation data for tenant: ${tenantId}\n`);

    // Get all navigation items
    const { data: navItems, error } = await supabase
      .from('navigation_items')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('order', { ascending: true });

    if (error) {
      console.error('❌ Error fetching navigation items:', error);
      return;
    }

    if (!navItems || navItems.length === 0) {
      console.log('❌ No navigation items found in database');
      return;
    }

    console.log(`✅ Found ${navItems.length} navigation items\n`);

    // Group by parent
    const sections = navItems.filter(item => !item.parent_id);
    const items = navItems.filter(item => item.parent_id);

    console.log(`📋 Sections: ${sections.length}`);
    sections.forEach(section => {
      console.log(`  - ${section.translation_key} (order: ${section.order}, active: ${section.is_active})`);
    });

    console.log(`\n📝 Items: ${items.length}`);
    items.forEach(item => {
      console.log(`  - ${item.translation_key} → ${item.href} (order: ${item.order}, active: ${item.is_active})`);
    });

    console.log('\n🔍 Sample API response structure:');
    const sections_with_items = sections.map(section => ({
      id: section.id,
      translation_key: section.translation_key,
      visible: section.is_active,
      order: section.order,
      items: items
        .filter(item => item.parent_id === section.id)
        .map(item => ({
          id: item.id,
          translation_key: item.translation_key,
          icon: item.icon,
          href: item.href,
          visible: item.is_active,
          order: item.order
        }))
    }));

    console.log(JSON.stringify(sections_with_items, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
}

checkNavigationData();
