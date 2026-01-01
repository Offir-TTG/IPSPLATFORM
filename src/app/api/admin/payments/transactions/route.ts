import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

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
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');
    const productId = searchParams.get('productId');

    let query = supabase
      .from('payment_schedules')
      .select(`
        id,
        amount,
        currency,
        status,
        payment_type,
        stripe_payment_intent_id,
        paid_date,
        scheduled_date,
        created_at,
        payment_number,
        enrollment_id
      `)
      .eq('tenant_id', tenantId)
      .order('scheduled_date', { ascending: false });

    if (status === 'completed') query = query.eq('status', 'paid');
    else if (status === 'pending') query = query.eq('status', 'pending');
    else if (status === 'failed') query = query.eq('status', 'failed');
    else if (status === 'refunded') query = query.eq('status', 'refunded');

    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data: schedules, error } = await query;

    if (error) {
      console.error('Error fetching payment schedules:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ transactions: [] });
    }

    // Get unique enrollment IDs
    const enrollmentIds = [...new Set(schedules.map((s: any) => s.enrollment_id).filter(Boolean))];

    // Fetch enrollments with user and product data
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        id,
        user_id,
        product_id
      `)
      .eq('tenant_id', tenantId)
      .in('id', enrollmentIds);

    if (enrollmentError) {
      console.error('Error fetching enrollments:', enrollmentError);
    }

    // Get unique user IDs and product IDs
    const userIds = [...new Set(enrollments?.map(e => e.user_id).filter(Boolean) || [])];
    const productIds = [...new Set(enrollments?.map(e => e.product_id).filter(Boolean) || [])];

    // Fetch users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    // Fetch products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title')
      .in('id', productIds);

    if (productsError) {
      console.error('Error fetching products:', productsError);
    }

    // Create lookup maps
    const userMap = new Map(users?.map(u => [u.id, u]) || []);
    const productMap = new Map(products?.map(p => [p.id, { title: p.title }]) || []);

    // Create a lookup map for enrollments
    const enrollmentMap = new Map(
      enrollments?.map((e: any) => [e.id, e]) || []
    );

    const transactions = schedules?.map((schedule: any) => {
      const enrollment = enrollmentMap.get(schedule.enrollment_id);
      const user = enrollment ? userMap.get(enrollment.user_id) : null;
      const product = enrollment ? productMap.get(enrollment.product_id) : null;

      let transactionStatus: 'completed' | 'pending' | 'failed' | 'refunded' | 'partially_refunded' = 'pending';
      if (schedule.status === 'paid') transactionStatus = 'completed';
      else if (schedule.status === 'refunded') transactionStatus = 'refunded';
      else if (schedule.status === 'failed') transactionStatus = 'failed';

      return {
        id: schedule.id,
        user_id: user?.id || '',
        user_name: user ? `${user.first_name} ${user.last_name}` : 'Unknown User',
        user_email: user?.email || '',
        enrollment_id: enrollment?.id || '',
        product_name: product?.title || 'Unknown Product',
        amount: parseFloat(schedule.amount || 0),
        currency: schedule.currency || 'USD',
        payment_method: schedule.payment_type || 'unknown',
        transaction_id: schedule.stripe_payment_intent_id || schedule.id,
        stripe_payment_intent_id: schedule.stripe_payment_intent_id,
        status: transactionStatus,
        created_at: schedule.scheduled_date,
        metadata: {
          payment_number: schedule.payment_number,
          payment_type: schedule.payment_type,
          paid_date: schedule.paid_date,
        },
      };
    }) || [];

    let filteredTransactions = transactions;

    // Filter by product
    if (productId) {
      filteredTransactions = filteredTransactions.filter((t: any) => {
        const enrollment = enrollmentMap.get(t.enrollment_id);
        return enrollment?.product_id === productId;
      });
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTransactions = filteredTransactions.filter((t: any) =>
        t.user_name.toLowerCase().includes(searchLower) ||
        t.user_email.toLowerCase().includes(searchLower) ||
        t.product_name.toLowerCase().includes(searchLower) ||
        t.transaction_id.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({ transactions: filteredTransactions });

  } catch (error) {
    console.error('Error in GET /api/admin/payments/transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
