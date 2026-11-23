import { NextRequest, NextResponse } from 'next/server';
import { deleteEnrollmentsWithCharges } from '@/lib/payments/deleteEnrollments';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { cancelEnrollment, CancelEnrollmentError } from '@/lib/payments/enrollmentService';

export const dynamic = 'force-dynamic';

// GET /api/admin/enrollments/[id] - Get single enrollment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Enrollments live in the enrollments table (user_programs is retired).
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        status,
        payment_status,
        enrolled_at,
        completed_at,
        expires_at,
        payment_plan_id,
        total_amount,
        paid_amount,
        currency,
        created_at,
        updated_at,
        user:users (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        product:products (
          id,
          title,
          type,
          price,
          currency,
          payment_model
        )
      `)
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (error) {
      console.error('Error fetching enrollment:', error);
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in GET /api/admin/enrollments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/enrollments/[id] - Update enrollment (only for draft status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const enrollmentId = params.id;
    const body = await request.json();
    const { product_id, expires_at } = body;

    // Get current enrollment to check status
    const { data: currentEnrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select('status')
      .eq('id', enrollmentId)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (fetchError || !currentEnrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Only allow editing draft enrollments
    if (currentEnrollment.status !== 'draft') {
      return NextResponse.json(
        { error: 'Can only edit enrollments in draft status' },
        { status: 400 }
      );
    }

    // Fetch product to get pricing information
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, price, currency, payment_model')
      .eq('id', product_id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Determine total amount based on payment model
    let totalAmount = 0;
    let currency = product.currency || 'USD';

    if (product.payment_model !== 'free') {
      totalAmount = product.price || 0;
    }

    // Update enrollment
    const updateData: any = {
      product_id,
      total_amount: totalAmount,
      currency,
      payment_status: totalAmount === 0 ? 'paid' : 'pending',
      updated_at: new Date().toISOString(),
    };

    if (expires_at) {
      updateData.expires_at = expires_at;
    }

    const { data, error } = await supabase
      .from('enrollments')
      .update(updateData)
      .eq('id', enrollmentId)
      .eq('tenant_id', userData.tenant_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating enrollment:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update enrollment' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error in PATCH /api/admin/enrollments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/enrollments/[id] - Unenroll (cancel); ?hard=true erases a draft
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    if (hardDelete) {
      // Only a draft (never sent, nothing paid or signed) may be erased;
      // anything further along is cancelled so its history stays.
      if (enrollment.status !== 'draft') {
        return NextResponse.json(
          { error: 'Only a draft enrollment can be deleted. Cancel it instead.' },
          { status: 400 }
        );
      }
      // With its payment schedules and payments, so no charge is left behind.
      const { error } = await deleteEnrollmentsWithCharges(createAdminClient(), [enrollment.id]);

      if (error) {
        console.error('Error deleting enrollment:', error);
        return NextResponse.json({ error: 'Failed to delete enrollment' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Unenroll = the normal cancel (stops future charges, no refund).
    const result = await cancelEnrollment(
      params.id,
      userData.tenant_id,
      'Removed by admin',
      user.id,
      undefined,
      user.email,
    );

    return NextResponse.json({ success: true, ...result });

  } catch (error: any) {
    if (error instanceof CancelEnrollmentError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error in DELETE /api/admin/enrollments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
