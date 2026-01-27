import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkForecastData() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      return;
    }
    const tenantId = tenants[0].id;

    const now = new Date();
    const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    console.log('=== Cash Flow Forecast Check ===\n');
    console.log('Current Date:', now.toISOString().split('T')[0]);
    console.log('Current Month:', monthKeys[now.getMonth()].toUpperCase(), now.getFullYear());

    // Check next 6 months
    for (let i = 1; i <= 6; i++) {
      const forecastDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const forecastMonthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);

      console.log(`\n--- ${monthKeys[forecastDate.getMonth()].toUpperCase()} ${forecastDate.getFullYear()} ---`);
      console.log('Date range:', forecastDate.toISOString().split('T')[0], 'to', forecastMonthEnd.toISOString().split('T')[0]);

      // Get ALL schedules for this month
      const { data: allSchedules } = await supabase
        .from('payment_schedules')
        .select('id, amount, status, scheduled_date, payment_type')
        .eq('tenant_id', tenantId)
        .gte('scheduled_date', forecastDate.toISOString())
        .lte('scheduled_date', forecastMonthEnd.toISOString());

      console.log('Total schedules:', allSchedules?.length || 0);

      if (allSchedules && allSchedules.length > 0) {
        const byStatus = {
          paid: allSchedules.filter(s => s.status === 'paid'),
          pending: allSchedules.filter(s => s.status === 'pending'),
          overdue: allSchedules.filter(s => s.status === 'overdue'),
          failed: allSchedules.filter(s => s.status === 'failed'),
        };

        console.log('  Paid:', byStatus.paid.length);
        console.log('  Pending:', byStatus.pending.length);
        console.log('  Overdue:', byStatus.overdue.length);
        console.log('  Failed:', byStatus.failed.length);

        // Calculate amounts
        const paidAmount = byStatus.paid.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0);
        const unpaidAmount = [...byStatus.pending, ...byStatus.overdue, ...byStatus.failed]
          .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0);

        console.log('  Paid Amount: $' + paidAmount.toFixed(2));
        console.log('  Unpaid Amount (Forecast): $' + unpaidAmount.toFixed(2));

        if (paidAmount > 0) {
          console.log('  ⚠️ This month has paid schedules - should NOT include them in forecast');
        }
        if (unpaidAmount > 0) {
          console.log('  ✅ Forecast will show: $' + unpaidAmount.toFixed(2));
        } else {
          console.log('  ℹ️ No unpaid schedules - forecast will show $0.00');
        }
      } else {
        console.log('  ℹ️ No schedules for this month');
      }
    }

    console.log('\n=== Summary ===');
    console.log('Forecast should only include UNPAID schedules (pending/overdue/failed)');
    console.log('Paid schedules should be excluded from forecast');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkForecastData().then(() => process.exit(0));
