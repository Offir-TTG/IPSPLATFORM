/**
 * Script to verify program error translations
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyTranslations() {
  console.log('Verifying program error translations...\n');

  const { data, error } = await supabase
    .from('translations')
    .select('*')
    .eq('translation_key', 'lms.programs.error.name_required')
    .order('language_code');

  if (error) {
    console.error('Error fetching translations:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('❌ No translations found for lms.programs.error.name_required');
    return;
  }

  console.log('✓ Found translations:\n');
  data.forEach(translation => {
    console.log(`Language: ${translation.language_code}`);
    console.log(`Key: ${translation.translation_key}`);
    console.log(`Value: ${translation.translation_value}`);
    console.log(`Context: ${translation.context}`);
    console.log(`Category: ${translation.category}`);
    console.log('---');
  });
}

verifyTranslations();
