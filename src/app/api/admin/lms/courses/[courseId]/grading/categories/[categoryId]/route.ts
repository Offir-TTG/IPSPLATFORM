import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { GradeCategoryUpdateInput } from '@/types/grading';

// PUT /api/admin/lms/courses/[courseId]/grading/categories/[categoryId] - Update a category
export async function PUT(
  request: NextRequest,
  { params }: { params: { courseId: string; categoryId: string } }
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
    const body: GradeCategoryUpdateInput = await request.json();

    // If weight is being updated, validate total weight
    if (body.weight !== undefined) {
      if (body.weight < 0 || body.weight > 100) {
        return NextResponse.json({ error: 'Weight must be between 0 and 100' }, { status: 400 });
      }

      // Get current category weight
      const { data: currentCategory } = await supabase
        .from('grade_categories')
        .select('weight_percentage')
        .eq('id', params.categoryId)
        .eq('tenant_id', userData.tenant_id)
        .single();

      if (!currentCategory) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }

      // Get all other categories for this course
      const { data: otherCategories } = await supabase
        .from('grade_categories')
        .select('weight_percentage')
        .eq('course_id', params.courseId)
        .eq('tenant_id', userData.tenant_id)
        .neq('id', params.categoryId);

      const otherWeight = otherCategories?.reduce((sum, cat) => sum + parseFloat(cat.weight_percentage?.toString() || '0'), 0) || 0;
      const newTotalWeight = otherWeight + body.weight;

      if (newTotalWeight > 100) {
        return NextResponse.json({
          error: `Total weight would exceed 100% (other categories: ${otherWeight}%, new weight: ${body.weight}%)`,
        }, { status: 400 });
      }
    }

    // Update grade category
    const { data: category, error: categoryError } = await supabase
      .from('grade_categories')
      .update({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.weight !== undefined && { weight_percentage: body.weight }),
        ...(body.drop_lowest !== undefined && { drop_lowest: body.drop_lowest }),
        ...(body.display_order !== undefined && { display_order: body.display_order }),
        ...(body.color_code !== undefined && { color_code: body.color_code }),
      })
      .eq('id', params.categoryId)
      .eq('course_id', params.courseId)
      .eq('tenant_id', userData.tenant_id)
      .select()
      .single();

    if (categoryError) {
      console.error('Error updating grade category:', categoryError);
      return NextResponse.json({ error: 'Failed to update grade category' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error('Error in PUT /api/admin/lms/courses/[courseId]/grading/categories/[categoryId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/lms/courses/[courseId]/grading/categories/[categoryId] - Delete a category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string; categoryId: string } }
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

    // Check if category has grade items
    const { data: gradeItems, error: itemsError } = await supabase
      .from('grade_items')
      .select('id')
      .eq('category_id', params.categoryId)
      .eq('tenant_id', userData.tenant_id);

    if (itemsError) {
      console.error('Error checking grade items:', itemsError);
      return NextResponse.json({ error: 'Failed to check grade items' }, { status: 500 });
    }

    if (gradeItems && gradeItems.length > 0) {
      return NextResponse.json({
        error: `Cannot delete category with ${gradeItems.length} grade item(s). Delete or reassign grade items first.`,
      }, { status: 400 });
    }

    // Delete grade category
    const { error: deleteError } = await supabase
      .from('grade_categories')
      .delete()
      .eq('id', params.categoryId)
      .eq('course_id', params.courseId)
      .eq('tenant_id', userData.tenant_id);

    if (deleteError) {
      console.error('Error deleting grade category:', deleteError);
      return NextResponse.json({ error: 'Failed to delete grade category' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Grade category deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/lms/courses/[courseId]/grading/categories/[categoryId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
