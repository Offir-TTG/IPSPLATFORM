import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTranslations() {
  console.log('🔍 Checking password step translations...\n');

  const { data, error } = await supabase
    .from('translations')
    .select('translation_key, language_code, translation_value')
    .or('translation_key.like.enrollment.wizard.password%,translation_key.eq.enrollment.wizard.steps.password')
    .is('tenant_id', null)
    .order('translation_key')
    .order('language_code');

  if (error) {
    console.error('Error fetching translations:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('❌ No password translations found!');
    return;
  }

  console.log(`✅ Found ${data.length} translations:\n`);

  let currentKey = '';
  for (const row of data) {
    if (row.translation_key !== currentKey) {
      currentKey = row.translation_key;
      console.log(`\n${row.translation_key}:`);
    }
    console.log(`  [${row.language_code}] ${row.translation_value}`);
  }
}

checkTranslations().catch(console.error);
