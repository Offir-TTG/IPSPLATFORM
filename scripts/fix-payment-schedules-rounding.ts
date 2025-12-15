/**
 * Fix existing payment schedules with rounding issues
 *
 * This script:
 * 1. Finds all enrollments with payment schedules
 * 2. Recalculates the installment amounts with proper rounding
 * 3. Adds the rounding adjustment to the last installment
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPaymentSchedules() {
  console.log('🔧 Fixing payment schedule rounding issues...\n');

  // Get enrollments with payment schedules
  const { data: enrollments, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id, total_amount, product_id')
    .order('created_at', { ascending: false });

  if (enrollmentError) {
    console.error('Error fetching enrollments:', enrollmentError);
    return;
  }

  let fixedCount = 0;

  for (const enrollment of enrollments) {
    // Get payment schedules for this enrollment
    const { data: schedules, error: scheduleError } = await supabase
      .from('payment_schedules')
      .select('*')
      .eq('enrollment_id', enrollment.id)
      .order('payment_number', { ascending: true });

    if (scheduleError || !schedules || schedules.length === 0) {
      continue;
    }

    // Calculate total scheduled amount
    const totalScheduled = schedules.reduce((sum, s) => sum + parseFloat(s.amount), 0);
    const diff = Math.abs(totalScheduled - enrollment.total_amount);

    // If there's a discrepancy, fix it
    if (diff > 0.01) {
      console.log(`\n📋 Enrollment: ${enrollment.id}`);
      console.log(`   Total: $${enrollment.total_amount}, Scheduled: $${totalScheduled.toFixed(2)}, Diff: $${diff.toFixed(2)}`);

      // Find the deposit (if any)
      const depositSchedule = schedules.find(s => s.payment_type === 'deposit');
      const installmentSchedules = schedules.filter(s => s.payment_type === 'installment');

      if (installmentSchedules.length > 0) {
        const depositAmount = depositSchedule ? parseFloat(depositSchedule.amount) : 0;
        const remainingAmount = enrollment.total_amount - depositAmount;

        // Recalculate installments with proper rounding
        const baseInstallmentAmount = parseFloat((remainingAmount / installmentSchedules.length).toFixed(2));
        const totalRoundedInstallments = baseInstallmentAmount * installmentSchedules.length;
        const roundingAdjustment = parseFloat((remainingAmount - totalRoundedInstallments).toFixed(2));

        console.log(`   Recalculating ${installmentSchedules.length} installments...`);
        console.log(`   Base amount: $${baseInstallmentAmount}, Adjustment: $${roundingAdjustment}`);

        // Update installments
        for (let i = 0; i < installmentSchedules.length; i++) {
          const schedule = installmentSchedules[i];
          const isLast = i === installmentSchedules.length - 1;
          const newAmount = isLast
            ? parseFloat((baseInstallmentAmount + roundingAdjustment).toFixed(2))
            : baseInstallmentAmount;

          // Only update if amount changed
          if (Math.abs(parseFloat(schedule.amount) - newAmount) > 0.001) {
            const { error: updateError } = await supabase
              .from('payment_schedules')
              .update({ amount: newAmount })
              .eq('id', schedule.id);

            if (updateError) {
              console.error(`   ❌ Error updating schedule ${schedule.id}:`, updateError);
            } else {
              console.log(`   ✓ Updated installment #${schedule.payment_number}: $${schedule.amount} → $${newAmount}`);
            }
          }
        }

        fixedCount++;
      }
    }
  }

  console.log(`\n✅ Fixed ${fixedCount} enrollment(s) with rounding issues`);
}

fixPaymentSchedules().catch(console.error);
