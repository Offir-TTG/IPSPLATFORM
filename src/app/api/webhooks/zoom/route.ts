import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { zoomService } from '@/lib/zoom/zoomService';
import crypto from 'crypto';

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

  // Process recording using zoom service
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
