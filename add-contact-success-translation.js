const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  {
    key: 'contact.success.sendAnother',
    en: 'Send Another Message',
    he: 'שלח הודעה נוספת'
  },
];

async function addTranslations() {
  console.log('🌐 Adding contact success translation...\n');

  const { data: tenants, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single();

  if (tenantError || !tenants) {
    console.error('❌ Error fetching tenant:', tenantError);
    process.exit(1);
  }

  const tenantId = tenants.id;
  console.log(`Using tenant ID: ${tenantId}\n`);

  let successCount = 0;

  for (const translation of translations) {
    try {
      const { data: existingEn } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', 'en')
        .eq('context', 'user');

      if (existingEn && existingEn.length > 0) {
        console.log(`- Skipped EN (exists): ${translation.key}`);
      } else {
        const { error: enError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: translation.key,
            translation_value: translation.en,
            language_code: 'en',
            context: 'user',
          });

        if (enError) throw enError;
        console.log(`✓ Added EN: ${translation.key}`);
        successCount++;
      }

      const { data: existingHe } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', 'he')
        .eq('context', 'user');

      if (existingHe && existingHe.length > 0) {
        console.log(`- Skipped HE (exists): ${translation.key}`);
      } else {
        const { error: heError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: translation.key,
            translation_value: translation.he,
            language_code: 'he',
            context: 'user',
          });

        if (heError) throw heError;
        console.log(`✓ Added HE: ${translation.key}`);
        successCount++;
      }

      console.log('');
    } catch (err) {
      console.error(`✗ Error adding ${translation.key}:`, err.message);
    }
  }

  console.log('='.repeat(50));
  console.log(`Successfully added: ${successCount}`);
  console.log('='.repeat(50));
}

addTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
