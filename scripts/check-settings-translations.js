const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const requiredKeys = [
  'emails.settings.description',
  'emails.settings.preview.title',
  'emails.settings.preview.description',
  'emails.settings.categories.title',
  'emails.settings.categories.description',
  'emails.settings.categories.value',
  'emails.settings.categories.label_en',
  'emails.settings.categories.label_he',
  'emails.settings.categories.color',
];

async function checkTranslations() {
  console.log('Checking email settings translations...\n');

  const { data: translations } = await supabase
    .from('translations')
    .select('translation_key, language_code, translation_value')
    .in('translation_key', requiredKeys);

  const grouped = {};
  translations?.forEach(t => {
    if (!grouped[t.translation_key]) grouped[t.translation_key] = {};
    grouped[t.translation_key][t.language_code] = t.translation_value;
  });

  const missing = [];
  requiredKeys.forEach(key => {
    const hasEn = grouped[key]?.en;
    const hasHe = grouped[key]?.he;

    console.log(`${key}:`);
    console.log(`  EN: ${hasEn || 'MISSING'}`);
    console.log(`  HE: ${hasHe || 'MISSING'}\n`);

    if (!hasEn || !hasHe) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    console.log(`\nMissing ${missing.length} translations:`);
    missing.forEach(k => console.log(`  - ${k}`));
  } else {
    console.log('\nAll settings translations are complete!');
  }
}

checkTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
