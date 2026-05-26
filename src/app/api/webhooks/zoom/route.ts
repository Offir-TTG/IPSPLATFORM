import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { ZoomService } from '@/lib/zoom/zoomService';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Zoom Webhook Handler
 *
 * Handles incoming webhooks from Zoom for various events:
 * - meeting.started
 * - meeting.ended
 * - meeting.participant_joined
 * - meeting.participant_left
 * - recording.completed
 * - recording.transcript_completed
 *
 * Documentation: https://developers.zoom.us/docs/api/rest/webhook-reference/
 */

// Verify Zoom webhook signature
function verifyZoomWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string,
  secretToken: string
): boolean {
  try {
    const message = `v0:${timestamp}:${payload}`;
    const hmac = crypto.createHmac('sha256', secretToken);
    const expectedSignature = `v0=${hmac.update(message).digest('hex')}`;

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying Zoom webhook signature:', error);
    return false;
  }
}

// POST /api/webhooks/zoom
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const payload = JSON.parse(body);

    console.log('[Zoom Webhook] Incoming POST. event=', payload?.event);

    // Webhooks arrive from Zoom with no auth cookies → user-scoped client
    // gets blocked by RLS. Use service-role to read the integration row
    // and insert webhook_events below.
    const supabase = createAdminClient();

    // Multi-tenant: each tenant has its own `integrations` row for zoom,
    // each potentially with a different webhook_secret_token. The previous
    // code did `.limit(1)` without an ORDER BY, which picked a random row —
    // often NOT the one that the active admin saved their fresh token into.
    // Fix: load ALL enabled zoom rows and gather every candidate token.
    const { data: integrations, error: intErr } = await supabase
      .from('integrations')
      .select('settings, credentials, tenant_id, updated_at')
      .eq('integration_key', 'zoom')
      .eq('is_enabled', true)
      .order('updated_at', { ascending: false });

    if (intErr) {
      console.error('[Zoom Webhook] integrations query failed:', intErr);
    }

    // Collect every distinct non-empty token across all integration rows,
    // trimmed defensively. Most-recently-updated first.
    // IMPORTANT: read `credentials.webhook_secret_token` BEFORE
    // `settings.webhook_secret_token` — the admin integration UI saves
    // the new "Webhook Secret Token" field to `credentials`, but older
    // versions of the platform may have left a stale value in `settings`.
    // We want the value the admin most recently typed to win.
    const candidateTokens: string[] = [];
    for (const row of integrations ?? []) {
      const fromCredentials = row?.credentials?.webhook_secret_token;
      const fromSettings    = row?.settings?.webhook_secret_token;
      for (const raw of [fromCredentials, fromSettings]) {
        const trimmed = raw ? String(raw).trim() : null;
        if (trimmed && !candidateTokens.includes(trimmed)) {
          candidateTokens.push(trimmed);
        }
      }
    }

    // `secretToken` = the most-recently-updated tenant's token. Used for
    // URL validation (we don't know which tenant Zoom is associated with
    // at validation time, so we pick the freshest) and as a fallback when
    // signature verification needs to try just one.
    const secretToken = candidateTokens[0] ?? null;

    const fingerprints = candidateTokens
      .map(t => `${t.slice(0, 4)}...${t.slice(-4)}(len=${t.length})`)
      .join(', ');

    console.log(
      '[Zoom Webhook] integrations_count=', integrations?.length ?? 0,
      'candidates=', candidateTokens.length,
      'fingerprints=', fingerprints || 'NONE'
    );

    // ----------------------------------------------------------------
    // URL validation challenge — handled BEFORE signature check, since
    // the challenge request itself doesn't carry signature headers.
    // ----------------------------------------------------------------
    if (payload.event === 'endpoint.url_validation') {
      if (!secretToken) {
        console.error('[Zoom Webhook] URL validation: no webhook_secret_token found. Either the integration row is missing, the integration is disabled, or the token field is empty.');
        return NextResponse.json(
          { error: 'Webhook Secret Token not configured in IPSPlatform' },
          { status: 500 }
        );
      }

      const plainToken = payload?.payload?.plainToken;
      if (!plainToken) {
        console.error('[Zoom Webhook] URL validation payload missing plainToken:', JSON.stringify(payload));
        return NextResponse.json({ error: 'Missing plainToken in payload' }, { status: 400 });
      }

      const hash = crypto.createHmac('sha256', secretToken)
        .update(plainToken)
        .digest('hex');

      console.log('[Zoom Webhook] URL validation OK. plainTokenLength=', plainToken.length, 'hashLength=', hash.length);
      return NextResponse.json({
        plainToken,
        encryptedToken: hash,
      });
    }

    // ----------------------------------------------------------------
    // For all OTHER events: verify HMAC signature against ALL candidate
    // tokens — accept if any tenant's stored secret produces a match.
    // (Zoom doesn't tell us which tenant the event belongs to here.)
    // ----------------------------------------------------------------
    if (candidateTokens.length > 0) {
      const signature = request.headers.get('x-zm-signature');
      const timestamp = request.headers.get('x-zm-request-timestamp');

      if (!signature || !timestamp) {
        console.error('Missing Zoom webhook signature headers');
        return NextResponse.json({ error: 'Missing signature headers' }, { status: 401 });
      }

      const matched = candidateTokens.some(t =>
        verifyZoomWebhookSignature(body, signature, timestamp, t)
      );
      if (!matched) {
        console.error('Invalid Zoom webhook signature against all', candidateTokens.length, 'candidate tokens');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    console.log('[Zoom Webhook] Received event:', payload.event);

    // Store webhook event in database
    await supabase.from('webhook_events').insert({
      source: 'zoom',
      event_type: payload.event,
      payload: payload,
      created_at: new Date().toISOString()
    });

    // Handle different event types
    switch (payload.event) {
      case 'meeting.started':
        await handleMeetingStarted(payload.payload);
        break;

      case 'meeting.ended':
        await handleMeetingEnded(payload.payload);
        break;

      case 'meeting.participant_joined':
        await handleParticipantJoined(payload.payload);
        break;

      case 'meeting.participant_left':
        await handleParticipantLeft(payload.payload);
        break;

      case 'recording.completed':
        await handleRecordingCompleted(payload.payload);
        break;

      case 'recording.transcript_completed':
        await handleTranscriptCompleted(payload.payload);
        break;

      default:
        console.log('[Zoom Webhook] Unhandled event type:', payload.event);
    }

    return NextResponse.json({ success: true, message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('[Zoom Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Handle meeting started event
async function handleMeetingStarted(payload: any) {
  console.log('[Zoom] Meeting started:', {
    meetingId: payload.object.id,
    topic: payload.object.topic,
    startTime: payload.object.start_time
  });

  // TODO: Update meeting status in database
  // You can extend this to update course/program sessions or send notifications
}

// Handle meeting ended event
async function handleMeetingEnded(payload: any) {
  console.log('[Zoom] Meeting ended:', {
    meetingId: payload.object.id,
    topic: payload.object.topic,
    duration: payload.object.duration
  });

  // TODO: Update meeting status, calculate attendance, etc.
}

// Handle participant joined event
async function handleParticipantJoined(payload: any) {
  console.log('[Zoom] Participant joined:', {
    meetingId: payload.object.id,
    participantName: payload.object.participant.user_name,
    participantEmail: payload.object.participant.email,
    joinTime: payload.object.participant.join_time
  });

  // TODO: Track participant attendance
}

// Handle participant left event
async function handleParticipantLeft(payload: any) {
  console.log('[Zoom] Participant left:', {
    meetingId: payload.object.id,
    participantName: payload.object.participant.user_name,
    duration: payload.object.participant.duration
  });

  // TODO: Calculate participant duration and update attendance records
}

// Handle recording completed event
async function handleRecordingCompleted(payload: any) {
  console.log('[Zoom] Recording completed:', {
    meetingId: payload.object.id,
    topic: payload.object.topic,
    recordingCount: payload.object.recording_files?.length || 0
  });

  // Get Zoom session to find tenant_id. Webhook context = no user auth,
  // so use the service-role client to bypass RLS.
  const supabase = createAdminClient();
  const { data: zoomSession } = await supabase
    .from('zoom_sessions')
    .select('lesson_id')
    .eq('zoom_meeting_id', payload.object.id)
    .single();

  if (!zoomSession?.lesson_id) {
    console.error('[Zoom] No lesson found for meeting:', payload.object.id);
    return;
  }

  // Get lesson to find tenant_id
  const { data: lesson } = await supabase
    .from('lessons')
    .select('tenant_id')
    .eq('id', zoomSession.lesson_id)
    .single();

  if (!lesson?.tenant_id) {
    console.error('[Zoom] No tenant_id found for lesson:', zoomSession.lesson_id);
    return;
  }

  // Process recording using zoom service
  const zoomService = new ZoomService(lesson.tenant_id);
  const result = await zoomService.processRecordingWebhook(payload);

  if (!result.success) {
    console.error('[Zoom] Failed to process recording:', result.error);
    // Don't throw error - we don't want to fail the webhook
    // The event is already stored in webhook_events table for debugging
    return;
  }

  console.log('[Zoom] Recording processed successfully:', {
    meetingId: payload.object.id,
    recordingCount: payload.object.recording_files?.length || 0
  });

  // Trigger recording.ready event
  try {
    const { processTriggerEvent } = await import('@/lib/email/triggerEngine');

    // Get full lesson details.
    //
    // CRITICAL: `lessons` has NO `program_id` column and NO `programs`
    // relation — listing them in the select caused PostgREST to return
    // `data: null` + an error. Since the surrounding code never
    // checked the error and just read `data`, `fullLesson` was always
    // null, the entire `if (fullLesson) { ... }` recipient-resolution
    // block was skipped, and ZERO `recording.ready` emails were ever
    // queued (recording-completed webhook fired, but no email went
    // out). Use only the columns/relations that actually exist.
    const { data: fullLesson, error: fullLessonError } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        course_id,
        start_time,
        courses (
          id,
          title
        )
      `)
      .eq('id', zoomSession.lesson_id)
      .single();
    if (fullLessonError) {
      console.error('[Zoom] Failed to load lesson for trigger:', fullLessonError);
    }
    if (!fullLesson) {
      console.error('[Zoom] recording.ready: fullLesson is null — skipping recipient resolution');
      return;
    }
    console.log('[Zoom] recording.ready: lesson loaded', {
      lessonId: fullLesson.id,
      courseId: (fullLesson as any).course_id,
      title: (fullLesson as any).title,
    });

    // Get enrolled students for this lesson.
    //
    // `enrollments` has NO `course_id` / `program_id` columns — the
    // relationship goes through `products`:
    //   enrollments.product_id → products(.course_id | .program_id)
    // Older code tried `enrollments.eq('course_id', …)` and got zero
    // rows back, which is why no recording-ready emails ever fired
    // even when the recording itself saved fine to the user portal.
    let enrollments: any[] | null = null;
    if (fullLesson) {
      // Step 1: products that contain this lesson's course OR program.
      const productQuery = supabase
        .from('products')
        .select('id')
        .eq('tenant_id', lesson.tenant_id);

      // `lessons` only has `course_id`. `program_id` lived in an older
      // schema and was removed; the previous branch on `fullLesson.program_id`
      // dead code given the lesson-table reality.
      if (fullLesson.course_id) {
        productQuery.eq('course_id', fullLesson.course_id);
      } else {
        // Nothing to scope to — bail.
        console.warn('[Zoom] recording.ready: lesson has no course_id — bailing');
        return;
      }

      const { data: products, error: productErr } = await productQuery;
      if (productErr) {
        console.error('[Zoom] recording.ready: products query failed:', productErr);
      }
      const productIds = (products ?? []).map((p) => p.id);
      console.log('[Zoom] recording.ready: products mapped to this course:', productIds.length);

      // Step 2: active enrollments on those products.
      if (productIds.length > 0) {
        const { data: rows } = await supabase
          .from('enrollments')
          .select(`
            user_id,
            users (
              email,
              first_name,
              last_name,
              preferred_language
            )
          `)
          .eq('tenant_id', lesson.tenant_id)
          .eq('status', 'active')
          .in('product_id', productIds);
        enrollments = rows;
      }
      console.log('[Zoom] recording.ready: active enrollments on those products:', enrollments?.length ?? 0);

      // Trigger event for each enrolled student
      if (enrollments && enrollments.length > 0) {
        let triggeredOk = 0;
        for (const enrollment of enrollments) {
          if (enrollment.users) {
            const triggerResult: any = await processTriggerEvent({
              eventType: 'recording.ready',
              tenantId: lesson.tenant_id,
              eventData: {
                lessonId: fullLesson.id,
                lessonTitle: fullLesson.title,
                courseId: fullLesson.course_id,
                courseName: (fullLesson.courses as any)?.title || '',
                meetingId: payload.object.id,
                meetingTopic: payload.object.topic,
                recordingFiles: payload.object.recording_files,
                recordingCount: payload.object.recording_files?.length || 0,
                userId: enrollment.user_id,
                email: (enrollment.users as any).email,
                userName: (enrollment.users as any).first_name,
                languageCode: (enrollment.users as any).preferred_language || 'en',
              },
              userId: enrollment.user_id,
              metadata: {
                zoomMeetingId: payload.object.id,
                hostId: payload.object.host_id,
              },
            });
            // The trigger engine returns a shape like
            // { success, matched_triggers, processed, queued } or
            // similar; we don't bind a strict type because old/new
            // engine versions differ. Log it raw so we can see what
            // came back per recipient.
            console.log('[Zoom] recording.ready: trigger result for', (enrollment.users as any).email, '→', triggerResult);
            if (triggerResult && (triggerResult.success !== false)) {
              triggeredOk += 1;
            }
          }
        }
        console.log(
          `[Zoom] Triggered recording.ready for ${enrollments.length} students (${triggeredOk} OK)`,
        );
      }
    }
  } catch (triggerError) {
    console.error('Error processing recording.ready trigger:', triggerError);
    // Don't fail webhook if trigger fails
  }
}

// Handle transcript completed event
async function handleTranscriptCompleted(payload: any) {
  console.log('[Zoom] Transcript completed:', {
    meetingId: payload.object.id,
    topic: payload.object.topic
  });

  // TODO: Store transcript links, make searchable, etc.
}

// GET endpoint - not used for webhooks but can provide info
export async function GET() {
  return NextResponse.json({
    message: 'Zoom webhook endpoint',
    instructions: 'Configure this URL in your Zoom App Event Subscriptions',
    url: '/api/webhooks/zoom',
    supportedEvents: [
      'meeting.started',
      'meeting.ended',
      'meeting.participant_joined',
      'meeting.participant_left',
      'recording.completed',
      'recording.transcript_completed'
    ]
  });
}
