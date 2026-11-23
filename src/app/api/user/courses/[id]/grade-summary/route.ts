import { createClient, createAdminClient } from '@/lib/supabase/server';
import { computeFinalGrade } from '@/lib/grading/finalGrade';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

// GET /api/user/courses/[id]/grade-summary - Get student's overall grade summary
export const GET = withAuth(
  async (request: NextRequest, user: any, context: { params: Promise<{ id: string }> }) => {
    try {
      const supabase = await createClient();
      const { id: courseId } = await context.params;

      // Get user's tenant
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (userDataError || !userData) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const tenantId = userData.tenant_id;

      // Get course info and verify it exists. Pull the course's own
      // grading_scale_id so we can map the overall percentage to a
      // letter via grade_ranges (no hardcoded 90/80/70/60).
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('title, description, grading_scale_id')
        .eq('id', courseId)
        .eq('tenant_id', tenantId)
        .single();

      if (courseError) {
        console.error('Error fetching course:', courseError);
        return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
      }

      // The final grade, by the same rules as the admin gradebook
      // (lib/grading/finalGrade): weighting by groups, dropping the lowest,
      // bonus items, and the course's pass mark.
      const admin = createAdminClient();
      const [{ data: items }, { data: grades, error: gradesError }, { data: categories }, { data: config }] = await Promise.all([
        admin.from('grade_items').select('id, max_points, category_id, is_extra_credit').eq('course_id', courseId).eq('is_published', true),
        supabase
          .from('student_grades')
          .select('grade_item_id, points_earned, is_excused, grade_item:grade_items!inner(course_id)')
          .eq('student_id', user.id)
          .eq('grade_item.course_id', courseId)
          .eq('tenant_id', tenantId),
        admin.from('grade_categories').select('id, weight_percentage, drop_lowest, is_active').eq('course_id', courseId),
        admin.from('course_grading_config').select('passing_percentage, use_weighted_categories').eq('course_id', courseId).maybeSingle(),
      ]);

      if (gradesError) {
        console.error('Error fetching grades for summary:', gradesError);
        return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
      }

      // The scale's ranges (the course's own, else the school's default).
      let ranges: any[] = [];
      let scaleId: string | null = course.grading_scale_id ?? null;
      if (!scaleId) {
        const { data: defaultScaleRow } = await supabase
          .from('grading_scales')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('is_default', { ascending: false })
          .limit(1)
          .maybeSingle();
        scaleId = defaultScaleRow?.id ?? null;
      }
      if (scaleId) {
        const { data: rangeRows } = await supabase
          .from('grade_ranges')
          .select('min_percentage, max_percentage, grade_label, color_code, is_passing')
          .eq('grading_scale_id', scaleId);
        ranges = rangeRows ?? [];
      }

      const scores: Record<string, { points: number | null; excused: boolean }> = {};
      for (const g of grades ?? []) {
        scores[(g as any).grade_item_id] = { points: (g as any).points_earned ?? null, excused: !!(g as any).is_excused };
      }
      const result = computeFinalGrade({
        items: (items ?? []).map((i: any) => ({ id: i.id, max_points: Number(i.max_points) || 0, category_id: i.category_id, is_extra_credit: i.is_extra_credit })),
        scores,
        categories: (categories ?? []).filter((c: any) => c.is_active !== false).map((c: any) => ({ id: c.id, weight_percentage: Number(c.weight_percentage) || 0, drop_lowest: c.drop_lowest })),
        weighted: !!config?.use_weighted_categories,
        passMark: config?.passing_percentage != null ? Number(config.passing_percentage) : 60,
        ranges,
      });
      const overallGrade = result.percent ?? 0;
      const totalPointsEarned = result.earned;
      const totalPointsPossible = result.possible;
      const letterGrade = result.letter;
      const letterColor = result.letterColor;

      return NextResponse.json({
        success: true,
        data: {
          course_name: course.title,
          course_description: course.description,
          overall_grade: overallGrade,
          total_points_earned: totalPointsEarned,
          total_points_possible: totalPointsPossible,
          letter_grade: letterGrade,
          letter_color: letterColor,
        },
      });
    } catch (error) {
      console.error('Error in GET /api/user/courses/[id]/grade-summary:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  ['student', 'instructor']
);
