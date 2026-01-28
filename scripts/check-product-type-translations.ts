import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkProductTypeTranslations() {
  console.log('🔍 Checking Product Type Translations\n');
  console.log('=' .repeat(60));

  const productTypes = [
    'program',
    'course',
    'lecture',
    'workshop',
    'webinar',
    'session',
    'session_pack',
    'bundle',
    'custom'
  ];

  for (const type of productTypes) {
    const key = `admin.enrollments.productType.${type}`;

    const { data: translations } = await supabase
      .from('translations')
      .select('language_code, value')
      .eq('key', key)
      .order('language_code');

    console.log(`\n${type}:`);
    console.log(`  Key: ${key}`);

    if (!translations || translations.length === 0) {
      console.log(`  ❌ No translations found`);
    } else {
      translations.forEach(t => {
        console.log(`  ${t.language_code.toUpperCase()}: ${t.value}`);
      });
    }
  }

  console.log('\n' + '='.repeat(60));
}

checkProductTypeTranslations().then(() => process.exit(0));
