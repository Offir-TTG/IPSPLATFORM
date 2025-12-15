/**
 * Fix Payment Schedule Dates
 *
 * This script fixes payment schedules to use the product's payment_start_date
 * instead of the current date.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function addMonthsUTC(date: Date, months: number): Date {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

async function fixPaymentDates() {
  console.log('🔧 Fixing payment schedule dates...\n');

  // Get enrollment with payment_start_date
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, product_id, payment_start_date')
    .eq('id', 'fe8cc3d2-5e25-4752-8b2d-70dda4ad5855')
    .single();

  if (!enrollment) {
    console.log('Enrollment not found');
    return;
  }

  // If enrollment doesn't have payment_start_date, get it from product
  let paymentStartDate = enrollment.payment_start_date;

  if (!paymentStartDate) {
    const { data: product } = await supabase
      .from('products')
      .select('payment_start_date')
      .eq('id', enrollment.product_id)
      .single();

    if (product?.payment_start_date) {
      paymentStartDate = product.payment_start_date;

      // Update enrollment with product's payment_start_date
      await supabase
        .from('enrollments')
        .update({ payment_start_date: product.payment_start_date })
        .eq('id', enrollment.id);

      console.log('✅ Updated enrollment with product payment_start_date\n');
    }
  }

  if (!paymentStartDate) {
    console.log('No payment_start_date found in enrollment or product');
    return;
  }

  console.log('Enrollment ID:', enrollment.id);
  console.log('Payment Start Date:', paymentStartDate);

  const startDate = new Date(paymentStartDate);

  // Get payment schedules
  const { data: schedules } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('enrollment_id', enrollment.id)
    .order('payment_number', { ascending: true });

  if (!schedules || schedules.length === 0) {
    console.log('No payment schedules found');
    return;
  }

  console.log(`\nFound ${schedules.length} payment schedules\n`);

  let depositSchedule = schedules.find(s => s.payment_type === 'deposit');
  let installmentSchedules = schedules.filter(s => s.payment_type === 'installment');

  console.log('Updating installment dates...');

  for (let i = 0; i < installmentSchedules.length; i++) {
    const schedule = installmentSchedules[i];
    const oldDate = new Date(schedule.scheduled_date);

    // Calculate new date: startDate + i months
    const newDate = addMonthsUTC(startDate, i);

    console.log(`  Installment #${schedule.payment_number}:`);
    console.log(`    Old: ${oldDate.toISOString().split('T')[0]}`);
    console.log(`    New: ${newDate.toISOString().split('T')[0]}`);

    // Update the schedule
    const { error } = await supabase
      .from('payment_schedules')
      .update({
        scheduled_date: newDate.toISOString(),
        original_due_date: newDate.toISOString(),
      })
      .eq('id', schedule.id);

    if (error) {
      console.error(`    ❌ Error:`, error);
    } else {
      console.log(`    ✅ Updated`);
    }
  }

  console.log('\n✅ Payment schedule dates updated!');
}

fixPaymentDates().catch(console.error);
