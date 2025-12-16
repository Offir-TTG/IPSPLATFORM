import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { GradeRangeUpdateInput } from '@/types/grading';

// PUT /api/admin/grading/scales/[id]/ranges/[rangeId] - Update a grade range
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; rangeId: string } }
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data with tenant
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permissions
    if (!['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body: GradeRangeUpdateInput = await request.json();

    // Validate percentage range if provided
    if (body.min_percentage !== undefined && body.max_percentage !== undefined) {
      if (body.min_percentage < 0 || body.max_percentage > 100 || body.min_percentage > body.max_percentage) {
        return NextResponse.json({ error: 'Invalid percentage range' }, { status: 400 });
      }
    }

    // Update grade range
    const { data: range, error: rangeError } = await supabase
      .from('grade_ranges')
      .update({
        ...(body.grade_label !== undefined && { grade_label: body.grade_label }),
        ...(body.min_percentage !== undefined && { min_percentage: body.min_percentage }),
        ...(body.max_percentage !== undefined && { max_percentage: body.max_percentage }),
        ...(body.gpa_value !== undefined && { gpa_value: body.gpa_value }),
        ...(body.display_order !== undefined && { display_order: body.display_order }),
        ...(body.color_code !== undefined && { color_code: body.color_code }),
        ...(body.is_passing !== undefined && { is_passing: body.is_passing }),
      })
      .eq('id', params.rangeId)
      .eq('grading_scale_id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .select()
      .single();

    if (rangeError) {
      console.error('Error updating grade range:', rangeError);
      return NextResponse.json({ error: 'Failed to update grade range' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: range });
  } catch (error) {
    console.error('Error in PUT /api/admin/grading/scales/[id]/ranges/[rangeId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/grading/scales/[id]/ranges/[rangeId] - Delete a grade range
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; rangeId: string } }
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data with tenant
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permissions
    if (!['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete grade range
    const { error: deleteError } = await supabase
      .from('grade_ranges')
      .delete()
      .eq('id', params.rangeId)
      .eq('grading_scale_id', params.id)
      .eq('tenant_id', userData.tenant_id);

    if (deleteError) {
      console.error('Error deleting grade range:', deleteError);
      return NextResponse.json({ error: 'Failed to delete grade range' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Grade range deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/grading/scales/[id]/ranges/[rangeId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
