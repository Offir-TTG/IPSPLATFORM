/**
 * Check Payment Intent Status in Stripe
 *
 * This script retrieves a payment intent from Stripe and displays its status and metadata
 * Usage: npx ts-node scripts/check-payment-intent-status.ts <schedule_id>
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPaymentIntentStatus(scheduleId: string) {
  console.log(`\n🔍 Checking payment intent status for schedule: ${scheduleId}\n`);

  // Get payment schedule from database
  const { data: schedule, error: scheduleError } = await supabase
    .from('payment_schedules')
    .select('*, enrollments!inner(tenant_id)')
    .eq('id', scheduleId)
    .single();

  if (scheduleError || !schedule) {
    console.error('❌ Schedule not found:', scheduleError);
    return;
  }

  console.log('📋 Schedule in Database:');
  console.log('  - ID:', schedule.id);
  console.log('  - Enrollment ID:', schedule.enrollment_id);
  console.log('  - Amount:', schedule.amount, schedule.currency);
  console.log('  - Payment Type:', schedule.payment_type);
  console.log('  - Status:', schedule.status);
  console.log('  - Payment Intent ID:', schedule.stripe_payment_intent_id || 'None');
  console.log('  - Payment ID:', schedule.payment_id || 'None');

  if (!schedule.stripe_payment_intent_id) {
    console.log('\n⚠️  No payment intent ID found in database');
    return;
  }

  // Get Stripe credentials
  const { data: integration } = await supabase
    .from('integrations')
    .select('credentials')
    .eq('tenant_id', (schedule.enrollments as any).tenant_id)
    .eq('integration_key', 'stripe')
    .single();

  if (!integration?.credentials?.secret_key) {
    console.error('❌ Stripe integration not configured');
    return;
  }

  // Initialize Stripe
  const stripe = new Stripe(integration.credentials.secret_key, {
    apiVersion: '2023-10-16',
  });

  // Retrieve payment intent from Stripe
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(schedule.stripe_payment_intent_id);

    console.log('\n💳 Payment Intent in Stripe:');
    console.log('  - ID:', paymentIntent.id);
    console.log('  - Status:', paymentIntent.status);
    console.log('  - Amount:', paymentIntent.amount / 100, paymentIntent.currency.toUpperCase());
    console.log('  - Created:', new Date(paymentIntent.created * 1000).toISOString());
    console.log('  - Customer:', paymentIntent.customer || 'None');
    console.log('  - Payment Method:', paymentIntent.payment_method || 'None');

    console.log('\n📦 Metadata:');
    Object.entries(paymentIntent.metadata).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value}`);
    });

    // Check if payment succeeded but database not updated
    if (paymentIntent.status === 'succeeded' && schedule.status !== 'paid') {
      console.log('\n⚠️  MISMATCH DETECTED:');
      console.log('  - Stripe status: succeeded ✓');
      console.log('  - Database status: pending ✗');
      console.log('  - This indicates webhook has NOT processed yet');

      // Check if payment record exists
      const { data: payment } = await supabase
        .from('payments')
        .select('id, status')
        .eq('stripe_payment_intent_id', paymentIntent.id)
        .single();

      if (payment) {
        console.log('  - Payment record exists:', payment.id, 'Status:', payment.status);
      } else {
        console.log('  - Payment record: NOT CREATED');
      }

      // Check webhook events
      const { data: webhooks } = await supabase
        .from('webhook_events')
        .select('event_type, processed_at')
        .eq('source', 'stripe')
        .contains('payload', { data: { object: { id: paymentIntent.id } } })
        .order('processed_at', { ascending: false })
        .limit(5);

      if (webhooks && webhooks.length > 0) {
        console.log('\n📨 Related Webhook Events:');
        webhooks.forEach(wh => {
          console.log(`  - ${wh.event_type} at ${wh.processed_at}`);
        });
      } else {
        console.log('\n❌ NO WEBHOOK EVENTS found for this payment intent');
        console.log('   This means webhooks are NOT being delivered!');
      }
    } else if (paymentIntent.status === 'succeeded' && schedule.status === 'paid') {
      console.log('\n✅ Status matches: Payment successful in both Stripe and database');
    } else {
      console.log(`\n⏳ Payment status: ${paymentIntent.status}`);
    }

  } catch (error: any) {
    console.error('\n❌ Error retrieving payment intent from Stripe:');
    console.error('  ', error.message);
  }
}

// Get schedule ID from command line
const scheduleId = process.argv[2];

if (!scheduleId) {
  console.error('Usage: npx ts-node scripts/check-payment-intent-status.ts <schedule_id>');
  console.error('Example: npx ts-node scripts/check-payment-intent-status.ts 2be55156-18e0-401d-97e3-05eefa4fb6ac');
  process.exit(1);
}

checkPaymentIntentStatus(scheduleId)
  .then(() => {
    console.log('\n✅ Check complete\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
