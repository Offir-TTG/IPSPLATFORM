import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('user_programs')
      .select(`
        id,
        enrollment_status,
        enrolled_at,
        completed_at,
        expires_at,
        payment_plan_id,
        contract_id,
        created_at,
        updated_at,
        user:users (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        program:programs (
          id,
          name,
          description,
          price,
          payment_plan
        )
      `)
      .eq('id', params.id)
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
      .select('role')
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

// DELETE /api/admin/enrollments/[id] - Unenroll user (soft delete by changing status)
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
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if hard delete is requested
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    if (hardDelete) {
      // Permanent deletion
      const { error } = await supabase
        .from('user_programs')
        .delete()
        .eq('id', params.id);

      if (error) {
        console.error('Error deleting enrollment:', error);
        return NextResponse.json(
          { error: 'Failed to delete enrollment' },
          { status: 500 }
        );
      }
    } else {
      // Soft delete (change status to dropped)
      const { error } = await supabase
        .from('user_programs')
        .update({ enrollment_status: 'dropped' })
        .eq('id', params.id);

      if (error) {
        console.error('Error updating enrollment status:', error);
        return NextResponse.json(
          { error: 'Failed to unenroll user' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/admin/enrollments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
