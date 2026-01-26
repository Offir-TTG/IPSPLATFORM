/**
 * Check existing enrollment translations to see what context they use
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTranslations() {
  console.log('Checking enrollment translations...\n');

  // Get translations that start with 'enrollment.'
  const { data, error } = await supabase
    .from('translations')
    .select('translation_key, category, context, language_code, translation_value')
    .like('translation_key', 'enrollment.%')
    .order('translation_key');

  if (error) {
    console.error('Error fetching translations:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No enrollment translations found.');
    return;
  }

  // Group by key
  const grouped = data.reduce((acc: any, item) => {
    if (!acc[item.translation_key]) {
      acc[item.translation_key] = {
        key: item.translation_key,
        category: item.category,
        context: item.context,
        translations: {}
      };
    }
    acc[item.translation_key].translations[item.language_code] = item.translation_value;
    return acc;
  }, {});

  console.log('Found enrollment translations:\n');
  for (const key in grouped) {
    const t = grouped[key];
    console.log(`Key: ${t.key}`);
    console.log(`  Category: ${t.category}`);
    console.log(`  Context: ${t.context}`);
    console.log(`  English: ${t.translations.en || '(missing)'}`);
    console.log(`  Hebrew: ${t.translations.he || '(missing)'}`);
    console.log('');
  }
}

checkTranslations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
