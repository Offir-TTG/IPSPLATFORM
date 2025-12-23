require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTranslations() {
  const keys = [
    'lms.lesson.meeting_integration_title',
    'lms.lesson.meeting_integration_desc',
    'lms.lesson.meeting_platform_label',
    'lms.lesson.platform_daily',
    'lms.lesson.platform_zoom',
    'lms.lesson.daily_room_name_label',
    'lms.lesson.daily_room_name_placeholder',
    'lms.lesson.daily_room_name_help',
  ];

  const { data, error } = await supabase
    .from('translations')
    .select('*')
    .in('translation_key', keys)
    .order('translation_key', { ascending: true })
    .order('language_code', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\nFound translations:');
  console.log('==================');
  data.forEach(t => {
    console.log(`${t.translation_key} [${t.language_code}]: ${t.translation_value}`);
  });

  console.log('\n\nMissing translations:');
  console.log('====================');
  const found = new Set(data.map(t => `${t.translation_key}:${t.language_code}`));
  keys.forEach(key => {
    ['en', 'he'].forEach(lang => {
      const combo = `${key}:${lang}`;
      if (!found.has(combo)) {
        console.log(`Missing: ${key} [${lang}]`);
      }
    });
  });
}

checkTranslations();
