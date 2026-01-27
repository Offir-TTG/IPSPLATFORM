/**
 * Force Update Report Translations
 * Deletes and re-inserts translations to bust cache
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

async function forceUpdate() {
  console.log('🔄 Force Updating Report Translations...\n');

  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants?.[0]?.id;

  if (!tenantId) {
    console.error('No tenant found');
    process.exit(1);
  }

  console.log(`Tenant ID: ${tenantId}\n`);

  for (const translation of translations) {
    // Delete existing translations
    const { error: deleteError } = await supabase
      .from('translations')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('translation_key', translation.key);

    if (deleteError) {
      console.error(`Error deleting ${translation.key}:`, deleteError.message);
      continue;
    }

    console.log(`🗑️  Deleted: ${translation.key}`);

    // Re-insert translations
    for (const lang of ['en', 'he']) {
      const value = translation[lang as 'en' | 'he'];

      const { error: insertError } = await supabase
        .from('translations')
        .insert({
          tenant_id: tenantId,
          translation_key: translation.key,
          language_code: lang,
          translation_value: value,
        });

      if (insertError) {
        console.error(`❌ Error inserting ${translation.key} (${lang}):`, insertError.message);
      } else {
        console.log(`✅ Inserted: ${translation.key} (${lang}) = "${value}"`);
      }
    }

    console.log('');
  }

  console.log('✅ Force update complete!');
  console.log('\nPlease:');
  console.log('1. Restart your Next.js dev server');
  console.log('2. Hard refresh your browser (Ctrl+Shift+R)');
}

forceUpdate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
