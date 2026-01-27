/**
 * Add refund translations for admin payment plan details dialog
 * Run: npx ts-node scripts/add-admin-payment-refund-translations.ts
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
    console.log('🌐 Adding refund translations for admin payment plan details dialog...\n');

    const translations = [
      {
        key: 'admin.enrollments.paymentPlanDetails.status.partially_refunded',
        en: 'Partially Refunded',
        he: 'הוחזר חלקית'
      },
      {
        key: 'admin.enrollments.paymentPlanDetails.status.refunded',
        en: 'Refunded',
        he: 'הוחזר'
      },
      {
        key: 'admin.enrollments.paymentPlanDetails.refunded',
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
          context: 'admin'
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
          context: 'admin'
        });

      if (heError) {
        console.error(`  ❌ Error inserting HE:`, heError);
        continue;
      }

      console.log(`  ✅ Added successfully`);
    }

    console.log('\n✅ Translations added!');
    console.log('\n📝 Updated component: src/components/admin/PaymentPlanDetailsDialog.tsx');
    console.log('   - Added refund status badges');
    console.log('   - Shows refund amount below payment amount when present');
    console.log('   - Now fetches from /api/enrollments/{id}/payment with enriched refund data');

  } catch (error) {
    console.error('Error:', error);
  }
}

addTranslations();
