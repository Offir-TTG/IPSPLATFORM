import { createClient } from '@/lib/supabase/server';
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

      // Get all grades for this student in this course
      const { data: grades, error: gradesError } = await supabase
        .from('student_grades')
        .select(`
          points_earned,
          is_excused,
          grade_item:grade_items!inner(
            max_points,
            course_id
          )
        `)
        .eq('student_id', user.id)
        .eq('grade_item.course_id', courseId)
        .eq('tenant_id', tenantId);

      if (gradesError) {
        console.error('Error fetching grades for summary:', gradesError);
        return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
      }

      // Calculate totals
      let totalPointsEarned = 0;
      let totalPointsPossible = 0;

      grades?.forEach((grade: any) => {
        if (!grade.is_excused) {
          if (grade.points_earned !== null && grade.points_earned !== undefined) {
            totalPointsEarned += grade.points_earned;
          }
          const gradeItem = Array.isArray(grade.grade_item) ? grade.grade_item[0] : grade.grade_item;
          totalPointsPossible += gradeItem.max_points;
        }
      });

      const overallGrade = totalPointsPossible > 0
        ? (totalPointsEarned / totalPointsPossible) * 100
        : 0;

      // Letter + color from the course's scale, with a tenant default
      // fallback when the course has no scale assigned. All values
      // come from grade_ranges — no hardcoded thresholds.
      let letterGrade: string | null = null;
      let letterColor: string | null = null;

      if (totalPointsPossible > 0) {
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
            .select('min_percentage, max_percentage, grade_label, color_code')
            .eq('grading_scale_id', scaleId);
          const hit = (rangeRows ?? []).find((r: any) =>
            overallGrade >= Number(r.min_percentage) && overallGrade <= Number(r.max_percentage),
          );
          if (hit) {
            letterGrade = (hit as any).grade_label ?? null;
            letterColor = (hit as any).color_code ?? null;
          }
        }
      }

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
