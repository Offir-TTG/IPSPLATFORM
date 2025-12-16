import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/lms/courses/[courseId]/grading/grades - List all grades for a course
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

    // Check permissions (admin, super_admin, or instructor)
    if (!['admin', 'super_admin', 'instructor'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all grades for this course
    const { data: grades, error: gradesError } = await supabase
      .from('student_grades')
      .select(`
        *,
        grade_item:grade_items!inner(course_id)
      `)
      .eq('grade_item.course_id', params.courseId)
      .eq('tenant_id', userData.tenant_id);

    if (gradesError) {
      console.error('Error fetching grades:', gradesError);
      return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: grades || [],
    });
  } catch (error) {
    console.error('Error in GET /api/admin/lms/courses/[courseId]/grading/grades:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
