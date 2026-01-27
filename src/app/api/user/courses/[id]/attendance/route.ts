import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
/**
 * GET /api/user/courses/[id]/attendance
 * Retrieves the current user's attendance records for a course
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Authentication
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
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify course exists and belongs to tenant
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get attendance records for the user
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select(
        `
        *,
        lesson:lessons(id, title)
      `
      )
      .eq('course_id', params.id)
      .eq('student_id', user.id)
      .eq('tenant_id', userData.tenant_id)
      .order('attendance_date', { ascending: false });

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
      return NextResponse.json(
        { error: 'Failed to fetch attendance' },
        { status: 500 }
      );
    }

    // Format the response
    const formattedAttendance = attendance?.map((record: any) => ({
      ...record,
      lesson_title: record.lesson?.title || null,
    }));
return NextResponse.json({ success: true, data: formattedAttendance });
  } catch (error) {
    console.error('Error in GET /api/user/courses/[id]/attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
