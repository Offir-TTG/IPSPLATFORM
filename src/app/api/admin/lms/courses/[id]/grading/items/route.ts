import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { GradeItem, GradeItemCreateInput } from '@/types/grading';

// GET /api/admin/lms/courses/[id]/grading/items - List all grade items for a course
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Get all grade items for this course with category info
    const { data: items, error: itemsError } = await supabase
      .from('grade_items')
      .select(`
        *,
        category:grade_categories(id, name, color_code)
      `)
      .eq('course_id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .order('display_order', { ascending: true });

    if (itemsError) {
      console.error('Error fetching grade items:', itemsError);
      return NextResponse.json({ error: 'Failed to fetch grade items' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: items || [],
    });
  } catch (error) {
    console.error('Error in GET /api/admin/lms/courses/[id]/grading/items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/lms/courses/[id]/grading/items - Create a new grade item
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const body: GradeItemCreateInput = await request.json();

    // Validate required fields
    if (!body.name || body.max_points === undefined) {
      return NextResponse.json({ error: 'Missing required fields: name, max_points' }, { status: 400 });
    }

    // Validate max_points
    if (body.max_points <= 0) {
      return NextResponse.json({ error: 'Max points must be greater than 0' }, { status: 400 });
    }

    // If category_id is provided, verify it exists and belongs to this course
    if (body.category_id) {
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

    // Create grade item
    const { data: item, error: itemError } = await supabase
      .from('grade_items')
      .insert({
        tenant_id: userData.tenant_id,
        course_id: params.id,
        category_id: body.category_id || null,
        name: body.name,
        description: body.description || null,
        max_points: body.max_points,
        due_date: body.due_date || null,
        available_from: body.available_from || null,
        available_until: body.available_until || null,
        is_published: body.is_published ?? true,
        is_extra_credit: body.is_extra_credit ?? false,
        allow_late_submission: body.allow_late_submission ?? true,
        display_order: body.display_order || 0,
      })
      .select()
      .single();

    if (itemError) {
      console.error('Error creating grade item:', itemError);
      return NextResponse.json({ error: 'Failed to create grade item' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/lms/courses/[id]/grading/items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
