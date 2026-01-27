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

async function checkCashFlowData() {
  try {
    // Get tenant
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      return;
    }
    const tenantId = tenants[0].id;
    console.log('Tenant ID:', tenantId);

    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    console.log('\n=== Current Month ===');
    console.log('From:', currentMonth.toISOString().split('T')[0]);
    console.log('To:', currentMonthEnd.toISOString().split('T')[0]);

    // Get current month's schedules
    const { data: currentMonthSchedules } = await supabase
      .from('payment_schedules')
      .select('id, amount, status, scheduled_date, paid_date')
      .eq('tenant_id', tenantId)
      .gte('scheduled_date', currentMonth.toISOString())
      .lte('scheduled_date', currentMonthEnd.toISOString());

    console.log('\n=== Payment Schedules This Month ===');
    console.log('Total schedules:', currentMonthSchedules?.length || 0);

    const expectedThisMonth = currentMonthSchedules?.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;
    const receivedGross = currentMonthSchedules?.filter(s => s.status === 'paid').reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;
    const pendingAmount = currentMonthSchedules?.filter(s => ['pending', 'overdue', 'failed'].includes(s.status)).reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;

    console.log('\nBreakdown by status:');
    console.log('  Paid schedules:', currentMonthSchedules?.filter(s => s.status === 'paid').length || 0, '- Amount:', receivedGross);
    console.log('  Pending schedules:', currentMonthSchedules?.filter(s => s.status === 'pending').length || 0);
    console.log('  Overdue schedules:', currentMonthSchedules?.filter(s => s.status === 'overdue').length || 0);
    console.log('  Failed schedules:', currentMonthSchedules?.filter(s => s.status === 'failed').length || 0);
    console.log('  Pending/Overdue/Failed Amount:', pendingAmount);

    console.log('\nExpected (all schedules):', expectedThisMonth);
    console.log('Received (paid schedules - gross):', receivedGross);

    // Get refunds for current month
    const { data: currentMonthPayments } = await supabase
      .from('payments')
      .select('id, refunded_amount, paid_at, payment_type')
      .eq('tenant_id', tenantId)
      .gte('paid_at', currentMonth.toISOString())
      .lte('paid_at', currentMonthEnd.toISOString());

    console.log('\n=== Payments This Month ===');
    console.log('Total payments:', currentMonthPayments?.length || 0);

    const refundsThisMonth = currentMonthPayments?.reduce((sum, p) => {
      const refunded = parseFloat(p.refunded_amount?.toString() || '0');
      return sum + refunded;
    }, 0) || 0;

    console.log('Total refunds:', refundsThisMonth);

    if (refundsThisMonth > 0) {
      console.log('\nPayments with refunds:');
      currentMonthPayments?.forEach(p => {
        const refunded = parseFloat(p.refunded_amount?.toString() || '0');
        if (refunded > 0) {
          console.log(`  - Payment ID: ${p.id}, Type: ${p.payment_type}, Refunded: ${refunded}`);
        }
      });
    }

    const received = receivedGross - refundsThisMonth;
    // API logic: Expected should be NET to match cash flow equation
    const expectedNet = expectedThisMonth - refundsThisMonth;

    console.log('\n=== Cash Flow Summary ===');
    console.log('Expected (Gross):', expectedThisMonth);
    console.log('Expected (NET - API returns this):', expectedNet, '(Gross:', expectedThisMonth, '- Refunds:', refundsThisMonth, ')');
    console.log('Received (NET):', received, '(Gross:', receivedGross, '- Refunds:', refundsThisMonth, ')');
    console.log('Pending:', pendingAmount);
    console.log('\nVerification:');
    console.log('Received + Pending =', received + pendingAmount);
    console.log('Expected (NET) =', expectedNet);
    console.log('Match?', Math.abs((received + pendingAmount) - expectedNet) < 0.01 ? '✅' : '❌');

    if (Math.abs((received + pendingAmount) - expectedNet) >= 0.01) {
      console.log('\n⚠️ MISMATCH DETECTED');
      console.log('Difference:', (received + pendingAmount) - expectedNet);
    } else {
      console.log('\n✅ Cash flow numbers add up correctly!');
      console.log('Expected (NET) = Received (NET) + Pending');
      console.log(`$${expectedNet.toFixed(2)} = $${received.toFixed(2)} + $${pendingAmount.toFixed(2)}`);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkCashFlowData().then(() => process.exit(0));
