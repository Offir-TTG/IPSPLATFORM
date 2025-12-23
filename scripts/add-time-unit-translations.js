const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const translations = [
  { key: 'common.time.hourShort', en: 'h', he: 'ש' },
  { key: 'common.time.minuteShort', en: 'm', he: 'ד' },
  { key: 'common.time.dayShort', en: 'd', he: 'י' },
  { key: 'common.time.min', en: 'min', he: 'דק' },
];

async function addTranslations() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      return;
    }

    const tenantId = tenants[0].id;
    let addedCount = 0;
    let updatedCount = 0;

    console.log(`Processing ${translations.length} translation keys...\n`);

    for (const translation of translations) {
      const { key, en, he } = translation;

      for (const context of ['user', 'admin']) {
        const { data: existingHe } = await supabase.from('translations').select('id').eq('tenant_id', tenantId).eq('translation_key', key).eq('language_code', 'he').eq('context', context);
        if (existingHe && existingHe.length > 0) {
          const { error: updateError } = await supabase.from('translations').update({ translation_value: he }).eq('tenant_id', tenantId).eq('translation_key', key).eq('language_code', 'he').eq('context', context);
          if (!updateError) { updatedCount++; console.log(`✅ Updated HE (${context}): ${key}`); }
        } else {
          const { error: insertError } = await supabase.from('translations').insert({ tenant_id: tenantId, translation_key: key, translation_value: he, language_code: 'he', context });
          if (!insertError) { addedCount++; console.log(`➕ Added HE (${context}): ${key}`); }
        }

        const { data: existingEn } = await supabase.from('translations').select('id').eq('tenant_id', tenantId).eq('translation_key', key).eq('language_code', 'en').eq('context', context);
        if (existingEn && existingEn.length > 0) {
          const { error: updateError } = await supabase.from('translations').update({ translation_value: en }).eq('tenant_id', tenantId).eq('translation_key', key).eq('language_code', 'en').eq('context', context);
          if (!updateError) { updatedCount++; console.log(`✅ Updated EN (${context}): ${key}`); }
        } else {
          const { error: insertError } = await supabase.from('translations').insert({ tenant_id: tenantId, translation_key: key, translation_value: en, language_code: 'en', context });
          if (!insertError) { addedCount++; console.log(`➕ Added EN (${context}): ${key}`); }
        }
      }
    }

    console.log(`\n✅ Completed!`);
    console.log(`Total added: ${addedCount}`);
    console.log(`Total updated: ${updatedCount}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

addTranslations();
