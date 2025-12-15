import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifySecret() {
  console.log('Checking webhook secret in database...\n');

  const { data, error } = await supabase
    .from('integrations')
    .select('id, tenant_id, integration_key, is_enabled, credentials')
    .eq('integration_key', 'stripe')
    .single();

  if (error) {
    console.error('❌ Error fetching integration:', error);
    return;
  }

  if (!data) {
    console.error('❌ No Stripe integration found');
    return;
  }

  console.log('Integration Details:');
  console.log('  ID:', data.id);
  console.log('  Tenant ID:', data.tenant_id);
  console.log('  Enabled:', data.is_enabled);
  console.log('');

  console.log('Credentials:');
  console.log('  Has secret_key:', !!data.credentials?.secret_key);
  console.log('  Has publishable_key:', !!data.credentials?.publishable_key);
  console.log('  Has webhook_secret:', !!data.credentials?.webhook_secret);
  console.log('');

  if (data.credentials?.webhook_secret) {
    const secret = data.credentials.webhook_secret;
    console.log('✅ Webhook Secret Found:');
    console.log('  ', secret.substring(0, 20) + '...' + secret.substring(secret.length - 15));
  } else {
    console.error('❌ Webhook secret is MISSING!');
    console.log('  Run: npx tsx update-webhook-secret.ts whsec_YOUR_SECRET');
  }
}

verifySecret().catch(console.error);
