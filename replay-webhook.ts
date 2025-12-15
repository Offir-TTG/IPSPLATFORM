/**
 * Replay Webhook Event
 *
 * Manually processes a webhook event that was logged but failed to process
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function replayWebhook(enrollmentId: string) {
  console.log('=== Replaying Webhook for Enrollment ===\n');

  // Get the webhook event
  const { data: webhookEvent } = await supabase
    .from('webhook_events')
    .select('*')
    .eq('event_type', 'payment_intent.succeeded')
    .order('processed_at', { ascending: false })
    .limit(1)
    .single();

  if (!webhookEvent) {
    console.error('❌ No payment_intent.succeeded webhook event found');
    return;
  }

  const payload = webhookEvent.payload as any;
  const paymentIntent = payload.data.object;

  console.log('Found webhook event:');
  console.log('  Event ID:', webhookEvent.event_id);
  console.log('  Payment Intent:', paymentIntent.id);
  console.log('  Amount:', paymentIntent.amount / 100);
  console.log('  Metadata:', paymentIntent.metadata);
  console.log('');

  const {
    tenant_id,
    enrollment_id,
    payment_type,
    schedule_id,
    payment_number,
  } = paymentIntent.metadata;

  // Get enrollment to get product_id
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('product_id')
    .eq('id', enrollment_id)
    .single();

  if (!enrollment) {
    console.error('❌ Enrollment not found');
    return;
  }

  console.log('Creating payment record...');

  // Create payment record
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      tenant_id,
      enrollment_id,
      payment_schedule_id: schedule_id,
      product_id: enrollment.product_id,
      stripe_payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      payment_type,
      status: 'succeeded',
      installment_number: parseInt(payment_number || '1'),
      paid_at: new Date().toISOString(),
      metadata: {
        payment_type,
        schedule_id,
        replayed: true,
        original_webhook_id: webhookEvent.event_id,
      },
    })
    .select()
    .single();

  if (paymentError) {
    console.error('❌ Failed to create payment:', paymentError.message);
    return;
  }

  console.log('✅ Payment record created:', payment.id);

  // Update payment schedule
  const { error: scheduleError } = await supabase
    .from('payment_schedules')
    .update({
      status: 'paid',
      paid_date: new Date().toISOString(),
    })
    .eq('id', schedule_id);

  if (scheduleError) {
    console.error('❌ Failed to update schedule:', scheduleError.message);
    return;
  }

  console.log('✅ Payment schedule updated');

  // Get all schedules to calculate total paid
  const { data: allSchedules } = await supabase
    .from('payment_schedules')
    .select('amount, status')
    .eq('enrollment_id', enrollment_id);

  const paidAmount = allSchedules
    ?.filter((s: any) => s.status === 'paid')
    .reduce((sum: number, s: any) => sum + parseFloat(s.amount.toString()), 0) || 0;

  const totalAmount = allSchedules
    ?.reduce((sum: number, s: any) => sum + parseFloat(s.amount.toString()), 0) || 0;

  const isFullyPaid = paidAmount >= totalAmount;

  // Update enrollment
  const { error: enrollmentError } = await supabase
    .from('enrollments')
    .update({
      paid_amount: paidAmount,
      payment_status: isFullyPaid ? 'paid' : 'partial',
      status: isFullyPaid ? 'active' : 'pending',
    })
    .eq('id', enrollment_id);

  if (enrollmentError) {
    console.error('❌ Failed to update enrollment:', enrollmentError.message);
    return;
  }

  console.log('✅ Enrollment updated');
  console.log('');
  console.log('=== Summary ===');
  console.log(`Total Paid: $${paidAmount} / $${totalAmount}`);
  console.log(`Status: ${isFullyPaid ? 'Fully Paid' : 'Partial Payment'}`);
}

const enrollmentId = process.argv[2] || 'b5bf73ca-0c4d-4224-bae7-b51c49ffd6b8';

replayWebhook(enrollmentId).catch(console.error);
