/**
 * Add translations for payment details section in profile billing page
 * Run: npx ts-node scripts/add-payment-details-translations.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function addTranslations() {
  try {
    console.log('🌐 Adding payment details translations...\n');

    const translations = [
      {
        key: 'user.profile.billing.details.refund',
        en: 'Refund Information',
        he: 'פרטי החזר'
      },
      {
        key: 'user.profile.billing.details.refundAmount',
        en: 'Amount',
        he: 'סכום'
      },
      {
        key: 'user.profile.billing.details.refundDate',
        en: 'Date',
        he: 'תאריך'
      },
      {
        key: 'user.profile.billing.details.refundReason',
        en: 'Reason',
        he: 'סיבה'
      },
      {
        key: 'user.profile.billing.details.dateAdjustment',
        en: 'Date Adjustment',
        he: 'שינוי תאריך'
      },
      {
        key: 'user.profile.billing.details.originalDate',
        en: 'Original',
        he: 'מקורי'
      },
      {
        key: 'user.profile.billing.details.adjustedDate',
        en: 'Adjusted',
        he: 'מעודכן'
      },
      {
        key: 'user.profile.billing.details.adjustmentReason',
        en: 'Reason',
        he: 'סיבה'
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

    console.log('\n✅ All translations added!');
    console.log('\nNow users can see detailed payment information including:');
    console.log('  - Refund amount, date, and reason');
    console.log('  - Original vs adjusted due dates');
    console.log('  - Adjustment reasons');

  } catch (error) {
    console.error('Error:', error);
  }
}

addTranslations();
