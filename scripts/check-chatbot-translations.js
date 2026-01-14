const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTranslations() {
  const { data: translations } = await supabase
    .from('translations')
    .select('translation_key, language_code, translation_value')
    .like('translation_key', 'chatbot.%')
    .order('translation_key');

  const grouped = {};
  translations?.forEach(t => {
    if (!grouped[t.translation_key]) grouped[t.translation_key] = {};
    grouped[t.translation_key][t.language_code] = t.translation_value;
  });

  console.log('Existing chatbot translations:\n');
  Object.keys(grouped).sort().forEach(key => {
    const en = grouped[key].en || 'MISSING';
    const he = grouped[key].he || 'MISSING';
    console.log(`${key}:`);
    console.log(`  EN: ${en}`);
    console.log(`  HE: ${he}\n`);
  });
}

checkTranslations();
