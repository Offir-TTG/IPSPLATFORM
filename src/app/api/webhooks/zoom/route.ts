import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

    // Get Zoom integration settings for webhook verification
    const supabase = await createClient();
    const { data: integration } = await supabase
      .from('integrations')
      .select('settings, credentials')
      .eq('integration_key', 'zoom')
      .eq('is_enabled', true)
      .single();

    // Verify webhook signature if secret token is configured
    const secretToken = integration?.settings?.webhook_secret_token || integration?.credentials?.webhook_secret_token;
    if (secretToken) {
      const signature = request.headers.get('x-zm-signature');
      const timestamp = request.headers.get('x-zm-request-timestamp');

      if (!signature || !timestamp) {
        console.error('Missing Zoom webhook signature headers');
        return NextResponse.json({ error: 'Missing signature headers' }, { status: 401 });
      }

      const isValid = verifyZoomWebhookSignature(body, signature, timestamp, secretToken);
      if (!isValid) {
        console.error('Invalid Zoom webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Handle endpoint URL validation
    if (payload.event === 'endpoint.url_validation') {
      const plainToken = payload.payload.plainToken;

      // Create HMAC hash
      const hash = crypto.createHmac('sha256', secretToken || '')
        .update(plainToken)
        .digest('hex');

      console.log('[Zoom Webhook] Endpoint validation successful');

      return NextResponse.json({
        plainToken,
        encryptedToken: hash
      });
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

  // Get Zoom session to find tenant_id
  const supabase = await createClient();
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

    // Get full lesson details
    const { data: fullLesson } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        course_id,
        program_id,
        start_time,
        courses (
          id,
          title
        ),
        programs (
          id,
          title
        )
      `)
      .eq('id', zoomSession.lesson_id)
      .single();

    // Get enrolled students for this lesson
    if (fullLesson) {
      // Get students based on course or program
      const enrollmentQuery = supabase
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
        .eq('status', 'active');

      if (fullLesson.course_id) {
        enrollmentQuery.eq('course_id', fullLesson.course_id);
      } else if (fullLesson.program_id) {
        enrollmentQuery.eq('program_id', fullLesson.program_id);
      }

      const { data: enrollments } = await enrollmentQuery;

      // Trigger event for each enrolled student
      if (enrollments && enrollments.length > 0) {
        for (const enrollment of enrollments) {
          if (enrollment.users) {
            await processTriggerEvent({
              eventType: 'recording.ready',
              tenantId: lesson.tenant_id,
              eventData: {
                lessonId: fullLesson.id,
                lessonTitle: fullLesson.title,
                courseId: fullLesson.course_id,
                programId: fullLesson.program_id,
                courseName: fullLesson.courses?.title || '',
                programName: fullLesson.programs?.title || '',
                meetingId: payload.object.id,
                meetingTopic: payload.object.topic,
                recordingFiles: payload.object.recording_files,
                recordingCount: payload.object.recording_files?.length || 0,
                userId: enrollment.user_id,
                email: enrollment.users.email,
                userName: enrollment.users.first_name,
                languageCode: enrollment.users.preferred_language || 'en',
              },
              userId: enrollment.user_id,
              metadata: {
                zoomMeetingId: payload.object.id,
                hostId: payload.object.host_id,
              },
            });
          }
        }
        console.log(`[Zoom] Triggered recording.ready for ${enrollments.length} students`);
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
