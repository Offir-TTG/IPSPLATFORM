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

async function addBulkDailyTranslations() {
  console.log('Adding bulk Daily.co translations...');

  const translations = [
    // Bulk meeting title/desc
    {
      translation_key: 'lms.lesson.bulk_meeting_title',
      language_code: 'en',
      translation_value: 'Video Meeting Integration',
      category: 'lms',
      context: 'both'
    },
    {
      translation_key: 'lms.lesson.bulk_meeting_title',
      language_code: 'he',
      translation_value: 'אינטגרציית פגישת וידאו',
      category: 'lms',
      context: 'both'
    },
    {
      translation_key: 'lms.lesson.bulk_meeting_desc',
      language_code: 'en',
      translation_value: 'Automatically create video meetings for each lesson',
      category: 'lms',
      context: 'both'
    },
    {
      translation_key: 'lms.lesson.bulk_meeting_desc',
      language_code: 'he',
      translation_value: 'צור פגישות וידאו אוטומטית עבור כל שיעור',
      category: 'lms',
      context: 'both'
    },

    // Daily.co room pattern
    {
      translation_key: 'lms.lesson.daily_room_pattern_label',
      language_code: 'en',
      translation_value: 'Daily.co Room Name Pattern',
      category: 'lms',
      context: 'both'
    },
    {
      translation_key: 'lms.lesson.daily_room_pattern_label',
      language_code: 'he',
      translation_value: 'תבנית שם חדר Daily.co',
      category: 'lms',
      context: 'both'
    },
    {
      translation_key: 'lms.lesson.daily_room_pattern_placeholder',
      language_code: 'en',
      translation_value: '{series_name}-session-{n}',
      category: 'lms',
      context: 'both'
    },
    {
      translation_key: 'lms.lesson.daily_room_pattern_placeholder',
      language_code: 'he',
      translation_value: '{series_name}-session-{n}',
      category: 'lms',
      context: 'both'
    },
    {
      translation_key: 'lms.lesson.daily_room_pattern_help',
      language_code: 'en',
      translation_value: 'Use tokens to create unique room names. Only Latin characters, numbers, and hyphens allowed.',
      category: 'lms',
      context: 'both'
    },
    {
      translation_key: 'lms.lesson.daily_room_pattern_help',
      language_code: 'he',
      translation_value: 'השתמש בטוקנים ליצירת שמות חדרים ייחודיים. רק תווים לטיניים, מספרים ומקפים מותרים.',
      category: 'lms',
      context: 'both'
    },

    // Validation
    {
      translation_key: 'lms.builder.daily_room_pattern_required',
      language_code: 'en',
      translation_value: 'Daily.co room pattern is required when creating Daily.co rooms',
      category: 'lms',
      context: 'both'
    },
    {
      translation_key: 'lms.builder.daily_room_pattern_required',
      language_code: 'he',
      translation_value: 'תבנית חדר Daily.co נדרשת בעת יצירת חדרי Daily.co',
      category: 'lms',
      context: 'both'
    },

    // Preview
    {
      translation_key: 'lms.lesson.preview_with_daily',
      language_code: 'en',
      translation_value: ', each with a Daily.co room',
      category: 'lms',
      context: 'both'
    },
    {
      translation_key: 'lms.lesson.preview_with_daily',
      language_code: 'he',
      translation_value: ', כל אחד עם חדר Daily.co',
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
    console.log(`  - ${t.translation_key} (${t.language_code})`);
  });

  const { error: insertError } = await supabase
    .from('translations')
    .insert(newTranslations);

  if (insertError) {
    console.error('\n❌ Error adding translations:', insertError);
    process.exit(1);
  }

  console.log('\n✅ Bulk Daily.co translations added successfully!');
}

addBulkDailyTranslations();
