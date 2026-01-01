import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkBillingInFirst1000() {
  const { data: tenants } = await adminClient.from('tenants').select('id').limit(1);
  const tenantId = tenants![0].id;

  // Get first 1000 (what export route gets for general translations)
  const { data: first1000 } = await adminClient
    .from('translations')
    .select('translation_key, translation_value')
    .eq('tenant_id', tenantId)
    .eq('language_code', 'he');

  console.log('Total fetched:', first1000?.length || 0);

  // Check if oneTimePayment is in there
  const oneTimePayment = first1000?.find(t => t.translation_key === 'user.profile.billing.oneTimePayment');
  console.log('\nuser.profile.billing.oneTimePayment in first 1000?');
  if (oneTimePayment) {
    console.log('  ✅ YES:', oneTimePayment.translation_value);
  } else {
    console.log('  ❌ NO - This is the problem!');
  }

  // Check all billing keys
  const billingKeys = first1000?.filter(t => t.translation_key.startsWith('user.profile.billing')) || [];
  console.log('\nuser.profile.billing.* keys in first 1000:', billingKeys.length);

  // Show position of 'user' keys
  const userKeys = first1000?.filter(t => t.translation_key.startsWith('user.')) || [];
  console.log('user.* keys in first 1000:', userKeys.length);

  if (userKeys.length > 0) {
    console.log('First user.* key:', userKeys[0].translation_key);
    console.log('Last user.* key:', userKeys[userKeys.length - 1].translation_key);
  }
}

checkBillingInFirst1000();
