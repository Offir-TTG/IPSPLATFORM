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

    // Get all schedules (for expected income and pending)
    const { data: allSchedules } = await supabase
      .from('payment_schedules')
      .select('amount, status')
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate.toISOString());

    const totalExpectedIncome = allSchedules?.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;

    // Calculate pending payments
    const pendingAmount = allSchedules?.filter(s => s.status === 'pending')
      .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;

    // Get refunds from payments table (need paid_at for chart and payment_type for breakdown)
    const { data: payments } = await supabase
      .from('payments')
      .select('refunded_amount, paid_at, payment_type')
      .eq('tenant_id', tenantId);

    const totalRefunds = payments?.reduce((sum, p) => {
      const refunded = parseFloat(p.refunded_amount?.toString() || '0');
      return sum + refunded;
    }, 0) || 0;

    // Calculate net revenue (total paid - refunds)
    const netRevenue = totalRevenue - totalRefunds;

    // Calculate collection rate
    const collectionRate = totalExpectedIncome > 0
      ? (totalRevenue / totalExpectedIncome) * 100
      : 0;

    // Group revenue by date for trend chart (with refunds)
    const revenueByDate: Record<string, { date: string; grossRevenue: number; refunds: number; netRevenue: number; transactions: number }> = {};

    // Add paid schedules (gross revenue)
    paidSchedules.forEach(schedule => {
      const date = new Date(schedule.paid_date).toISOString().split('T')[0];
      if (!revenueByDate[date]) {
        revenueByDate[date] = { date, grossRevenue: 0, refunds: 0, netRevenue: 0, transactions: 0 };
      }
      revenueByDate[date].grossRevenue += parseFloat(schedule.amount.toString());
      revenueByDate[date].transactions += 1;
    });

    // Subtract refunds by date (using paid_at as the refund date)
    if (payments && payments.length > 0) {
      payments.forEach(payment => {
        const refundAmount = parseFloat(payment.refunded_amount?.toString() || '0');
        if (refundAmount > 0 && payment.paid_at) {
          const date = new Date(payment.paid_at).toISOString().split('T')[0];
          if (revenueByDate[date]) {
            revenueByDate[date].refunds += refundAmount;
          }
        }
      });
    }

    // Calculate net revenue for each date
    Object.values(revenueByDate).forEach(item => {
      item.netRevenue = item.grossRevenue - item.refunds;
    });

    const revenueOverTime = Object.values(revenueByDate).map(item => ({
      date: item.date,
      grossRevenue: Math.round(item.grossRevenue * 100) / 100,
      refunds: Math.round(item.refunds * 100) / 100,
      netRevenue: Math.round(item.netRevenue * 100) / 100,
      transactions: item.transactions
    }));

    // Group revenue by payment type (GROSS - before refunds)
    const grossRevenueByTypeMap: Record<string, number> = {};
    paidSchedules.forEach(schedule => {
      const type = schedule.payment_type || 'unknown';
      grossRevenueByTypeMap[type] = (grossRevenueByTypeMap[type] || 0) + parseFloat(schedule.amount.toString());
    });

    // Group refunds by payment type (ACTUAL - from payments table)
    const refundsByTypeMap: Record<string, number> = {};
    if (payments && payments.length > 0) {
      payments.forEach(payment => {
        const refundAmount = parseFloat(payment.refunded_amount?.toString() || '0');
        if (refundAmount > 0) {
          const type = payment.payment_type || 'unknown';
          refundsByTypeMap[type] = (refundsByTypeMap[type] || 0) + refundAmount;
        }
      });
    }

    // Calculate net revenue by type (gross - actual refunds for that type)
    const netRevenueByTypeMap: Record<string, number> = {};
    Object.entries(grossRevenueByTypeMap).forEach(([type, grossAmount]) => {
      const refundsForType = refundsByTypeMap[type] || 0;
      netRevenueByTypeMap[type] = grossAmount - refundsForType;
    });

    const totalForPercentage = Object.values(netRevenueByTypeMap).reduce((sum, val) => sum + val, 0);
    const revenueByType = Object.entries(netRevenueByTypeMap).map(([name, value]) => ({
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
        netRevenue: Math.round(netRevenue * 100) / 100,
        totalRefunds: Math.round(totalRefunds * 100) / 100,
        avgTransaction: Math.round(avgTransaction * 100) / 100,
        pendingAmount: Math.round(pendingAmount * 100) / 100,
        collectionRate: Math.round(collectionRate * 10) / 10,
        transactionCount,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        avgGrowth: Math.round(avgGrowth * 10) / 10,
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
