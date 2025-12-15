import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ZoomService } from '@/lib/zoom/zoomService';

export const dynamic = 'force-dynamic';

// ============================================================================
// POST /api/admin/lessons/[id]/zoom/create
// Create a Zoom meeting for a lesson
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const lessonId = params.id;

    // Get lesson to access tenant_id
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('tenant_id')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Create Zoom meeting using service
    const zoomService = new ZoomService(lesson.tenant_id);
    const result = await zoomService.createMeetingForLesson(lessonId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create Zoom meeting' },
        { status: 400 }
      );
    }

    // Log audit event
    await supabase.from('audit_events').insert({
      user_id: user.id,
      event_type: 'CREATE',
      event_category: 'EDUCATION',
      resource_type: 'zoom_sessions',
      resource_id: result.data!.id,
      action: 'Created Zoom meeting for lesson',
      description: `Lesson ID: ${lessonId}, Meeting ID: ${result.data!.zoom_meeting_id}`,
      new_values: result.data,
      risk_level: 'low',
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Zoom meeting created successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/admin/lessons/[id]/zoom/create:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
