import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { GradingScale, GradingScaleCreateInput, ScaleType } from '@/types/grading';

// Reads request-scoped APIs (cookies / searchParams / dynamic params) —
// must run per-request, never pre-rendered.
export const dynamic = 'force-dynamic';

/**
 * Default `grade_ranges` to seed when a scale is created with a
 * well-known `scale_type`. The pass/fail boundary is 60% across the
 * board (matches the rest of the platform).
 *   • `letter`   → A-F, 5 buckets
 *   • `passfail` → Pass / Fail, 2 buckets
 *   • `numeric` + `custom` → no defaults (admin defines own buckets)
 */
function defaultRangesFor(scaleType: ScaleType): Array<{
  label: string;
  min: number;
  max: number;
  gpa: number | null;
  order: number;
  color: string | null;
  passing: boolean;
}> {
  switch (scaleType) {
    case 'letter':
      return [
        { label: 'A', min: 90, max: 100, gpa: 4.0, order: 1, color: '#22c55e', passing: true },
        { label: 'B', min: 80, max: 89.99, gpa: 3.0, order: 2, color: '#3b82f6', passing: true },
        { label: 'C', min: 70, max: 79.99, gpa: 2.0, order: 3, color: '#eab308', passing: true },
        { label: 'D', min: 60, max: 69.99, gpa: 1.0, order: 4, color: '#f97316', passing: true },
        { label: 'F', min: 0,  max: 59.99, gpa: 0.0, order: 5, color: '#ef4444', passing: false },
      ];
    case 'passfail':
      return [
        { label: 'Pass', min: 60, max: 100,   gpa: null, order: 1, color: '#22c55e', passing: true },
        { label: 'Fail', min: 0,  max: 59.99, gpa: null, order: 2, color: '#ef4444', passing: false },
      ];
    default:
      return [];
  }
}

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

    // Auto-seed `grade_ranges` for well-known scale types. Without
    // this, the scale exists with zero buckets and the read pipeline
    // can't resolve any percentage to a letter — the gradebook + the
    // student /grades page both fall back to showing just the %.
    // `custom` and `numeric` scales need ranges defined by the admin
    // so we don't seed anything for those.
    const seededRanges = defaultRangesFor(body.scale_type);
    if (seededRanges.length > 0) {
      const rangeRows = seededRanges.map((r) => ({
        tenant_id: userData.tenant_id,
        grading_scale_id: scale.id,
        grade_label: r.label,
        min_percentage: r.min,
        max_percentage: r.max,
        gpa_value: r.gpa,
        display_order: r.order,
        color_code: r.color,
        is_passing: r.passing,
      }));
      const { error: rangesError } = await supabase
        .from('grade_ranges')
        .insert(rangeRows);
      if (rangesError) {
        // The scale was created OK; the seed failed. Surface as a
        // warning but don't roll back — the admin can add ranges
        // manually if needed.
        console.error('Failed to seed default grade_ranges:', rangesError);
        return NextResponse.json(
          {
            success: true,
            data: scale,
            warning:
              'Scale created but default ranges could not be auto-seeded — add them manually.',
          },
          { status: 201 },
        );
      }
    }

    return NextResponse.json({ success: true, data: scale }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/grading/scales:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
