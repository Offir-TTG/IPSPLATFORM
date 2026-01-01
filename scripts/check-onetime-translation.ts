import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkOneTimeTranslation() {
  const { data: tenants } = await adminClient.from('tenants').select('id').limit(1);
  const tenantId = tenants![0].id;

  console.log('Checking one-time payment translation...\n');

  // Check for the key
  const { data: heTranslation } = await adminClient
    .from('translations')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('translation_key', 'user.profile.billing.oneTimePayment')
    .eq('language_code', 'he')
    .maybeSingle();

  console.log('Hebrew translation for "user.profile.billing.oneTimePayment":');
  if (heTranslation) {
    console.log('  Found:', heTranslation.translation_value);
  } else {
    console.log('  NOT FOUND ❌');
  }

  // Check related keys
  const { data: relatedKeys } = await adminClient
    .from('translations')
    .select('translation_key, translation_value')
    .eq('tenant_id', tenantId)
    .eq('language_code', 'he')
    .like('translation_key', 'user.profile.billing%');

  console.log('\nAll user.profile.billing.* keys:');
  relatedKeys?.forEach(t => {
    console.log(`  ${t.translation_key}: ${t.translation_value}`);
  });
}

checkOneTimeTranslation();
