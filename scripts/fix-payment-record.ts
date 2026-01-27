/**
 * Fix payment record with missing data
 * Run: npx ts-node scripts/fix-payment-record.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixPaymentRecord() {
  try {
    const paymentId = '2f4e2318-0de5-44cd-ada0-6a1d53501bbd';
    const scheduleId = '216475a7-037d-428b-8e2d-e8d5f8ee4ac6';

    console.log('🔧 Fixing payment record...\n');

    // Get schedule data to fill in missing fields
    const { data: schedule } = await supabase
      .from('payment_schedules')
      .select('enrollment_id, payment_plan_id, payment_number, payment_type, amount')
      .eq('id', scheduleId)
      .single();

    if (!schedule) {
      console.error('Schedule not found');
      return;
    }

    console.log('Schedule data:');
    console.log(`  Payment Number: ${schedule.payment_number}`);
    console.log(`  Payment Type: ${schedule.payment_type}`);
    console.log(`  Payment Plan ID: ${schedule.payment_plan_id}`);
    console.log(`  Amount: ${schedule.amount}`);

    // Get enrollment data for product_id
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('product_id')
      .eq('id', schedule.enrollment_id)
      .single();

    console.log(`\nEnrollment Product ID: ${enrollment?.product_id}`);

    // Update payment record with complete data
    const { data: updated, error } = await supabase
      .from('payments')
      .update({
        // Fill in missing initial data
        installment_number: schedule.payment_number,
        product_id: enrollment?.product_id,
        payment_plan_id: schedule.payment_plan_id,
        payment_type: schedule.payment_type,
        metadata: {
          payment_number: schedule.payment_number,
          payment_type: schedule.payment_type,
          original_schedule_id: scheduleId,
        },
        // Fill in missing refund data
        status: 'refunded',
        refunded_amount: parseFloat(schedule.amount.toString()),
        refunded_at: new Date('2026-01-26T19:56:44.971033+00:00').toISOString(), // From schedule updated_at
        refund_reason: 'Admin refund',
      })
      .eq('id', paymentId)
      .select();

    if (error) {
      console.error('\n❌ Error updating payment:', error);
    } else {
      console.log('\n✅ Payment record updated successfully!');
      console.log('\nUpdated payment:');
      console.log(JSON.stringify(updated[0], null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

fixPaymentRecord();
