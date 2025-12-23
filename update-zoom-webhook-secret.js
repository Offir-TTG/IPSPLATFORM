const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function updateWebhookSecret() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get the webhook secret from command line argument
  const webhookSecret = process.argv[2];

  if (!webhookSecret) {
    console.error('ERROR: Please provide the webhook secret token as an argument');
    console.log('\nUsage:');
    console.log('  node update-zoom-webhook-secret.js YOUR_WEBHOOK_SECRET_TOKEN');
    console.log('\nExample:');
    console.log('  node update-zoom-webhook-secret.js abc123xyz456');
    process.exit(1);
  }

  console.log('='.repeat(80));
  console.log('UPDATING ZOOM WEBHOOK SECRET');
  console.log('='.repeat(80));

  // Get current Zoom integration
  const { data: integration, error: fetchError } = await supabase
    .from('integrations')
    .select('*')
    .eq('integration_key', 'zoom')
    .single();

  if (fetchError || !integration) {
    console.error('Error fetching Zoom integration:', fetchError);
    process.exit(1);
  }

  console.log('\nCurrent integration settings:');
  console.log('  Tenant ID:', integration.tenant_id);
  console.log('  Enabled:', integration.is_enabled);
  console.log('  Has webhook secret:', !!(integration.settings?.webhook_secret_token || integration.credentials?.webhook_secret_token));

  // Update the integration with webhook secret
  // We'll add it to the settings field
  const updatedSettings = {
    ...integration.settings,
    webhook_secret_token: webhookSecret
  };

  const { error: updateError } = await supabase
    .from('integrations')
    .update({
      settings: updatedSettings,
      updated_at: new Date().toISOString()
    })
    .eq('id', integration.id);

  if (updateError) {
    console.error('Error updating integration:', updateError);
    process.exit(1);
  }

  console.log('\n✅ Successfully updated webhook secret!');
  console.log('\nNext steps:');
  console.log('  1. Make sure ngrok is running: ngrok http 3000');
  console.log('  2. Copy your ngrok HTTPS URL');
  console.log('  3. Go to marketplace.zoom.us → Your App → Event Subscriptions');
  console.log('  4. Add webhook URL: https://[your-ngrok-url].ngrok.io/api/webhooks/zoom');
  console.log('  5. Subscribe to "All Recordings have completed" event');
  console.log('  6. Test by ending a recorded meeting');
  console.log('='.repeat(80));
}

updateWebhookSecret().catch(console.error);
