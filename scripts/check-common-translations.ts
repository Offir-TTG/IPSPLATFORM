/**
 * Script to check common translations
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCommonTranslations() {
  console.log('Checking common translations...\n');

  const keys = [
    'common.required_fields',
    'common.error'
  ];

  for (const key of keys) {
    console.log(`\nChecking: ${key}`);
    console.log('='.repeat(50));

    const { data, error } = await supabase
      .from('translations')
      .select('*')
      .eq('translation_key', key)
      .order('language_code');

    if (error) {
      console.error('Error:', error);
      continue;
    }

    if (!data || data.length === 0) {
      console.log(`❌ No translations found for ${key}`);
      continue;
    }

    data.forEach(translation => {
      console.log(`  ${translation.language_code}: "${translation.translation_value}" (context: ${translation.context})`);
    });
  }
}

checkCommonTranslations();
