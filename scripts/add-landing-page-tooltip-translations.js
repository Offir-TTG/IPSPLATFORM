// Add landing page tooltip translations
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // Programs section tooltips
  { key: 'public.programs.gridView', en: 'Grid View', he: 'תצוגת רשת' },
  { key: 'public.programs.listView', en: 'List View', he: 'תצוגת רשימה' },

  // Courses section tooltips
  { key: 'public.courses.gridView', en: 'Grid View', he: 'תצוגת רשת' },
  { key: 'public.courses.listView', en: 'List View', he: 'תצוגת רשימה' },
];

async function addTranslations() {
  console.log('Adding landing page tooltip translations...\n');

  for (const translation of translations) {
    console.log(`Adding: ${translation.key}`);

    // Check if English already exists
    const { data: existingEn } = await supabase
      .from('translations')
      .select('id')
      .eq('translation_key', translation.key)
      .eq('language_code', 'en')
      .maybeSingle();

    if (existingEn) {
      console.log(`  ⊘ English already exists`);
    } else {
      const { error: enError } = await supabase
        .from('translations')
        .insert({
          translation_key: translation.key,
          language_code: 'en',
          translation_value: translation.en,
          context: 'admin',
        });

      if (enError) {
        console.error(`  ✗ Error adding English: ${enError.message}`);
      } else {
        console.log(`  ✓ English: ${translation.en}`);
      }
    }

    // Check if Hebrew already exists
    const { data: existingHe } = await supabase
      .from('translations')
      .select('id')
      .eq('translation_key', translation.key)
      .eq('language_code', 'he')
      .maybeSingle();

    if (existingHe) {
      console.log(`  ⊘ Hebrew already exists`);
    } else {
      const { error: heError } = await supabase
        .from('translations')
        .insert({
          translation_key: translation.key,
          language_code: 'he',
          translation_value: translation.he,
          context: 'admin',
        });

      if (heError) {
        console.error(`  ✗ Error adding Hebrew: ${heError.message}`);
      } else {
        console.log(`  ✓ Hebrew: ${translation.he}`);
      }
    }

    console.log('');
  }

  console.log(`✅ Added ${translations.length} translation keys (${translations.length * 2} total translations)`);
}

addTranslations()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
