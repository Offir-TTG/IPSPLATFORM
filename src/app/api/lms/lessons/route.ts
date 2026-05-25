import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { lessonService } from '@/lib/lms/lessonService.server';

export const dynamic = 'force-dynamic';

// ============================================================================
// GET /api/lms/lessons
// List lessons for a course or module
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('course_id');
    const moduleId = searchParams.get('module_id');
    const includeTopics = searchParams.get('include_topics') === 'true';

    if (!courseId && !moduleId) {
      return NextResponse.json(
        { success: false, error: 'course_id or module_id is required' },
        { status: 400 }
      );
    }

    // Build filter
    const filter: any = {};
    if (courseId) filter.course_id = courseId;
    if (moduleId) filter.module_id = moduleId;

    // Get lessons
    const result = await lessonService.getLessons(filter, includeTopics);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/lms/lessons
// Create a new lesson
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();

    // Validate required fields
    if (!body.course_id || !body.title || !body.start_time || body.order === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build lesson payload. Zoom config columns are forwarded verbatim
    // when present so the single-lesson dialog can capture security /
    // video+audio / recording settings the same way the bulk dialog
    // already does. lessonService.createLesson spreads this into the
    // INSERT, and ZoomService.createMeetingForLesson reads the same
    // columns back when the admin requests a Zoom meeting.
    const ZOOM_FIELDS = [
      'zoom_passcode',
      'zoom_waiting_room',
      'zoom_join_before_host',
      'zoom_mute_upon_entry',
      'zoom_require_authentication',
      'zoom_host_video',
      'zoom_participant_video',
      'zoom_audio',
      'zoom_auto_recording',
      'zoom_record_speaker_view',
      'zoom_recording_disclaimer',
    ] as const;
    const zoomPatch: Record<string, unknown> = {};
    for (const k of ZOOM_FIELDS) {
      if (body[k] !== undefined) zoomPatch[k] = body[k];
    }

    const result = await lessonService.createLesson({
      course_id: body.course_id,
      module_id: body.module_id,
      title: body.title,
      description: body.description,
      content: body.content,
      order: body.order,
      start_time: body.start_time,
      duration: body.duration || 60,
      materials: body.materials || [],
      is_published: body.is_published ?? false,
      status: body.status || 'scheduled',
      ...(body.timezone ? { timezone: body.timezone } : {}),
      ...zoomPatch,
    } as any);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Log audit event
    await supabase.from('audit_events').insert({
      user_id: user.id,
      event_type: 'CREATE',
      event_category: 'EDUCATION',
      resource_type: 'lessons',
      resource_id: result.data!.id,
      action: 'Created new lesson',
      description: `Lesson: ${body.title}`,
      new_values: result.data,
      risk_level: 'low',
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/lms/lessons (Bulk reorder)
// Reorder multiple lessons at once
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();

    // Check if this is a reorder request
    if (body.action === 'reorder' && body.items) {
      const result = await lessonService.reorderLessons({
        items: body.items,
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }

      // Log audit event
      await supabase.from('audit_events').insert({
        user_id: user.id,
        event_type: 'UPDATE',
        event_category: 'EDUCATION',
        resource_type: 'lessons',
        action: 'Reordered lessons',
        description: `Reordered ${body.items.length} lessons`,
        new_values: { items: body.items },
        risk_level: 'low',
      });

      return NextResponse.json({
        success: true,
        message: result.message,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing bulk operation:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
