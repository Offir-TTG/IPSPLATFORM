import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkTranslation() {
  const { data } = await supabase
    .from('translations')
    .select('translation_key, language_code, translation_value')
    .eq('translation_key', 'admin.enrollments.paymentPlan.depositLabel');

  console.log('Translation for depositLabel:');
  if (data && data.length > 0) {
    console.table(data);
  } else {
    console.log('❌ Translation NOT FOUND in database!');
    console.log('\nNeed to add translation for:');
    console.log('  Key: admin.enrollments.paymentPlan.depositLabel');
    console.log('  English: deposit');
    console.log('  Hebrew: מקדמה');
  }
}

checkTranslation();
