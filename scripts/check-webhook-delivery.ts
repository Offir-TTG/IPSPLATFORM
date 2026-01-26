/**
 * Check Webhook Delivery Status
 *
 * This script checks if Stripe webhooks are being received and processed
 * Usage: npx ts-node scripts/check-webhook-delivery.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWebhookDelivery() {
  console.log('\n🔍 Checking webhook delivery status...\n');

  // Check recent webhook events in database
  const { data: webhooks, error } = await supabase
    .from('webhook_events')
    .select('*')
    .eq('source', 'stripe')
    .order('processed_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error querying webhook_events:', error);
    return;
  }

  if (!webhooks || webhooks.length === 0) {
    console.log('⚠️  NO WEBHOOK EVENTS FOUND in database');
    console.log('\nThis means one of the following:');
    console.log('  1. Stripe CLI is not forwarding webhooks to the Next.js server');
    console.log('  2. The webhook endpoint /api/webhooks/stripe is not receiving events');
    console.log('  3. The webhook endpoint is not saving events to the database');
    console.log('\n📋 Next steps:');
    console.log('  1. Check Stripe CLI command - should be:');
    console.log('     stripe listen --forward-to http://localhost:3000/api/webhooks/stripe');
    console.log('  2. Check Next.js server logs for "[Webhook]" messages');
    console.log('  3. Test manually: stripe trigger payment_intent.succeeded');
    return;
  }

  console.log(`✅ Found ${webhooks.length} recent webhook events:\n`);

  webhooks.forEach((wh, index) => {
    console.log(`${index + 1}. Event: ${wh.event_type}`);
    console.log(`   ID: ${wh.id}`);
    console.log(`   Processed: ${new Date(wh.processed_at).toLocaleString()}`);

    // Extract payment intent ID if available
    const payload = wh.payload as any;
    if (payload?.data?.object?.id) {
      console.log(`   Object ID: ${payload.data.object.id}`);
    }
    if (payload?.data?.object?.metadata) {
      console.log(`   Metadata: ${JSON.stringify(payload.data.object.metadata)}`);
    }
    console.log('');
  });

  // Check for payment_intent.succeeded events specifically
  const { data: successEvents } = await supabase
    .from('webhook_events')
    .select('*')
    .eq('source', 'stripe')
    .eq('event_type', 'payment_intent.succeeded')
    .order('processed_at', { ascending: false })
    .limit(5);

  console.log('\n💳 Payment Intent Success Events:\n');

  if (!successEvents || successEvents.length === 0) {
    console.log('⚠️  No payment_intent.succeeded events found');
    console.log('   This is the event that creates payment records and updates schedules');
  } else {
    successEvents.forEach((event, index) => {
      const payload = event.payload as any;
      const metadata = payload?.data?.object?.metadata || {};

      console.log(`${index + 1}. Payment Intent: ${payload?.data?.object?.id}`);
      console.log(`   Amount: ${payload?.data?.object?.amount / 100} ${payload?.data?.object?.currency}`);
      console.log(`   Enrollment ID: ${metadata.enrollment_id || 'Missing'}`);
      console.log(`   Schedule ID: ${metadata.schedule_id || 'Missing'}`);
      console.log(`   Processed: ${new Date(event.processed_at).toLocaleString()}`);
      console.log('');
    });
  }

  // Check if webhook events have proper metadata
  const recentSuccess = successEvents?.[0];
  if (recentSuccess) {
    const payload = recentSuccess.payload as any;
    const metadata = payload?.data?.object?.metadata || {};

    if (!metadata.enrollment_id || !metadata.schedule_id) {
      console.log('⚠️  WARNING: Most recent payment intent is missing metadata!');
      console.log('   Metadata:', JSON.stringify(metadata));
      console.log('   This will prevent webhook from updating payment tables');
    } else {
      // Check if payment was created for this event
      const { data: payment } = await supabase
        .from('payments')
        .select('id, status, amount')
        .eq('stripe_payment_intent_id', payload.data.object.id)
        .single();

      if (payment) {
        console.log('✅ Payment record created for most recent event:');
        console.log(`   Payment ID: ${payment.id}`);
        console.log(`   Status: ${payment.status}`);
        console.log(`   Amount: ${payment.amount}`);
      } else {
        console.log('❌ Payment record NOT CREATED for most recent event');
        console.log('   This indicates webhook processing failed');
      }
    }
  }

  // Check last 5 minutes for new events
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: recentWebhooks, count } = await supabase
    .from('webhook_events')
    .select('*', { count: 'exact' })
    .eq('source', 'stripe')
    .gte('processed_at', fiveMinutesAgo);

  console.log(`\n📊 Webhooks received in last 5 minutes: ${count || 0}`);

  if (count === 0) {
    console.log('⚠️  No recent webhooks - Stripe CLI may not be running');
  } else {
    console.log('✅ Webhooks are being delivered');
  }
}

checkWebhookDelivery()
  .then(() => {
    console.log('\n✅ Check complete\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
