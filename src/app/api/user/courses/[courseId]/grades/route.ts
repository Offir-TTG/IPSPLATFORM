import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/user/courses/[courseId]/grades - Get student's grades for a course
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
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

    // Verify user is enrolled in this course
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', params.courseId)
      .eq('tenant_id', userData.tenant_id)
      .eq('status', 'active')
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
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
      .eq('grade_item.course_id', params.courseId)
      .eq('tenant_id', userData.tenant_id)
      .order('grade_item(due_date)', { ascending: false });

    if (gradesError) {
      console.error('Error fetching grades:', gradesError);
      return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
    }

    // Transform the data for easier frontend consumption
    const transformedGrades = grades?.map(grade => ({
      id: grade.id,
      grade_item_id: grade.grade_item_id,
      grade_item_name: grade.grade_item.name,
      points_earned: grade.points_earned,
      max_points: grade.grade_item.max_points,
      percentage: grade.percentage,
      status: grade.status,
      is_excused: grade.is_excused,
      feedback: grade.feedback,
      graded_at: grade.graded_at,
      due_date: grade.grade_item.due_date,
      category_name: grade.grade_item.category?.name,
      category_color: grade.grade_item.category?.color_code,
    })) || [];

    return NextResponse.json({
      success: true,
      data: transformedGrades,
    });
  } catch (error) {
    console.error('Error in GET /api/user/courses/[courseId]/grades:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
