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
  { key: 'admin.users.setPassword.successTitle', en: 'Password Updated', he: 'הסיסמה עודכנה', context: 'admin' },
];

async function addTranslations() {
  console.log('🌐 Adding success password translations...\n');

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
  let skipCount = 0;

  for (const translation of translations) {
    try {
      // Check English
      const { data: existingEn } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', 'en')
        .eq('context', translation.context);

      if (existingEn && existingEn.length > 0) {
        skipCount++;
      } else {
        const { error: enError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: translation.key,
            translation_value: translation.en,
            language_code: 'en',
            context: translation.context,
          });

        if (enError) throw enError;
        successCount++;
      }

      // Check Hebrew
      const { data: existingHe } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', 'he')
        .eq('context', translation.context);

      if (existingHe && existingHe.length > 0) {
        skipCount++;
      } else {
        const { error: heError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: translation.key,
            translation_value: translation.he,
            language_code: 'he',
            context: translation.context,
          });

        if (heError) throw heError;
        successCount++;
      }
    } catch (err) {
      console.error(`✗ Error adding ${translation.key}:`, err.message);
    }
  }

  console.log('='.repeat(50));
  console.log(`✅ Successfully added: ${successCount}`);
  console.log(`⏭️  Skipped (already exist): ${skipCount}`);
  console.log('='.repeat(50));
}

addTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
