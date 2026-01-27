/**
 * Diagnose Translation Issues
 * Check exact keys and what the API would return
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
  console.log('🔍 Diagnosing Translation Keys\n');

  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants?.[0]?.id;

  if (!tenantId) {
    console.error('No tenant found');
    process.exit(1);
  }

  console.log(`Tenant ID: ${tenantId}\n`);

  // These are the EXACT keys used in the code
  const keys = [
    'admin.payments.netRevenue',
    'admin.payments.reports.afterRefunds',
    'admin.payments.reports.collectionRate',
    'admin.payments.reports.ofExpected',
  ];

  console.log('Checking exact keys used in Revenue Report:\n');

  for (const key of keys) {
    console.log(`\n🔑 ${key}`);
    console.log('─'.repeat(60));

    // Check English
    const { data: enData } = await supabase
      .from('translations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('translation_key', key)
      .eq('language_code', 'en')
      .single();

    // Check Hebrew
    const { data: heData } = await supabase
      .from('translations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('translation_key', key)
      .eq('language_code', 'he')
      .single();

    if (enData) {
      console.log(`✅ EN: "${enData.translation_value}"`);
    } else {
      console.log(`❌ EN: NOT FOUND`);
    }

    if (heData) {
      console.log(`✅ HE: "${heData.translation_value}"`);
    } else {
      console.log(`❌ HE: NOT FOUND - THIS IS THE PROBLEM!`);
    }
  }

  console.log('\n\n📊 Simulating API Response for admin context, Hebrew language:\n');

  // Simulate what the translation API returns
  const { data: allTranslations } = await supabase
    .from('translations')
    .select('translation_key, translation_value')
    .eq('tenant_id', tenantId)
    .eq('language_code', 'he')
    .in('translation_key', keys);

  console.log('Translations API would return:');
  console.log(JSON.stringify(allTranslations, null, 2));

  console.log('\n\n🔍 Checking for any similar keys in database:\n');

  // Search for partial matches
  for (const key of keys) {
    const parts = key.split('.');
    const lastPart = parts[parts.length - 1];

    const { data: similar } = await supabase
      .from('translations')
      .select('translation_key, language_code, translation_value')
      .eq('tenant_id', tenantId)
      .like('translation_key', `%${lastPart}%`);

    if (similar && similar.length > 0) {
      console.log(`\nSimilar to "${key}":`);
      similar.forEach(t => {
        console.log(`  ${t.translation_key} (${t.language_code}): "${t.translation_value}"`);
      });
    }
  }
}

diagnose()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
