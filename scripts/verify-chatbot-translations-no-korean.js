const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyTranslations() {
  console.log('🔍 Checking all chatbot translations for Korean characters...\n');

  const { data: translations } = await supabase
    .from('translations')
    .select('translation_key, language_code, translation_value')
    .like('translation_key', 'chatbot.%')
    .eq('language_code', 'he')
    .order('translation_key');

  let hasKorean = false;
  const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;

  translations.forEach(t => {
    if (koreanRegex.test(t.translation_value)) {
      console.log(`❌ FOUND KOREAN in ${t.translation_key}:`);
      console.log(`   Value: ${t.translation_value}\n`);
      hasKorean = true;
    }
  });

  if (!hasKorean) {
    console.log('✅ All Hebrew translations are clean - no Korean characters found!\n');
    console.log('Listing all Hebrew chatbot translations:');
    translations.forEach(t => {
      console.log(`  ${t.translation_key}: ${t.translation_value}`);
    });
  } else {
    console.log('\n❌ Found Korean characters in translations above. Need to fix!');
  }
}

verifyTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
