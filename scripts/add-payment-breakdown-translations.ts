import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addPaymentBreakdownTranslations() {
  const translations = [
    {
      key: 'enrollment.payment.breakdown.title',
      en: 'Payment Breakdown',
      he: 'פירוט תשלום',
      context: 'user'
    },
    {
      key: 'enrollment.payment.breakdown.due_today',
      en: 'Due Today (Deposit)',
      he: 'לתשלום היום (מקדמה)',
      context: 'user'
    },
    {
      key: 'enrollment.payment.breakdown.total_cost',
      en: 'Total Program Cost',
      he: 'עלות התוכנית הכוללת',
      context: 'user'
    },
    {
      key: 'enrollment.payment.breakdown.remaining_balance',
      en: 'Remaining Balance',
      he: 'יתרת חוב',
      context: 'user'
    },
    {
      key: 'enrollment.payment.breakdown.installment_info',
      en: 'Remaining balance paid in {{count}} monthly installments',
      he: 'יתרת החוב תשולם ב-{{count}} תשלומים חודשיים',
      context: 'user'
    },
    {
      key: 'enrollment.payment.amount_due_now',
      en: 'Amount Due Now',
      he: 'סכום לתשלום כעת',
      context: 'user'
    }
  ];

  console.log('Adding payment breakdown translations...');

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

  console.log('\n✨ Payment breakdown translations added successfully!');
  console.log('\nUsage in React:');
  console.log("const { t } = useTranslation();");
  console.log("t('enrollment.payment.breakdown.title')");
  console.log("t('enrollment.payment.breakdown.due_today')");
  console.log("t('enrollment.payment.breakdown.total_cost')");
  console.log("t('enrollment.payment.breakdown.remaining_balance')");
  console.log("t('enrollment.payment.breakdown.installment_info', { count: 12 })");
  console.log("t('enrollment.payment.amount_due_now')");
}

addPaymentBreakdownTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script error:', error);
    process.exit(1);
  });
