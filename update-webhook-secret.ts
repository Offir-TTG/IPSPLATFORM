/**
 * Update Webhook Secret
 *
 * Updates the Stripe webhook secret in the database
 * Usage: npx tsx update-webhook-secret.ts whsec_your_secret_here
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function updateWebhookSecret(newSecret: string) {
  if (!newSecret || !newSecret.startsWith('whsec_')) {
    console.error('❌ Invalid webhook secret. Must start with "whsec_"');
    console.error('Usage: npx tsx update-webhook-secret.ts whsec_your_secret_here');
    return;
  }

  console.log('Updating Stripe webhook secret...\n');

  // Get current integration
  const { data: integration, error: fetchError } = await supabase
    .from('integrations')
    .select('*')
    .eq('integration_key', 'stripe')
    .single();

  if (fetchError || !integration) {
    console.error('❌ Could not find Stripe integration:', fetchError?.message);
    return;
  }

  console.log('Current Integration:');
  console.log('  ID:', integration.id);
  console.log('  Tenant ID:', integration.tenant_id);
  console.log('  Enabled:', integration.is_enabled);

  if (integration.credentials?.webhook_secret) {
    const oldSecret = integration.credentials.webhook_secret;
    console.log('  Old Secret:', oldSecret.substring(0, 15) + '...' + oldSecret.substring(oldSecret.length - 10));
  } else {
    console.log('  Old Secret: NOT SET');
  }

  // Update webhook secret
  const updatedCredentials = {
    ...integration.credentials,
    webhook_secret: newSecret,
  };

  const { error: updateError } = await supabase
    .from('integrations')
    .update({
      credentials: updatedCredentials,
      updated_at: new Date().toISOString(),
    })
    .eq('id', integration.id);

  if (updateError) {
    console.error('❌ Failed to update webhook secret:', updateError.message);
    return;
  }

  console.log('\n✅ Webhook secret updated successfully!');
  console.log('  New Secret:', newSecret.substring(0, 15) + '...' + newSecret.substring(newSecret.length - 10));
  console.log('\nNext steps:');
  console.log('1. Make sure Stripe CLI is running:');
  console.log('   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe');
  console.log('\n2. Test with trigger:');
  console.log('   stripe trigger payment_intent.succeeded');
  console.log('\n3. Check webhook events:');
  console.log('   npx tsx check-webhook-data.ts');
}

const secret = process.argv[2];

if (!secret) {
  console.error('❌ Missing webhook secret argument');
  console.error('Usage: npx tsx update-webhook-secret.ts whsec_your_secret_here');
  console.error('\nGet your webhook secret from:');
  console.error('1. Run: stripe listen --print-secret');
  console.error('2. Copy the secret that starts with "whsec_"');
  process.exit(1);
}

updateWebhookSecret(secret).catch(console.error);
