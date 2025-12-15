import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findEnrollment() {
  const { data } = await supabase
    .from('enrollments')
    .select('id, created_at, payment_start_date, product_id')
    .order('created_at', { ascending: false })
    .limit(3);

  console.log('Latest enrollments:');
  data?.forEach((e, idx) => {
    console.log(`${idx + 1}. ID: ${e.id}`);
    console.log(`   Product ID: ${e.product_id}`);
    console.log(`   Created: ${e.created_at}`);
    console.log(`   Payment Start Date: ${e.payment_start_date || 'NULL'}\n`);
  });
}

findEnrollment().catch(console.error);
