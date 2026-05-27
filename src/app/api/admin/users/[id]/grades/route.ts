import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/users/[id]/grades?page=1&per_page=20
// Paginated list of student_grades joined with grade_items + parent
// course + grader name. Returns { grades, total, page, per_page }.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: callerRow } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!callerRow || !['admin', 'super_admin'].includes(callerRow.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '20', 10)));
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const adminClient = createAdminClient();

    const { data, error, count } = await adminClient
      .from('student_grades')
      .select(
        `
        id,
        points_earned,
        percentage,
        letter_grade,
        status,
        is_excused,
        is_late,
        submitted_at,
        graded_at,
        feedback,
        grade_item:grade_items (
          id, name, max_points,
          course:courses ( id, title, grading_scale_id )
        ),
        grader:users!student_grades_graded_by_fkey ( id, first_name, last_name )
      `,
        { count: 'exact' },
      )
      .eq('student_id', params.id)
      .order('graded_at', { ascending: false, nullsFirst: false })
      .range(from, to);

    if (error) {
      console.error('student_grades query failed:', error);
      return NextResponse.json({ error: 'Failed to load grades' }, { status: 500 });
    }

    // Per-course scale resolution — matches what /api/user/grades and
    // the dashboard do, so the admin tab and the student view always
    // show the same letter. Always re-resolves from the LIVE scale
    // (ignores stored student_grades.letter_grade) so scale changes
    // propagate instantly without needing to clear the cached letter.
    type Range = { min: number; max: number; label: string; color: string | null };

    // Collect every course scale that appears in this page of grades,
    // plus the tenant's default scale as a fallback.
    const scaleIds = new Set<string>();
    (data ?? []).forEach((row: any) => {
      const item = Array.isArray(row.grade_item) ? row.grade_item[0] : row.grade_item;
      const course = item?.course
        ? Array.isArray(item.course) ? item.course[0] : item.course
        : null;
      if (course?.grading_scale_id) scaleIds.add(course.grading_scale_id);
    });

    const { data: studentRow } = await adminClient
      .from('users')
      .select('tenant_id')
      .eq('id', params.id)
      .maybeSingle();

    let tenantDefaultScaleId: string | null = null;
    if (studentRow?.tenant_id) {
      const { data: defaultScaleRow } = await adminClient
        .from('grading_scales')
        .select('id')
        .eq('tenant_id', studentRow.tenant_id)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (defaultScaleRow?.id) {
        tenantDefaultScaleId = defaultScaleRow.id;
        scaleIds.add(defaultScaleRow.id);
      }
    }

    const rangesByScale = new Map<string, Range[]>();
    if (scaleIds.size > 0) {
      const { data: rangeRows } = await adminClient
        .from('grade_ranges')
        .select('grading_scale_id, min_percentage, max_percentage, grade_label, color_code')
        .in('grading_scale_id', Array.from(scaleIds));
      (rangeRows ?? []).forEach((r: any) => {
        const arr = rangesByScale.get(r.grading_scale_id) ?? [];
        arr.push({
          min: Number(r.min_percentage),
          max: Number(r.max_percentage),
          label: r.grade_label,
          color: r.color_code ?? null,
        });
        rangesByScale.set(r.grading_scale_id, arr);
      });
    }

    const matchRange = (pct: number | null, scaleId: string | null): Range | null => {
      if (pct === null || pct === undefined || !scaleId) return null;
      const rs = rangesByScale.get(scaleId);
      if (!rs) return null;
      return rs.find((r) => pct >= r.min && pct <= r.max) ?? null;
    };
    const resolveRange = (pct: number | null, scaleId: string | null): Range | null =>
      matchRange(pct, scaleId) ?? matchRange(pct, tenantDefaultScaleId);

    const grades = (data ?? []).map((row: any) => {
      if (row.is_excused || row.percentage == null) {
        return { ...row, letter_grade: null, letter_color: null };
      }
      const item = Array.isArray(row.grade_item) ? row.grade_item[0] : row.grade_item;
      const course = item?.course
        ? Array.isArray(item.course) ? item.course[0] : item.course
        : null;
      const courseScaleId = course?.grading_scale_id ?? null;
      // Try the live scale first; if no range matches (e.g. the
      // scale isn't configured yet), fall back to the stored letter
      // so existing data doesn't vanish.
      const hit = resolveRange(Number(row.percentage), courseScaleId);
      return {
        ...row,
        letter_grade: hit?.label ?? row.letter_grade ?? null,
        letter_color: hit?.color ?? null,
      };
    });

    return NextResponse.json({
      grades,
      total: count ?? 0,
      page,
      per_page: perPage,
    });
  } catch (error) {
    console.error(`Error in GET /api/admin/users/${params.id}/grades:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
