const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTranslations() {
  console.log('Checking template description translations...\n');

  const { data, error } = await supabase
    .from('translations')
    .select('translation_key, language_code, translation_value')
    .like('translation_key', 'email_template.%description')
    .is('tenant_id', null)
    .order('translation_key', { ascending: true })
    .order('language_code', { ascending: true });

  if (error) {
    console.error('Error fetching translations:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('❌ No template description translations found!');
    process.exit(1);
  }

  console.log(`✅ Found ${data.length} template description translations:\n`);

  // Group by template
  const byTemplate = {};
  data.forEach(t => {
    const templateKey = t.translation_key.replace('email_template.', '').replace('.description', '');
    if (!byTemplate[templateKey]) {
      byTemplate[templateKey] = {};
    }
    byTemplate[templateKey][t.language_code] = t.translation_value;
  });

  // Display
  Object.keys(byTemplate).forEach(templateKey => {
    console.log(`📧 ${templateKey}:`);
    Object.keys(byTemplate[templateKey]).forEach(lang => {
      console.log(`   [${lang}] ${byTemplate[templateKey][lang]}`);
    });
    console.log();
  });

  process.exit(0);
}

verifyTranslations();
