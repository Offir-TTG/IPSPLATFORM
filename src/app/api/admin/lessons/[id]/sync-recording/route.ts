import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ZoomService } from '@/lib/zoom/zoomService';

export const dynamic = 'force-dynamic';

// ============================================================================
// POST /api/admin/lessons/[id]/sync-recording
//
// Manually fetch the recording for a lesson directly from Zoom's API and
// backfill the local DB. Use when the `recording.completed` webhook didn't
// fire (local dev without a tunnel, webhook misconfigured, or Zoom hiccup).
//
// Auth: admin or super_admin.
// Returns: { success, data: { recordingUrl, recordingStatus, filesFound } }
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const lessonId = params.id;
    if (!lessonId) {
      return NextResponse.json(
        { success: false, error: 'lesson id is required' },
        { status: 400 }
      );
    }

    // Find the lesson's tenant_id — ZoomService picks the right credentials
    // from the tenant's `integrations` row. Without this, sync would pull
    // from the wrong tenant's Zoom account.
    const { data: lesson } = await supabase
      .from('lessons')
      .select('id, tenant_id')
      .eq('id', lessonId)
      .single();

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Defense-in-depth: don't let a tenant admin sync a lesson from
    // another tenant.
    if (lesson.tenant_id !== userData.tenant_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const zoomService = new ZoomService(lesson.tenant_id);
    const result = await zoomService.syncLessonRecording(lessonId);

    if (!result.success) {
      // Pass errorCode through so the UI can localize the message
      // instead of showing Zoom's raw English error text.
      return NextResponse.json(
        { success: false, error: result.error, errorCode: result.errorCode },
        { status: result.errorCode === 'no_recording' ? 404 : 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error('[sync-recording] fatal error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
