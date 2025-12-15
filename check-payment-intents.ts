import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkPaymentIntents() {
  const enrollmentId = process.argv[2] || '7051d98f-6709-403a-9fbd-b4a7dcaa6e73';

  const { data, error } = await supabase
    .from('payment_schedules')
    .select('id, payment_number, payment_type, stripe_payment_intent_id, status, amount')
    .eq('enrollment_id', enrollmentId)
    .order('payment_number');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Payment Schedules for Enrollment:', enrollmentId);
  console.log('');

  data?.forEach((schedule: any) => {
    console.log(`Payment #${schedule.payment_number} (${schedule.payment_type}):`);
    console.log(`  Amount: $${schedule.amount}`);
    console.log(`  Status: ${schedule.status}`);
    console.log(`  Intent ID: ${schedule.stripe_payment_intent_id || 'NONE'}`);
    console.log('');
  });

  const withIntent = data?.filter((s: any) => s.stripe_payment_intent_id) || [];
  console.log(`Total schedules: ${data?.length || 0}`);
  console.log(`With payment intent: ${withIntent.length}`);
  console.log(`Without payment intent: ${(data?.length || 0) - withIntent.length}`);
}

checkPaymentIntents().catch(console.error);
