import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addLessonUpdatedTranslations() {
  console.log('Checking for lesson_updated translations...');

  // Check if translations exist
  const { data: existing, error: checkError } = await supabase
    .from('translations')
    .select('*')
    .in('translation_key', [
      'lms.builder.lesson_updated',
      'lms.builder.lesson_updated_zoom_failed',
      'lms.builder.lesson_updated_zoom_error'
    ]);

  if (checkError) {
    console.error('Error checking translations:', checkError);
    process.exit(1);
  }

  console.log('Found existing translations:', existing?.length || 0);
  if (existing && existing.length > 0) {
    console.log('Existing translations:');
    existing.forEach(t => {
      console.log(`  - ${t.translation_key} (${t.language_code}): ${t.translation_value}`);
    });
  }

  // Define translations
  const translations = [
    // English
    {
      translation_key: 'lms.builder.lesson_updated',
      language_code: 'en',
      translation_value: 'Lesson updated successfully',
      category: 'lms'
    },
    {
      translation_key: 'lms.builder.lesson_updated_zoom_failed',
      language_code: 'en',
      translation_value: 'Lesson updated but Zoom meeting update failed: {error}',
      category: 'lms'
    },
    {
      translation_key: 'lms.builder.lesson_updated_zoom_error',
      language_code: 'en',
      translation_value: 'Lesson updated but Zoom meeting update failed',
      category: 'lms'
    },
    // Hebrew
    {
      translation_key: 'lms.builder.lesson_updated',
      language_code: 'he',
      translation_value: 'השיעור עודכן בהצלחה',
      category: 'lms'
    },
    {
      translation_key: 'lms.builder.lesson_updated_zoom_failed',
      language_code: 'he',
      translation_value: 'השיעור עודכן אך עדכון הפגישה ב-Zoom נכשל: {error}',
      category: 'lms'
    },
    {
      translation_key: 'lms.builder.lesson_updated_zoom_error',
      language_code: 'he',
      translation_value: 'השיעור עודכן אך עדכון הפגישה ב-Zoom נכשל',
      category: 'lms'
    },
  ];

  // Filter out existing translations
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
    console.log(`  - ${t.translation_key} (${t.language_code})`);
  });

  const { error: insertError } = await supabase
    .from('translations')
    .insert(newTranslations);

  if (insertError) {
    console.error('\n❌ Error adding translations:', insertError);
    process.exit(1);
  }

  console.log('\n✅ Translations added successfully!');
}

addLessonUpdatedTranslations();
