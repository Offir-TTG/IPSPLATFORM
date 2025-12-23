require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugTranslations() {
  console.log('Checking translations in database...\n');

  const keys = [
    'lms.lesson.meeting_platform_label',
    'lms.lesson.platform_daily',
    'lms.lesson.daily_room_name_label',
    'lms.lesson.daily_room_name_placeholder',
    'lms.lesson.daily_room_name_help',
  ];

  // Check what's in the database
  const { data: allTranslations, error } = await supabase
    .from('translations')
    .select('*')
    .in('translation_key', keys)
    .order('translation_key', { ascending: true })
    .order('language_code', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Database translations:');
  console.log('======================');

  const grouped = {};
  allTranslations.forEach(t => {
    if (!grouped[t.translation_key]) {
      grouped[t.translation_key] = {};
    }
    grouped[t.translation_key][t.language_code] = t.translation_value;
  });

  Object.keys(grouped).forEach(key => {
    console.log(`\n${key}:`);
    console.log(`  EN: ${grouped[key]['en'] || 'MISSING'}`);
    console.log(`  HE: ${grouped[key]['he'] || 'MISSING'}`);
  });

  // Check if translations API would return them
  console.log('\n\nChecking API endpoint...');
  console.log('========================');

  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/translations?select=*&translation_key=in.(${keys.join(',')})&language_code=eq.he`, {
    headers: {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    }
  });

  const apiData = await response.json();
  console.log(`API returned ${apiData.length} Hebrew translations`);
  apiData.forEach(t => {
    console.log(`  ${t.translation_key}: ${t.translation_value}`);
  });
}

debugTranslations();
