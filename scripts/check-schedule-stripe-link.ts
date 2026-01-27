/**
 * Check if payment schedule has proper Stripe invoice linking
 * Run: npx ts-node scripts/check-schedule-stripe-link.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkScheduleLink() {
  try {
    console.log('🔍 Checking payment schedule and Stripe invoice link...\n');

    const scheduleId = '216475a7-037d-428b-8e2d-e8d5f8ee4ac6';
    const stripeInvoiceId = 'in_1StvIFEMmMuRaOH0yrPvryt0';

    // Get payment schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('payment_schedules')
      .select('*')
      .eq('id', scheduleId)
      .single();

    if (scheduleError) {
      console.error('❌ Error fetching schedule:', scheduleError);
      return;
    }

    console.log('📋 Payment Schedule:', scheduleId);
    console.log('  Payment #:', schedule.payment_number);
    console.log('  Status:', schedule.status);
    console.log('  Amount:', `$${schedule.amount}`);
    console.log('  Stripe Invoice ID:', schedule.stripe_invoice_id);
    console.log('');

    if (schedule.stripe_invoice_id === stripeInvoiceId) {
      console.log('✅ Payment schedule is linked to the Stripe invoice');
    } else {
      console.log('❌ Payment schedule is NOT properly linked to the Stripe invoice');
      console.log('   Expected:', stripeInvoiceId);
      console.log('   Found:', schedule.stripe_invoice_id || 'None');
    }
    console.log('');

    // Check what invoices the user API would fetch
    console.log('🔍 Checking what the fetchInvoices logic would do...\n');

    console.log('Logic:');
    console.log('1. Fetch all Stripe invoices from /api/user/invoices');
    console.log('2. Each invoice has metadata.payment_schedule_id');
    console.log('3. Check if payment_schedule status === "paid"');
    console.log('4. If yes, set invoice.locallyPaid = true');
    console.log('5. Show "Payment is being processed" instead of "Pay Now"');
    console.log('');

    console.log('📊 For this case:');
    console.log('  Schedule ID:', scheduleId);
    console.log('  Schedule Status:', schedule.status);
    console.log('  Stripe Invoice ID:', schedule.stripe_invoice_id);
    console.log('');

    if (schedule.status === 'paid') {
      console.log('✅ Status is "paid"');
      console.log('   → IF Stripe invoice metadata has payment_schedule_id = "' + scheduleId + '"');
      console.log('   → THEN invoice.locallyPaid should be true');
      console.log('   → THEN should show: "התשלום מעובד" (Payment is being processed)');
    } else {
      console.log('❌ Status is NOT "paid"');
      console.log('   → Should show "Pay Now" button');
    }
    console.log('');

    console.log('🔑 Key Question:');
    console.log('Does the Stripe invoice metadata contain:');
    console.log('  payment_schedule_id: "' + scheduleId + '"?');
    console.log('');
    console.log('If NO: The invoice will NOT be matched and will show "Pay Now"');
    console.log('If YES: The invoice will be matched and show "Payment is being processed"');

  } catch (error) {
    console.error('Error:', error);
  }
}

checkScheduleLink();
