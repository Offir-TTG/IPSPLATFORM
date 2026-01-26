/**
 * Add wizard payment plan selection translations
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Translation {
  key: string;
  en: string;
  he: string;
  category: string;
  context: string;
}

const translations: Translation[] = [
  {
    key: 'enrollment.wizard.payment.selectPlan',
    en: 'Select your preferred payment plan to continue.',
    he: 'בחר את תוכנית התשלום המועדפת עליך כדי להמשיך.',
    category: 'enrollment',
    context: 'user'
  },
  {
    key: 'enrollment.wizard.payment.deposit',
    en: 'Initial Deposit',
    he: 'מקדמה ראשונית',
    category: 'enrollment',
    context: 'user'
  },
  {
    key: 'enrollment.wizard.payment.installments',
    en: 'Installments',
    he: 'תשלומים',
    category: 'enrollment',
    context: 'user'
  },
  {
    key: 'enrollment.wizard.payment.selecting',
    en: 'Selecting...',
    he: 'בוחר...',
    category: 'enrollment',
    context: 'user'
  },
  {
    key: 'enrollment.wizard.payment.oneTimePayment',
    en: 'Single Payment',
    he: 'תשלום חד-פעמי',
    category: 'enrollment',
    context: 'user'
  },
  {
    key: 'enrollment.wizard.payment.recurringPayments',
    en: 'Recurring Payments',
    he: 'תשלומים חוזרים',
    category: 'enrollment',
    context: 'user'
  },
  {
    key: 'enrollment.wizard.payment.subscriptionPrice',
    en: 'Subscription',
    he: 'מנוי',
    category: 'enrollment',
    context: 'user'
  },
  {
    key: 'enrollment.wizard.payment.trialDays',
    en: 'days free trial',
    he: 'ימי ניסיון חינם',
    category: 'enrollment',
    context: 'user'
  },
  {
    key: 'enrollment.wizard.payment.subscriptionRenews',
    en: 'Automatically renews until cancelled',
    he: 'מתחדש אוטומטית עד לביטול',
    category: 'enrollment',
    context: 'user'
  },
  {
    key: 'enrollment.wizard.payment.selectPlanError',
    en: 'Please select a payment plan',
    he: 'אנא בחר תוכנית תשלום',
    category: 'enrollment',
    context: 'user'
  },
  {
    key: 'enrollment.wizard.payment.selectPlanFailed',
    en: 'Failed to select payment plan',
    he: 'נכשל לבחור תוכנית תשלום',
    category: 'enrollment',
    context: 'user'
  },
];

async function addTranslations() {
  console.log('Adding wizard payment plan translations...\n');

  // Get the default tenant ID
  const { data: tenants, error: tenantError} = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single();

  if (tenantError || !tenants) {
    console.error('Error fetching tenant:', tenantError?.message);
    process.exit(1);
  }

  const tenantId = tenants.id;
  console.log(`Using tenant ID: ${tenantId}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const translation of translations) {
    console.log(`Processing: ${translation.key}`);

    // Add English translation
    const { error: enError } = await supabase.rpc('upsert_translation', {
      p_language_code: 'en',
      p_translation_key: translation.key,
      p_translation_value: translation.en,
      p_category: translation.category,
      p_context: translation.context,
      p_tenant_id: tenantId
    });

    if (enError) {
      console.error(`  ❌ Error adding English translation:`, enError.message);
      errorCount++;
    } else {
      console.log(`  ✅ Added English: "${translation.en}"`);
      successCount++;
    }

    // Add Hebrew translation
    const { error: heError } = await supabase.rpc('upsert_translation', {
      p_language_code: 'he',
      p_translation_key: translation.key,
      p_translation_value: translation.he,
      p_category: translation.category,
      p_context: translation.context,
      p_tenant_id: tenantId
    });

    if (heError) {
      console.error(`  ❌ Error adding Hebrew translation:`, heError.message);
      errorCount++;
    } else {
      console.log(`  ✅ Added Hebrew: "${translation.he}"`);
      successCount++;
    }

    console.log('');
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Translation process complete!`);
  console.log(`   Success: ${successCount} translations`);
  if (errorCount > 0) {
    console.log(`   Errors: ${errorCount} translations`);
  }
  console.log(`${'='.repeat(60)}\n`);
}

addTranslations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
