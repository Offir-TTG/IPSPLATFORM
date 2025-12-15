import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { GradeRangeCreateInput } from '@/types/grading';
import { validateGradeRanges } from '@/lib/grading/gradeCalculator';

// GET /api/admin/grading/scales/[id]/ranges - Get all grade ranges for a scale
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
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get grade ranges
    const { data: ranges, error: rangesError } = await supabase
      .from('grade_ranges')
      .select('*')
      .eq('grading_scale_id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .order('display_order', { ascending: true });

    if (rangesError) {
      console.error('Error fetching grade ranges:', rangesError);
      return NextResponse.json({ error: 'Failed to fetch grade ranges' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: ranges });
  } catch (error) {
    console.error('Error in GET /api/admin/grading/scales/[id]/ranges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/grading/scales/[id]/ranges - Create a new grade range
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
    const body: Omit<GradeRangeCreateInput, 'grading_scale_id'> = await request.json();

    // Validate required fields
    if (!body.grade_label || body.min_percentage == null || body.max_percentage == null || body.display_order == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate percentage range
    if (body.min_percentage < 0 || body.max_percentage > 100 || body.min_percentage > body.max_percentage) {
      return NextResponse.json({ error: 'Invalid percentage range' }, { status: 400 });
    }

    // Create grade range
    const { data: range, error: rangeError } = await supabase
      .from('grade_ranges')
      .insert({
        tenant_id: userData.tenant_id,
        grading_scale_id: params.id,
        grade_label: body.grade_label,
        min_percentage: body.min_percentage,
        max_percentage: body.max_percentage,
        gpa_value: body.gpa_value ?? null,
        display_order: body.display_order,
        color_code: body.color_code ?? null,
        is_passing: body.is_passing ?? true,
      })
      .select()
      .single();

    if (rangeError) {
      console.error('Error creating grade range:', rangeError);
      return NextResponse.json({ error: 'Failed to create grade range' }, { status: 500 });
    }

    // Validate all ranges for this scale
    const { data: allRanges } = await supabase
      .from('grade_ranges')
      .select('*')
      .eq('grading_scale_id', params.id);

    if (allRanges) {
      const validation = validateGradeRanges(allRanges);
      if (!validation.isValid) {
        return NextResponse.json(
          {
            success: true,
            data: range,
            warnings: validation.errors,
            message: 'Grade range created but validation warnings exist',
          },
          { status: 201 }
        );
      }
    }

    return NextResponse.json({ success: true, data: range }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/grading/scales/[id]/ranges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
