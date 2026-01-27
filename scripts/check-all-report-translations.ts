/**
 * Check All Report Translations
 * Finds any translation keys used in reports that don't have Hebrew translations
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// All translation keys used in the Revenue Report section
const requiredKeys = [
  'admin.payments.reports.totalExpectedIncome',
  'admin.payments.reports.allSchedules',
  'admin.payments.totalRevenue',
  'admin.payments.reports.avgTransaction',
  'admin.payments.netRevenue',
  'admin.payments.reports.afterRefunds',
  'admin.payments.reports.collectionRate',
  'admin.payments.reports.ofExpected',
];

async function checkTranslations() {
  console.log('🔍 Checking Report Translations\n');

  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants?.[0]?.id;

  if (!tenantId) {
    console.error('No tenant found');
    process.exit(1);
  }

  let missing = 0;
  let found = 0;

  for (const key of requiredKeys) {
    const { data: enTrans } = await supabase
      .from('translations')
      .select('translation_value')
      .eq('tenant_id', tenantId)
      .eq('translation_key', key)
      .eq('language_code', 'en')
      .single();

    const { data: heTrans } = await supabase
      .from('translations')
      .select('translation_value')
      .eq('tenant_id', tenantId)
      .eq('translation_key', key)
      .eq('language_code', 'he')
      .single();

    if (!heTrans) {
      console.log(`❌ MISSING Hebrew: ${key}`);
      if (enTrans) {
        console.log(`   English: "${enTrans.translation_value}"`);
      }
      console.log('');
      missing++;
    } else {
      console.log(`✅ ${key}`);
      console.log(`   en: "${enTrans?.translation_value}"`);
      console.log(`   he: "${heTrans.translation_value}"`);
      console.log('');
      found++;
    }
  }

  console.log(`\n📊 Summary: ${found} found, ${missing} missing Hebrew translations`);

  if (missing > 0) {
    console.log('\n⚠️  Some translations are missing Hebrew versions!');
  } else {
    console.log('\n✅ All translations have Hebrew versions!');
  }
}

checkTranslations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
