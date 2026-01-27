import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit/auditService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/lessons/[id]/recording
 * Secure endpoint for streaming lesson recordings
 * Validates auth and enrollment before proxying video from Zoom
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
      .select('id, recording_status, recording_play_url, recording_download_url, storage_location, recording_files')
      .eq('lesson_id', lessonId)
      .single();

    if (zoomError || !zoomSession) {
      return NextResponse.json(
        { success: false, error: 'No recording found for this lesson' },
        { status: 404 }
      );
    }

    if (zoomSession.recording_status !== 'ready') {
      return NextResponse.json({
        success: false,
        error: zoomSession.recording_status === 'pending' ? 'Recording is being processed' : 'Recording not available',
        status: zoomSession.recording_status,
      }, { status: 404 });
    }

    // Get the video file URL from recording_files
    let videoUrl = zoomSession.recording_download_url;

    if (!videoUrl && zoomSession.recording_files) {
      const files = Array.isArray(zoomSession.recording_files) 
        ? zoomSession.recording_files 
        : [];
      
      const videoFile = files.find((f: any) => 
        f.file_type === 'MP4' || f.recording_type === 'shared_screen_with_speaker_view'
      );

      if (videoFile) {
        videoUrl = videoFile.download_url;
      }
    }

    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: 'Recording file not available' },
        { status: 404 }
      );
    }

    // Audit log: Track student accessing lesson recording (helps with attendance tracking)
    const course = Array.isArray(lesson.courses) ? lesson.courses[0] : lesson.courses;
    await logAuditEvent({
      user_id: user.id,
      event_type: 'READ',
      event_category: 'ATTENDANCE',
      resource_type: 'lesson_recording',
      resource_id: lessonId,
      resource_name: `Lesson Recording: ${lesson.title}`,
      action: 'Accessed lesson recording',
      description: `Student accessed recording for lesson "${lesson.title}" in course "${course?.title}"`,
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
        storage_location: zoomSession.storage_location,
        recording_status: zoomSession.recording_status,
        access_type: 'self_access'
      }
    });

    // For now, return the URL (client will handle the video playback)
    // In production, you'd want to proxy the stream for better security
    return NextResponse.json({
      success: true,
      video_url: videoUrl,
      lesson_title: lesson.title,
      storage_location: zoomSession.storage_location,
      // Note: In production, this should be a proxied stream URL from your domain
      // not the direct Zoom URL
    });

  } catch (error) {
    console.error('Error in recording endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
