import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUpcomingPayments, getOverduePayments } from '@/lib/payments/scheduleManager';

export const dynamic = 'force-dynamic';

// GET /api/admin/payments/schedules - List payment schedules
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get('enrollment_id');
    const status = searchParams.get('status');
    const overdue = searchParams.get('overdue');
    const upcoming = searchParams.get('upcoming');
    const daysAhead = parseInt(searchParams.get('days_ahead') || '30');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const userSearch = searchParams.get('userSearch');
    const productId = searchParams.get('productId');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');

    let schedules;
    let total = 0;

    if (overdue === 'true') {
      schedules = await getOverduePayments(userData.tenant_id);
      total = schedules?.length || 0;
    } else if (upcoming === 'true') {
      schedules = await getUpcomingPayments(userData.tenant_id, daysAhead);
      total = schedules?.length || 0;
    } else {
      // First, get total count
      let countQuery = supabase
        .from('payment_schedules')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', userData.tenant_id);

      if (enrollmentId) {
        countQuery = countQuery.eq('enrollment_id', enrollmentId);
      }

      if (status) {
        countQuery = countQuery.eq('status', status);
      }

      // Add amount filters to count query
      if (minAmount) {
        countQuery = countQuery.gte('amount', parseFloat(minAmount));
      }

      if (maxAmount) {
        countQuery = countQuery.lte('amount', parseFloat(maxAmount));
      }

      const { count } = await countQuery;
      total = count || 0;

      // Build query - fetch schedules with pagination
      let query = supabase
        .from('payment_schedules')
        .select('*')
        .eq('tenant_id', userData.tenant_id);

      if (enrollmentId) {
        query = query.eq('enrollment_id', enrollmentId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      // Add amount filters
      if (minAmount) {
        query = query.gte('amount', parseFloat(minAmount));
      }

      if (maxAmount) {
        query = query.lte('amount', parseFloat(maxAmount));
      }

      query = query
        .order('scheduled_date', { ascending: true })
        .range(offset, offset + limit - 1);

      const { data: scheduleData, error } = await query;

      if (error) {
        console.error('Error fetching schedules:', error);
        return NextResponse.json(
          { error: 'Failed to fetch schedules' },
          { status: 500 }
        );
      }

      // Batch fetch all enrollments, users, and products to avoid N+1 queries
      const enrollmentIds = [...new Set((scheduleData || []).map(s => s.enrollment_id))];

      // Fetch all enrollments in one query (with tenant_id filter for RLS)
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('id, user_id, product_id')
        .in('id', enrollmentIds)
        .eq('tenant_id', userData.tenant_id);

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
      }

      const enrollmentMap = new Map(enrollments?.map(e => [e.id, e]) || []);

      // Get unique user and product IDs
      const userIds = [...new Set(enrollments?.map(e => e.user_id).filter(Boolean) || [])];
      const productIds = [...new Set(enrollments?.map(e => e.product_id).filter(Boolean) || [])];

      // Fetch all users in one query
      const { data: users } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      const userMap = new Map(users?.map(u => [u.id, u]) || []);

      // Fetch all products in one query (with tenant_id filter for RLS)
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, title')
        .in('id', productIds)
        .eq('tenant_id', userData.tenant_id);

      if (productsError) {
        console.error('Error fetching products:', productsError);
      }

      const productMap = new Map(products?.map(p => [p.id, p]) || []);

      // Enrich schedules with fetched data
      const enrichedSchedules = (scheduleData || []).map(schedule => {
        const enrollment = enrollmentMap.get(schedule.enrollment_id);

        if (!enrollment) {
          // Enrollment is missing - this is a data integrity issue
          return {
            ...schedule,
            product_id: null,
            user_name: 'Unknown (Enrollment Missing)',
            user_email: '',
            product_name: 'Unknown (Enrollment Missing)',
          };
        }

        const user = enrollment?.user_id ? userMap.get(enrollment.user_id) : null;
        const product = enrollment?.product_id ? productMap.get(enrollment.product_id) : null;

        return {
          ...schedule,
          product_id: enrollment?.product_id || null,
          user_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Unknown',
          user_email: user?.email || '',
          product_name: product?.title || 'Unknown Product',
        };
      });

      // Apply post-enrichment filters
      let filteredSchedules = enrichedSchedules;

      if (userSearch) {
        const searchLower = userSearch.toLowerCase();
        filteredSchedules = filteredSchedules.filter(s =>
          s.user_name.toLowerCase().includes(searchLower) ||
          s.user_email.toLowerCase().includes(searchLower)
        );
      }

      if (productId) {
        filteredSchedules = filteredSchedules.filter(s => s.product_id === productId);
      }

      schedules = filteredSchedules;
    }

    // Calculate summary statistics
    const summary = {
      total_scheduled: schedules?.length || 0,
      total_amount: schedules?.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0,
      pending: schedules?.filter(s => s.status === 'pending').length || 0,
      paid: schedules?.filter(s => s.status === 'paid').length || 0,
      overdue: schedules?.filter(s => {
        return s.status === 'pending' && new Date(s.scheduled_date) < new Date();
      }).length || 0,
    };

    const response = NextResponse.json({
      schedules: schedules || [],
      total,
      summary,
    });

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error) {
    console.error('Error in GET /api/admin/payments/schedules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
