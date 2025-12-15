/**
 * Process Successful Deposit Payment
 *
 * This script manually processes the $800 deposit payment that succeeded in Stripe
 * but wasn't captured by webhook due to Stripe CLI issue.
 *
 * Enrollment ID: 7051d98f-6709-403a-9fbd-b4a7dcaa6e73
 * Payment Intent: pi_3SdborEMmMuRaOH007rpiE5A (or the new one)
 * Amount: $800
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function processDeposit() {
  const enrollmentId = '7051d98f-6709-403a-9fbd-b4a7dcaa6e73';

  console.log('=== Processing Successful Deposit Payment ===\n');

  // Get enrollment details
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('*')
    .eq('id', enrollmentId)
    .single();

  if (enrollmentError || !enrollment) {
    console.error('❌ Could not find enrollment:', enrollmentError?.message);
    return;
  }

  console.log('Enrollment:', enrollment.id);
  console.log('Current Status:', enrollment.payment_status);
  console.log('Current Paid Amount:', enrollment.paid_amount);
  console.log('');

  // Get the deposit schedule
  const { data: depositSchedule, error: scheduleError } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .eq('payment_type', 'deposit')
    .single();

  if (scheduleError || !depositSchedule) {
    console.error('❌ Could not find deposit schedule:', scheduleError?.message);
    return;
  }

  console.log('Deposit Schedule:');
  console.log('  ID:', depositSchedule.id);
  console.log('  Amount:', depositSchedule.amount);
  console.log('  Current Status:', depositSchedule.status);
  console.log('  Payment Intent:', depositSchedule.stripe_payment_intent_id || 'NONE');
  console.log('');

  // Check if already processed
  if (depositSchedule.status === 'paid') {
    console.log('⚠️  Deposit already marked as paid!');

    const { data: existingPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .eq('amount', depositSchedule.amount)
      .single();

    if (existingPayment) {
      console.log('✅ Payment record exists. Nothing to do.');
      return;
    } else {
      console.log('⚠️  Schedule marked as paid but no payment record. Will create payment record.');
    }
  }

  console.log('Processing payment...\n');

  // 1. Create payment record
  const paymentIntentId = depositSchedule.stripe_payment_intent_id || 'manual_' + Date.now();

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      tenant_id: enrollment.tenant_id,
      enrollment_id: enrollment.id,
      payment_schedule_id: depositSchedule.id,
      product_id: enrollment.product_id,
      stripe_payment_intent_id: paymentIntentId,
      amount: depositSchedule.amount,
      currency: depositSchedule.currency.toUpperCase(),
      payment_type: 'deposit',
      status: 'succeeded',
      installment_number: 1,
      paid_at: new Date().toISOString(),
      metadata: {
        manually_processed: true,
        note: 'Payment succeeded in Stripe but webhook failed. Manually processed.',
      },
    })
    .select()
    .single();

  if (paymentError) {
    console.error('❌ Failed to create payment record:', paymentError.message);
    return;
  }

  console.log('✅ Payment record created:', payment.id);

  // 2. Update payment schedule
  const { error: updateScheduleError } = await supabase
    .from('payment_schedules')
    .update({
      status: 'paid',
      paid_date: new Date().toISOString(),
      payment_id: payment.id,
    })
    .eq('id', depositSchedule.id);

  if (updateScheduleError) {
    console.error('❌ Failed to update schedule:', updateScheduleError.message);
    return;
  }

  console.log('✅ Deposit schedule marked as paid');

  // 3. Update enrollment
  const paidAmount = parseFloat(depositSchedule.amount.toString());

  const { error: updateEnrollmentError } = await supabase
    .from('enrollments')
    .update({
      paid_amount: paidAmount,
      payment_status: 'partial', // Deposit paid, but not full amount
      status: 'pending', // Still pending full payment
      updated_at: new Date().toISOString(),
    })
    .eq('id', enrollmentId);

  if (updateEnrollmentError) {
    console.error('❌ Failed to update enrollment:', updateEnrollmentError.message);
    return;
  }

  console.log('✅ Enrollment updated');
  console.log('');

  console.log('=== Summary ===');
  console.log('✅ Deposit payment processed successfully');
  console.log(`   Amount Paid: $${paidAmount}`);
  console.log(`   Total Course: $${enrollment.total_amount}`);
  console.log(`   Remaining: $${enrollment.total_amount - paidAmount}`);
  console.log(`   Status: partial (deposit paid)`);
  console.log('');
  console.log('Next payment: Installment #2 ($513.33) due April 15, 2026');
  console.log('');
  console.log('⚠️  IMPORTANT: Fix Stripe CLI to capture future payments automatically!');
  console.log('See: FIX_STRIPE_CLI_NOW.md');
}

processDeposit().catch(console.error);
