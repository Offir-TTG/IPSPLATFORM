const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTranslations() {
  console.log('Checking Hebrew translations for notifications...\n');

  const { data: translations, error } = await supabase
    .from('translations')
    .select('translation_key, translation_value, language_code, context')
    .eq('language_code', 'he')
    .like('translation_key', 'user.notifications.%')
    .order('translation_key');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${translations.length} Hebrew notification translations:\n`);

  translations.forEach(t => {
    console.log(`${t.translation_key}: ${t.translation_value}`);
  });

  // Check for English too
  const { data: enTranslations } = await supabase
    .from('translations')
    .select('translation_key')
    .eq('language_code', 'en')
    .like('translation_key', 'user.notifications.%')
    .order('translation_key');

  console.log(`\n\nFound ${enTranslations?.length || 0} English notification translations`);
}

checkTranslations();
