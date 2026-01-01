import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testExpectedIncome() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    const tenantId = tenants![0].id;

    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    console.log('Testing Total Expected Income calculation...\n');

    // Get all schedules (all statuses)
    const { data: allSchedules } = await supabase
      .from('payment_schedules')
      .select('amount, status')
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate.toISOString());

    console.log('All schedules in last 30 days:', allSchedules?.length || 0);

    if (allSchedules) {
      const byStatus = allSchedules.reduce((acc: any, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {});

      console.log('Breakdown by status:', byStatus);

      const totalExpectedIncome = allSchedules.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0);
      console.log('\n✅ Total Expected Income:', totalExpectedIncome);

      const paidOnly = allSchedules.filter(s => s.status === 'paid');
      const totalRevenue = paidOnly.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0);
      console.log('✅ Total Revenue (paid only):', totalRevenue);

      console.log('\n📊 Comparison:');
      console.log(`  Expected Income: $${totalExpectedIncome.toFixed(2)}`);
      console.log(`  Actual Revenue:  $${totalRevenue.toFixed(2)}`);
      console.log(`  Pending:         $${(totalExpectedIncome - totalRevenue).toFixed(2)}`);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testExpectedIncome();
