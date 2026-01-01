const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const translations = [
  // English - lessons
  { lang: 'en', key: 'user.dashboard.stats.lessons', value: 'lessons', ctx: 'user' },

  // Hebrew - lessons
  { lang: 'he', key: 'user.dashboard.stats.lessons', value: 'שיעורים', ctx: 'user' },
];

async function addTranslations() {
  console.log('Adding lessons translation...\n');

  try {
    // Get tenant ID
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .order('created_at')
      .limit(1);

    if (tenantError || !tenants || tenants.length === 0) {
      throw new Error('No tenant found');
    }

    const tenantId = tenants[0].id;
    console.log('Using tenant:', tenantId);

    // Delete existing translations with this key first
    console.log('Cleaning up existing translations...');
    await supabase
      .from('translations')
      .delete()
      .eq('translation_key', 'user.dashboard.stats.lessons');

    console.log('✓ Cleaned up existing translations\n');

    console.log(`\nInserting ${translations.length} translations...\n`);

    const records = translations.map(t => ({
      language_code: t.lang,
      translation_key: t.key,
      translation_value: t.value,
      context: t.ctx,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from('translations')
      .insert(records);

    if (insertError) {
      console.error('Error inserting translations:', insertError);
      throw insertError;
    }

    console.log('✅ All lessons translations added successfully!');
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

addTranslations();
