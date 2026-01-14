/**
 * Add Email Template Name Translations
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Translation {
  key: string;
  en: string;
  he: string;
  category: string;
}

const translations: Translation[] = [
  // Email Template Names
  { key: 'email.template.enrollment_invitation', en: 'Enrollment Invitation', he: 'הזמנה להרשמה', category: 'emails' },
  { key: 'email.template.generic_notification', en: 'Generic Notification', he: 'התראה כללית', category: 'emails' },
  { key: 'email.template.password_reset', en: 'Password Reset', he: 'איפוס סיסמה', category: 'emails' },
  { key: 'email.template.welcome', en: 'Welcome Email', he: 'דוא"ל ברוכים הבאים', category: 'emails' },
  { key: 'email.template.payment_receipt', en: 'Payment Receipt', he: 'קבלת תשלום', category: 'emails' },
  { key: 'email.template.enrollment_confirmation', en: 'Enrollment Confirmation', he: 'אישור הרשמה', category: 'emails' },
];

async function addTranslations() {
  console.log('Starting to add email template translations...\n');

  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  if (!tenants || tenants.length === 0) {
    console.error('❌ No tenant found');
    return;
  }

  const tenantId = tenants[0].id;
  console.log(`Using tenant ID: ${tenantId}\n`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const translation of translations) {
    try {
      console.log(`Processing: ${translation.key}`);

      // Check English
      const { data: existingEN } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', 'en')
        .maybeSingle();

      if (!existingEN) {
        const { error } = await supabase.from('translations').insert({
          tenant_id: tenantId,
          language_code: 'en',
          translation_key: translation.key,
          translation_value: translation.en,
          category: translation.category,
          context: 'admin'
        });

        if (error) {
          console.error(`  ❌ Error adding EN:`, error.message);
          errorCount++;
        } else {
          console.log(`  ✅ Added EN: "${translation.en}"`);
          successCount++;
        }
      } else {
        console.log(`  ⏭️  Skipped EN (exists)`);
        skippedCount++;
      }

      // Check Hebrew
      const { data: existingHE } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', 'he')
        .maybeSingle();

      if (!existingHE) {
        const { error } = await supabase.from('translations').insert({
          tenant_id: tenantId,
          language_code: 'he',
          translation_key: translation.key,
          translation_value: translation.he,
          category: translation.category,
          context: 'admin'
        });

        if (error) {
          console.error(`  ❌ Error adding HE:`, error.message);
          errorCount++;
        } else {
          console.log(`  ✅ Added HE: "${translation.he}"`);
          successCount++;
        }
      } else {
        console.log(`  ⏭️  Skipped HE (exists)`);
        skippedCount++;
      }

      console.log('');

    } catch (error) {
      console.error(`❌ Unexpected error for ${translation.key}:`, error);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('Summary:');
  console.log(`✅ Successfully added: ${successCount}`);
  console.log(`⏭️  Skipped (existing): ${skippedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total processed: ${translations.length * 2} (EN + HE)`);
  console.log('='.repeat(50));
}

addTranslations()
  .then(() => {
    console.log('\n✅ Translation addition complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
