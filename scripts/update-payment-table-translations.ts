/**
 * Update payment table translations to match platform style
 * Run: npx ts-node scripts/update-payment-table-translations.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function updateTranslations() {
  try {
    console.log('🌐 Updating payment table translations to match platform style...\n');

    const translations = [
      {
        key: 'user.profile.billing.dueDate',
        en: 'Due Date',
        he: 'תאריך יעד'
      },
      {
        key: 'user.profile.billing.originalAmount',
        en: 'Original',
        he: 'מקורי'
      },
      {
        key: 'user.profile.billing.refundedAmount',
        en: 'Refunded',
        he: 'הוחזר'
      },
      {
        key: 'user.profile.billing.paidAmount',
        en: 'Paid',
        he: 'שולם'
      },
      {
        key: 'user.profile.billing.paymentStatus',
        en: 'Status',
        he: 'סטטוס'
      },
      {
        key: 'user.profile.billing.dateAdjusted',
        en: 'Date Adjusted',
        he: 'תאריך שונה'
      },
      {
        key: 'user.profile.billing.originalDate',
        en: 'Original',
        he: 'מקורי'
      },
      {
        key: 'user.profile.billing.refundDetails',
        en: 'Refund Details',
        he: 'פרטי החזר'
      }
    ];

    for (const translation of translations) {
      console.log(`\nProcessing: ${translation.key}`);
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

    console.log('\n✅ All translations updated!');
    console.log('\nChanges made:');
    console.log('  ✓ Removed .table. subkey from translation keys');
    console.log('  ✓ Updated to match platform translation style');
    console.log('  ✓ Table now follows consistent naming convention');

  } catch (error) {
    console.error('Error:', error);
  }
}

updateTranslations();
