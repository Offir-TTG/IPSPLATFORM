import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function simulateDisputeWebhook() {
  console.log('🎭 Simulating Stripe Dispute Webhook\n');

  // Get tenant and payment for realistic test
  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants?.[0]?.id;

  if (!tenantId) {
    console.log('❌ No tenant found');
    return;
  }

  // Try to find a real payment to link the dispute to
  const { data: payments } = await supabase
    .from('payments')
    .select('id, tenant_id, enrollment_id, user_id, stripe_payment_intent_id, amount, currency')
    .eq('tenant_id', tenantId)
    .not('stripe_payment_intent_id', 'is', null)
    .limit(1);

  const payment = payments?.[0];

  if (!payment) {
    console.log('⚠️  No payments found. Creating standalone test dispute...');
  } else {
    console.log('✅ Found payment to link dispute to:');
    console.log(`   Payment ID: ${payment.id}`);
    console.log(`   Amount: ${payment.currency} ${payment.amount}`);
  }

  // Simulate charge.dispute.created event
  const mockDisputeEvent = {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    type: 'charge.dispute.created',
    data: {
      object: {
        id: `dp_test_${Date.now()}`,
        object: 'dispute',
        amount: payment ? Math.round(parseFloat(payment.amount) * 100) : 9999,
        currency: payment?.currency.toLowerCase() || 'usd',
        charge: `ch_test_${Date.now()}`,
        payment_intent: payment?.stripe_payment_intent_id || `pi_test_${Date.now()}`,
        reason: 'fraudulent',
        status: 'needs_response',
        evidence_details: {
          due_by: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days from now
          submission_count: 0,
          has_evidence: false
        },
        is_charge_refundable: true,
        network_reason_code: 'fraudulent'
      }
    }
  };

  console.log('\n📤 Simulating webhook event:');
  console.log(JSON.stringify(mockDisputeEvent, null, 2));

  // Manually create the dispute (simulating what the webhook handler would do)
  console.log('\n💾 Creating dispute record...');

  const dispute = mockDisputeEvent.data.object;

  const disputeData = {
    tenant_id: tenantId,
    payment_id: payment?.id || null,
    enrollment_id: payment?.enrollment_id || null,
    user_id: payment?.user_id || null,
    stripe_dispute_id: dispute.id,
    stripe_charge_id: dispute.charge,
    amount: dispute.amount / 100,
    currency: dispute.currency.toUpperCase(),
    reason: dispute.reason,
    status: 'needs_response',
    evidence_due_date: new Date(dispute.evidence_details.due_by * 1000).toISOString(),
    evidence_submitted: false,
    metadata: {
      stripe_dispute_status: dispute.status,
      is_charge_refundable: dispute.is_charge_refundable,
      network_reason_code: dispute.network_reason_code,
      test: true
    }
  };

  const { data: createdDispute, error: createError } = await supabase
    .from('payment_disputes')
    .insert(disputeData)
    .select()
    .single();

  if (createError) {
    console.log('❌ Failed to create dispute:', createError.message);
    return;
  }

  console.log('✅ Dispute created successfully!');
  console.log('\n📋 Dispute Details:');
  console.log(`   ID: ${createdDispute.id}`);
  console.log(`   Stripe Dispute ID: ${createdDispute.stripe_dispute_id}`);
  console.log(`   Amount: ${createdDispute.currency} ${createdDispute.amount}`);
  console.log(`   Reason: ${createdDispute.reason}`);
  console.log(`   Status: ${createdDispute.status}`);
  console.log(`   Evidence Due: ${new Date(createdDispute.evidence_due_date).toLocaleString()}`);

  // Create notification
  console.log('\n🔔 Creating notification...');
  const { error: notifError } = await supabase.from('notifications').insert({
    type: 'payment_dispute_created',
    title: 'Payment Dispute Created',
    message: `A payment dispute of ${createdDispute.amount.toFixed(2)} ${createdDispute.currency} has been filed. Reason: ${createdDispute.reason}`,
    data: {
      dispute_id: createdDispute.stripe_dispute_id,
      payment_id: payment?.id,
      amount: createdDispute.amount,
      currency: createdDispute.currency,
      reason: createdDispute.reason
    },
    created_at: new Date().toISOString()
  });

  if (notifError) {
    console.log('⚠️  Could not create notification:', notifError.message);
  } else {
    console.log('✅ Notification created');
  }

  // Test querying the dispute
  console.log('\n🔍 Testing dispute query...');
  const { data: queriedDispute, error: queryError } = await supabase
    .from('payment_disputes')
    .select(`
      *,
      users (first_name, last_name, email),
      enrollments (
        id,
        products (title)
      ),
      payments (stripe_payment_intent_id)
    `)
    .eq('id', createdDispute.id)
    .single();

  if (queryError) {
    console.log('❌ Query failed:', queryError.message);
  } else {
    console.log('✅ Dispute queried with joins:');
    console.log(`   User: ${queriedDispute.users?.first_name || 'N/A'} ${queriedDispute.users?.last_name || ''}`);
    console.log(`   Product: ${queriedDispute.enrollments?.products?.title || 'N/A'}`);
  }

  console.log('\n🎉 Webhook simulation complete!');
  console.log('\n📝 Next Steps:');
  console.log(`   1. View in UI: /admin/payments/disputes`);
  console.log(`   2. Test evidence submission for dispute ID: ${createdDispute.id}`);
  console.log(`   3. Test status updates (needs_response → under_review → won/lost)`);
  console.log(`\n   To clean up: DELETE FROM payment_disputes WHERE id = '${createdDispute.id}';`);
}

simulateDisputeWebhook().then(() => process.exit(0));
