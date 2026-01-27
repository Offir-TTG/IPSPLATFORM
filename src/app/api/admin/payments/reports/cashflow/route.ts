import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/payments/reports/cashflow - Get cash flow report data
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenantId = userData.tenant_id;
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get current month's expected income (all schedules due this month)
    const { data: currentMonthSchedules } = await supabase
      .from('payment_schedules')
      .select('amount, status')
      .eq('tenant_id', tenantId)
      .gte('scheduled_date', currentMonth.toISOString())
      .lte('scheduled_date', currentMonthEnd.toISOString());

    const expectedGross = currentMonthSchedules?.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;
    const receivedGross = currentMonthSchedules?.filter(s => s.status === 'paid').reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;

    // Calculate actual pending (schedules not yet paid)
    const pendingAmount = currentMonthSchedules?.filter(s => ['pending', 'overdue', 'failed'].includes(s.status)).reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;

    // Get refunds for current month
    const { data: currentMonthPayments } = await supabase
      .from('payments')
      .select('refunded_amount, paid_at')
      .eq('tenant_id', tenantId)
      .gte('paid_at', currentMonth.toISOString())
      .lte('paid_at', currentMonthEnd.toISOString());

    const refundsThisMonth = currentMonthPayments?.reduce((sum, p) => {
      const refunded = parseFloat(p.refunded_amount?.toString() || '0');
      return sum + refunded;
    }, 0) || 0;

    const received = receivedGross - refundsThisMonth;
    // Expected = What we're still expecting to receive = Pending schedules
    const expectedThisMonth = pendingAmount;

    // Get forecast for next 6 months (starting from next month, not current month)
    const forecastData = [];
    const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    for (let i = 1; i <= 6; i++) {
      const forecastDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const forecastMonthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);

      // Only forecast UNPAID schedules (pending, overdue, failed)
      const { data: monthSchedules } = await supabase
        .from('payment_schedules')
        .select('amount, payment_type, status')
        .eq('tenant_id', tenantId)
        .in('status', ['pending', 'overdue', 'failed'])
        .gte('scheduled_date', forecastDate.toISOString())
        .lte('scheduled_date', forecastMonthEnd.toISOString());

      const expected = monthSchedules?.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;

      // Calculate scheduled vs subscription
      const scheduled = monthSchedules?.filter(s => s.payment_type !== 'subscription').reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;
      const subscription = monthSchedules?.filter(s => s.payment_type === 'subscription').reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;

      forecastData.push({
        monthKey: monthKeys[forecastDate.getMonth()],
        expected: Math.round(expected * 100) / 100,
        scheduled: Math.round(scheduled * 100) / 100,
        subscription: Math.round(subscription * 100) / 100
      });
    }

    return NextResponse.json({
      currentMonth: {
        expected: Math.round(expectedThisMonth * 100) / 100,
        received: Math.round(received * 100) / 100,
        pending: Math.round(pendingAmount * 100) / 100,
        refunds: Math.round(refundsThisMonth * 100) / 100
      },
      forecast: forecastData
    });

  } catch (error) {
    console.error('Error in GET /api/admin/payments/reports/cashflow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
