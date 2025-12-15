import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  const tenantId = '70d86807-7e7c-49cd-8601-98235444e2ac';

  console.log('Testing the exact query from the API...\n');

  // Test the exact query from the API
  const { data, error } = await supabase
    .from('payment_schedules')
    .select(`
      *,
      enrollments!inner(
        id,
        user_id,
        users(first_name, last_name, email)
      ),
      payment_plans(plan_name, plan_type)
    `)
    .eq('tenant_id', tenantId)
    .order('scheduled_date', { ascending: true });

  if (error) {
    console.error('Query error:', error);
  } else {
    console.log(`Found ${data?.length || 0} schedules with the join query`);
    if (data && data.length > 0) {
      console.log('\nFirst result:');
      console.log(JSON.stringify(data[0], null, 2));
    }
  }

  // Test without the inner join
  console.log('\n\nTesting without inner join...');
  const { data: data2, error: error2 } = await supabase
    .from('payment_schedules')
    .select('*, enrollments(id, user_id)')
    .eq('tenant_id', tenantId)
    .limit(5);

  if (error2) {
    console.error('Query error:', error2);
  } else {
    console.log(`Found ${data2?.length || 0} schedules`);
    if (data2 && data2.length > 0) {
      console.log('\nFirst result:');
      console.log(JSON.stringify(data2[0], null, 2));
    }
  }
}

testQuery();
