require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addTranslation() {
  console.log('Adding course description translation...\n');

  const translations = [
    {
      translation_key: 'lms.builder.course_description',
      language_code: 'en',
      translation_value: 'Course Description',
      category: 'lms',
      context: 'both'
    },
    {
      translation_key: 'lms.builder.course_description',
      language_code: 'he',
      translation_value: 'תיאור הקורס',
      category: 'lms',
      context: 'both'
    }
  ];

  const { data: existing, error: checkError } = await supabase
    .from('translations')
    .select('*')
    .eq('translation_key', 'lms.builder.course_description');

  if (checkError) {
    console.error('Error checking translations:', checkError);
    process.exit(1);
  }

  console.log('Found existing translations:', existing?.length || 0);

  const existingKeys = new Set(existing?.map(t => t.language_code) || []);
  const newTranslations = translations.filter(t => !existingKeys.has(t.language_code));

  if (newTranslations.length === 0) {
    console.log('\n✅ All translations already exist!');
    return;
  }

  console.log(`\nAdding ${newTranslations.length} new translations...`);
  newTranslations.forEach(t => {
    console.log(`  - ${t.translation_key} (${t.language_code}): ${t.translation_value}`);
  });

  const { error: insertError } = await supabase
    .from('translations')
    .insert(newTranslations);

  if (insertError) {
    console.error('\n❌ Error adding translations:', insertError);
    process.exit(1);
  }

  console.log('\n✅ Course description translations added successfully!');
}

addTranslation();
