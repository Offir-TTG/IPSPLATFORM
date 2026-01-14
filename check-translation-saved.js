const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTranslation() {
  console.log('Checking if translation was saved...\n');

  const translationKey = 'admin.audit.filters.category.data';

  const { data, error } = await supabase
    .from('translations')
    .select('*')
    .eq('translation_key', translationKey)
    .order('language_code');

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('❌ Translation NOT found in database!');
    return;
  }

  console.log(`✅ Found ${data.length} translation(s):\n`);
  data.forEach(t => {
    console.log(`Language: ${t.language_code}`);
    console.log(`Value: ${t.translation_value}`);
    console.log(`Updated: ${t.updated_at}`);
    console.log(`ID: ${t.id}\n`);
  });
}

checkTranslation();
