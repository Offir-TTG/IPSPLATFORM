/**
 * Add Restructure Plan Validation Error Translations
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
    key: 'admin.payments.schedules.errorInstallmentRequired',
    en: 'Please enter a valid number of installments',
    he: 'אנא הזן מספר תשלומים תקין',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.payments.schedules.errorInstallmentMax',
    en: 'Maximum 100 installments allowed',
    he: 'מקסימום 100 תשלומים מותרים',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.payments.schedules.errorReasonRequired',
    en: 'Please provide a reason for restructuring',
    he: 'אנא ספק סיבה לשינוי המבנה',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.payments.schedules.errorReasonTooShort',
    en: 'Reason must be at least 10 characters',
    he: 'הסיבה חייבת להכיל לפחות 10 תווים',
    category: 'admin',
    context: 'admin',
  },
];

async function addTranslations() {
  console.log('Adding restructure validation error translations...\n');

  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants?.[0]?.id;

  if (!tenantId) {
    console.error('No tenant found');
    process.exit(1);
  }

  let added = 0;
  let skipped = 0;

  for (const trans of translations) {
    // Hebrew
    const { data: existingHe } = await supabase
      .from('translations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('language_code', 'he')
      .eq('translation_key', trans.key)
      .maybeSingle();

    if (!existingHe) {
      const { error: heError } = await supabase.from('translations').insert({
        tenant_id: tenantId,
        language_code: 'he',
        translation_key: trans.key,
        translation_value: trans.he,
        category: trans.category,
        context: trans.context,
      });

      if (!heError) {
        console.log(`✓ ${trans.key} (he): ${trans.he}`);
        added++;
      } else if (!heError.message.includes('duplicate')) {
        console.error(`✗ ${trans.key} (he):`, heError.message);
      }
    } else {
      skipped++;
    }

    // English
    const { data: existingEn } = await supabase
      .from('translations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('language_code', 'en')
      .eq('translation_key', trans.key)
      .maybeSingle();

    if (!existingEn) {
      const { error: enError } = await supabase.from('translations').insert({
        tenant_id: tenantId,
        language_code: 'en',
        translation_key: trans.key,
        translation_value: trans.en,
        category: trans.category,
        context: trans.context,
      });

      if (!enError) {
        console.log(`✓ ${trans.key} (en): ${trans.en}`);
        added++;
      } else if (!enError.message.includes('duplicate')) {
        console.error(`✗ ${trans.key} (en):`, enError.message);
      }
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ Added ${added} new translations`);
  if (skipped > 0) {
    console.log(`⏭️  Skipped ${skipped} existing translations`);
  }
}

addTranslations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
