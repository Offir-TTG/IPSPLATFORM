import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPagination() {
  const tenantId = '70d86807-7e7c-49cd-8601-98235444e2ac';

  console.log('Testing pagination...\n');

  // Test page 1 with limit 20
  const page = 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  console.log(`Page: ${page}, Limit: ${limit}, Offset: ${offset}\n`);

  // Get total count
  const { count } = await supabase
    .from('payment_schedules')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  console.log(`Total count: ${count}\n`);

  // Get paginated data
  const { data, error } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('scheduled_date', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Returned ${data?.length || 0} schedules`);
    console.log('\nFirst 3 schedules:');
    data?.slice(0, 3).forEach((s, i) => {
      console.log(`${i + 1}. Payment #${s.payment_number}, Date: ${s.scheduled_date}`);
    });
  }

  // Test page 2
  console.log('\n\nTesting Page 2...\n');
  const page2 = 2;
  const offset2 = (page2 - 1) * limit;

  const { data: data2, error: error2 } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('scheduled_date', { ascending: true })
    .range(offset2, offset2 + limit - 1);

  if (error2) {
    console.error('Error:', error2);
  } else {
    console.log(`Page 2 returned ${data2?.length || 0} schedules`);
    console.log('\nFirst 3 schedules from page 2:');
    data2?.slice(0, 3).forEach((s, i) => {
      console.log(`${i + 1}. Payment #${s.payment_number}, Date: ${s.scheduled_date}`);
    });
  }
}

testPagination().catch(console.error);
