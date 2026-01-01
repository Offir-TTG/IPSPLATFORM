const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTranslations() {
  // Check for notification template translations
  const { data, error } = await supabase
    .from('translations')
    .select('*')
    .like('translation_key', '%notification%');

  if (error) {
    console.log('Error:', error);
  } else {
    console.log(`Found ${data.length} notification translations:`);

    // Group by key
    const grouped = {};
    data.forEach(t => {
      if (!grouped[t.translation_key]) {
        grouped[t.translation_key] = {};
      }
      grouped[t.translation_key][t.language_code] = t.translation_value;
    });

    console.log('\nGrouped by key:');
    Object.entries(grouped).forEach(([key, values]) => {
      console.log(`\n${key}:`);
      console.log(`  EN: ${values.en || 'MISSING'}`);
      console.log(`  HE: ${values.he || 'MISSING'}`);
    });
  }
}

checkTranslations();
