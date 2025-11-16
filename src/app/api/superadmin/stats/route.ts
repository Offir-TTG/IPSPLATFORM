import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/tenant/auth';

// GET - Get platform-wide statistics (Super Admin only)
export async function GET(request: NextRequest) {
  try {
    // Check if user is super admin
    const isSuper = await isSuperAdmin();
    if (!isSuper) {
      return NextResponse.json(
        { success: false, error: 'Super admin access required' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Get total tenant count
    const { count: totalTenants } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true });

    // Get active tenant count
    const { count: activeTenants } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get total user count
    const { count: totalUsers } = await supabase
      .from('tenant_users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get total course count
    const { count: totalCourses } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    // Get tenants by subscription tier
    const { data: tierData } = await supabase
      .from('tenants')
      .select('subscription_tier')
      .eq('status', 'active');

    const tierCounts = tierData?.reduce((acc: any, t: any) => {
      acc[t.subscription_tier] = (acc[t.subscription_tier] || 0) + 1;
      return acc;
    }, {});

    // Get recent tenants (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentTenants } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Get tenant growth by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: growthData } = await supabase
      .from('tenants')
      .select('created_at')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: true });

    const monthlyGrowth = growthData?.reduce((acc: any, t: any) => {
      const month = new Date(t.created_at).toISOString().substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          total_tenants: totalTenants || 0,
          active_tenants: activeTenants || 0,
          total_users: totalUsers || 0,
          total_courses: totalCourses || 0,
          recent_tenants_30d: recentTenants || 0,
        },
        by_tier: tierCounts || {},
        monthly_growth: monthlyGrowth || {},
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while fetching statistics' },
      { status: 500 }
    );
  }
}
