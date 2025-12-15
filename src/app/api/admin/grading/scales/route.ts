import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { GradingScale, GradingScaleCreateInput } from '@/types/grading';

// GET /api/admin/grading/scales - List all grading scales
export async function GET(request: NextRequest) {
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

    // Get grading scales with their ranges
    const { data: scales, error: scalesError } = await supabase
      .from('grading_scales')
      .select(`
        *,
        grade_ranges (*)
      `)
      .eq('tenant_id', userData.tenant_id)
      .order('created_at', { ascending: false });

    if (scalesError) {
      console.error('Error fetching grading scales:', scalesError);
      return NextResponse.json({ error: 'Failed to fetch grading scales' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: scales });
  } catch (error) {
    console.error('Error in GET /api/admin/grading/scales:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/grading/scales - Create a new grading scale
export async function POST(request: NextRequest) {
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
    const body: GradingScaleCreateInput = await request.json();

    // Validate required fields
    if (!body.name || !body.scale_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // If this is set as default, unset other defaults
    if (body.is_default) {
      await supabase
        .from('grading_scales')
        .update({ is_default: false })
        .eq('tenant_id', userData.tenant_id)
        .eq('is_default', true);
    }

    // Create grading scale
    const { data: scale, error: scaleError } = await supabase
      .from('grading_scales')
      .insert({
        tenant_id: userData.tenant_id,
        name: body.name,
        description: body.description || null,
        scale_type: body.scale_type,
        is_default: body.is_default ?? false,
        is_active: body.is_active ?? true,
      })
      .select()
      .single();

    if (scaleError) {
      console.error('Error creating grading scale:', scaleError);
      return NextResponse.json({ error: 'Failed to create grading scale' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: scale }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/grading/scales:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
