/**
 * Check status of payment #4 (invoice 1MMYTZDY-0004)
 * Run: npx ts-node scripts/check-payment-4-status.ts
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
    console.log('🔍 Checking payment #4 status...\n');

    // Find payment schedule #4
    const { data: schedules, error: scheduleError } = await supabase
      .from('payment_schedules')
      .select('*')
      .eq('payment_number', 4)
      .order('created_at', { ascending: false })
      .limit(5);

    if (scheduleError) {
      console.error('❌ Error fetching schedules:', scheduleError);
      return;
    }

    if (!schedules || schedules.length === 0) {
      console.log('❌ No payment schedules found for payment #4');
      return;
    }

    console.log(`✅ Found ${schedules.length} payment schedule(s) for payment #4:\n`);

    for (const schedule of schedules) {
      console.log('📋 Payment Schedule:');
      console.log('  ID:', schedule.id);
      console.log('  Payment #:', schedule.payment_number);
      console.log('  Amount:', `$${schedule.amount}`);
      console.log('  Status:', schedule.status);
      console.log('  Stripe Invoice ID:', schedule.stripe_invoice_id || 'None');
      console.log('');

      if (schedule.stripe_invoice_id === 'in_1StsUdEMmMuRaOH0LwzwitTe') {
        console.log('✅ This is the schedule for invoice 1MMYTZDY-0004');
        console.log('');

        if (schedule.status === 'paid') {
          console.log('✅ Status is "paid" - Should show "Payment is being processed"');
        } else {
          console.log('❌ Status is NOT "paid" (it is "' + schedule.status + '")');
          console.log('   This is why it shows "Pay Now" button');
          console.log('');
          console.log('💡 To fix: Update payment_schedule status to "paid"');
          console.log('   Either:');
          console.log('   1. Admin uses "Charge Now" button');
          console.log('   2. Manually update: UPDATE payment_schedules SET status = \'paid\' WHERE id = \'' + schedule.id + '\';');
        }
      }

      console.log('\n' + '='.repeat(60) + '\n');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkPaymentStatus();
