import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit/auditService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/lessons/[id]/join
 * Secure endpoint for students to join Zoom meetings
 * Validates auth and enrollment before returning join URL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const lessonId = params.id;

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get lesson details with course info
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        start_time,
        duration,
        course_id,
        courses!inner (
          id,
          title,
          tenant_id
        )
      `)
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this course via enrollments
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('course_id', lesson.course_id)
      .eq('status', 'active')
      .single();

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'You are not enrolled in this course' },
        { status: 403 }
      );
    }

    // Get Zoom session for this lesson
    const { data: zoomSession, error: zoomError } = await supabase
      .from('zoom_sessions')
      .select('id, join_url, scheduled_start, duration_minutes')
      .eq('lesson_id', lessonId)
      .single();

    if (zoomError || !zoomSession) {
      return NextResponse.json(
        { success: false, error: 'No Zoom meeting configured for this lesson' },
        { status: 404 }
      );
    }

    // Check if session is within time window (30 min before to 3 hours after)
    const now = new Date();
    const sessionStart = new Date(zoomSession.scheduled_start);
    const sessionEnd = new Date(sessionStart.getTime() + (zoomSession.duration_minutes + 180) * 60 * 1000);
    const earlyJoin = new Date(sessionStart.getTime() - 30 * 60 * 1000);

    if (now < earlyJoin) {
      return NextResponse.json({
        success: false,
        error: 'Session not yet available',
        scheduled_start: zoomSession.scheduled_start,
        minutes_until_available: Math.floor((earlyJoin.getTime() - now.getTime()) / (60 * 1000)),
      }, { status: 403 });
    }

    if (now > sessionEnd) {
      return NextResponse.json(
        { success: false, error: 'Session has ended' },
        { status: 410 }
      );
    }

    // Log attendance
    try {
      await supabase.from('lesson_attendance').insert({
        lesson_id: lessonId,
        user_id: user.id,
        tenant_id: (lesson.courses as any)?.tenant_id,
        status: 'present',
        joined_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log attendance:', error);
    }

    // Audit log: Track student joining live lesson (attendance tracking)
    const course = Array.isArray(lesson.courses) ? lesson.courses[0] : lesson.courses;
    await logAuditEvent({
      user_id: user.id,
      event_type: 'ACCESS',
      event_category: 'ATTENDANCE',
      resource_type: 'live_lesson',
      resource_id: lessonId,
      resource_name: `Live Lesson: ${lesson.title}`,
      action: 'Joined live lesson',
      description: `Student joined live lesson "${lesson.title}" in course "${course?.title}"`,
      status: 'success',
      risk_level: 'low',
      student_id: user.id,
      is_student_record: true,
      compliance_flags: ['FERPA'],
      metadata: {
        lesson_id: lessonId,
        lesson_title: lesson.title,
        course_id: lesson.course_id,
        course_title: course?.title,
        enrollment_id: enrollment.id,
        scheduled_start: zoomSession.scheduled_start,
        duration_minutes: zoomSession.duration_minutes,
        joined_at: new Date().toISOString(),
        access_type: 'self_access'
      }
    });

    // Return join URL
    return NextResponse.json({
      success: true,
      join_url: zoomSession.join_url,
      lesson_title: lesson.title,
      scheduled_start: zoomSession.scheduled_start,
    });
  } catch (error) {
    console.error('Error in lesson join endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
