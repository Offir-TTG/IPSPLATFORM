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

async function addDailyDialogTranslations() {
  console.log('Adding Daily.co dialog translations...');

  // Define translations
  const translations = [
    // Video Meeting Integration
    {
      translation_key: 'lms.lesson.meeting_integration_title',
      language_code: 'en',
      translation_value: 'Video Meeting Integration',
      category: 'lms'
    },
    {
      translation_key: 'lms.lesson.meeting_integration_title',
      language_code: 'he',
      translation_value: 'אינטגרציית פגישת וידאו',
      category: 'lms'
    },
    {
      translation_key: 'lms.lesson.meeting_integration_desc',
      language_code: 'en',
      translation_value: 'Create a video meeting automatically for this lesson',
      category: 'lms'
    },
    {
      translation_key: 'lms.lesson.meeting_integration_desc',
      language_code: 'he',
      translation_value: 'צור פגישת וידאו אוטומטית עבור שיעור זה',
      category: 'lms'
    },

    // Meeting Platform
    {
      translation_key: 'lms.lesson.meeting_platform_label',
      language_code: 'en',
      translation_value: 'Meeting Platform',
      category: 'lms'
    },
    {
      translation_key: 'lms.lesson.meeting_platform_label',
      language_code: 'he',
      translation_value: 'פלטפורמת פגישה',
      category: 'lms'
    },
    {
      translation_key: 'lms.lesson.platform_daily',
      language_code: 'en',
      translation_value: 'Daily.co',
      category: 'lms'
    },
    {
      translation_key: 'lms.lesson.platform_daily',
      language_code: 'he',
      translation_value: 'Daily.co',
      category: 'lms'
    },
    {
      translation_key: 'lms.lesson.platform_zoom',
      language_code: 'en',
      translation_value: 'Zoom',
      category: 'lms'
    },
    {
      translation_key: 'lms.lesson.platform_zoom',
      language_code: 'he',
      translation_value: 'Zoom',
      category: 'lms'
    },

    // Daily.co Room Name
    {
      translation_key: 'lms.lesson.daily_room_name_label',
      language_code: 'en',
      translation_value: 'Daily.co Room Name',
      category: 'lms'
    },
    {
      translation_key: 'lms.lesson.daily_room_name_label',
      language_code: 'he',
      translation_value: 'שם חדר Daily.co',
      category: 'lms'
    },
    {
      translation_key: 'lms.lesson.daily_room_name_placeholder',
      language_code: 'en',
      translation_value: 'e.g., Introduction to Parenting - Session 1',
      category: 'lms'
    },
    {
      translation_key: 'lms.lesson.daily_room_name_placeholder',
      language_code: 'he',
      translation_value: 'לדוגמה: מבוא להורות - מפגש 1',
      category: 'lms'
    },
    {
      translation_key: 'lms.lesson.daily_room_name_help',
      language_code: 'en',
      translation_value: 'This will be used to identify the room (only Latin characters, numbers, and hyphens)',
      category: 'lms'
    },
    {
      translation_key: 'lms.lesson.daily_room_name_help',
      language_code: 'he',
      translation_value: 'זה ישמש לזיהוי החדר (רק תווים לטיניים, מספרים ומקפים)',
      category: 'lms'
    },

    // Validation messages
    {
      translation_key: 'lms.builder.daily_room_name_required',
      language_code: 'en',
      translation_value: 'Daily.co room name is required when creating Daily.co room',
      category: 'lms'
    },
    {
      translation_key: 'lms.builder.daily_room_name_required',
      language_code: 'he',
      translation_value: 'שם חדר Daily.co נדרש בעת יצירת חדר Daily.co',
      category: 'lms'
    },

    // Success/Error messages
    {
      translation_key: 'lms.builder.lesson_daily_created',
      language_code: 'en',
      translation_value: 'Lesson and Daily.co room created successfully',
      category: 'lms'
    },
    {
      translation_key: 'lms.builder.lesson_daily_created',
      language_code: 'he',
      translation_value: 'השיעור וחדר Daily.co נוצרו בהצלחה',
      category: 'lms'
    },
    {
      translation_key: 'lms.builder.lesson_created_daily_failed',
      language_code: 'en',
      translation_value: 'Lesson created but Daily.co room creation failed',
      category: 'lms'
    },
    {
      translation_key: 'lms.builder.lesson_created_daily_failed',
      language_code: 'he',
      translation_value: 'השיעור נוצר אך יצירת חדר Daily.co נכשלה',
      category: 'lms'
    },
    {
      translation_key: 'lms.builder.lesson_created_daily_error',
      language_code: 'en',
      translation_value: 'Lesson created but Daily.co room creation failed',
      category: 'lms'
    },
    {
      translation_key: 'lms.builder.lesson_created_daily_error',
      language_code: 'he',
      translation_value: 'השיעור נוצר אך יצירת חדר Daily.co נכשלה',
      category: 'lms'
    },

    // Builder messages
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
    {
      translation_key: 'lms.builder.open_daily',
      language_code: 'en',
      translation_value: 'Open Daily.co',
      category: 'lms'
    },
    {
      translation_key: 'lms.builder.open_daily',
      language_code: 'he',
      translation_value: 'פתח Daily.co',
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

  console.log('\n✅ Daily.co dialog translations added successfully!');
}

addDailyDialogTranslations();
