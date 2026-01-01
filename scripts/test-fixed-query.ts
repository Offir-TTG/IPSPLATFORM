import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFixedQuery() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    const tenantId = tenants![0].id;

    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    console.log('Testing FIXED query...\n');

    const { data: paidSchedules, error } = await supabase
      .from('payment_schedules')
      .select(`
        id,
        amount,
        currency,
        status,
        paid_date,
        payment_type,
        payment_number,
        created_at,
        enrollment_id
      `)
      .eq('tenant_id', tenantId)
      .eq('status', 'paid')
      .gte('paid_date', startDate.toISOString())
      .order('paid_date', { ascending: true });

    console.log('Error:', error);
    console.log('Number of results:', paidSchedules?.length || 0);

    if (paidSchedules && paidSchedules.length > 0) {
      console.log('\nResults:');
      console.log(JSON.stringify(paidSchedules, null, 2));

      const totalRevenue = paidSchedules.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0);
      console.log('\n✅ Total Revenue:', totalRevenue);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testFixedQuery();
