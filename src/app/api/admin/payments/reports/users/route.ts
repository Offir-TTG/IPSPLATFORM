import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/payments/reports/users - Get user analysis data
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

    // Get all enrollments with user and payment data
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id, user_id')
      .eq('tenant_id', tenantId);

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({
        userSegments: [],
        averageRevenue: 0,
        planTrends: []
      });
    }

    // Get user IDs
    const userIds = [...new Set(enrollments.map(e => e.user_id))];

    // Get all users with their roles
    const { data: users } = await supabase
      .from('users')
      .select('id, role')
      .in('id', userIds);

    // Get enrollment IDs
    const enrollmentIds = enrollments.map(e => e.id);

    // Get all payment schedules for these enrollments
    const { data: paymentSchedules } = await supabase
      .from('payment_schedules')
      .select('enrollment_id, amount, status, scheduled_date')
      .in('enrollment_id', enrollmentIds);

    // Create user role map
    const userRoleMap = new Map(users?.map(u => [u.id, u.role]) || []);

    // Create schedules by enrollment map
    const schedulesByEnrollment = new Map<string, any[]>();
    paymentSchedules?.forEach(schedule => {
      if (!schedulesByEnrollment.has(schedule.enrollment_id)) {
        schedulesByEnrollment.set(schedule.enrollment_id, []);
      }
      schedulesByEnrollment.get(schedule.enrollment_id)!.push(schedule);
    });

    // Group by user role/segment
    const segmentStats = new Map<string, { users: Set<string>; revenue: number }>();

    enrollments.forEach((enrollment: any) => {
      const userId = enrollment.user_id;
      const userRole = userRoleMap.get(userId) || 'student';

      // Map role to segment
      const segment = userRole === 'instructor' ? 'instructors' :
                      userRole === 'admin' ? 'staff' : 'students';

      if (!segmentStats.has(segment)) {
        segmentStats.set(segment, { users: new Set(), revenue: 0 });
      }

      const stats = segmentStats.get(segment)!;
      stats.users.add(userId);

      // Calculate revenue from payment schedules
      const schedules = schedulesByEnrollment.get(enrollment.id) || [];
      schedules.forEach((schedule: any) => {
        if (schedule.status === 'paid') {
          stats.revenue += parseFloat(schedule.amount?.toString() || '0');
        }
      });
    });

    // Convert to array format
    const userSegments = Array.from(segmentStats.entries()).map(([segment, stats]) => ({
      segment,
      users: stats.users.size,
      revenue: Math.round(stats.revenue * 100) / 100,
      avg: stats.users.size > 0 ? Math.round((stats.revenue / stats.users.size) * 100) / 100 : 0
    }));

    // Calculate average revenue per user
    const totalRevenue = userSegments.reduce((sum, seg) => sum + seg.revenue, 0);
    const totalUsers = userSegments.reduce((sum, seg) => sum + seg.users, 0);
    const averageRevenue = totalUsers > 0 ? Math.round((totalRevenue / totalUsers) * 100) / 100 : 0;

    // Get plan trends over last 6 months
    const now = new Date();
    const planTrends = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthKey = monthDate.toLocaleDateString('en-US', { month: 'short' });

      // Get enrollments created in this month
      const { data: monthEnrollments } = await supabase
        .from('enrollments')
        .select('id, payment_plan_id, enrolled_at')
        .eq('tenant_id', tenantId)
        .gte('enrolled_at', monthDate.toISOString())
        .lte('enrolled_at', monthEnd.toISOString());

      // Get payment plans for these enrollments
      const monthPlanIds = [...new Set((monthEnrollments || []).map((e: any) => e.payment_plan_id).filter(Boolean))];
      let monthPlans: any[] = [];
      if (monthPlanIds.length > 0) {
        const { data } = await supabase
          .from('payment_plans')
          .select('id, plan_type')
          .in('id', monthPlanIds);
        monthPlans = data || [];
      }

      const planMap = new Map(monthPlans.map(p => [p.id, p.plan_type]));

      // Count by plan type
      const counts = {
        oneTime: 0,
        deposit: 0,
        installments: 0,
        subscription: 0
      };

      monthEnrollments?.forEach((enrollment: any) => {
        const planType = enrollment.payment_plan_id
          ? planMap.get(enrollment.payment_plan_id)
          : null;

        if (planType === 'one_time') counts.oneTime++;
        else if (planType === 'deposit') counts.deposit++;
        else if (planType === 'installments') counts.installments++;
        else if (planType === 'subscription') counts.subscription++;
      });

      planTrends.push({
        month: monthKey,
        ...counts
      });
    }

    return NextResponse.json({
      userSegments,
      averageRevenue,
      planTrends
    });

  } catch (error) {
    console.error('Error in GET /api/admin/payments/reports/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
