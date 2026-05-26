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
          course:courses ( id, title )
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

    // Letter-grade + color fallback. When student_grades.letter_grade
    // is NULL (the write path doesn't populate it yet), compute it on
    // the fly using the student's tenant default grading_scale and its
    // grade_ranges. The matched range's color_code is shipped as
    // `letter_color` so both admin and student UIs can paint the
    // badge with the same configured color.
    type Range = { min_percentage: number; max_percentage: number; grade_label: string; color_code: string | null };
    let ranges: Range[] = [];
    const { data: studentRow } = await adminClient
      .from('users')
      .select('tenant_id')
      .eq('id', params.id)
      .maybeSingle();

    if (studentRow?.tenant_id) {
      // Prefer the tenant's default scale; if none flagged default,
      // fall back to any active scale so the column still renders.
      const { data: scaleRow } = await adminClient
        .from('grading_scales')
        .select('id, is_default')
        .eq('tenant_id', studentRow.tenant_id)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (scaleRow?.id) {
        const { data: rangeRows } = await adminClient
          .from('grade_ranges')
          .select('min_percentage, max_percentage, grade_label, color_code')
          .eq('grading_scale_id', scaleRow.id);
        ranges = (rangeRows as Range[]) ?? [];
      }
    }

    const matchRange = (pct: number | null): Range | null => {
      if (pct === null || pct === undefined || ranges.length === 0) return null;
      return ranges.find(r => pct >= Number(r.min_percentage) && pct <= Number(r.max_percentage)) ?? null;
    };

    const grades = (data ?? []).map((row: any) => {
      if (row.is_excused) {
        return { ...row, letter_grade: null, letter_color: null };
      }
      if (row.letter_grade) {
        // Already-stored letter — try to match its color from the scale's ranges.
        const hit = ranges.find(r => r.grade_label === row.letter_grade);
        return { ...row, letter_color: hit?.color_code ?? null };
      }
      const hit = matchRange(row.percentage);
      return {
        ...row,
        letter_grade: hit?.grade_label ?? null,
        letter_color: hit?.color_code ?? null,
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
