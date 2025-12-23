/**
 * Add System Category Translation
 * Adds translations for the "system" email template category
 *
 * Usage: npx tsx scripts/add-system-category-translation.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // System category translation
  {
    key: 'emails.category.system',
    en: 'System',
    he: 'מערכת'
  },
];

async function addTranslations() {
  console.log('🌍 Adding system category translation...\n');

  // Get all tenants
  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('id, name');

  if (tenantsError) {
    console.error('Error fetching tenants:', tenantsError);
    process.exit(1);
  }

  if (!tenants || tenants.length === 0) {
    console.log('⚠️  No tenants found');
    process.exit(0);
  }

  console.log(`Found ${tenants.length} tenant(s)\n`);

  let totalAdded = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const tenant of tenants) {
    console.log(`\n📧 Processing tenant: ${tenant.name} (${tenant.id})`);
    console.log('='.repeat(60));

    for (const translation of translations) {
      // Check English
      const { data: existingEn } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('language_code', 'en')
        .eq('translation_key', translation.key)
        .single();

      if (!existingEn) {
        const { error: enError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenant.id,
            language_code: 'en',
            translation_key: translation.key,
            translation_value: translation.en,
            context: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (enError) {
          console.error(`❌ Error adding EN translation for ${translation.key}:`, enError);
          totalErrors++;
        } else {
          console.log(`✅ Added EN: ${translation.key}`);
          totalAdded++;
        }
      } else {
        console.log(`⏭️  Skipped EN: ${translation.key} (already exists)`);
        totalSkipped++;
      }

      // Check Hebrew
      const { data: existingHe } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('language_code', 'he')
        .eq('translation_key', translation.key)
        .single();

      if (!existingHe) {
        const { error: heError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenant.id,
            language_code: 'he',
            translation_key: translation.key,
            translation_value: translation.he,
            context: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (heError) {
          console.error(`❌ Error adding HE translation for ${translation.key}:`, heError);
          totalErrors++;
        } else {
          console.log(`✅ Added HE: ${translation.key}`);
          totalAdded++;
        }
      } else {
        console.log(`⏭️  Skipped HE: ${translation.key} (already exists)`);
        totalSkipped++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✨ Translation seeding complete!');
  console.log(`   ✅ Added: ${totalAdded} translations`);
  console.log(`   ⏭️  Skipped: ${totalSkipped} translations`);
  console.log(`   ❌ Errors: ${totalErrors}`);
  console.log('');
}

// Run the script
addTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
