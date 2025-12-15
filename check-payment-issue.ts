import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPaymentIssues() {
  console.log('🔍 Checking payment issues...\n');

  // Find enrollments with payment schedules
  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select('id, product_id, total_amount, paid_amount, payment_status')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching enrollments:', error);
    return;
  }

  for (const enrollment of enrollments) {
    console.log(`\n📋 Enrollment: ${enrollment.id}`);
    console.log(`  Total: $${enrollment.total_amount}, Paid: $${enrollment.paid_amount || 0}, Status: ${enrollment.payment_status}`);

    // Get payment schedules
    const { data: schedules } = await supabase
      .from('payment_schedules')
      .select('*')
      .eq('enrollment_id', enrollment.id)
      .order('payment_number', { ascending: true });

    if (schedules && schedules.length > 0) {
      console.log(`\n  📅 Payment Schedules (${schedules.length} total):`);

      let totalScheduled = 0;
      schedules.forEach((s, idx) => {
        totalScheduled += parseFloat(s.amount);
        console.log(`    ${idx + 1}. ${s.payment_type} (#${s.payment_number}): $${s.amount} - ${s.status} - Due: ${new Date(s.scheduled_date).toLocaleDateString()}`);
      });

      console.log(`  Total Scheduled: $${totalScheduled.toFixed(2)}`);

      // Check for discrepancy
      const diff = Math.abs(totalScheduled - enrollment.total_amount);
      if (diff > 0.01) {
        console.log(`  ⚠️  MISMATCH: Scheduled total ($${totalScheduled.toFixed(2)}) != Enrollment total ($${enrollment.total_amount})`);
      }
    }

    // Get payments (actual transactions)
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('enrollment_id', enrollment.id)
      .order('created_at', { ascending: false });

    if (payments && payments.length > 0) {
      console.log(`\n  💳 Payment Transactions (${payments.length} total):`);
      payments.forEach((p, idx) => {
        console.log(`    ${idx + 1}. $${p.amount} - ${p.status} - ${p.stripe_payment_intent_id || 'N/A'} - ${new Date(p.created_at).toLocaleString()}`);
      });

      // Check for duplicates
      const intentIds = payments.map(p => p.stripe_payment_intent_id).filter(Boolean);
      const duplicates = intentIds.filter((id, idx) => intentIds.indexOf(id) !== idx);
      if (duplicates.length > 0) {
        console.log(`  ⚠️  DUPLICATE TRANSACTIONS: ${duplicates.join(', ')}`);
      }
    }
  }
}

checkPaymentIssues().catch(console.error);
