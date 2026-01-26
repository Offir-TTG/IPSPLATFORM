import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixInstallmentInfoTranslation() {
  console.log('Fixing installment info translation to use single braces...');

  // Update English translation
  const { error: enError } = await supabase
    .from('translations')
    .update({
      translation_value: 'Remaining balance paid in {count} {frequency} installments'
    })
    .eq('translation_key', 'user.payments.checkout.installmentInfo')
    .eq('language_code', 'en');

  if (enError) {
    console.error('❌ Error updating EN translation:', enError);
  } else {
    console.log('✅ Updated EN translation');
  }

  // Update Hebrew translation
  const { error: heError } = await supabase
    .from('translations')
    .update({
      translation_value: 'יתרת החוב תשולם ב-{count} תשלומים {frequency}'
    })
    .eq('translation_key', 'user.payments.checkout.installmentInfo')
    .eq('language_code', 'he');

  if (heError) {
    console.error('❌ Error updating HE translation:', heError);
  } else {
    console.log('✅ Updated HE translation');
  }

  console.log('\n✨ Installment info translation fixed!');
  console.log('Changed from {{count}} {{frequency}} to {count} {frequency}');
}

fixInstallmentInfoTranslation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script error:', error);
    process.exit(1);
  });
