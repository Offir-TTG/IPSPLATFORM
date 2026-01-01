import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStatusAPI() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    const tenantId = tenants![0].id;

    console.log('Testing Payment Status API...\n');

    // Get all payment schedules
    const { data: schedules } = await supabase
      .from('payment_schedules')
      .select('id, amount, status, scheduled_date, paid_date')
      .eq('tenant_id', tenantId);

    console.log('Total schedules:', schedules?.length || 0);

    if (schedules) {
      const now = new Date();
      const statusCounts: Record<string, { count: number; amount: number }> = {
        paid: { count: 0, amount: 0 },
        pending: { count: 0, amount: 0 },
        overdue: { count: 0, amount: 0 },
        failed: { count: 0, amount: 0 }
      };

      schedules.forEach(schedule => {
        const amount = parseFloat(schedule.amount.toString());

        if (schedule.status === 'paid') {
          statusCounts.paid.count++;
          statusCounts.paid.amount += amount;
        } else if (schedule.status === 'failed') {
          statusCounts.failed.count++;
          statusCounts.failed.amount += amount;
        } else if (schedule.status === 'pending') {
          const scheduledDate = new Date(schedule.scheduled_date);
          if (scheduledDate < now) {
            statusCounts.overdue.count++;
            statusCounts.overdue.amount += amount;
          } else {
            statusCounts.pending.count++;
            statusCounts.pending.amount += amount;
          }
        }
      });

      console.log('\n=== Status Breakdown ===');
      Object.entries(statusCounts).forEach(([status, data]) => {
        const percentage = schedules.length > 0 ? ((data.count / schedules.length) * 100).toFixed(1) : 0;
        console.log(`${status.toUpperCase()}: ${data.count} schedules, $${data.amount.toFixed(2)} (${percentage}%)`);
      });

      console.log('\n✅ Payment Status Report data is ready!');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testStatusAPI();
