import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ZoomService } from '@/lib/zoom/zoomService';

// ============================================================================
// GET /api/lms/lessons/[id]/zoom-session
// Fetch Zoom session data for a lesson
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const lessonId = params.id;

    // Fetch Zoom session for this lesson
    const { data: zoomSession, error } = await supabase
      .from('zoom_sessions')
      .select('*')
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching Zoom session:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch Zoom session' },
        { status: 500 }
      );
    }

    if (!zoomSession) {
      return NextResponse.json(
        { success: false, error: 'Zoom session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: zoomSession,
    });
  } catch (error) {
    console.error('Error in GET /api/lms/lessons/[id]/zoom-session:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/lms/lessons/[id]/zoom-session
// Update Zoom session for a lesson
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin/instructor permissions
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin', 'instructor'].includes(userData.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const lessonId = params.id;
    const body = await request.json();

    console.log('[PATCH /api/lms/lessons/[id]/zoom-session] Lesson ID:', lessonId);
    console.log('[PATCH /api/lms/lessons/[id]/zoom-session] Request body:', JSON.stringify(body, null, 2));

    const {
      topic,
      agenda,
      start_time,
      duration,
      timezone,
      password,
      settings,
    } = body;

    // Build options for update
    const updateOptions: any = {};

    if (topic !== undefined) updateOptions.topic = topic;
    if (agenda !== undefined) updateOptions.agenda = agenda;
    if (start_time !== undefined) updateOptions.start_time = start_time;
    if (duration !== undefined) updateOptions.duration = duration;
    if (timezone !== undefined) updateOptions.timezone = timezone;
    if (password !== undefined) updateOptions.password = password;
    if (settings !== undefined) updateOptions.settings = settings;

    console.log('[PATCH /api/lms/lessons/[id]/zoom-session] Update options:', JSON.stringify(updateOptions, null, 2));

    // Get lesson to access tenant_id
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('tenant_id')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Update Zoom meeting using service
    const zoomService = new ZoomService(lesson.tenant_id);
    const result = await zoomService.updateMeetingForLesson(lessonId, updateOptions);

    console.log('[PATCH /api/lms/lessons/[id]/zoom-session] Result:', JSON.stringify(result, null, 2));

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to update Zoom meeting' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Zoom meeting updated successfully',
    });
  } catch (error) {
    console.error('Error in PATCH /api/lms/lessons/[id]/zoom-session:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
