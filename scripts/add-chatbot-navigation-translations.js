const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  {
    key: 'chatbot.response.foundNavigation',
    context: 'user',
    en: 'I found these sections for you:',
    he: 'מצאתי את הקטעים האלה עבורך:'
  }
];

async function addTranslations() {
  console.log('🔍 Finding tenant...');

  // Get the first tenant
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
  console.log(`📝 Adding ${translations.length} navigation translations...\n`);

  let added = 0;
  let skipped = 0;

  for (const translation of translations) {
    // Check if translation already exists
    const { data: existing } = await supabase
      .from('translations')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('translation_key', translation.key)
      .eq('language_code', 'en')
      .eq('context', translation.context);

    if (existing && existing.length > 0) {
      console.log(`⏭️  Skipping existing: ${translation.key}`);
      skipped++;
      continue;
    }

    // Add English translation
    const { error: enError } = await supabase
      .from('translations')
      .insert({
        tenant_id: tenant.id,
        translation_key: translation.key,
        language_code: 'en',
        translation_value: translation.en,
        context: translation.context,
      });

    if (enError) {
      console.error(`❌ Error adding EN translation for ${translation.key}:`, enError);
      continue;
    }

    // Add Hebrew translation
    const { error: heError } = await supabase
      .from('translations')
      .insert({
        tenant_id: tenant.id,
        translation_key: translation.key,
        language_code: 'he',
        translation_value: translation.he,
        context: translation.context,
      });

    if (heError) {
      console.error(`❌ Error adding HE translation for ${translation.key}:`, heError);
      continue;
    }

    console.log(`✅ Added: ${translation.key}`);
    console.log(`   EN: ${translation.en}`);
    console.log(`   HE: ${translation.he}\n`);
    added += 2;
  }

  console.log(`\n✨ Done!`);
  console.log(`📊 Added: ${added} translations`);
  console.log(`⏭️  Skipped: ${skipped} existing translations`);
}

addTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
