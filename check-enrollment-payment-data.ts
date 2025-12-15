import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkEnrollmentData() {
  console.log('Checking enrollment payment plan data...\n');

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id, payment_model, payment_plan, payment_plan_key, payment_plan_data, total_amount, paid_amount')
    .limit(3);

  if (enrollments && enrollments.length > 0) {
    enrollments.forEach((enrollment: any, idx: number) => {
      console.log(`\n=== Enrollment ${idx + 1} ===`);
      console.log('ID:', enrollment.id);
      console.log('Payment Model:', enrollment.payment_model);
      console.log('Payment Plan Key:', enrollment.payment_plan_key);
      console.log('\nPayment Plan Data:');
      console.log(JSON.stringify(enrollment.payment_plan_data, null, 2));
      console.log('\nPayment Plan (legacy field):');
      console.log(JSON.stringify(enrollment.payment_plan, null, 2));
      console.log('Total Amount:', enrollment.total_amount);
      console.log('Paid Amount:', enrollment.paid_amount);
    });
  } else {
    console.log('No enrollments found');
  }
}

checkEnrollmentData().catch(console.error);
