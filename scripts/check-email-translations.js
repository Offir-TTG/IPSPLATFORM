const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkEmailTranslations() {
  const { data: translations } = await supabase
    .from('translations')
    .select('translation_key, language_code, translation_value')
    .like('translation_key', 'emails.%')
    .order('translation_key');

  const grouped = {};
  translations?.forEach(t => {
    if (!grouped[t.translation_key]) grouped[t.translation_key] = {};
    grouped[t.translation_key][t.language_code] = t.translation_value;
  });

  console.log('Email translations status:\n');
  const keys = Object.keys(grouped).sort();

  const missing = [];
  keys.forEach(key => {
    const en = grouped[key].en;
    const he = grouped[key].he;
    if (!en || !he) {
      missing.push(key);
      console.log(`MISSING: ${key}`);
      console.log(`   EN: ${en || 'NOT FOUND'}`);
      console.log(`   HE: ${he || 'NOT FOUND'}\n`);
    }
  });

  console.log(`\nTotal email translation keys: ${keys.length}`);
  console.log(`Complete translations: ${keys.length - missing.length}`);
  console.log(`Missing translations: ${missing.length}`);

  if (missing.length === 0) {
    console.log('\nAll email translations are complete!');
  }
}

checkEmailTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
