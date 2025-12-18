import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const clearTooltip = {
  key: 'lms.attendance.tooltip.clearAll',
  en: 'Clear all',
  he: 'נקה הכל'
};

async function addClearTooltip() {
  try {
    console.log('🚀 Adding clear tooltip translation...\n');

    const { data: tenants } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenants) throw new Error('No tenant found');

    const tenantId = tenants.id;
    console.log(`✓ Found tenant: ${tenantId}\n`);

    // Delete existing if present
    await supabase
      .from('translations')
      .delete()
      .eq('translation_key', clearTooltip.key)
      .eq('tenant_id', tenantId);

    // Insert English
    await supabase.from('translations').insert({
      tenant_id: tenantId,
      translation_key: clearTooltip.key,
      language_code: 'en',
      translation_value: clearTooltip.en,
      context: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Insert Hebrew
    await supabase.from('translations').insert({
      tenant_id: tenantId,
      translation_key: clearTooltip.key,
      language_code: 'he',
      translation_value: clearTooltip.he,
      context: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    console.log(`✓ Added ${clearTooltip.key}`);
    console.log(`  EN: ${clearTooltip.en}`);
    console.log(`  HE: ${clearTooltip.he}`);

    console.log('\n✅ Done! Added clear tooltip translation');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addClearTooltip();
