/**
 * Manually Process Payment
 *
 * This script manually updates the database as if the webhook fired.
 * Use this ONLY for testing/recovery when webhook fails.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function manuallyProcessPayment(paymentIntentId: string) {
  console.log('=== Manually Processing Payment ===\n');
  console.log('Payment Intent ID:', paymentIntentId);
  console.log('');

  // Find the schedule with this payment intent
  const { data: schedule, error: scheduleError } = await supabase
    .from('payment_schedules')
    .select('*, enrollments(id, tenant_id, user_id, total_amount)')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single();

  if (scheduleError || !schedule) {
    console.error('❌ Could not find schedule with payment intent:', paymentIntentId);
    return;
  }

  console.log('Found Schedule:');
  console.log('  Schedule ID:', schedule.id);
  console.log('  Enrollment ID:', (schedule as any).enrollments.id);
  console.log('  Payment Type:', schedule.payment_type);
  console.log('  Amount:', schedule.amount);
  console.log('  Current Status:', schedule.status);
  console.log('');

  const enrollment = (schedule as any).enrollments;

  // Check if already processed
  if (schedule.status === 'paid') {
    console.log('⚠️  Schedule already marked as paid. Checking payment record...');

    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (existingPayment) {
      console.log('✅ Payment record already exists. Nothing to do.');
      return;
    }
  }

  console.log('Processing payment...\n');

  // 1. Create payment record
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      tenant_id: enrollment.tenant_id,
      user_id: enrollment.user_id,
      enrollment_id: enrollment.id,
      amount: schedule.amount,
      currency: schedule.currency.toUpperCase(),
      payment_method: 'stripe',
      transaction_id: paymentIntentId,
      stripe_payment_intent_id: paymentIntentId,
      status: 'completed',
      metadata: {
        payment_type: schedule.payment_type,
        schedule_id: schedule.id,
        manually_processed: true,
        processed_at: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (paymentError) {
    console.error('❌ Failed to create payment record:', paymentError);
    return;
  }

  console.log('✅ Payment record created:', payment.id);

  // 2. Update payment schedule to paid
  const { error: updateScheduleError } = await supabase
    .from('payment_schedules')
    .update({
      status: 'paid',
      paid_date: new Date().toISOString(),
    })
    .eq('id', schedule.id);

  if (updateScheduleError) {
    console.error('❌ Failed to update schedule:', updateScheduleError);
    return;
  }

  console.log('✅ Schedule marked as paid');

  // 3. Calculate total paid amount for enrollment
  const { data: allSchedules } = await supabase
    .from('payment_schedules')
    .select('amount, status')
    .eq('enrollment_id', enrollment.id);

  const paidAmount = allSchedules
    ?.filter((s: any) => s.status === 'paid')
    .reduce((sum: number, s: any) => sum + parseFloat(s.amount.toString()), 0) || 0;

  const totalAmount = parseFloat(enrollment.total_amount);
  const isFullyPaid = paidAmount >= totalAmount;
  const isDeposit = schedule.payment_type === 'deposit';

  // 4. Update enrollment
  const { error: updateEnrollmentError } = await supabase
    .from('enrollments')
    .update({
      paid_amount: paidAmount,
      payment_status: isFullyPaid ? 'paid' : 'partial',
      deposit_paid: isDeposit || undefined,
      status: isFullyPaid ? 'active' : 'pending',
    })
    .eq('id', enrollment.id);

  if (updateEnrollmentError) {
    console.error('❌ Failed to update enrollment:', updateEnrollmentError);
    return;
  }

  console.log('✅ Enrollment updated');
  console.log('   Paid Amount:', paidAmount);
  console.log('   Payment Status:', isFullyPaid ? 'paid' : 'partial');
  console.log('   Enrollment Status:', isFullyPaid ? 'active' : 'pending');
  console.log('');

  console.log('=== Summary ===');
  console.log('✅ Payment processed successfully');
  console.log(`   Amount: $${schedule.amount}`);
  console.log(`   Total Paid: $${paidAmount} / $${totalAmount}`);
  console.log(`   Remaining: $${totalAmount - paidAmount}`);
}

// Get payment intent ID from command line
const paymentIntentId = process.argv[2] || 'pi_3SdborEMmMuRaOH007rpiE5A';

manuallyProcessPayment(paymentIntentId).catch(console.error);
