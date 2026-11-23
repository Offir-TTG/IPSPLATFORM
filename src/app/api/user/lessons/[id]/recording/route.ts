import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { loadIntegration } from '@/lib/integrations/store';
import { createZoomClient } from '@/lib/zoom/client';
import { loadClientLearning } from '@/lib/portal/clientLearning';
import { requireCourseAccess } from '@/lib/payments/accessControl';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> | { id: string } };

/**
 * GET /api/user/lessons/[id]/recording
 *
 * Plays a lesson's Zoom recording in the portal's own video player, without
 * Zoom's page. Checks the client may see the lesson's course (the same rules
 * as the course page), then redirects to Zoom's short-lived link for the
 * video file. The browser gets that one link, never the Zoom credentials.
 */
export const GET = withAuth(
  async (request: NextRequest, user: any, context: Ctx) => {
    const { id: lessonId } = await context.params;
    const admin = createAdminClient();

    const { data: lesson } = await admin
      .from('lessons')
      .select('id, is_published, course_id, tenant_id, zoom_sessions (recording_files, zoom_meeting_id, zoom_meeting_uuid)')
      .eq('id', lessonId)
      .maybeSingle();
    if (!lesson || !lesson.is_published) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // The client must be able to enter the course (directly, a club or a program) and have paid for it.
    const staff = user.role === 'admin' || user.role === 'super_admin';
    if (!staff) {
      const learning = await loadClientLearning(user.id);
      if (!learning.courseIds.includes(lesson.course_id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const denied = await requireCourseAccess(user.id, lesson.course_id, lesson.tenant_id);
      if (denied) return denied;
    }

    const session: any = Array.isArray(lesson.zoom_sessions) ? lesson.zoom_sessions[0] : lesson.zoom_sessions;
    let files: any[] = [];
    try {
      files = Array.isArray(session?.recording_files) ? session.recording_files : JSON.parse(session?.recording_files || '[]');
    } catch {
      files = [];
    }
    const videos = files.filter((f) => f?.download_url && String(f.file_type ?? '').toUpperCase() === 'MP4' && f.status !== 'deleted');
    const video = videos.find((f) => f.recording_type === 'shared_screen_with_speaker_view') ?? videos[0];
    if (!video) return NextResponse.json({ error: 'No recording file' }, { status: 404 });

    const { data: integration } = await loadIntegration(lesson.tenant_id, 'zoom', { enabledOnly: true });
    const c = integration?.credentials as any;
    if (!c?.account_id || !c?.client_id || !c?.client_secret) return NextResponse.json({ error: 'Zoom is not connected' }, { status: 503 });

    try {
      const zoom = createZoomClient(c, integration?.settings as any);
      let link = await zoom.getRecordingFileLink(video.download_url);
      let gone = false;
      // The saved address can go stale: ask Zoom for the meeting's current files and use the fresh one.
      if (!link && (session?.zoom_meeting_uuid || session?.zoom_meeting_id)) {
        const uuid = session.zoom_meeting_uuid as string | null;
        const key = uuid ? encodeURIComponent(encodeURIComponent(uuid)) : String(session.zoom_meeting_id);
        const fresh: any = await zoom.getRecordings(key).catch((e: any) => {
          // 404: Zoom no longer has this meeting's recording (deleted, or in Zoom's trash).
          if (e?.status === 404) gone = true;
          return null;
        });
        const freshVideos = (fresh?.recording_files ?? []).filter((f: any) => f?.download_url && String(f.file_type ?? '').toUpperCase() === 'MP4');
        const freshVideo = freshVideos.find((f: any) => f.id === video.id) ?? freshVideos.find((f: any) => f.recording_type === video.recording_type) ?? freshVideos[0];
        if (freshVideo) link = await zoom.getRecordingFileLink(freshVideo.download_url);
      }
      // ?check=1: only says whether it can play, so the page can explain when it can't.
      if (new URL(request.url).searchParams.get('check') === '1') return NextResponse.json({ ok: !!link, reason: link ? null : gone ? 'gone' : 'unavailable' });
      if (!link) return NextResponse.json({ error: gone ? 'Recording no longer at Zoom' : 'Recording unavailable' }, { status: gone ? 410 : 502 });
      const res = NextResponse.redirect(link, 302);
      res.headers.set('Cache-Control', 'no-store');
      return res;
    } catch (e) {
      console.error('[recording] Zoom link failed:', e);
      return NextResponse.json({ error: 'Recording unavailable' }, { status: 502 });
    }
  },
  ['student', 'instructor', 'admin', 'super_admin'],
);
