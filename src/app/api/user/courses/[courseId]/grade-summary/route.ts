import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/user/courses/[courseId]/grade-summary - Get student's overall grade summary
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

    // Get course info
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('name, description')
      .eq('id', params.courseId)
      .eq('tenant_id', userData.tenant_id)
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
      .eq('grade_item.course_id', params.courseId)
      .eq('tenant_id', userData.tenant_id);

    if (gradesError) {
      console.error('Error fetching grades for summary:', gradesError);
      return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
    }

    // Calculate totals
    let totalPointsEarned = 0;
    let totalPointsPossible = 0;

    grades?.forEach(grade => {
      if (!grade.is_excused) {
        if (grade.points_earned !== null && grade.points_earned !== undefined) {
          totalPointsEarned += grade.points_earned;
        }
        totalPointsPossible += grade.grade_item.max_points;
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
        course_name: course.name,
        course_description: course.description,
        overall_grade: overallGrade,
        total_points_earned: totalPointsEarned,
        total_points_possible: totalPointsPossible,
        letter_grade: letterGrade,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/user/courses/[courseId]/grade-summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
