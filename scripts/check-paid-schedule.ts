import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPaidSchedule() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    const tenantId = tenants![0].id;

    // Get paid schedules with all details
    const { data: paidSchedules } = await supabase
      .from('payment_schedules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'paid');

    console.log('=== Paid Schedules Details ===');
    console.log('Count:', paidSchedules?.length || 0);

    if (paidSchedules && paidSchedules.length > 0) {
      paidSchedules.forEach((s, i) => {
        console.log(`\nSchedule ${i + 1}:`);
        console.log('  ID:', s.id);
        console.log('  Amount:', s.amount);
        console.log('  Currency:', s.currency);
        console.log('  Status:', s.status);
        console.log('  Payment Type:', s.payment_type);
        console.log('  Payment Number:', s.payment_number);
        console.log('  Scheduled Date:', s.scheduled_date);
        console.log('  Paid Date:', s.paid_date);
        console.log('  Created At:', s.created_at);
      });

      // Check if paid_date is in the last 30 days
      const now = new Date();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      console.log('\n=== Date Range Check ===');
      console.log('Now:', now.toISOString());
      console.log('Last 30 days start:', last30Days.toISOString());

      paidSchedules.forEach((s, i) => {
        if (s.paid_date) {
          const paidDate = new Date(s.paid_date);
          const isInRange = paidDate >= last30Days;
          console.log(`\nSchedule ${i + 1} paid_date: ${s.paid_date}`);
          console.log(`  Is in last 30 days range: ${isInRange}`);
        } else {
          console.log(`\nSchedule ${i + 1}: NO PAID_DATE (this is the problem!)`);
        }
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkPaidSchedule();
