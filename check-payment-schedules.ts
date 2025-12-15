import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchedules() {
  console.log('Checking payment schedules...\n');

  // Check if payment_schedules table exists and has data
  const { data: schedules, error } = await supabase
    .from('payment_schedules')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error querying payment_schedules:', error);
  } else {
    console.log(`Found ${schedules?.length || 0} payment schedules`);
    if (schedules && schedules.length > 0) {
      console.log('\nSample schedule:');
      console.log(JSON.stringify(schedules[0], null, 2));
    }
  }

  // Check enrollments with payment info
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('id, user_id, product_id, payment_status')
    .limit(5);

  if (enrollError) {
    console.error('Error querying enrollments:', enrollError);
  } else {
    console.log(`\nFound ${enrollments?.length || 0} enrollments`);
    if (enrollments && enrollments.length > 0) {
      console.log('\nSample enrollment:');
      console.log(JSON.stringify(enrollments[0], null, 2));
    }
  }

  // Check if tenant_id is set
  const { data: schedulesWithTenant, error: tenantError } = await supabase
    .from('payment_schedules')
    .select('tenant_id')
    .limit(1);

  if (!tenantError && schedulesWithTenant && schedulesWithTenant.length > 0) {
    console.log('\nTenant ID in payment_schedules:', schedulesWithTenant[0].tenant_id);
  }
}

checkSchedules();
