/**
 * Verify Report Translations
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verify() {
  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants?.[0]?.id;

  console.log('🔍 Checking Report Translations\n');

  const keys = [
    'admin.payments.reports.afterRefunds',
    'admin.payments.reports.collectionRate',
  ];

  for (const key of keys) {
    const { data } = await supabase
      .from('translations')
      .select('language_code, translation_value')
      .eq('tenant_id', tenantId)
      .eq('translation_key', key)
      .order('language_code');

    console.log(`\n${key}:`);
    if (data && data.length > 0) {
      data.forEach(t => {
        console.log(`  ${t.language_code}: "${t.translation_value}"`);
      });
    } else {
      console.log('  ❌ NOT FOUND');
    }
  }
}

verify()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
