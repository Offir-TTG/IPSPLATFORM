/**
 * Backfill Payment IDs in Payment Schedules
 *
 * Links existing payment_schedules records to their corresponding payments records
 * by populating the payment_id field based on payment_schedule_id relationship
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfillPaymentIds() {
  console.log('🔄 Starting backfill of payment_id in payment_schedules...\n');

  try {
    // Find all payment_schedules that are paid but don't have payment_id set
    const { data: schedules, error: schedulesError } = await supabase
      .from('payment_schedules')
      .select('id, stripe_payment_intent_id')
      .eq('status', 'paid')
      .is('payment_id', null)
      .not('stripe_payment_intent_id', 'is', null);

    if (schedulesError) {
      console.error('❌ Error fetching payment schedules:', schedulesError);
      process.exit(1);
    }

    if (!schedules || schedules.length === 0) {
      console.log('✅ No payment schedules need backfilling. All records are up to date.');
      return;
    }

    console.log(`📊 Found ${schedules.length} payment schedules that need payment_id backfilled\n`);

    let updated = 0;
    let notFound = 0;
    let errors = 0;

    for (const schedule of schedules) {
      try {
        // Find the corresponding payment record by stripe_payment_intent_id
        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .select('id')
          .eq('stripe_payment_intent_id', schedule.stripe_payment_intent_id)
          .maybeSingle();

        if (paymentError) {
          console.error(`❌ Error finding payment for schedule ${schedule.id}:`, paymentError.message);
          errors++;
          continue;
        }

        if (!payment) {
          console.log(`⚠️  No payment found for schedule ${schedule.id} (intent: ${schedule.stripe_payment_intent_id})`);
          notFound++;
          continue;
        }

        // Update payment_schedule with payment_id
        const { error: updateError } = await supabase
          .from('payment_schedules')
          .update({ payment_id: payment.id })
          .eq('id', schedule.id);

        if (updateError) {
          console.error(`❌ Error updating schedule ${schedule.id}:`, updateError.message);
          errors++;
          continue;
        }

        updated++;
        console.log(`✓ Updated schedule ${schedule.id} with payment_id ${payment.id}`);
      } catch (err) {
        console.error(`❌ Unexpected error processing schedule ${schedule.id}:`, err);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 BACKFILL SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total schedules processed: ${schedules.length}`);
    console.log(`✅ Successfully updated: ${updated}`);
    console.log(`⚠️  Payment not found: ${notFound}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('='.repeat(60));

    if (updated > 0) {
      console.log('\n✅ Backfill completed successfully!');
      console.log('Payment schedules are now properly linked to payment records.');
    }

    if (notFound > 0) {
      console.log('\n⚠️  Some schedules could not be linked because payment records don\'t exist.');
      console.log('This is normal for schedules that were marked as paid before the payment system was implemented.');
    }
  } catch (error) {
    console.error('\n❌ Fatal error during backfill:', error);
    process.exit(1);
  }
}

backfillPaymentIds();
