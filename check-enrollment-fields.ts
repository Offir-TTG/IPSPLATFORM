import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkEnrollmentData() {
  console.log('Checking enrollment payment plan data...\n');

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*')
    .limit(1);

  if (enrollments && enrollments.length > 0) {
    const enrollment = enrollments[0];
    console.log('=== Full Enrollment Data ===');
    console.log(JSON.stringify(enrollment, null, 2));
    
    console.log('\n=== payment_plan_data ===');
    console.log(JSON.stringify(enrollment.payment_plan_data, null, 2));
    
    console.log('\n=== payment_plan ===');
    console.log(JSON.stringify(enrollment.payment_plan, null, 2));
  } else {
    console.log('No enrollments found');
  }
}

checkEnrollmentData().catch(console.error);
