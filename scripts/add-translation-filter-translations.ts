import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // Filter dropdown options
  { key: 'admin.translations.filterByCategory', en: 'Filter by Category', he: 'סינון לפי קטגוריה' },
  { key: 'admin.translations.allCategories', en: 'All Categories', he: 'כל הקטגוריות' },
];

async function addTranslations() {
  console.log('Starting to add translation filter translations...');

  // Get the first tenant_id from the database
  const { data: tenants, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single();

  if (tenantError || !tenants) {
    console.error('Error fetching tenant:', tenantError);
    return;
  }

  const tenantId = tenants.id;
  console.log('Using tenant_id:', tenantId);

  for (const translation of translations) {
    console.log(`Processing: ${translation.key}`);

    // Check if English translation exists
    const { data: existingEn } = await supabase
      .from('translations')
      .select('id, translation_value')
      .eq('tenant_id', tenantId)
      .eq('translation_key', translation.key)
      .eq('language_code', 'en')
      .maybeSingle();

    if (existingEn) {
      console.log(`  English translation exists, updating...`);
      const { error: updateError } = await supabase
        .from('translations')
        .update({ translation_value: translation.en })
        .eq('id', existingEn.id);

      if (updateError) {
        console.error(`  Error updating English: ${updateError.message}`);
      } else {
        console.log(`  ✓ English updated`);
      }
    } else {
      console.log(`  Creating English translation...`);
      const { error: insertError } = await supabase
        .from('translations')
        .insert({
          tenant_id: tenantId,
          translation_key: translation.key,
          language_code: 'en',
          translation_value: translation.en,
        });

      if (insertError) {
        console.error(`  Error creating English: ${insertError.message}`);
      } else {
        console.log(`  ✓ English created`);
      }
    }

    // Check if Hebrew translation exists
    const { data: existingHe } = await supabase
      .from('translations')
      .select('id, translation_value')
      .eq('tenant_id', tenantId)
      .eq('translation_key', translation.key)
      .eq('language_code', 'he')
      .maybeSingle();

    if (existingHe) {
      console.log(`  Hebrew translation exists, updating...`);
      const { error: updateError } = await supabase
        .from('translations')
        .update({ translation_value: translation.he })
        .eq('id', existingHe.id);

      if (updateError) {
        console.error(`  Error updating Hebrew: ${updateError.message}`);
      } else {
        console.log(`  ✓ Hebrew updated`);
      }
    } else {
      console.log(`  Creating Hebrew translation...`);
      const { error: insertError } = await supabase
        .from('translations')
        .insert({
          tenant_id: tenantId,
          translation_key: translation.key,
          language_code: 'he',
          translation_value: translation.he,
        });

      if (insertError) {
        console.error(`  Error creating Hebrew: ${insertError.message}`);
      } else {
        console.log(`  ✓ Hebrew created`);
      }
    }
  }

  console.log('\n✅ All translations processed!');
  console.log(`Total translations: ${translations.length}`);
}

addTranslations().catch(console.error);
