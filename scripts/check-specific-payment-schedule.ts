/**
 * Check specific payment and schedule status
 * Run: npx ts-node scripts/check-specific-payment-schedule.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkPaymentAndSchedule() {
  try {
    console.log('🔍 Checking payment and schedule status...\n');
    console.log('='.repeat(70));

    const paymentId = '2f4e2318-0de5-44cd-ada0-6a1d53501bbd';
    const scheduleId = '216475a7-037d-428b-8e2d-e8d5f8ee4ac6';

    // Check payment record
    console.log('\n1️⃣  PAYMENT RECORD');
    console.log('-'.repeat(70));

    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (payment) {
      console.log(`Payment ID: ${payment.id.substring(0, 8)}...`);
      console.log(`  Status: ${payment.status}`);
      console.log(`  Amount: ${payment.amount} ${payment.currency}`);
      console.log(`  Refunded Amount: ${payment.refunded_amount || '0.00'}`);
      console.log(`  Refunded At: ${payment.refunded_at || 'NULL'}`);
      console.log(`  Refund Reason: ${payment.refund_reason || 'NULL'}`);
      console.log(`  Schedule ID: ${payment.payment_schedule_id}`);
    } else {
      console.log('❌ Payment not found');
    }

    // Check schedule record
    console.log('\n2️⃣  PAYMENT SCHEDULE RECORD');
    console.log('-'.repeat(70));

    const { data: schedule } = await supabase
      .from('payment_schedules')
      .select('*')
      .eq('id', scheduleId)
      .single();

    if (schedule) {
      console.log(`Schedule ID: ${schedule.id.substring(0, 8)}...`);
      console.log(`  Status: ${schedule.status}`);
      console.log(`  Amount: ${schedule.amount} ${schedule.currency}`);
      console.log(`  Payment Number: ${schedule.payment_number}`);
      console.log(`  Payment Type: ${schedule.payment_type}`);
      console.log(`  Scheduled Date: ${schedule.scheduled_date}`);
      console.log(`  Paid Date: ${schedule.paid_date || 'NULL'}`);
    } else {
      console.log('❌ Schedule not found');
    }

    // Simulate what the transactions API would return
    console.log('\n3️⃣  WHAT TRANSACTIONS API WOULD RETURN');
    console.log('-'.repeat(70));

    let transactionStatus = 'pending';
    let refundAmount: number | undefined;

    if (schedule && payment) {
      if (schedule.status === 'refunded') {
        transactionStatus = 'refunded';
        refundAmount = payment.refunded_amount ? parseFloat(payment.refunded_amount) : parseFloat(schedule.amount);
      } else if (payment) {
        if (payment.status === 'refunded') transactionStatus = 'refunded';
        else if (payment.status === 'partially_refunded') transactionStatus = 'partially_refunded';
        else if (payment.status === 'paid') transactionStatus = 'completed';
        else if (payment.status === 'failed') transactionStatus = 'failed';

        refundAmount = payment.refunded_amount ? parseFloat(payment.refunded_amount) : undefined;
      }

      console.log(`Transaction Status: ${transactionStatus}`);
      console.log(`Refund Amount: ${refundAmount || 'undefined'}`);

      if (transactionStatus === 'partially_refunded' && refundAmount) {
        console.log('\n✅ This should show in UI with:');
        console.log(`   Status badge: "הוחזר חלקית" (Partially Refunded)`);
        console.log(`   Amount: ${schedule.amount} ${schedule.currency}`);
        console.log(`   Refunded: ${refundAmount} ${schedule.currency}`);
      } else {
        console.log('\n⚠️  Something is wrong - status or refund amount not set correctly');
      }
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('Error:', error);
  }
}

checkPaymentAndSchedule();
