/**
 * Check status of payment #5 for the invoice shown
 * Run: npx ts-node scripts/check-payment-5-status.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkPaymentStatus() {
  try {
    console.log('🔍 Checking payment #5 status...\n');

    // Find payment schedule #5 with amount $540.83
    const { data: schedules, error: scheduleError } = await supabase
      .from('payment_schedules')
      .select('*')
      .eq('payment_number', 5)
      .eq('amount', 540.83)
      .order('created_at', { ascending: false })
      .limit(5);

    if (scheduleError) {
      console.error('❌ Error fetching schedules:', scheduleError);
      return;
    }

    if (!schedules || schedules.length === 0) {
      console.log('❌ No payment schedules found for payment #5 with amount $540.83');
      return;
    }

    console.log(`✅ Found ${schedules.length} payment schedule(s):\n`);

    for (const schedule of schedules) {
      // Fetch enrollment info separately
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('invoice_number, user_id')
        .eq('id', schedule.enrollment_id)
        .single();

      console.log('📋 Payment Schedule:');
      console.log('  ID:', schedule.id);
      console.log('  Payment #:', schedule.payment_number);
      console.log('  Amount:', `$${schedule.amount}`);
      console.log('  Status:', schedule.status);
      console.log('  Scheduled Date:', schedule.scheduled_date);
      console.log('  Stripe Invoice ID:', schedule.stripe_invoice_id || 'None');
      console.log('  Enrollment ID:', schedule.enrollment_id);
      console.log('  Enrollment Invoice #:', enrollment?.invoice_number || 'N/A');

      // Check if there's a payment record for this schedule
      const { data: payments, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('payment_schedule_id', schedule.id)
        .order('created_at', { ascending: false });

      if (paymentError) {
        console.error('  ❌ Error fetching payments:', paymentError);
      } else if (!payments || payments.length === 0) {
        console.log('  ⚠️  No payment records found for this schedule');
      } else {
        console.log(`  💰 Payment Records (${payments.length}):`);
        payments.forEach((payment, idx) => {
          console.log(`    Payment ${idx + 1}:`);
          console.log('      ID:', payment.id);
          console.log('      Amount:', `$${payment.amount}`);
          console.log('      Status:', payment.status);
          console.log('      Refunded Amount:', payment.refunded_amount ? `$${payment.refunded_amount}` : 'None');
          console.log('      Created:', payment.created_at);
        });
      }

      console.log('\n' + '='.repeat(60) + '\n');
    }

    // Summary for the UI logic
    console.log('📊 Summary for UI Logic:');
    const firstSchedule = schedules[0];
    console.log('  Schedule Status:', firstSchedule.status);

    if (firstSchedule.status === 'paid') {
      console.log('  ✅ Should show: "Payment is being processed" (התשלום מעובד)');
    } else {
      console.log('  ✅ Should show: "Pay Now" button (שלם עכשיו)');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkPaymentStatus();
