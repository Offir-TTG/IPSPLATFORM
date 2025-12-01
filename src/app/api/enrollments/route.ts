import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processEnrollment } from '@/lib/payments/enrollmentService';
import { logAuditEvent } from '@/lib/audit/logger';

// POST /api/enrollments - Create new enrollment with payment processing
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { product_id, user_id, start_date, metadata, user_metadata } = body;

    // Validate required fields
    if (!product_id) {
      return NextResponse.json(
        { error: 'product_id is required' },
        { status: 400 }
      );
    }

    // Determine the user to enroll
    // Admins can enroll others, regular users can only enroll themselves
    const enrollUserId = user_id || user.id;

    if (enrollUserId !== user.id && !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot enroll other users' },
        { status: 403 }
      );
    }

    // Check if user is already enrolled in this product
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id, payment_status, status')
      .eq('user_id', enrollUserId)
      .eq('product_id', product_id)
      .eq('tenant_id', userData.tenant_id)
      .in('status', ['draft', 'pending', 'active', 'suspended'])
      .single();

    if (existingEnrollment) {
      return NextResponse.json(
        {
          error: 'User is already enrolled in this product',
          enrollment_id: existingEnrollment.id,
          status: existingEnrollment.status,
        },
        { status: 409 }
      );
    }

    // Process enrollment with payment system
    const result = await processEnrollment(
      {
        user_id: enrollUserId,
        product_id,
        start_date: start_date ? new Date(start_date) : undefined,
        metadata,
        user_metadata,
      },
      userData.tenant_id
    );

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email || 'unknown',
      action: 'enrollment.created',
      details: {
        enrollmentId: result.enrollment_id,
        productId: product_id,
        productName: result.product.product_name,
        paymentPlanId: result.payment_plan.id,
        paymentPlanName: result.payment_plan.plan_name,
        totalAmount: result.total_amount,
        enrolledUserId: enrollUserId,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      enrollment_id: result.enrollment_id,
      product: result.product,
      payment_plan: result.payment_plan,
      total_amount: result.total_amount,
      deposit_amount: result.deposit_amount,
      schedules: result.schedules,
      stripe_client_secret: result.stripe_client_secret,
      next_payment_date: result.next_payment_date,
      requires_immediate_payment: result.requires_immediate_payment,
      message: 'Enrollment created successfully',
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/enrollments:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/enrollments - List user's enrollments
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('payment_status');

    // Determine which user's enrollments to fetch
    let targetUserId = user.id;
    if (userId && ['admin', 'super_admin'].includes(userData.role)) {
      targetUserId = userId;
    }

    // Build query
    let query = supabase
      .from('enrollments')
      .select(`
        *,
        users!inner(id, first_name, last_name, email),
        payment_plans(id, plan_name, plan_type),
        products!inner(
          id,
          product_type,
          product_name,
          price,
          currency
        )
      `)
      .eq('user_id', targetUserId)
      .eq('tenant_id', userData.tenant_id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus);
    }

    const { data: enrollments, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch enrollments: ${error.message}`);
    }

    return NextResponse.json({
      enrollments: enrollments || [],
      count: enrollments?.length || 0,
    });

  } catch (error: any) {
    console.error('Error in GET /api/enrollments:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
