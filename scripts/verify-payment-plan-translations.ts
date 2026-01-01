import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTranslations() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      return;
    }

    const tenantId = tenants[0].id;

    const keys = [
      'user.profile.billing.oneTimePayment',
      'user.profile.billing.depositPlusInstallments',
      'user.profile.billing.subscription',
      'user.profile.billing.free',
      'user.profile.billing.fullPayment',
    ];

    console.log('\n📋 Checking payment plan translations:\n');

    for (const key of keys) {
      // Check Hebrew
      const { data: he } = await supabase
        .from('translations')
        .select('translation_value')
        .eq('tenant_id', tenantId)
        .eq('translation_key', key)
        .eq('language_code', 'he')
        .single();

      // Check English
      const { data: en } = await supabase
        .from('translations')
        .select('translation_value')
        .eq('tenant_id', tenantId)
        .eq('translation_key', key)
        .eq('language_code', 'en')
        .single();

      const heStatus = he ? `✓ ${he.translation_value}` : '✗ Missing';
      const enStatus = en ? `✓ ${en.translation_value}` : '✗ Missing';

      console.log(`${key}:`);
      console.log(`  HE: ${heStatus}`);
      console.log(`  EN: ${enStatus}`);
      console.log('');
    }

    console.log('✅ Verification complete!');
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyTranslations();
