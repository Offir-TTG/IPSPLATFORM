/**
 * Add Revenue Report Translations
 * Adds translations for new revenue report metrics
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  {
    key: 'admin.payments.reports.afterRefunds',
    en: 'After refunds',
    he: 'לאחר החזרים',
  },
  {
    key: 'admin.payments.reports.collectionRate',
    en: 'Collection Rate',
    he: 'שיעור גביה',
  },
];

async function addTranslations() {
  console.log('🌐 Adding Revenue Report Translations...\n');

  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants?.[0]?.id;

  if (!tenantId) {
    console.error('No tenant found');
    process.exit(1);
  }

  console.log(`Tenant ID: ${tenantId}\n`);

  let addedCount = 0;
  let skippedCount = 0;

  for (const translation of translations) {
    for (const lang of ['en', 'he']) {
      const value = translation[lang as 'en' | 'he'];

      // Check if translation already exists
      const { data: existing } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', lang)
        .single();

      if (existing) {
        console.log(`⏭️  Skipped: ${translation.key} (${lang}) - already exists`);
        skippedCount++;
        continue;
      }

      // Insert translation
      const { error } = await supabase
        .from('translations')
        .insert({
          tenant_id: tenantId,
          translation_key: translation.key,
          language_code: lang,
          translation_value: value,
        });

      if (error) {
        console.error(`❌ Error adding ${translation.key} (${lang}):`, error.message);
      } else {
        console.log(`✅ Added: ${translation.key} (${lang}) = "${value}"`);
        addedCount++;
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Added: ${addedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log(`   Total: ${addedCount + skippedCount}`);
}

addTranslations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
