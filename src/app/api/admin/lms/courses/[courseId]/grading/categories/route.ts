import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { GradeCategory, GradeCategoryCreateInput } from '@/types/grading';

// GET /api/admin/lms/courses/[courseId]/grading/categories - List all categories for a course
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
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

    // Check permissions (admin, super_admin, or instructor)
    if (!['admin', 'super_admin', 'instructor'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all grade categories for this course
    const { data: categories, error: categoriesError } = await supabase
      .from('grade_categories')
      .select('*')
      .eq('course_id', params.courseId)
      .eq('tenant_id', userData.tenant_id)
      .order('display_order', { ascending: true });

    if (categoriesError) {
      console.error('Error fetching grade categories:', categoriesError);
      return NextResponse.json({ error: 'Failed to fetch grade categories' }, { status: 500 });
    }

    // Calculate total weight
    const totalWeight = categories?.reduce((sum, cat) => sum + parseFloat(cat.weight_percentage?.toString() || '0'), 0) || 0;

    return NextResponse.json({
      success: true,
      data: categories || [],
      totalWeight,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/lms/courses/[courseId]/grading/categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/lms/courses/[courseId]/grading/categories - Create a new category
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
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
    const body: GradeCategoryCreateInput = await request.json();

    // Validate required fields
    if (!body.name || body.weight === undefined) {
      return NextResponse.json({ error: 'Missing required fields: name, weight' }, { status: 400 });
    }

    // Validate weight range
    if (body.weight < 0 || body.weight > 100) {
      return NextResponse.json({ error: 'Weight must be between 0 and 100' }, { status: 400 });
    }

    // Check if adding this category would exceed 100% total weight
    const { data: existingCategories } = await supabase
      .from('grade_categories')
      .select('weight_percentage')
      .eq('course_id', params.courseId)
      .eq('tenant_id', userData.tenant_id);

    const currentTotalWeight = existingCategories?.reduce((sum, cat) => sum + parseFloat(cat.weight_percentage?.toString() || '0'), 0) || 0;
    const newTotalWeight = currentTotalWeight + body.weight;

    if (newTotalWeight > 100) {
      return NextResponse.json({
        error: `Total weight would exceed 100% (current: ${currentTotalWeight}%, adding: ${body.weight}%)`,
      }, { status: 400 });
    }

    // Create grade category
    const { data: category, error: categoryError } = await supabase
      .from('grade_categories')
      .insert({
        tenant_id: userData.tenant_id,
        course_id: params.courseId,
        name: body.name,
        description: body.description || null,
        weight_percentage: body.weight,
        drop_lowest: body.drop_lowest || 0,
        display_order: body.display_order || 0,
        color_code: body.color_code || null,
      })
      .select()
      .single();

    if (categoryError) {
      console.error('Error creating grade category:', categoryError);
      return NextResponse.json({ error: 'Failed to create grade category' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/lms/courses/[courseId]/grading/categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
