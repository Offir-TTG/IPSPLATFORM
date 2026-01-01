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

async function checkData() {
  try {
    // Get tenant
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      return;
    }
    const tenantId = tenants[0].id;
    console.log('Tenant ID:', tenantId);

    // Check payment schedules
    const { data: schedules, error: schedError } = await supabase
      .from('payment_schedules')
      .select('id, amount, status, paid_date, payment_type, created_at')
      .eq('tenant_id', tenantId);

    console.log('\n=== Payment Schedules ===');
    console.log('Total schedules:', schedules?.length || 0);

    if (schedules && schedules.length > 0) {
      const paidSchedules = schedules.filter(s => s.status === 'paid');
      console.log('Paid schedules:', paidSchedules.length);
      console.log('Pending schedules:', schedules.filter(s => s.status === 'pending').length);

      console.log('\nFirst 5 schedules:');
      schedules.slice(0, 5).forEach(s => {
        console.log(`  - ID: ${s.id}, Status: ${s.status}, Amount: ${s.amount}, Type: ${s.payment_type}, Paid: ${s.paid_date || 'N/A'}`);
      });

      // Calculate total revenue
      const totalRevenue = paidSchedules.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0);
      console.log('\nTotal Revenue from paid schedules:', totalRevenue);
    }

    if (schedError) {
      console.error('Error fetching schedules:', schedError);
    }

    // Check enrollments
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('id, total_amount, paid_amount, payment_status')
      .eq('tenant_id', tenantId);

    console.log('\n=== Enrollments ===');
    console.log('Total enrollments:', enrollments?.length || 0);

    if (enrollments && enrollments.length > 0) {
      console.log('Active enrollments:', enrollments.filter(e => !['cancelled', 'refunded'].includes(e.payment_status)).length);
      console.log('\nFirst 5 enrollments:');
      enrollments.slice(0, 5).forEach(e => {
        console.log(`  - ID: ${e.id}, Status: ${e.payment_status}, Total: ${e.total_amount}, Paid: ${e.paid_amount}`);
      });
    }

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkData();
