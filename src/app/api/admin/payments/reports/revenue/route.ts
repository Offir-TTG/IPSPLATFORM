import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/payments/reports/revenue - Get revenue report data
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

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams;
    const dateRange = searchParams.get('range') || 'last_30_days';

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

    // Get all paid payment schedules in date range
    const { data: paidSchedules } = await supabase
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
        enrollment_id
      `)
      .eq('tenant_id', tenantId)
      .eq('status', 'paid')
      .gte('paid_date', startDate.toISOString())
      .order('paid_date', { ascending: true });

    if (!paidSchedules) {
      return NextResponse.json({
        summary: { totalRevenue: 0, totalExpectedIncome: 0, avgTransaction: 0, mrr: 0, arr: 0, transactionCount: 0 },
        revenueOverTime: [],
        revenueByType: [],
        currency: 'USD'
      });
    }

    // Calculate summary statistics
    const totalRevenue = paidSchedules.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0);
    const transactionCount = paidSchedules.length;
    const avgTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0;

    // Get currency (use first transaction's currency or default to USD)
    const currency = paidSchedules.length > 0 ? paidSchedules[0].currency : 'USD';

    // Calculate total expected income (all schedules regardless of status)
    const { data: allSchedules } = await supabase
      .from('payment_schedules')
      .select('amount')
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate.toISOString());

    const totalExpectedIncome = allSchedules?.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;

    // Calculate MRR (Monthly Recurring Revenue) - from subscription/installment payments
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const mrrPayments = paidSchedules.filter(s => {
      const paidDate = new Date(s.paid_date);
      return paidDate >= currentMonth &&
             (s.payment_type === 'subscription' || s.payment_type === 'installment');
    });
    const mrr = mrrPayments.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0);

    // Calculate ARR (Annual Recurring Revenue)
    const arr = mrr * 12;

    // Group revenue by date for trend chart
    const revenueByDate: Record<string, { date: string; revenue: number; transactions: number }> = {};
    paidSchedules.forEach(schedule => {
      const date = new Date(schedule.paid_date).toISOString().split('T')[0];
      if (!revenueByDate[date]) {
        revenueByDate[date] = { date, revenue: 0, transactions: 0 };
      }
      revenueByDate[date].revenue += parseFloat(schedule.amount.toString());
      revenueByDate[date].transactions += 1;
    });

    const revenueOverTime = Object.values(revenueByDate).map(item => ({
      date: item.date,
      revenue: Math.round(item.revenue * 100) / 100,
      transactions: item.transactions
    }));

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

    // Calculate growth compared to previous period
    const periodLength = now.getTime() - startDate.getTime();
    const previousPeriodStart = new Date(startDate.getTime() - periodLength);

    const { data: previousSchedules } = await supabase
      .from('payment_schedules')
      .select('amount')
      .eq('tenant_id', tenantId)
      .eq('status', 'paid')
      .gte('paid_date', previousPeriodStart.toISOString())
      .lt('paid_date', startDate.toISOString());

    const previousRevenue = previousSchedules?.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const previousCount = previousSchedules?.length || 0;
    const previousAvg = previousCount > 0 ? previousRevenue / previousCount : 0;
    const avgGrowth = previousAvg > 0 ? ((avgTransaction - previousAvg) / previousAvg) * 100 : 0;

    return NextResponse.json({
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalExpectedIncome: Math.round(totalExpectedIncome * 100) / 100,
        avgTransaction: Math.round(avgTransaction * 100) / 100,
        mrr: Math.round(mrr * 100) / 100,
        arr: Math.round(arr * 100) / 100,
        transactionCount,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        avgGrowth: Math.round(avgGrowth * 10) / 10,
        mrrGrowth: 0, // TODO: Calculate MRR growth
      },
      revenueOverTime,
      revenueByType,
      currency
    });

  } catch (error) {
    console.error('Error in GET /api/admin/payments/reports/revenue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
