import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkEnrollment() {
  // Get the most recent enrollment
  const { data: enrollment, error } = await supabase
    .from('enrollments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n=== Latest Enrollment ===');
  console.log('ID:', enrollment.id);
  console.log('Status:', enrollment.status);
  console.log('Payment Status:', enrollment.payment_status);
  console.log('Total Amount:', enrollment.total_amount);
  console.log('Paid Amount:', enrollment.paid_amount);
  console.log('Created:', enrollment.created_at);
  console.log('Updated:', enrollment.updated_at);

  // Get payment schedules
  const { data: schedules } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('enrollment_id', enrollment.id)
    .order('due_date', { ascending: true });

  console.log('\n=== Payment Schedules ===');
  schedules?.forEach((s, i) => {
    console.log(`\nSchedule ${i + 1}:`);
    console.log('  Type:', s.payment_type);
    console.log('  Amount:', s.amount);
    console.log('  Status:', s.status);
    console.log('  Due Date:', s.due_date);
    console.log('  Paid Date:', s.paid_date);
  });

  // Get payments
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('enrollment_id', enrollment.id)
    .order('paid_at', { ascending: false });

  console.log('\n=== Payments ===');
  if (payments && payments.length > 0) {
    payments.forEach((p, i) => {
      console.log(`\nPayment ${i + 1}:`);
      console.log('  Amount:', p.amount);
      console.log('  Type:', p.payment_type);
      console.log('  Status:', p.status);
      console.log('  Paid At:', p.paid_at);
      console.log('  Stripe Intent:', p.stripe_payment_intent_id);
    });
  } else {
    console.log('No payments found');
  }
}

checkEnrollment().catch(console.error);
