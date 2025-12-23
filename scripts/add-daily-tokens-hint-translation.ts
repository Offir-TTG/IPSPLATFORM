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

async function addDailyTokensHintTranslation() {
  console.log('Adding Daily.co tokens hint translation...');

  // Define translations
  const translations = [
    {
      translation_key: 'lms.lesson.daily_tokens_hint',
      language_code: 'en',
      translation_value: 'Tip: You can use the tokens below to auto-generate room names for bulk creation',
      category: 'lms'
    },
    {
      translation_key: 'lms.lesson.daily_tokens_hint',
      language_code: 'he',
      translation_value: 'טיפ: ניתן להשתמש בטוקנים למטה ליצירה אוטומטית של שמות חדרים ביצירה המונית',
      category: 'lms'
    },
    {
      translation_key: 'lms.builder.add_daily',
      language_code: 'en',
      translation_value: 'Add Daily.co',
      category: 'lms'
    },
    {
      translation_key: 'lms.builder.add_daily',
      language_code: 'he',
      translation_value: 'הוסף Daily.co',
      category: 'lms'
    },
    {
      translation_key: 'lms.builder.daily_created',
      language_code: 'en',
      translation_value: 'Daily.co room created successfully',
      category: 'lms'
    },
    {
      translation_key: 'lms.builder.daily_created',
      language_code: 'he',
      translation_value: 'חדר Daily.co נוצר בהצלחה',
      category: 'lms'
    },
    {
      translation_key: 'lms.builder.daily_create_failed',
      language_code: 'en',
      translation_value: 'Failed to create Daily.co room',
      category: 'lms'
    },
    {
      translation_key: 'lms.builder.daily_create_failed',
      language_code: 'he',
      translation_value: 'יצירת חדר Daily.co נכשלה',
      category: 'lms'
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

addDailyTokensHintTranslation();
