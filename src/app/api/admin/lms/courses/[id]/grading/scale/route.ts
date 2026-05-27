/**
 * PATCH /api/admin/lms/courses/[id]/grading/scale
 *
 * Sets `courses.grading_scale_id` AND clears `student_grades.letter_grade`
 * for every grade item in this course. The clear is what makes the
 * change "reflect" in the UI: the read pipelines (dashboard +
 * /api/user/grades + admin grades) fall through to live-compute the
 * letter against the new scale when `letter_grade` is NULL.
 *
 * Body: { grading_scale_id: string | null }
 *
 * Returns: { success: true, cleared: <n> } where n is how many
 * student_grades rows had their stored letter reset.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/lms/courses/[id]/grading/scale
 *
 * Returns the scale + ranges that the course's grades resolve
 * against. Resolution order matches the read pipelines used by
 * /api/user/grades and /api/user/dashboard:
 *
 *   1. courses.grading_scale_id (per-course override)
 *   2. The tenant's default active scale (is_default=true, is_active=true)
 *
 * Used by the admin gradebook to render a letter alongside each
 * student's total — so the admin sees what the student sees.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();
    const courseId = params.id;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();
    if (!userData || !['admin', 'super_admin', 'instructor'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: course } = await supabase
      .from('courses')
      .select('id, grading_scale_id, tenant_id')
      .eq('id', courseId)
      .maybeSingle();
    if (!course || course.tenant_id !== userData.tenant_id) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    let scaleId: string | null = course.grading_scale_id ?? null;
    let usedTenantDefault = false;

    if (!scaleId) {
      const { data: defaultScale } = await supabase
        .from('grading_scales')
        .select('id')
        .eq('tenant_id', userData.tenant_id)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .limit(1)
        .maybeSingle();
      scaleId = defaultScale?.id ?? null;
      usedTenantDefault = !!scaleId;
    }

    if (!scaleId) {
      return NextResponse.json({
        scale_id: null,
        scale_name: null,
        used_tenant_default: false,
        ranges: [],
      });
    }

    const [{ data: scale }, { data: ranges }] = await Promise.all([
      supabase
        .from('grading_scales')
        .select('id, name, scale_type')
        .eq('id', scaleId)
        .maybeSingle(),
      supabase
        .from('grade_ranges')
        .select('grade_label, min_percentage, max_percentage, color_code, display_order, is_passing')
        .eq('grading_scale_id', scaleId)
        .order('min_percentage', { ascending: false }),
    ]);

    return NextResponse.json({
      scale_id: scaleId,
      scale_name: scale?.name ?? null,
      scale_type: scale?.scale_type ?? null,
      used_tenant_default: usedTenantDefault,
      ranges: (ranges ?? []).map((r: any) => ({
        label: r.grade_label,
        min: Number(r.min_percentage),
        max: Number(r.max_percentage),
        color: r.color_code ?? null,
        is_passing: !!r.is_passing,
      })),
    });
  } catch (error: any) {
    console.error('Error in GET /grading/scale:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();
    const courseId = params.id;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();
    if (!userData || !['admin', 'super_admin', 'instructor'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify course tenancy.
    const { data: course } = await supabase
      .from('courses')
      .select('id, tenant_id')
      .eq('id', courseId)
      .maybeSingle();
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    if (course.tenant_id !== userData.tenant_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const newScaleId: string | null =
      body?.grading_scale_id === undefined ? null : body.grading_scale_id;

    // 1. Update the course's scale.
    const { error: courseErr } = await supabase
      .from('courses')
      .update({ grading_scale_id: newScaleId })
      .eq('id', courseId);
    if (courseErr) {
      console.error('Failed to update grading_scale_id:', courseErr);
      return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
    }

    // 2. Clear stored letter_grade for all grades in this course so
    // the next read recomputes them against the new scale. Use the
    // service-role client because the matching is done via a joined
    // subquery on grade_items.course_id and RLS for student_grades
    // doesn't allow admins to bulk-update other users' rows.
    const admin = createAdminClient();
    const { data: itemRows } = await admin
      .from('grade_items')
      .select('id')
      .eq('course_id', courseId)
      .eq('tenant_id', userData.tenant_id);
    const itemIds = (itemRows ?? []).map((r: any) => r.id);

    let cleared = 0;
    if (itemIds.length > 0) {
      const { count, error: clearErr } = await admin
        .from('student_grades')
        .update({ letter_grade: null }, { count: 'exact' })
        .in('grade_item_id', itemIds);
      if (clearErr) {
        // The course update already succeeded; report partial success
        // so the admin sees the scale changed but letters might still
        // show the old value on cached student_grades.
        console.error('Scale set but failed to clear letter_grade:', clearErr);
        return NextResponse.json({
          success: true,
          cleared: 0,
          warning: 'Scale updated but stored letters were not cleared',
        });
      }
      cleared = count ?? 0;
    }

    return NextResponse.json({ success: true, cleared });
  } catch (error: any) {
    console.error('Error in PATCH /grading/scale:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: 500 },
    );
  }
}
