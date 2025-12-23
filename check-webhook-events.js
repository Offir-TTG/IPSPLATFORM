const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkWebhookEvents() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('='.repeat(80));
  console.log('CHECKING ZOOM WEBHOOK STATUS');
  console.log('='.repeat(80));

  // Check if webhook_events table has any Zoom events
  const { data: webhookEvents, error: webhookError } = await supabase
    .from('webhook_events')
    .select('*')
    .eq('source', 'zoom')
    .order('created_at', { ascending: false })
    .limit(10);

  if (webhookError) {
    console.error('Error fetching webhook events:', webhookError);
  } else {
    console.log('\nRecent Zoom Webhook Events:', webhookEvents?.length || 0);
    if (webhookEvents && webhookEvents.length > 0) {
      webhookEvents.forEach((event, index) => {
        console.log(`\n${index + 1}. Event Type: ${event.event_type}`);
        console.log(`   Created: ${event.created_at}`);
        console.log(`   Meeting ID: ${event.payload?.object?.id || 'N/A'}`);
      });
    } else {
      console.log('   ⚠️  No webhook events received yet');
    }
  }

  // Check zoom_sessions table for recordings
  const { data: recordings, error: recordingsError } = await supabase
    .from('zoom_sessions')
    .select('*')
    .not('recording_status', 'eq', 'none')
    .order('created_at', { ascending: false })
    .limit(5);

  if (recordingsError) {
    console.error('Error fetching recordings:', recordingsError);
  } else {
    console.log('\n\nZoom Sessions with Recordings:', recordings?.length || 0);
    if (recordings && recordings.length > 0) {
      recordings.forEach((rec, index) => {
        console.log(`\n${index + 1}. Meeting ID: ${rec.zoom_meeting_id}`);
        console.log(`   Recording Status: ${rec.recording_status}`);
        console.log(`   Play URL: ${rec.recording_play_url || 'N/A'}`);
        console.log(`   Download URL: ${rec.recording_download_url || 'N/A'}`);
        console.log(`   Created: ${rec.created_at}`);
      });
    } else {
      console.log('   ⚠️  No recordings in database yet');
    }
  }

  // Check Zoom integration settings
  const { data: integration } = await supabase
    .from('integrations')
    .select('*')
    .eq('integration_key', 'zoom')
    .single();

  console.log('\n\nZoom Integration Status:');
  console.log('  Enabled:', integration?.is_enabled || false);
  console.log('  Has webhook secret:', !!(integration?.settings?.webhook_secret_token || integration?.credentials?.webhook_secret_token));
  console.log('  Webhook URL:', integration?.webhook_url || 'Not set');

  console.log('\n' + '='.repeat(80));
  console.log('TROUBLESHOOTING STEPS:');
  console.log('='.repeat(80));
  console.log('\n1. VERIFY NGROK IS RUNNING:');
  console.log('   - Check ngrok terminal for active tunnel');
  console.log('   - Look for: "Forwarding https://xxx.ngrok.io -> http://localhost:3000"');

  console.log('\n2. VERIFY ZOOM WEBHOOK CONFIGURATION:');
  console.log('   - Go to: https://marketplace.zoom.us');
  console.log('   - Navigate to: Your App → Features → Event Subscriptions');
  console.log('   - Verify endpoint URL is: https://[your-ngrok].ngrok.io/api/webhooks/zoom');
  console.log('   - Check that "All Recordings have completed" is subscribed');
  console.log('   - Ensure validation shows green checkmark');

  console.log('\n3. TEST THE WEBHOOK ENDPOINT:');
  console.log('   - Your dev server must be running (npm run dev)');
  console.log('   - Visit: http://localhost:3000/api/webhooks/zoom');
  console.log('   - Should return JSON with supported events');

  console.log('\n4. VERIFY RECORDING SETTINGS:');
  console.log('   - Recording must be saved to Zoom Cloud (not local)');
  console.log('   - Wait 5-10 minutes after meeting ends for processing');
  console.log('   - Check Zoom web portal: https://zoom.us/recording');

  console.log('\n5. CHECK SERVER LOGS:');
  console.log('   - Watch your Next.js dev server console');
  console.log('   - Look for "[Zoom Webhook] Received event: recording.completed"');

  console.log('\n' + '='.repeat(80));
}

checkWebhookEvents().catch(console.error);
