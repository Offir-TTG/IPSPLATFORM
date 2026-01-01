import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/payments/reports/plans - Get payment plans analysis data
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

    // Get all enrollments with payment plan data
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id, payment_plan_id, enrolled_at')
      .eq('tenant_id', tenantId);

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({
        planPerformance: [],
        planTrends: []
      });
    }

    // Get enrollment IDs
    const enrollmentIds = enrollments.map(e => e.id);

    // Get all payment plans for these enrollments
    const planIds = [...new Set(enrollments.map(e => e.payment_plan_id).filter(Boolean))];
    let paymentPlans: any[] = [];
    if (planIds.length > 0) {
      const { data } = await supabase
        .from('payment_plans')
        .select('id, plan_type')
        .in('id', planIds);
      paymentPlans = data || [];
    }

    // Get all payment schedules for these enrollments
    const { data: paymentSchedules } = await supabase
      .from('payment_schedules')
      .select('enrollment_id, amount, status, scheduled_date, payment_type')
      .in('enrollment_id', enrollmentIds);

    // Create lookup maps
    const planMap = new Map(paymentPlans.map(p => [p.id, p.plan_type]));
    const schedulesByEnrollment = new Map<string, any[]>();

    paymentSchedules?.forEach(schedule => {
      if (!schedulesByEnrollment.has(schedule.enrollment_id)) {
        schedulesByEnrollment.set(schedule.enrollment_id, []);
      }
      schedulesByEnrollment.get(schedule.enrollment_id)!.push(schedule);
    });

    // Group by payment type (not plan type)
    // This way we show separate cards for deposits and installments
    const paymentTypeStatsMap = new Map<string, {
      enrollmentSet: Set<string>;
      totalRevenue: number;
      paidCount: number;
      totalSchedules: number;
    }>();

    enrollments.forEach((enrollment: any) => {
      const allSchedules = schedulesByEnrollment.get(enrollment.id) || [];

      allSchedules.forEach((schedule: any) => {
        // Determine the payment type category for reporting
        let reportingType: string;

        if (schedule.payment_type === 'deposit') {
          reportingType = 'deposit';
        } else if (schedule.payment_type === 'installment') {
          reportingType = 'installments';
        } else if (schedule.payment_type === 'one_time') {
          reportingType = 'one_time';
        } else if (schedule.payment_type === 'subscription') {
          reportingType = 'subscription';
        } else {
          reportingType = 'unknown';
        }

        if (!paymentTypeStatsMap.has(reportingType)) {
          paymentTypeStatsMap.set(reportingType, {
            enrollmentSet: new Set(),
            totalRevenue: 0,
            paidCount: 0,
            totalSchedules: 0,
          });
        }

        const stats = paymentTypeStatsMap.get(reportingType)!;
        stats.enrollmentSet.add(enrollment.id);
        stats.totalSchedules++;

        const amount = parseFloat(schedule.amount?.toString() || '0');
        stats.totalRevenue += amount;

        if (schedule.status === 'paid') {
          stats.paidCount++;
        }
      });
    });

    // Convert to array format
    const planPerformance = Array.from(paymentTypeStatsMap.entries()).map(([type, stats]) => ({
      type,
      enrollments: stats.enrollmentSet.size,
      revenue: Math.round(stats.totalRevenue * 100) / 100,
      avg: stats.enrollmentSet.size > 0 ? Math.round((stats.totalRevenue / stats.enrollmentSet.size) * 100) / 100 : 0,
      completion: stats.totalSchedules > 0 ? Math.round((stats.paidCount / stats.totalSchedules) * 100) : 0
    }));

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

      const monthPlanMap = new Map(monthPlans.map(p => [p.id, p.plan_type]));

      // Count by plan type
      const counts = {
        oneTime: 0,
        deposit: 0,
        installments: 0,
        subscription: 0
      };

      monthEnrollments?.forEach((enrollment: any) => {
        const planType = enrollment.payment_plan_id
          ? monthPlanMap.get(enrollment.payment_plan_id)
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
      planPerformance,
      planTrends
    });

  } catch (error) {
    console.error('Error in GET /api/admin/payments/reports/plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
