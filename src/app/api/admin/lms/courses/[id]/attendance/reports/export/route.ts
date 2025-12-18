import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';

/**
 * GET /api/admin/lms/courses/[id]/attendance/reports/export
 * Exports attendance reports to CSV
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

    // Only instructors and admins can export reports
    if (!['instructor', 'admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get course info
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get attendance statistics
    const { data: stats, error: statsError } = await supabase
      .from('attendance_stats')
      .select('*')
      .eq('course_id', params.id)
      .eq('tenant_id', userData.tenant_id);

    if (statsError) {
      console.error('Error fetching stats:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: 500 }
      );
    }

    // Get student info
    const studentIds = stats?.map((s) => s.student_id) || [];
    const { data: students, error: studentsError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .in('id', studentIds);

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return NextResponse.json(
        { error: 'Failed to fetch students' },
        { status: 500 }
      );
    }

    // Generate CSV
    const headers = [
      'Student Name',
      'Email',
      'Total Sessions',
      'Present',
      'Late',
      'Absent',
      'Excused',
      'Attendance %',
    ];

    const rows =
      stats?.map((stat: any) => {
        const student = students?.find((s) => s.id === stat.student_id);
        return [
          student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : 'Unknown',
          student?.email || '',
          stat.total_sessions.toString(),
          stat.present_count.toString(),
          stat.late_count.toString(),
          stat.absent_count.toString(),
          stat.excused_count.toString(),
          stat.attendance_percentage.toFixed(2) + '%',
        ];
      }) || [];

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
        'Content-Disposition': `attachment; filename="attendance-report-${course.title.replace(
          /[^a-z0-9]/gi,
          '-'
        )}-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
      },
    });
  } catch (error) {
    console.error(
      'Error in GET /api/admin/lms/courses/[id]/attendance/reports/export:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
