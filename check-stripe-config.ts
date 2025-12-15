import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStripeConfig() {
  console.log('Checking Stripe integration configuration...\n');

  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('integration_key', 'stripe')
    .single();

  if (error) {
    console.error('❌ Error fetching Stripe integration:', error.message);
    return;
  }

  if (!data) {
    console.log('❌ No Stripe integration found in database');
    console.log('\nYou need to configure Stripe in the admin integrations page.');
    return;
  }

  console.log('✅ Stripe integration exists');
  console.log('\nIntegration details:');
  console.log('- ID:', data.id);
  console.log('- Key:', data.integration_key);
  console.log('- Enabled:', data.enabled);
  console.log('- Tenant ID:', data.tenant_id || 'NULL (global)');

  if (data.credentials) {
    console.log('\nCredentials configuration:');
    console.log('- Publishable Key:', data.credentials.publishable_key ? '✅ Set' : '❌ Missing');
    console.log('- Secret Key:', data.credentials.secret_key ? '✅ Set' : '❌ Missing');
    console.log('- Webhook Secret:', data.credentials.webhook_secret ? '✅ Set' : '❌ Missing');

    if (data.credentials.webhook_secret) {
      console.log(`  → Starts with: ${data.credentials.webhook_secret.substring(0, 15)}...`);
    }
  } else {
    console.log('\n❌ No credentials object found');
  }

  // Check for recent webhook events
  console.log('\n\nChecking recent webhook events...');
  const { data: webhooks, error: webhookError } = await supabase
    .from('webhook_events')
    .select('*')
    .eq('source', 'stripe')
    .order('processed_at', { ascending: false })
    .limit(5);

  if (webhookError) {
    console.log('⚠️  Error fetching webhook events:', webhookError.message);
  } else if (!webhooks || webhooks.length === 0) {
    console.log('⚠️  No webhook events found');
    console.log('   This is expected if you haven\'t processed any payments yet.');
  } else {
    console.log(`✅ Found ${webhooks.length} recent webhook events:`);
    webhooks.forEach((wh, i) => {
      console.log(`\n${i + 1}. Event Type: ${wh.event_type}`);
      console.log(`   Processed: ${wh.processed_at}`);
    });
  }
}

checkStripeConfig();
