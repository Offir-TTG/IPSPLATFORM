require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTranslations() {
  const { data, error } = await supabase
    .from('translations')
    .select('key, language, value')
    .in('key', ['detail.certificate', 'detail.certificateDesc', 'detail.access', 'detail.accessDesc'])
    .order('key', { ascending: true });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Translations found in database:\n');
    data.forEach(t => {
      console.log(`${t.key} (${t.language}): ${t.value}`);
    });
  }

  process.exit(0);
}

checkTranslations();
