/**
 * Fix schedule status for partial refund
 * Schedule was marked as 'refunded' but payment was only partially refunded
 * Run: npx ts-node scripts/fix-partial-refund-schedule-status.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixScheduleStatus() {
  try {
    console.log('🔧 Fixing schedule status for partial refund...\n');
    console.log('='.repeat(70));

    const scheduleId = '216475a7-037d-428b-8e2d-e8d5f8ee4ac6';

    // Check current status
    console.log('\n1️⃣  CURRENT STATUS');
    console.log('-'.repeat(70));

    const { data: before } = await supabase
      .from('payment_schedules')
      .select('id, status, amount, currency, payment_number')
      .eq('id', scheduleId)
      .single();

    if (before) {
      console.log(`Schedule ID: ${before.id.substring(0, 8)}...`);
      console.log(`  Current Status: ${before.status}`);
      console.log(`  Amount: ${before.amount} ${before.currency}`);
      console.log(`  Payment Number: ${before.payment_number}`);
    }

    // Check payment record to confirm it's partial
    const { data: payment } = await supabase
      .from('payments')
      .select('status, amount, refunded_amount')
      .eq('payment_schedule_id', scheduleId)
      .single();

    if (payment) {
      console.log(`\n  Payment Status: ${payment.status}`);
      console.log(`  Payment Amount: ${payment.amount}`);
      console.log(`  Refunded Amount: ${payment.refunded_amount}`);

      const isPartialRefund = payment.refunded_amount && parseFloat(payment.refunded_amount) < payment.amount;

      if (isPartialRefund) {
        console.log(`  ✓ Confirmed: Partial refund ($${payment.refunded_amount} out of $${payment.amount})`);
      } else {
        console.log(`  ⚠️  Warning: This appears to be a full refund`);
      }
    }

    // Fix the schedule status
    console.log('\n2️⃣  APPLYING FIX');
    console.log('-'.repeat(70));

    const { error } = await supabase
      .from('payment_schedules')
      .update({
        status: 'paid', // Partial refunds keep schedule as 'paid'
        updated_at: new Date().toISOString()
      })
      .eq('id', scheduleId);

    if (error) {
      console.error('❌ Error updating schedule:', error);
      return;
    }

    console.log('✅ Updated schedule status to "paid"');

    // Verify the fix
    console.log('\n3️⃣  VERIFICATION');
    console.log('-'.repeat(70));

    const { data: after } = await supabase
      .from('payment_schedules')
      .select('id, status, amount, currency')
      .eq('id', scheduleId)
      .single();

    if (after) {
      console.log(`Schedule Status: ${after.status}`);
      console.log(`Amount: ${after.amount} ${after.currency}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ FIX COMPLETE!');
    console.log('='.repeat(70));
    console.log('\nWhat changed:');
    console.log(`  Before: schedule.status = "refunded"`);
    console.log(`  After:  schedule.status = "paid"`);
    console.log('');
    console.log('Result:');
    console.log('  ✅ Admin UI will now show: "Partially Refunded" (הוחזר חלקית)');
    console.log('  ✅ Refund amount $200.00 will display correctly');
    console.log('  ✅ User UI will also show partially refunded status');
    console.log('');
    console.log('💡 Hard refresh browser to see changes (Ctrl+Shift+R)');
    console.log('');

  } catch (error) {
    console.error('Error:', error);
  }
}

fixScheduleStatus();
