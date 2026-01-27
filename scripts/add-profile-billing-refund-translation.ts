/**
 * Add refund display translation for profile billing page
 * Run: npx ts-node scripts/add-profile-billing-refund-translation.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function addTranslation() {
  try {
    console.log('🌐 Adding refund display translation for profile billing page...\n');

    const translations = [
      {
        key: 'user.profile.billing.refunded',
        en: 'Refunded',
        he: 'הוחזר'
      }
    ];

    for (const translation of translations) {
      console.log(`\nAdding: ${translation.key}`);
      console.log(`  EN: ${translation.en}`);
      console.log(`  HE: ${translation.he}`);

      // Check if exists
      const { data: existing } = await supabase
        .from('translations')
        .select('translation_key')
        .eq('translation_key', translation.key)
        .eq('language_code', 'en')
        .single();

      if (existing) {
        console.log(`  ⚠️  Key already exists, skipping`);
        continue;
      }

      // Insert English
      const { error: enError } = await supabase
        .from('translations')
        .insert({
          translation_key: translation.key,
          language_code: 'en',
          translation_value: translation.en,
          context: 'user'
        });

      if (enError) {
        console.error(`  ❌ Error inserting EN:`, enError);
        continue;
      }

      // Insert Hebrew
      const { error: heError } = await supabase
        .from('translations')
        .insert({
          translation_key: translation.key,
          language_code: 'he',
          translation_value: translation.he,
          context: 'user'
        });

      if (heError) {
        console.error(`  ❌ Error inserting HE:`, heError);
        continue;
      }

      console.log(`  ✅ Added successfully`);
    }

    console.log('\n✅ Translation added!');
    console.log('\n📝 Updated component: src/app/(user)/profile/page.tsx');
    console.log('   - Added refunded_amount display in schedule list');
    console.log('   - Shows refund amount below payment amount when present');
    console.log('\n💡 Invoices section already shows refund amounts');

  } catch (error) {
    console.error('Error:', error);
  }
}

addTranslation();
