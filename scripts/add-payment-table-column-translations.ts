/**
 * Add translations for enhanced payment table columns
 * Run: npx ts-node scripts/add-payment-table-column-translations.ts
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
    console.log('🌐 Adding payment table column translations...\n');

    const translations = [
      {
        key: 'user.profile.billing.table.type',
        en: 'Type',
        he: 'סוג'
      },
      {
        key: 'user.profile.billing.table.dueOn',
        en: 'Due On',
        he: 'מועד תשלום'
      },
      {
        key: 'user.profile.billing.table.original',
        en: 'Original',
        he: 'מקורי'
      },
      {
        key: 'user.profile.billing.table.refunded',
        en: 'Refunded',
        he: 'הוחזר'
      },
      {
        key: 'user.profile.billing.table.paid',
        en: 'Paid',
        he: 'שולם'
      },
      {
        key: 'user.profile.billing.table.status',
        en: 'Status',
        he: 'סטטוס'
      },
      {
        key: 'user.profile.billing.table.dateAdjusted',
        en: 'Date Adjusted',
        he: 'תאריך שונה'
      },
      {
        key: 'user.profile.billing.table.originalDate',
        en: 'Original',
        he: 'מקורי'
      },
      {
        key: 'user.profile.billing.table.refundDetails',
        en: 'Refund Details',
        he: 'פרטי החזר'
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

    console.log('\n✅ All table column translations added!');
    console.log('\nPayment table now shows:');
    console.log('  - Original payment amount');
    console.log('  - Refunded amount (with hover tooltip for details)');
    console.log('  - Paid amount (net after refund)');
    console.log('  - Date adjustment indicator (icon with tooltip)');
    console.log('  - Status badge (Paid/Partially Refunded/Refunded)');

  } catch (error) {
    console.error('Error:', error);
  }
}

addTranslations();
