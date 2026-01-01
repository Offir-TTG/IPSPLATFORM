import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const translations = [
  { key: 'user.dashboard.stats.hours', en: 'h', he: 'ש' }, // ש = שעות (hours)
  { key: 'user.dashboard.stats.minutes', en: 'm', he: 'ד' }, // ד = דקות (minutes)
];

async function addTimeUnitTranslations() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id, name').limit(1);

    if (!tenants || tenants.length === 0) {
      console.log('No tenant found');
      return;
    }

    const tenant = tenants[0];
    console.log(`\nAdding time unit translations for tenant: ${tenant.name} (${tenant.id})\n`);

    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (const t of translations) {
      // Insert Hebrew
      const heResult = await supabase
        .from('translations')
        .insert({
          tenant_id: tenant.id,
          translation_key: t.key,
          translation_value: t.he,
          language_code: 'he',
          context: 'user'
        });

      if (heResult.error) {
        if (heResult.error.message.includes('duplicate')) {
          duplicateCount++;
        } else {
          console.error(`❌ Error inserting HE ${t.key}:`, heResult.error.message);
          errorCount++;
        }
      } else {
        console.log(`✓ Added HE: ${t.key} = ${t.he}`);
        successCount++;
      }

      // Insert English
      const enResult = await supabase
        .from('translations')
        .insert({
          tenant_id: tenant.id,
          translation_key: t.key,
          translation_value: t.en,
          language_code: 'en',
          context: 'user'
        });

      if (enResult.error) {
        if (enResult.error.message.includes('duplicate')) {
          duplicateCount++;
        } else {
          console.error(`❌ Error inserting EN ${t.key}:`, enResult.error.message);
          errorCount++;
        }
      } else {
        console.log(`✓ Added EN: ${t.key} = ${t.en}`);
        successCount++;
      }
    }

    console.log(`\n✅ Done!`);
    console.log(`Successfully inserted: ${successCount}`);
    console.log(`Duplicates (already exist): ${duplicateCount}`);
    console.log(`Errors: ${errorCount}`);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

addTimeUnitTranslations();
