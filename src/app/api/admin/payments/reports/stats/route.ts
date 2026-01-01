import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/payments/reports/stats - Get payment statistics for dashboard
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

    // Get all enrollments with payment data
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('total_amount, paid_amount, payment_status')
      .eq('tenant_id', tenantId);

    // Get all payment schedules (including paid and pending)
    const { data: schedules } = await supabase
      .from('payment_schedules')
      .select('amount, status, scheduled_date, paid_date')
      .eq('tenant_id', tenantId);

    // Calculate total revenue from paid schedules
    const totalRevenue = schedules
      ?.filter(s => s.status === 'paid')
      .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;

    // Calculate active enrollments (with payment status not cancelled/refunded)
    const activeEnrollments = enrollments?.filter(e =>
      !['cancelled', 'refunded'].includes(e.payment_status)
    ).length || 0;

    // Calculate pending payments (pending schedules)
    const pendingPayments = schedules?.filter(s => s.status === 'pending').length || 0;

    // Calculate pending amount
    const pendingAmount = schedules
      ?.filter(s => s.status === 'pending')
      .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;

    // Calculate overdue payments
    const now = new Date();
    const overduePayments = schedules?.filter(s =>
      s.status === 'pending' && new Date(s.scheduled_date) < now
    ).length || 0;

    // Calculate this month's revenue from paid schedules
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthRevenue = schedules
      ?.filter(s => s.status === 'paid' && s.paid_date && new Date(s.paid_date) >= thisMonthStart)
      .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;

    // Calculate last month's revenue for comparison
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonthRevenue = schedules
      ?.filter(s => {
        if (s.status !== 'paid' || !s.paid_date) return false;
        const date = new Date(s.paid_date);
        return date >= lastMonthStart && date <= lastMonthEnd;
      })
      .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;

    // Calculate growth percentage
    const revenueGrowth = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    // Get recent paid schedules (fetch separately and join manually since no FK exists)
    const { data: paidSchedules } = await supabase
      .from('payment_schedules')
      .select('id, amount, status, paid_date, enrollment_id')
      .eq('tenant_id', tenantId)
      .eq('status', 'paid')
      .order('paid_date', { ascending: false })
      .limit(5);

    // Get enrollment and user data for recent payments
    let recentPayments: any[] = [];
    if (paidSchedules && paidSchedules.length > 0) {
      const enrollmentIds = paidSchedules.map(s => s.enrollment_id).filter(Boolean);

      if (enrollmentIds.length > 0) {
        const { data: enrollmentsData } = await supabase
          .from('enrollments')
          .select('id, user_id')
          .in('id', enrollmentIds);

        const userIds = enrollmentsData?.map(e => e.user_id).filter(Boolean) || [];

        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, first_name, last_name, email')
            .in('id', userIds);

          // Create lookup maps
          const userMap = new Map(usersData?.map(u => [u.id, u]) || []);
          const enrollmentMap = new Map(enrollmentsData?.map(e => [e.id, e]) || []);

          // Join the data
          recentPayments = paidSchedules.map(schedule => {
            const enrollment = enrollmentMap.get(schedule.enrollment_id);
            const user = enrollment ? userMap.get(enrollment.user_id) : null;

            return {
              id: schedule.id,
              amount: schedule.amount,
              status: schedule.status,
              paid_date: schedule.paid_date,
              enrollments: {
                users: user || null
              }
            };
          }).filter(p => p.enrollments.users !== null); // Only include payments with valid users
        }
      }
    }

    return NextResponse.json({
      totalRevenue,
      activeEnrollments,
      pendingPayments,
      pendingAmount,
      overduePayments,
      thisMonthRevenue,
      revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
      recentPayments: recentPayments || [],
    });

  } catch (error) {
    console.error('Error in GET /api/admin/payments/reports/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
