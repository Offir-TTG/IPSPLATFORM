import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/dashboard/stats - Get comprehensive dashboard statistics
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
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // === PLATFORM CURRENCY ===
    // platform_settings.platform.currency.default wins over the
    // language-derived currency on admin surfaces. setting_value is
    // stored as a JSON string (e.g. '"USD"'), so we strip the quotes.
    let platformCurrencyCode = 'ILS';
    const { data: currencySetting } = await supabase
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', 'platform.currency.default')
      .maybeSingle();
    if (currencySetting?.setting_value) {
      const raw = currencySetting.setting_value;
      // setting_value can come back as a JSON-encoded string ('"USD"')
      // or as a plain string ('USD') depending on the column type.
      const code =
        typeof raw === 'string'
          ? raw.replace(/^"|"$/g, '').trim()
          : String(raw).trim();
      if (code) platformCurrencyCode = code;
    }

    // === FINANCIAL METRICS ===

    // Get all payment schedules
    const { data: schedules } = await supabase
      .from('payment_schedules')
      .select('amount, status, scheduled_date, paid_date')
      .eq('tenant_id', tenantId);

    const totalRevenue = schedules
      ?.filter(s => s.status === 'paid')
      .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;

    const thisMonthRevenue = schedules
      ?.filter(s => s.status === 'paid' && s.paid_date && new Date(s.paid_date) >= thisMonthStart)
      .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;

    const lastMonthRevenue = schedules
      ?.filter(s => {
        if (s.status !== 'paid' || !s.paid_date) return false;
        const date = new Date(s.paid_date);
        return date >= lastMonthStart && date <= lastMonthEnd;
      })
      .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;

    const revenueGrowth = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    const pendingAmount = schedules
      ?.filter(s => s.status === 'pending')
      .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;

    const overdueCount = schedules?.filter(s =>
      s.status === 'pending' && new Date(s.scheduled_date) < now
    ).length || 0;

    const overdueAmount = schedules
      ?.filter(s => s.status === 'pending' && new Date(s.scheduled_date) < now)
      .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;

    // === ENROLLMENT METRICS ===

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('status, payment_status, created_at')
      .eq('tenant_id', tenantId);

    const activeEnrollments = enrollments?.filter(e => e.status === 'active').length || 0;
    const pendingEnrollments = enrollments?.filter(e => e.status === 'pending').length || 0;
    const draftEnrollments = enrollments?.filter(e => e.status === 'draft').length || 0;
    const totalEnrollments = enrollments?.length || 0;

    const thisMonthEnrollments = enrollments?.filter(e =>
      new Date(e.created_at) >= thisMonthStart
    ).length || 0;

    const lastMonthEnrollments = enrollments?.filter(e => {
      const date = new Date(e.created_at);
      return date >= lastMonthStart && date <= lastMonthEnd;
    }).length || 0;

    const enrollmentGrowth = lastMonthEnrollments > 0
      ? ((thisMonthEnrollments - lastMonthEnrollments) / lastMonthEnrollments) * 100
      : 0;

    // === USER METRICS ===

    const { data: users } = await supabase
      .from('users')
      .select('role, created_at')
      .eq('tenant_id', tenantId);

    const totalUsers = users?.length || 0;
    const studentCount = users?.filter(u => u.role === 'user').length || 0;
    const instructorCount = users?.filter(u => u.role === 'instructor').length || 0;
    const adminCount = users?.filter(u => ['admin', 'super_admin'].includes(u.role)).length || 0;

    const thisMonthUsers = users?.filter(u =>
      new Date(u.created_at) >= thisMonthStart
    ).length || 0;

    // === LMS METRICS ===

    const { data: programs } = await supabase
      .from('programs')
      .select('id, is_active')
      .eq('tenant_id', tenantId);

    const totalPrograms = programs?.length || 0;
    const activePrograms = programs?.filter(p => p.is_active).length || 0;

    const { data: courses } = await supabase
      .from('courses')
      .select('id, is_active')
      .eq('tenant_id', tenantId);

    const totalCourses = courses?.length || 0;
    const activeCourses = courses?.filter(c => c.is_active).length || 0;

    // Get upcoming sessions (next 7 days)
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { data: upcomingSessions } = await supabase
      .from('course_sessions')
      .select('id')
      .eq('tenant_id', tenantId)
      .gte('start_date', now.toISOString())
      .lte('start_date', nextWeek.toISOString());

    const upcomingSessionsCount = upcomingSessions?.length || 0;

    // === PRODUCT METRICS ===

    const { data: products } = await supabase
      .from('products')
      .select('id, is_active, payment_model')
      .eq('tenant_id', tenantId);

    const totalProducts = products?.length || 0;
    const activeProducts = products?.filter(p => p.is_active).length || 0;
    const freeProducts = products?.filter(p => p.payment_model === 'free').length || 0;
    const paidProducts = totalProducts - freeProducts;

    // === PAYMENT PLAN METRICS ===

    const { data: paymentPlans } = await supabase
      .from('payment_plans')
      .select('id, is_active')
      .eq('tenant_id', tenantId);

    const totalPaymentPlans = paymentPlans?.length || 0;
    const activePaymentPlans = paymentPlans?.filter(p => p.is_active).length || 0;

    // === RECENT ACTIVITY ===

    // Get recent enrollments (last 5)
    const { data: recentEnrollments } = await supabase
      .from('enrollments')
      .select(`
        id,
        status,
        created_at,
        user_id,
        product_id,
        users!enrollments_user_id_fkey(first_name, last_name, email),
        products(title)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get recent payments (last 5)
    const { data: recentPayments } = await supabase
      .from('payment_schedules')
      .select('id, amount, paid_date, enrollment_id')
      .eq('tenant_id', tenantId)
      .eq('status', 'paid')
      .order('paid_date', { ascending: false })
      .limit(5);

    // Fetch enrollment and user data for recent payments
    let paymentsWithUsers: any[] = [];
    if (recentPayments && recentPayments.length > 0) {
      const enrollmentIds = recentPayments.map(p => p.enrollment_id).filter(Boolean);

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

          const userMap = new Map(usersData?.map(u => [u.id, u]) || []);
          const enrollmentMap = new Map(enrollmentsData?.map(e => [e.id, e]) || []);

          paymentsWithUsers = recentPayments.map(payment => {
            const enrollment = enrollmentMap.get(payment.enrollment_id);
            const user = enrollment ? userMap.get(enrollment.user_id) : null;
            return {
              ...payment,
              user
            };
          }).filter(p => p.user);
        }
      }
    }

    // === SIX-MONTH ROLLUPS (for charts) ===
    // Compute monthly buckets in-process — both source arrays are
    // already loaded. The dashboard renders these as line/bar charts.
    // Months are returned oldest→newest with the YYYY-MM key plus a
    // short locale-agnostic label the client can format.
    const monthKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const months: Array<{ key: string; year: number; month: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: monthKey(d), year: d.getFullYear(), month: d.getMonth() });
    }
    const revenueHistory = months.map(({ key, year, month }) => {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      const amount =
        schedules
          ?.filter(
            (s) =>
              s.status === 'paid' &&
              s.paid_date &&
              new Date(s.paid_date) >= start &&
              new Date(s.paid_date) <= end,
          )
          .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;
      return { month: key, amount };
    });
    const enrollmentHistory = months.map(({ key, year, month }) => {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      const count =
        enrollments?.filter((e) => {
          const d = new Date(e.created_at);
          return d >= start && d <= end;
        }).length || 0;
      return { month: key, count };
    });

    return NextResponse.json({
      financial: {
        totalRevenue,
        thisMonthRevenue,
        lastMonthRevenue,
        revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
        pendingAmount,
        overdueCount,
        overdueAmount,
      },
      enrollments: {
        total: totalEnrollments,
        active: activeEnrollments,
        pending: pendingEnrollments,
        draft: draftEnrollments,
        thisMonth: thisMonthEnrollments,
        lastMonth: lastMonthEnrollments,
        growth: parseFloat(enrollmentGrowth.toFixed(1)),
      },
      users: {
        total: totalUsers,
        students: studentCount,
        instructors: instructorCount,
        admins: adminCount,
        thisMonth: thisMonthUsers,
      },
      lms: {
        programs: {
          total: totalPrograms,
          active: activePrograms,
        },
        courses: {
          total: totalCourses,
          active: activeCourses,
        },
        upcomingSessions: upcomingSessionsCount,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        paid: paidProducts,
        free: freeProducts,
      },
      paymentPlans: {
        total: totalPaymentPlans,
        active: activePaymentPlans,
      },
      recentActivity: {
        enrollments: recentEnrollments || [],
        payments: paymentsWithUsers,
      },
      // Last 6 months, oldest → newest. Drives the chart hero on the
      // admin dashboard (revenue line + enrollments bar).
      history: {
        revenue: revenueHistory,
        enrollments: enrollmentHistory,
      },
      // Platform-wide default currency, resolved from platform_settings.
      // The dashboard renders all money in this code — language only
      // controls the locale for digit grouping.
      currency: {
        code: platformCurrencyCode,
      },
    });

  } catch (error) {
    console.error('Error in GET /api/admin/dashboard/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
