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

      // Get course info and verify it exists
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('title, description')
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

      // Determine letter grade
      let letterGrade = 'F';
      if (overallGrade >= 90) letterGrade = 'A';
      else if (overallGrade >= 80) letterGrade = 'B';
      else if (overallGrade >= 70) letterGrade = 'C';
      else if (overallGrade >= 60) letterGrade = 'D';

      return NextResponse.json({
        success: true,
        data: {
          course_name: course.title,
          course_description: course.description,
          overall_grade: overallGrade,
          total_points_earned: totalPointsEarned,
          total_points_possible: totalPointsPossible,
          letter_grade: letterGrade,
        },
      });
    } catch (error) {
      console.error('Error in GET /api/user/courses/[id]/grade-summary:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  ['student', 'instructor']
);
