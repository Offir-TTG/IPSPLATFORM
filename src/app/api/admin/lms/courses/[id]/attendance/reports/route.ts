import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/lms/courses/[id]/attendance/reports
 * Retrieves attendance statistics for all students in a course
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
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only instructors and admins can view reports
    if (!['instructor', 'admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get attendance statistics from the view
    const { data: stats, error: statsError } = await supabase
      .from('attendance_stats')
      .select('*')
      .eq('course_id', params.id)
      .eq('tenant_id', userData.tenant_id);

    if (statsError) {
      console.error('Error fetching attendance stats:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch attendance statistics' },
        { status: 500 }
      );
    }

    // Get student info for each record
    const studentIds = stats?.map((s) => s.student_id) || [];
    const { data: students, error: studentsError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .in('id', studentIds);

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return NextResponse.json(
        { error: 'Failed to fetch student information' },
        { status: 500 }
      );
    }

    // Merge student info with stats
    const reports = stats?.map((stat) => {
      const student = students?.find((s) => s.id === stat.student_id);
      return {
        ...stat,
        student_name: student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : 'Unknown',
        student_email: student?.email || '',
      };
    }) || [];

    return NextResponse.json({ success: true, data: reports });
  } catch (error) {
    console.error('Error in GET /api/admin/lms/courses/[id]/attendance/reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
