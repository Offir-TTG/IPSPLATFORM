/**
 * Find which payment schedule is linked to invoice in_1StsUdEMmMuRaOH0LwzwitTe
 * Run: npx ts-node scripts/find-orphaned-invoice.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findOrphanedInvoice() {
  try {
    console.log('🔍 Searching for payment schedule linked to invoice in_1StsUdEMmMuRaOH0LwzwitTe...\n');

    const targetInvoiceId = 'in_1StsUdEMmMuRaOH0LwzwitTe';

    // Search for payment schedule with this stripe_invoice_id
    const { data: schedules, error: scheduleError } = await supabase
      .from('payment_schedules')
      .select('*')
      .eq('stripe_invoice_id', targetInvoiceId);

    if (scheduleError) {
      console.error('❌ Error searching:', scheduleError);
      return;
    }

    if (!schedules || schedules.length === 0) {
      console.log('❌ No payment schedule found with stripe_invoice_id =', targetInvoiceId);
      console.log('');
      console.log('This means:');
      console.log('  - This Stripe invoice is NOT linked to any payment schedule');
      console.log('  - It is an orphaned/duplicate invoice');
      console.log('  - The "Pay Now" button will continue to show (which may be correct)');
      console.log('');
      console.log('Possible reasons:');
      console.log('  1. Invoice was created manually in Stripe without linking to schedule');
      console.log('  2. Invoice creation failed to update payment_schedule');
      console.log('  3. Invoice is for a different payment that hasn\'t been charged yet');
      return;
    }

    console.log(`✅ Found ${schedules.length} payment schedule(s):\n`);

    for (const schedule of schedules) {
      console.log('📋 Payment Schedule:');
      console.log('  ID:', schedule.id);
      console.log('  Payment #:', schedule.payment_number);
      console.log('  Amount:', `$${schedule.amount}`);
      console.log('  Status:', schedule.status);
      console.log('  Scheduled Date:', schedule.scheduled_date);
      console.log('  Stripe Invoice ID:', schedule.stripe_invoice_id);
      console.log('');

      if (schedule.status === 'paid') {
        console.log('✅ Status is "paid"');
        console.log('   → This should show "Payment is being processed"');
        console.log('   → If it\'s not showing, there may be a frontend caching issue');
      } else {
        console.log('❌ Status is "' + schedule.status + '"');
        console.log('   → This is why "Pay Now" button shows');
        console.log('   → This is correct behavior if payment hasn\'t been processed');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

findOrphanedInvoice();
