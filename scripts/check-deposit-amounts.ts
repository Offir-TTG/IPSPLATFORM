import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDepositAmounts() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      return;
    }
    const tenantId = tenants[0].id;

    console.log('\n=== Deposit Amount Analysis ===\n');

    // Get payment plan
    const { data: plans } = await supabase
      .from('payment_plans')
      .select('*')
      .eq('tenant_id', tenantId);

    console.log('Payment Plan:');
    plans?.forEach(plan => {
      console.log(`  ID: ${plan.id}`);
      console.log(`  Type: ${plan.plan_type}`);
      console.log(`  Total Amount: ${plan.total_amount || 'N/A'}`);
      console.log(`  Deposit Amount: ${plan.deposit_amount || 'N/A'}`);
      console.log(`  Number of Payments: ${plan.number_of_payments || 'N/A'}`);
    });

    // Get enrollments
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id, payment_plan_id')
      .eq('tenant_id', tenantId);

    console.log(`\nEnrollments: ${enrollments?.length || 0}`);

    if (!enrollments || enrollments.length === 0) return;

    const enrollmentIds = enrollments.map(e => e.id);

    // Get payment schedules
    const { data: schedules } = await supabase
      .from('payment_schedules')
      .select('*')
      .in('enrollment_id', enrollmentIds)
      .order('scheduled_date', { ascending: true });

    console.log(`\nPayment Schedules: ${schedules?.length || 0}\n`);

    schedules?.forEach((schedule, index) => {
      console.log(`${index + 1}. ${schedule.payment_type || 'N/A'}`);
      console.log(`   Amount: $${schedule.amount}`);
      console.log(`   Status: ${schedule.status}`);
      console.log(`   Date: ${schedule.scheduled_date}`);
      console.log('');
    });

    // Calculate totals
    const depositSchedules = schedules?.filter(s => s.payment_type === 'deposit') || [];
    const installmentSchedules = schedules?.filter(s => s.payment_type === 'installment') || [];

    const totalDeposit = depositSchedules.reduce((sum, s) => sum + parseFloat(s.amount?.toString() || '0'), 0);
    const totalInstallments = installmentSchedules.reduce((sum, s) => sum + parseFloat(s.amount?.toString() || '0'), 0);
    const totalAll = schedules?.reduce((sum, s) => sum + parseFloat(s.amount?.toString() || '0'), 0) || 0;

    console.log('Summary:');
    console.log(`  Deposit Schedules: ${depositSchedules.length} x $${totalDeposit / depositSchedules.length || 0} = $${totalDeposit}`);
    console.log(`  Installment Schedules: ${installmentSchedules.length} x $${installmentSchedules.length > 0 ? totalInstallments / installmentSchedules.length : 0} = $${totalInstallments}`);
    console.log(`  Total: $${totalAll}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

checkDepositAmounts();
