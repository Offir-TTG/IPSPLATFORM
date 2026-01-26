import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addCheckoutTranslations() {
  const translations = [
    {
      key: 'user.payments.checkout.paymentBreakdown',
      en: 'Payment Breakdown',
      he: 'פירוט תשלום',
      context: 'user'
    },
    {
      key: 'user.payments.checkout.dueToday',
      en: 'Due Today (Deposit)',
      he: 'לתשלום היום (מקדמה)',
      context: 'user'
    },
    {
      key: 'user.payments.checkout.totalProgramCost',
      en: 'Total Program Cost',
      he: 'עלות התוכנית הכוללת',
      context: 'user'
    },
    {
      key: 'user.payments.checkout.remainingBalance',
      en: 'Remaining Balance',
      he: 'יתרת חוב',
      context: 'user'
    },
    {
      key: 'user.payments.checkout.installmentInfo',
      en: 'Remaining balance paid in {{count}} {{frequency}} installments',
      he: 'יתרת החוב תשולם ב-{{count}} תשלומים {{frequency}}',
      context: 'user'
    }
  ];

  console.log('Adding checkout translations...');

  for (const translation of translations) {
    // Check if translation already exists
    const { data: existing } = await supabase
      .from('translations')
      .select('id')
      .eq('translation_key', translation.key)
      .eq('language_code', 'en')
      .maybeSingle();

    if (existing) {
      console.log(`⚠️  Translation key "${translation.key}" already exists, skipping...`);
      continue;
    }

    // Insert English translation
    const { error: enError } = await supabase
      .from('translations')
      .insert({
        translation_key: translation.key,
        language_code: 'en',
        translation_value: translation.en,
        context: translation.context
      });

    if (enError) {
      console.error(`❌ Error inserting EN translation for ${translation.key}:`, enError);
      continue;
    }

    // Insert Hebrew translation
    const { error: heError } = await supabase
      .from('translations')
      .insert({
        translation_key: translation.key,
        language_code: 'he',
        translation_value: translation.he,
        context: translation.context
      });

    if (heError) {
      console.error(`❌ Error inserting HE translation for ${translation.key}:`, heError);
      continue;
    }

    console.log(`✅ Added translation: ${translation.key}`);
  }

  console.log('\n✨ Checkout translations added successfully!');
  console.log('\nThese translations are already being used in:');
  console.log('src/app/(public)/enroll/wizard/[id]/pay/page.tsx');
}

addCheckoutTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script error:', error);
    process.exit(1);
  });
