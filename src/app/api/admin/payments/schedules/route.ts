import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUpcomingPayments, getOverduePayments } from '@/lib/payments/scheduleManager';

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

    let schedules;

    if (overdue === 'true') {
      schedules = await getOverduePayments(userData.tenant_id);
    } else if (upcoming === 'true') {
      schedules = await getUpcomingPayments(userData.tenant_id, daysAhead);
    } else {
      // Build query
      let query = supabase
        .from('payment_schedules')
        .select(`
          *,
          enrollments!inner(
            id,
            user_id,
            users(first_name, last_name, email)
          ),
          payment_plans(plan_name, plan_type)
        `)
        .eq('tenant_id', userData.tenant_id);

      if (enrollmentId) {
        query = query.eq('enrollment_id', enrollmentId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      query = query.order('scheduled_date', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching schedules:', error);
        return NextResponse.json(
          { error: 'Failed to fetch schedules' },
          { status: 500 }
        );
      }

      schedules = data;
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

    return NextResponse.json({
      schedules: schedules || [],
      summary,
    });

  } catch (error) {
    console.error('Error in GET /api/admin/payments/schedules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
