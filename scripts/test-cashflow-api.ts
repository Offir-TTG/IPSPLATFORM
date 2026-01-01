import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCashFlowAPI() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    const tenantId = tenants![0].id;

    console.log('Testing Cash Flow API...\n');

    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Current month data
    const { data: currentMonthSchedules } = await supabase
      .from('payment_schedules')
      .select('amount, status')
      .eq('tenant_id', tenantId)
      .gte('scheduled_date', currentMonth.toISOString())
      .lte('scheduled_date', currentMonthEnd.toISOString());

    console.log('Current Month Schedules:', currentMonthSchedules?.length || 0);

    const expectedThisMonth = currentMonthSchedules?.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;
    const received = currentMonthSchedules?.filter(s => s.status === 'paid').reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;
    const pending = expectedThisMonth - received;

    console.log('\n=== Current Month ===');
    console.log('Expected:', expectedThisMonth);
    console.log('Received:', received);
    console.log('Pending:', pending);

    // Forecast for next 6 months
    console.log('\n=== 6-Month Forecast ===');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 6; i++) {
      const forecastDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const forecastMonthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);

      const { data: monthSchedules } = await supabase
        .from('payment_schedules')
        .select('amount, payment_type')
        .eq('tenant_id', tenantId)
        .gte('scheduled_date', forecastDate.toISOString())
        .lte('scheduled_date', forecastMonthEnd.toISOString());

      const expected = monthSchedules?.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;
      const scheduled = monthSchedules?.filter(s => s.payment_type !== 'subscription').reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;
      const subscription = monthSchedules?.filter(s => s.payment_type === 'subscription').reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;

      console.log(`${monthNames[forecastDate.getMonth()]}: Expected=$${expected.toFixed(2)}, Scheduled=$${scheduled.toFixed(2)}, Subscription=$${subscription.toFixed(2)}`);
    }

    console.log('\n✅ Cash Flow Report data is ready!');

  } catch (error) {
    console.error('Error:', error);
  }
}

testCashFlowAPI();
