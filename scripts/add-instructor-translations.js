require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addTranslations() {
  console.log('Adding instructor field translations...\n');

  const translations = [
    // Instructor field
    {
      translation_key: 'lms.courses.instructor',
      language_code: 'en',
      translation_value: 'Instructor',
      category: 'lms',
      context: 'both'
    },
    {
      translation_key: 'lms.courses.instructor',
      language_code: 'he',
      translation_value: 'מרצה',
      category: 'lms',
      context: 'both'
    },
    // Select instructor placeholder
    {
      translation_key: 'lms.courses.select_instructor',
      language_code: 'en',
      translation_value: 'Select an instructor (optional)',
      category: 'lms',
      context: 'both'
    },
    {
      translation_key: 'lms.courses.select_instructor',
      language_code: 'he',
      translation_value: 'בחר מרצה (אופציונלי)',
      category: 'lms',
      context: 'both'
    },
    // No users available
    {
      translation_key: 'lms.courses.no_users',
      language_code: 'en',
      translation_value: 'No users available',
      category: 'lms',
      context: 'both'
    },
    {
      translation_key: 'lms.courses.no_users',
      language_code: 'he',
      translation_value: 'אין משתמשים זמינים',
      category: 'lms',
      context: 'both'
    },
    // Instructor help text
    {
      translation_key: 'lms.courses.instructor_help',
      language_code: 'en',
      translation_value: 'Leave empty to set yourself as the instructor',
      category: 'lms',
      context: 'both'
    },
    {
      translation_key: 'lms.courses.instructor_help',
      language_code: 'he',
      translation_value: 'השאר ריק כדי להגדיר את עצמך כמרצה',
      category: 'lms',
      context: 'both'
    }
  ];

  const { data: existing, error: checkError } = await supabase
    .from('translations')
    .select('*')
    .in('translation_key', [
      'lms.courses.instructor',
      'lms.courses.select_instructor',
      'lms.courses.no_users',
      'lms.courses.instructor_help'
    ]);

  if (checkError) {
    console.error('Error checking translations:', checkError);
    process.exit(1);
  }

  console.log('Found existing translations:', existing?.length || 0);

  const existingKeys = new Set(
    existing?.map(t => `${t.translation_key}:${t.language_code}`) || []
  );

  const newTranslations = translations.filter(
    t => !existingKeys.has(`${t.translation_key}:${t.language_code}`)
  );

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

  console.log('\n✅ Instructor translations added successfully!');
}

addTranslations();
