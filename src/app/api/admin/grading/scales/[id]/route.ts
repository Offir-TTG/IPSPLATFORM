import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { GradingScaleUpdateInput } from '@/types/grading';

// GET /api/admin/grading/scales/[id] - Get a specific grading scale
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

    // Get grading scale with ranges
    const { data: scale, error: scaleError } = await supabase
      .from('grading_scales')
      .select(`
        *,
        grade_ranges (*)
      `)
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (scaleError) {
      console.error('Error fetching grading scale:', scaleError);
      return NextResponse.json({ error: 'Grading scale not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: scale });
  } catch (error) {
    console.error('Error in GET /api/admin/grading/scales/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/grading/scales/[id] - Update a grading scale
export async function PUT(
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
    const body: GradingScaleUpdateInput = await request.json();

    // If setting as default, unset other defaults
    if (body.is_default) {
      await supabase
        .from('grading_scales')
        .update({ is_default: false })
        .eq('tenant_id', userData.tenant_id)
        .eq('is_default', true)
        .neq('id', params.id);
    }

    // Update grading scale
    const { data: scale, error: scaleError } = await supabase
      .from('grading_scales')
      .update(body)
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .select()
      .single();

    if (scaleError) {
      console.error('Error updating grading scale:', scaleError);
      return NextResponse.json({ error: 'Failed to update grading scale' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: scale });
  } catch (error) {
    console.error('Error in PUT /api/admin/grading/scales/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/grading/scales/[id] - Delete a grading scale
export async function DELETE(
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

    // Check if scale is in use
    const { data: inUse, error: checkError } = await supabase
      .from('course_grading_config')
      .select('id')
      .eq('grading_scale_id', params.id)
      .limit(1);

    if (checkError) {
      console.error('Error checking scale usage:', checkError);
      return NextResponse.json({ error: 'Failed to check scale usage' }, { status: 500 });
    }

    if (inUse && inUse.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete grading scale that is in use by courses' },
        { status: 400 }
      );
    }

    // Delete grading scale (will cascade delete grade_ranges)
    const { error: deleteError } = await supabase
      .from('grading_scales')
      .delete()
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id);

    if (deleteError) {
      console.error('Error deleting grading scale:', deleteError);
      return NextResponse.json({ error: 'Failed to delete grading scale' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Grading scale deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/grading/scales/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
