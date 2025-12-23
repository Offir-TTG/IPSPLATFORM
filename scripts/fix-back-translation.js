const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTranslations() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      return;
    }

    const tenantId = tenants[0].id;

    // Check if common.back exists with correct context
    const { data: existing } = await supabase
      .from('translations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('translation_key', 'common.back')
      .eq('language_code', 'he');

    console.log('Existing common.back translations:', existing);

    // Make sure it exists in BOTH user and admin contexts
    for (const context of ['user', 'admin']) {
      const { data: contextCheck } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', 'common.back')
        .eq('language_code', 'he')
        .eq('context', context);

      if (!contextCheck || contextCheck.length === 0) {
        const { error } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: 'common.back',
            translation_value: 'חזור',
            language_code: 'he',
            context: context
          });
        
        if (!error) {
          console.log(`✅ Added common.back for context: ${context}`);
        }
      } else {
        console.log(`✓ common.back already exists for context: ${context}`);
      }

      // English too
      const { data: contextCheckEn } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', 'common.back')
        .eq('language_code', 'en')
        .eq('context', context);

      if (!contextCheckEn || contextCheckEn.length === 0) {
        const { error } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: 'common.back',
            translation_value: 'Back',
            language_code: 'en',
            context: context
          });
        
        if (!error) {
          console.log(`✅ Added common.back (EN) for context: ${context}`);
        }
      }
    }

    console.log('\n✅ Translation check completed!');
  } catch (error) {
    console.error('Error:', error);
  }
}

fixTranslations();
