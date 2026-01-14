const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixTranslation() {
  console.log('🔍 Finding tenant...');

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name')
    .limit(1)
    .single();

  if (tenantError || !tenant) {
    console.error('❌ Error finding tenant:', tenantError);
    process.exit(1);
  }

  console.log(`✅ Found tenant: ${tenant.name} (${tenant.id})`);
  console.log('🔧 Fixing chatbot.quickAction.myAssignments Hebrew translation...\n');

  // Update the Hebrew translation with correct text
  const { error } = await supabase
    .from('translations')
    .update({ translation_value: 'המטלות שלי' })
    .eq('tenant_id', tenant.id)
    .eq('translation_key', 'chatbot.quickAction.myAssignments')
    .eq('language_code', 'he');

  if (error) {
    console.error('❌ Error updating translation:', error);
    process.exit(1);
  }

  console.log('✅ Fixed: chatbot.quickAction.myAssignments');
  console.log('   HE: המטלות שלי (was: המ과לות שלי)\n');
  console.log('✨ Done!');
}

fixTranslation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
