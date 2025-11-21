import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Get all payments
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, status, created_at')
      .eq('tenant_id', tenantId)
      .eq('status', 'completed');

    // Get all payment schedules
    const { data: schedules } = await supabase
      .from('payment_schedules')
      .select('amount, status, scheduled_date')
      .eq('tenant_id', tenantId);

    // Calculate total revenue (from completed payments)
    const totalRevenue = payments?.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;

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

    // Calculate this month's revenue
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthRevenue = payments
      ?.filter(p => new Date(p.created_at) >= thisMonthStart)
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;

    // Calculate last month's revenue for comparison
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonthRevenue = payments
      ?.filter(p => {
        const date = new Date(p.created_at);
        return date >= lastMonthStart && date <= lastMonthEnd;
      })
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;

    // Calculate growth percentage
    const revenueGrowth = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    // Get recent payments
    const { data: recentPayments } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        status,
        created_at,
        enrollments!inner(
          users(first_name, last_name, email)
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5);

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
