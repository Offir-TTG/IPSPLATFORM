import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';

/**
 * GET /api/admin/lms/courses/[courseId]/attendance/export
 * Exports attendance records to CSV
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
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

    // Only instructors and admins can export attendance
    if (!['instructor', 'admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get course info
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', params.courseId)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get all attendance records with student info
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select(
        `
        *,
        student:users!attendance_student_id_fkey(id, first_name, last_name, email),
        lesson:lessons(id, title)
      `
      )
      .eq('course_id', params.courseId)
      .eq('tenant_id', userData.tenant_id)
      .order('attendance_date', { ascending: true })
      .order('student_id', { ascending: true });

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
      return NextResponse.json(
        { error: 'Failed to fetch attendance' },
        { status: 500 }
      );
    }

    // Generate CSV
    const headers = ['Date', 'Student Name', 'Email', 'Lesson', 'Status', 'Notes'];
    const rows = attendance?.map((record: any) => [
      record.attendance_date,
      `${record.student?.first_name || ''} ${record.student?.last_name || ''}`.trim(),
      record.student?.email || '',
      record.lesson?.title || 'General',
      record.status,
      record.notes || '',
    ]) || [];

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="attendance-${course.title.replace(/[^a-z0-9]/gi, '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/lms/courses/[courseId]/attendance/export:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
