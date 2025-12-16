import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BulkAttendanceInput, Attendance } from '@/types/lms';

/**
 * GET /api/admin/lms/courses/[courseId]/attendance
 * Retrieves attendance records for a course
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

    // Only instructors and admins can view attendance
    if (!['instructor', 'admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const lessonId = searchParams.get('lesson_id');
    const studentId = searchParams.get('student_id');

    // Build query
    let query = supabase
      .from('attendance')
      .select(
        `
        *,
        student:users!attendance_student_id_fkey(id, first_name, last_name, email),
        lesson:lessons(id, title),
        recorder:users!attendance_recorded_by_fkey(id, first_name, last_name)
      `
      )
      .eq('course_id', params.courseId)
      .eq('tenant_id', userData.tenant_id);

    if (date) {
      query = query.eq('attendance_date', date);
    }

    if (lessonId) {
      query = query.eq('lesson_id', lessonId);
    }

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    query = query.order('attendance_date', { ascending: false });
    query = query.order('student_id', { ascending: true });

    const { data: attendance, error: attendanceError } = await query;

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
      return NextResponse.json(
        { error: 'Failed to fetch attendance' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: attendance });
  } catch (error) {
    console.error('Error in GET /api/admin/lms/courses/[courseId]/attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/lms/courses/[courseId]/attendance
 * Creates or updates attendance records in bulk
 */
export async function POST(
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

    // Only instructors and admins can mark attendance
    if (!['instructor', 'admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: BulkAttendanceInput = await request.json();
    const { course_id, lesson_id, attendance_date, records } = body;

    // Validate course_id matches params
    if (course_id !== params.courseId) {
      return NextResponse.json(
        { error: 'Course ID mismatch' },
        { status: 400 }
      );
    }

    // Verify course exists and belongs to tenant
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('id', params.courseId)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Verify lesson if provided
    if (lesson_id) {
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('id')
        .eq('id', lesson_id)
        .eq('tenant_id', userData.tenant_id)
        .single();

      if (lessonError || !lesson) {
        return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
      }
    }

    // Prepare records for upsert
    const attendanceRecords = records.map((record) => ({
      tenant_id: userData.tenant_id,
      course_id: params.courseId,
      lesson_id: lesson_id || null,
      student_id: record.student_id,
      attendance_date,
      status: record.status,
      notes: record.notes || null,
      recorded_by: user.id,
    }));

    // Upsert attendance records
    const { data: upsertedRecords, error: upsertError } = await supabase
      .from('attendance')
      .upsert(attendanceRecords, {
        onConflict: 'tenant_id,course_id,lesson_id,student_id,attendance_date',
        ignoreDuplicates: false,
      })
      .select();

    if (upsertError) {
      console.error('Error upserting attendance:', upsertError);
      return NextResponse.json(
        { error: 'Failed to save attendance' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: upsertedRecords,
      count: upsertedRecords?.length || 0,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/lms/courses/[courseId]/attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
