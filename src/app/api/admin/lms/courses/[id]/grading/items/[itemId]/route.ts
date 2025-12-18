import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { GradeItemUpdateInput } from '@/types/grading';

// PUT /api/admin/lms/courses/[id]/grading/items/[itemId] - Update a grade item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
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
    const body: GradeItemUpdateInput = await request.json();

    // Validate max_points if provided
    if (body.max_points !== undefined && body.max_points <= 0) {
      return NextResponse.json({ error: 'Max points must be greater than 0' }, { status: 400 });
    }

    // If category_id is being updated, verify it exists and belongs to this course
    if (body.category_id !== undefined && body.category_id !== null) {
      const { data: category, error: categoryError } = await supabase
        .from('grade_categories')
        .select('id')
        .eq('id', body.category_id)
        .eq('course_id', params.id)
        .eq('tenant_id', userData.tenant_id)
        .single();

      if (categoryError || !category) {
        return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
      }
    }

    // Update grade item
    const { data: item, error: itemError } = await supabase
      .from('grade_items')
      .update({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.category_id !== undefined && { category_id: body.category_id }),
        ...(body.max_points !== undefined && { max_points: body.max_points }),
        ...(body.due_date !== undefined && { due_date: body.due_date }),
        ...(body.available_from !== undefined && { available_from: body.available_from }),
        ...(body.available_until !== undefined && { available_until: body.available_until }),
        ...(body.is_published !== undefined && { is_published: body.is_published }),
        ...(body.is_extra_credit !== undefined && { is_extra_credit: body.is_extra_credit }),
        ...(body.allow_late_submission !== undefined && { allow_late_submission: body.allow_late_submission }),
        ...(body.display_order !== undefined && { display_order: body.display_order }),
      })
      .eq('id', params.itemId)
      .eq('course_id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .select()
      .single();

    if (itemError) {
      console.error('Error updating grade item:', itemError);
      return NextResponse.json({ error: 'Failed to update grade item' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error in PUT /api/admin/lms/courses/[id]/grading/items/[itemId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/lms/courses/[id]/grading/items/[itemId] - Delete a grade item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
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

    // Check if item has student grades
    const { data: studentGrades, error: gradesError } = await supabase
      .from('student_grades')
      .select('id')
      .eq('grade_item_id', params.itemId)
      .eq('tenant_id', userData.tenant_id);

    if (gradesError) {
      console.error('Error checking student grades:', gradesError);
      return NextResponse.json({ error: 'Failed to check student grades' }, { status: 500 });
    }

    if (studentGrades && studentGrades.length > 0) {
      return NextResponse.json({
        error: `Cannot delete grade item with ${studentGrades.length} student grade(s). Delete grades first or unpublish the item.`,
      }, { status: 400 });
    }

    // Delete grade item
    const { error: deleteError } = await supabase
      .from('grade_items')
      .delete()
      .eq('id', params.itemId)
      .eq('course_id', params.id)
      .eq('tenant_id', userData.tenant_id);

    if (deleteError) {
      console.error('Error deleting grade item:', deleteError);
      return NextResponse.json({ error: 'Failed to delete grade item' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Grade item deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/lms/courses/[id]/grading/items/[itemId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
