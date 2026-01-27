/**
 * Export Transactions API
 * Exports payment transactions as CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const paymentMethod = searchParams.get('paymentMethod');

    // Build query - fetch payments first
    let query = supabase
      .from('payments')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }
    if (paymentMethod) {
      query = query.eq('payment_method', paymentMethod);
    }

    const { data: payments, error } = await query;

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    if (!payments || payments.length === 0) {
      // Return empty CSV with headers only
      const csvHeaders = [
        'Payment ID',
        'Date',
        'Student Name',
        'Student Email',
        'Product',
        'Payment #',
        'Amount',
        'Currency',
        'Status',
        'Payment Method',
        'Refunded Amount',
        'Refund Reason',
        'Stripe Payment Intent'
      ].join(',');

      // Add UTF-8 BOM for proper Hebrew character display
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvHeaders;

      return new NextResponse(csvWithBOM, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Get unique enrollment IDs
    const enrollmentIds = [...new Set(payments.map((p: any) => p.enrollment_id).filter(Boolean))];

    // Fetch enrollments with related data (only if there are any)
    let enrollments: any[] = [];
    if (enrollmentIds.length > 0) {
      const { data } = await supabase
        .from('enrollments')
        .select('id, invoice_number, user_id, product_id')
        .in('id', enrollmentIds);
      enrollments = data || [];
    }

    // Get unique user and product IDs
    const userIds = [...new Set(enrollments.map(e => e.user_id).filter(Boolean))];
    const productIds = [...new Set(enrollments.map(e => e.product_id).filter(Boolean))];

    // Fetch users and products (only if there are any)
    let users: any[] = [];
    let products: any[] = [];

    if (userIds.length > 0) {
      const { data } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .in('id', userIds);
      users = data || [];
    }

    if (productIds.length > 0) {
      const { data } = await supabase
        .from('products')
        .select('id, title')
        .in('id', productIds);
      products = data || [];
    }

    // Get payment schedule IDs
    const scheduleIds = [...new Set(payments.map((p: any) => p.payment_schedule_id).filter(Boolean))];

    // Fetch payment schedules (only if there are any)
    let schedules: any[] = [];
    if (scheduleIds.length > 0) {
      const { data } = await supabase
        .from('payment_schedules')
        .select('id, payment_number, scheduled_date')
        .in('id', scheduleIds);
      schedules = data || [];
    }

    // Create lookup maps
    const enrollmentMap = new Map(enrollments.map(e => [e.id, e]));
    const userMap = new Map(users.map(u => [u.id, u]));
    const productMap = new Map(products.map(p => [p.id, p]));
    const scheduleMap = new Map(schedules.map(s => [s.id, s]));

    // Generate CSV
    const csvHeaders = [
      'Payment ID',
      'Date',
      'Student Name',
      'Student Email',
      'Product',
      'Payment #',
      'Amount',
      'Currency',
      'Status',
      'Payment Method',
      'Refunded Amount',
      'Refund Reason',
      'Stripe Payment Intent'
    ].join(',');

    const csvRows = payments.map((payment: any) => {
      const enrollment = enrollmentMap.get(payment.enrollment_id);
      const user = enrollment ? userMap.get(enrollment.user_id) : null;
      const product = enrollment ? productMap.get(enrollment.product_id) : null;
      const schedule = scheduleMap.get(payment.payment_schedule_id);

      return [
        payment.id,
        new Date(payment.created_at).toISOString(),
        user ? `"${user.first_name} ${user.last_name}"` : '',
        user?.email || '',
        product ? `"${product.title}"` : '',
        schedule?.payment_number || '',
        payment.amount || 0,
        payment.currency || 'USD',
        payment.status,
        payment.payment_method || '',
        payment.refunded_amount || 0,
        payment.refund_reason ? `"${payment.refund_reason}"` : '',
        payment.stripe_payment_intent_id || ''
      ].join(',');
    });

    const csv = [csvHeaders, ...csvRows].join('\n');

    // Add UTF-8 BOM for proper Hebrew character display in Excel
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csv;

    // Return CSV file
    return new NextResponse(csvWithBOM, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error('Error exporting transactions:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
