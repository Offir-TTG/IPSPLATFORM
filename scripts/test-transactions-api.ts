/**
 * Test transactions API response
 * Run: npx ts-node scripts/test-transactions-api.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testTransactionsAPI() {
  try {
    console.log('🔍 Testing transactions API logic...\n');

    const tenantId = '70d86807-7e7c-49cd-8601-98235444e2ac';
    const refundedScheduleId = '216475a7-037d-428b-8e2d-e8d5f8ee4ac6';

    // Get the refunded schedule
    const { data: schedule, error: schedError } = await supabase
      .from('payment_schedules')
      .select('id, amount, status, stripe_payment_intent_id, enrollment_id, payment_number')
      .eq('id', refundedScheduleId)
      .single();

    if (schedError) {
      console.error('Error fetching schedule:', schedError);
      return;
    }

    console.log('Refunded Schedule:');
    console.log(`  ID: ${schedule.id}`);
    console.log(`  Status: ${schedule.status}`);
    console.log(`  Amount: ${schedule.amount}`);
    console.log(`  Payment Number: ${schedule.payment_number}`);

    // Check if there's a payment record
    const { data: payment } = await supabase
      .from('payments')
      .select('id, status, refunded_amount, refunded_at')
      .eq('payment_schedule_id', refundedScheduleId)
      .maybeSingle();

    console.log('\nPayment Record:');
    if (payment) {
      console.log(`  ID: ${payment.id}`);
      console.log(`  Status: ${payment.status}`);
      console.log(`  Refunded Amount: ${payment.refunded_amount || 'NULL'}`);
      console.log(`  Refunded At: ${payment.refunded_at || 'NULL'}`);
    } else {
      console.log('  No payment record found');
    }

    // Simulate the API logic
    console.log('\n=== API LOGIC SIMULATION ===\n');

    let transactionStatus: 'completed' | 'pending' | 'failed' | 'refunded' | 'partially_refunded' = 'pending';
    let refundAmount: number | undefined = undefined;

    // This is the exact logic from the API
    if (schedule.status === 'refunded') {
      transactionStatus = 'refunded';
      refundAmount = payment?.refunded_amount
        ? parseFloat(payment.refunded_amount)
        : parseFloat(schedule.amount);
      console.log('✓ Schedule status is "refunded"');
      console.log(`  → Transaction Status: ${transactionStatus}`);
      console.log(`  → Refund Amount: ${refundAmount}`);
    } else if (payment) {
      console.log('✗ Schedule status is NOT "refunded", checking payment record...');
      if (payment.status === 'refunded') transactionStatus = 'refunded';
      else if (payment.status === 'partially_refunded') transactionStatus = 'partially_refunded';
      else if (payment.status === 'succeeded') transactionStatus = 'completed';
      else if (payment.status === 'failed') transactionStatus = 'failed';
      refundAmount = payment.refunded_amount ? parseFloat(payment.refunded_amount) : undefined;
      console.log(`  → Transaction Status: ${transactionStatus}`);
    } else {
      console.log('✗ Schedule status is NOT "refunded" and no payment record');
      if (schedule.status === 'paid') transactionStatus = 'completed';
      else if (schedule.status === 'failed') transactionStatus = 'failed';
      console.log(`  → Transaction Status: ${transactionStatus}`);
    }

    console.log('\n=== EXPECTED API RESPONSE ===');
    console.log({
      id: schedule.id,
      status: transactionStatus,
      refund_amount: refundAmount,
      amount: parseFloat(schedule.amount),
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

testTransactionsAPI();
