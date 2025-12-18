import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

// GET /api/user/courses/[id]/grades - Get student's grades for a course
export const GET = withAuth(
  async (_request: NextRequest, user: any, context: { params: Promise<{ id: string }> }) => {
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

      // Verify course exists and belongs to tenant
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id')
        .eq('id', courseId)
        .eq('tenant_id', tenantId)
        .single();

      if (courseError || !course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }

      // Get all grades for this student in this course
      const { data: grades, error: gradesError } = await supabase
        .from('student_grades')
        .select(`
          *,
          grade_item:grade_items!inner(
            id,
            name,
            max_points,
            due_date,
            course_id,
            category:grade_categories(
              id,
              name,
              color_code
            )
          )
        `)
        .eq('student_id', user.id)
        .eq('grade_item.course_id', courseId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (gradesError) {
        console.error('Error fetching grades:', gradesError);
        return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
      }

      // Transform the data for easier frontend consumption
      const transformedGrades = grades?.map((grade: any) => {
        const gradeItem = Array.isArray(grade.grade_item) ? grade.grade_item[0] : grade.grade_item;
        const category = gradeItem.category ? (Array.isArray(gradeItem.category) ? gradeItem.category[0] : gradeItem.category) : null;

        return {
          id: grade.id,
          grade_item_id: grade.grade_item_id,
          grade_item_name: gradeItem.name,
          points_earned: grade.points_earned,
          max_points: gradeItem.max_points,
          percentage: grade.percentage,
          status: grade.status,
          is_excused: grade.is_excused,
          feedback: grade.feedback,
          graded_at: grade.graded_at,
          due_date: gradeItem.due_date,
          category_name: category?.name,
          category_color: category?.color_code,
        };
      }) || [];

      return NextResponse.json({
        success: true,
        data: transformedGrades,
      });
    } catch (error) {
      console.error('Error in GET /api/user/courses/[id]/grades:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  ['student', 'instructor']
);
