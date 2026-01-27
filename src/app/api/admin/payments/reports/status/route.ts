import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/payments/reports/status - Get payment status report data
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

    // Get all payment schedules
    const { data: schedules } = await supabase
      .from('payment_schedules')
      .select('id, amount, status, scheduled_date, paid_date')
      .eq('tenant_id', tenantId);

    if (!schedules) {
      return NextResponse.json({
        statusBreakdown: [],
        statusOverTime: [],
        totalSchedules: 0,
        totalRefunds: 0
      });
    }

    // Get refunds from payments table
    const { data: payments } = await supabase
      .from('payments')
      .select('refunded_amount')
      .eq('tenant_id', tenantId);

    const totalRefunds = payments?.reduce((sum, p) => {
      const refunded = parseFloat(p.refunded_amount?.toString() || '0');
      return sum + refunded;
    }, 0) || 0;

    // Calculate status breakdown
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
          // Overdue
          statusCounts.overdue.count++;
          statusCounts.overdue.amount += amount;
        } else {
          // Pending
          statusCounts.pending.count++;
          statusCounts.pending.amount += amount;
        }
      }
    });

    // Adjust paid amount to be NET (after refunds)
    const netPaidAmount = statusCounts.paid.amount - totalRefunds;

    const totalSchedules = schedules.length;
    const statusBreakdown = Object.entries(statusCounts).map(([status, data]) => {
      let amount = data.amount;
      // Show NET amount for paid status (gross - refunds)
      if (status === 'paid') {
        amount = netPaidAmount;
      }

      return {
        status,
        count: data.count,
        amount: Math.round(amount * 100) / 100,
        percentage: totalSchedules > 0 ? Math.round((data.count / totalSchedules) * 100) : 0
      };
    });

    // Group by month for trend analysis (last 6 months)
    const monthsAgo = 6;
    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);

    const monthlyData: Record<string, { month: string; paid: number; pending: number; overdue: number; failed: number }> = {};

    for (let i = monthsAgo - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      monthlyData[monthKey] = {
        month: monthKey,
        paid: 0,
        pending: 0,
        overdue: 0,
        failed: 0
      };
    }

    schedules.forEach(schedule => {
      const date = schedule.paid_date ? new Date(schedule.paid_date) : new Date(schedule.scheduled_date);
      if (date >= startDate) {
        const monthKey = date.toISOString().slice(0, 7);
        if (monthlyData[monthKey]) {
          if (schedule.status === 'paid') {
            monthlyData[monthKey].paid++;
          } else if (schedule.status === 'failed') {
            monthlyData[monthKey].failed++;
          } else if (schedule.status === 'pending') {
            const scheduledDate = new Date(schedule.scheduled_date);
            if (scheduledDate < now) {
              monthlyData[monthKey].overdue++;
            } else {
              monthlyData[monthKey].pending++;
            }
          }
        }
      }
    });

    const statusOverTime = Object.values(monthlyData);

    return NextResponse.json({
      statusBreakdown,
      statusOverTime,
      totalSchedules,
      totalRefunds: Math.round(totalRefunds * 100) / 100
    });

  } catch (error) {
    console.error('Error in GET /api/admin/payments/reports/status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
