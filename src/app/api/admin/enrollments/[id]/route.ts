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

// PATCH /api/admin/enrollments/[id] - Update enrollment
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

    const body = await request.json();
    const {
      enrollment_status,
      expires_at,
      completed_at,
      payment_plan_id,
      contract_id
    } = body;

    const updates: any = {};
    if (enrollment_status !== undefined) {
      updates.enrollment_status = enrollment_status;

      // Auto-set completed_at when status changes to completed
      if (enrollment_status === 'completed' && !completed_at) {
        updates.completed_at = new Date().toISOString();
      }
    }
    if (expires_at !== undefined) updates.expires_at = expires_at;
    if (completed_at !== undefined) updates.completed_at = completed_at;
    if (payment_plan_id !== undefined) updates.payment_plan_id = payment_plan_id;
    if (contract_id !== undefined) updates.contract_id = contract_id;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('user_programs')
      .update(updates)
      .eq('id', params.id)
      .select(`
        id,
        enrollment_status,
        enrolled_at,
        completed_at,
        expires_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error updating enrollment:', error);
      return NextResponse.json(
        { error: 'Failed to update enrollment' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);

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
