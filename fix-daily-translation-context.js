require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixTranslationContext() {
  console.log('Fixing Daily.co translation context from "user" to "both"...\n');

  const keys = [
    'lms.lesson.meeting_integration_title',
    'lms.lesson.meeting_integration_desc',
    'lms.lesson.meeting_platform_label',
    'lms.lesson.platform_daily',
    'lms.lesson.platform_zoom',
    'lms.lesson.daily_room_name_label',
    'lms.lesson.daily_room_name_placeholder',
    'lms.lesson.daily_room_name_help',
    'lms.builder.daily_room_name_required',
    'lms.builder.lesson_daily_created',
    'lms.builder.lesson_created_daily_failed',
    'lms.builder.lesson_created_daily_error',
    'lms.builder.daily_created',
    'lms.builder.daily_create_failed',
    'lms.builder.open_daily',
    'lms.builder.add_daily',
    'lms.lesson.daily_tokens_hint',
  ];

  console.log(`Updating ${keys.length} translation keys...`);

  const { data: updated, error } = await supabase
    .from('translations')
    .update({ context: 'both' })
    .in('translation_key', keys)
    .select();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`✅ Successfully updated ${updated.length} translations to context='both'`);

  // Group by key
  const byKey = {};
  updated.forEach(t => {
    if (!byKey[t.translation_key]) byKey[t.translation_key] = [];
    byKey[t.translation_key].push(t.language_code);
  });

  console.log('\nUpdated translations:');
  Object.keys(byKey).forEach(key => {
    console.log(`  ${key}: ${byKey[key].join(', ')}`);
  });
}

fixTranslationContext();
