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

async function addBulkPublishTranslations() {
  console.log('Adding bulk lesson publish translations...\n');

  const translations = [
    // Publish title
    {
      translation_key: 'lms.lesson.publish_title',
      language_code: 'en',
      translation_value: 'Publish Lessons',
      category: 'lms',
      context: 'both'
    },
    {
      translation_key: 'lms.lesson.publish_title',
      language_code: 'he',
      translation_value: 'פרסום שיעורים',
      category: 'lms',
      context: 'both'
    },

    // Publish description
    {
      translation_key: 'lms.lesson.publish_desc',
      language_code: 'en',
      translation_value: 'Make lessons visible to students immediately',
      category: 'lms',
      context: 'both'
    },
    {
      translation_key: 'lms.lesson.publish_desc',
      language_code: 'he',
      translation_value: 'הפוך את השיעורים לגלויים לתלמידים מיד',
      category: 'lms',
      context: 'both'
    },
  ];

  // Check for existing translations
  const { data: existing, error: checkError } = await supabase
    .from('translations')
    .select('*')
    .in('translation_key', translations.map(t => t.translation_key));

  if (checkError) {
    console.error('Error checking translations:', checkError);
    process.exit(1);
  }

  console.log('Found existing translations:', existing?.length || 0);

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
    console.log(`  - ${t.translation_key} (${t.language_code}): ${t.translation_value}`);
  });

  const { error: insertError } = await supabase
    .from('translations')
    .insert(newTranslations);

  if (insertError) {
    console.error('\n❌ Error adding translations:', insertError);
    process.exit(1);
  }

  console.log('\n✅ Bulk publish translations added successfully!');
}

addBulkPublishTranslations();
