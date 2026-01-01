import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPlansAPI() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    const tenantId = tenants![0].id;

    console.log('Testing Payment Plans Report API...\n');

    // Get all enrollments with payment plan data
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id, payment_plan_id, enrolled_at')
      .eq('tenant_id', tenantId);

    console.log(`Found ${enrollments?.length || 0} enrollments\n`);

    if (!enrollments || enrollments.length === 0) {
      console.log('No enrollments found.');
      return;
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

    console.log(`Found ${paymentPlans.length} payment plans`);

    // Get all payment schedules for these enrollments
    const { data: paymentSchedules } = await supabase
      .from('payment_schedules')
      .select('enrollment_id, amount, status, scheduled_date, payment_type')
      .in('enrollment_id', enrollmentIds);

    console.log(`Found ${paymentSchedules?.length || 0} payment schedules\n`);

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

    console.log('=== Payment Plan Performance ===\n');
    planPerformance.forEach(plan => {
      console.log(`${plan.type}:`);
      console.log(`  Enrollments: ${plan.enrollments}`);
      console.log(`  Revenue: $${plan.revenue.toLocaleString()}`);
      console.log(`  Average: $${plan.avg.toLocaleString()}`);
      console.log(`  Completion: ${plan.completion}%`);
      console.log('');
    });

    // Get plan trends over last 6 months
    const now = new Date();
    const planTrends = [];

    console.log('=== Plan Selection Trends (Last 6 Months) ===\n');

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

      console.log(`${monthKey}: One-Time=${counts.oneTime}, Deposit=${counts.deposit}, Installments=${counts.installments}, Subscription=${counts.subscription}`);

      planTrends.push({
        month: monthKey,
        ...counts
      });
    }

    console.log('\n✅ Payment Plans Report data is ready!');

  } catch (error) {
    console.error('Error:', error);
  }
}

testPlansAPI();
