import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Translation {
  key: string;
  en: string;
  he: string;
}

const translations: Translation[] = [
  {
    key: 'enrollment.wizard.complete.congratulations',
    en: '🎉 Congratulations!',
    he: '🎉 מזל טוב!'
  }
];

async function addCongratulationsTranslation() {
  console.log('Starting to add congratulations translation...\n');

  // Get tenant ID
  const { data: tenants, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .limit(1);

  if (tenantError || !tenants || tenants.length === 0) {
    console.error('❌ Error fetching tenant:', tenantError);
    return;
  }

  const tenantId = tenants[0].id;
  console.log(`Using tenant ID: ${tenantId}\n`);

  let totalAdded = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const translation of translations) {
    console.log(`Processing: ${translation.key}`);

    // Check English
    const { data: existingEN } = await supabase
      .from('translations')
      .select('id, translation_value')
      .eq('tenant_id', tenantId)
      .eq('translation_key', translation.key)
      .eq('language_code', 'en')
      .maybeSingle();

    if (!existingEN) {
      const { error } = await supabase
        .from('translations')
        .insert({
          tenant_id: tenantId,
          language_code: 'en',
          translation_key: translation.key,
          translation_value: translation.en,
          category: 'enrollment',
          context: 'user'
        });

      if (error) {
        console.error(`  ❌ Error adding EN:`, error.message);
      } else {
        console.log(`  ✅ Added EN: "${translation.en}"`);
        totalAdded++;
      }
    } else if (existingEN.translation_value !== translation.en) {
      const { error } = await supabase
        .from('translations')
        .update({ translation_value: translation.en, updated_at: new Date().toISOString() })
        .eq('id', existingEN.id);

      if (error) {
        console.error(`  ❌ Error updating EN:`, error.message);
      } else {
        console.log(`  ✅ Updated EN: "${translation.en}"`);
        totalUpdated++;
      }
    } else {
      console.log(`  - Skipped EN (same value)`);
      totalSkipped++;
    }

    // Check Hebrew
    const { data: existingHE } = await supabase
      .from('translations')
      .select('id, translation_value')
      .eq('tenant_id', tenantId)
      .eq('translation_key', translation.key)
      .eq('language_code', 'he')
      .maybeSingle();

    if (!existingHE) {
      const { error } = await supabase
        .from('translations')
        .insert({
          tenant_id: tenantId,
          language_code: 'he',
          translation_key: translation.key,
          translation_value: translation.he,
          category: 'enrollment',
          context: 'user'
        });

      if (error) {
        console.error(`  ❌ Error adding HE:`, error.message);
      } else {
        console.log(`  ✅ Added HE: "${translation.he}"`);
        totalAdded++;
      }
    } else if (existingHE.translation_value !== translation.he) {
      const { error } = await supabase
        .from('translations')
        .update({ translation_value: translation.he, updated_at: new Date().toISOString() })
        .eq('id', existingHE.id);

      if (error) {
        console.error(`  ❌ Error updating HE:`, error.message);
      } else {
        console.log(`  ✅ Updated HE: "${translation.he}"`);
        totalUpdated++;
      }
    } else {
      console.log(`  - Skipped HE (same value)`);
      totalSkipped++;
    }

    console.log(''); // Empty line between translations
  }

  console.log(`Summary:`);
  console.log(`  Added: ${totalAdded}`);
  console.log(`  Updated: ${totalUpdated}`);
  console.log(`  Skipped: ${totalSkipped}`);
  console.log('\n✅ Done!');
}

addCongratulationsTranslation().catch(console.error);
