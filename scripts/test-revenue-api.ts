import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRevenueAPI() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    const tenantId = tenants![0].id;

    console.log('Testing Revenue API logic...\n');

    // Simulate the API logic
    const dateRange = 'last_30_days';
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'last_7_days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last_30_days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last_90_days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    console.log('Date range:', dateRange);
    console.log('Start date:', startDate.toISOString());
    console.log('Now:', now.toISOString());

    // Get all paid payment schedules in date range
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
        enrollments!inner(
          id,
          total_amount,
          users(id, first_name, last_name, email)
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('status', 'paid')
      .gte('paid_date', startDate.toISOString())
      .order('paid_date', { ascending: true });

    console.log('\n=== Query Results ===');
    console.log('Error:', error);
    console.log('Number of results:', paidSchedules?.length || 0);

    if (paidSchedules && paidSchedules.length > 0) {
      console.log('\nFirst schedule:');
      console.log(JSON.stringify(paidSchedules[0], null, 2));

      // Calculate summary statistics
      const totalRevenue = paidSchedules.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0);
      const transactionCount = paidSchedules.length;
      const avgTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0;

      console.log('\n=== Calculated Stats ===');
      console.log('Total Revenue:', totalRevenue);
      console.log('Transaction Count:', transactionCount);
      console.log('Avg Transaction:', avgTransaction);

      // Get currency
      const currency = paidSchedules.length > 0 ? paidSchedules[0].currency : 'USD';
      console.log('Currency:', currency);

      // Calculate MRR
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const mrrPayments = paidSchedules.filter(s => {
        const paidDate = new Date(s.paid_date);
        return paidDate >= currentMonth &&
               (s.payment_type === 'subscription' || s.payment_type === 'installment');
      });
      const mrr = mrrPayments.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0);
      const arr = mrr * 12;

      console.log('\n=== MRR/ARR ===');
      console.log('Current month start:', currentMonth.toISOString());
      console.log('MRR payments count:', mrrPayments.length);
      console.log('MRR:', mrr);
      console.log('ARR:', arr);

      // Group revenue by date
      const revenueByDate: Record<string, { date: string; revenue: number; transactions: number }> = {};
      paidSchedules.forEach(schedule => {
        const date = new Date(schedule.paid_date).toISOString().split('T')[0];
        if (!revenueByDate[date]) {
          revenueByDate[date] = { date, revenue: 0, transactions: 0 };
        }
        revenueByDate[date].revenue += parseFloat(schedule.amount.toString());
        revenueByDate[date].transactions += 1;
      });

      console.log('\n=== Revenue Over Time ===');
      console.log(JSON.stringify(Object.values(revenueByDate), null, 2));

      // Group revenue by payment type
      const revenueByTypeMap: Record<string, number> = {};
      paidSchedules.forEach(schedule => {
        const type = schedule.payment_type || 'unknown';
        revenueByTypeMap[type] = (revenueByTypeMap[type] || 0) + parseFloat(schedule.amount.toString());
      });

      const totalForPercentage = Object.values(revenueByTypeMap).reduce((sum, val) => sum + val, 0);
      const revenueByType = Object.entries(revenueByTypeMap).map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
        percentage: totalForPercentage > 0 ? Math.round((value / totalForPercentage) * 100) : 0
      }));

      console.log('\n=== Revenue By Type ===');
      console.log(JSON.stringify(revenueByType, null, 2));

    } else {
      console.log('\nNo paid schedules found in date range!');
      console.log('This is why all stats show 0');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testRevenueAPI();
