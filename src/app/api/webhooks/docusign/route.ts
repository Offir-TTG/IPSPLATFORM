import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// DocuSign Connect webhook events
interface DocuSignWebhookEvent {
  event: string;
  apiVersion: string;
  uri: string;
  retryCount: number;
  configurationId: string;
  generatedDateTime: string;
  data: {
    accountId: string;
    envelopeId: string;
    userId?: string;
    envelopeSummary?: {
      status: string;
      emailSubject: string;
      signingLocation: string;
      enableWetSign: string;
      statusChangedDateTime: string;
      documentsUri: string;
      recipientsUri: string;
      attachmentsUri: string;
      envelopeUri: string;
      customFieldsUri: string;
      notificationUri: string;
    };
    recipients?: {
      signers?: Array<{
        recipientId: string;
        email: string;
        name: string;
        status: string;
        signedDateTime?: string;
        deliveredDateTime?: string;
        declinedDateTime?: string;
        declinedReason?: string;
      }>;
    };
    customFields?: {
      textCustomFields?: Array<{
        fieldId: string;
        name: string;
        value: string;
      }>;
    };
  };
}

// Verify DocuSign HMAC signature
function verifyDocuSignSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const calculatedSignature = hmac.digest('base64');
  return calculatedSignature === signature;
}

// POST /api/webhooks/docusign - Handle DocuSign Connect webhook events
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the raw payload for signature verification
    const rawPayload = await request.text();

    // Get signature from headers
    const signature = request.headers.get('X-DocuSign-Signature-1');

    // Get webhook secret from integrations table
    const { data: integration } = await supabase
      .from('integrations')
      .select('credentials')
      .eq('integration_key', 'docusign')
      .single();

    // Verify signature if webhook secret is configured
    if (integration?.credentials?.webhook_secret && signature) {
      const isValid = verifyDocuSignSignature(
        rawPayload,
        signature,
        integration.credentials.webhook_secret
      );

      if (!isValid) {
        console.error('Invalid DocuSign webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse the JSON payload
    const event: DocuSignWebhookEvent = JSON.parse(rawPayload);

    console.log('DocuSign webhook event received:', {
      event: event.event,
      envelopeId: event.data.envelopeId,
      status: event.data.envelopeSummary?.status
    });

    // Handle different event types
    switch (event.event) {
      case 'envelope-sent':
        await handleEnvelopeSent(supabase, event);
        break;

      case 'envelope-delivered':
        await handleEnvelopeDelivered(supabase, event);
        break;

      case 'envelope-completed':
        await handleEnvelopeCompleted(supabase, event);
        break;

      case 'envelope-declined':
        await handleEnvelopeDeclined(supabase, event);
        break;

      case 'envelope-voided':
        await handleEnvelopeVoided(supabase, event);
        break;

      case 'recipient-completed':
        await handleRecipientCompleted(supabase, event);
        break;

      default:
        console.log('Unhandled DocuSign event:', event.event);
    }

    // Store the webhook event for audit
    await supabase.from('webhook_events').insert({
      source: 'docusign',
      event_type: event.event,
      payload: event,
      processed_at: new Date().toISOString()
    });

    // Return success response to DocuSign
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('DocuSign webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle envelope sent event
async function handleEnvelopeSent(supabase: any, event: DocuSignWebhookEvent) {
  const { envelopeId, envelopeSummary } = event.data;

  // Update enrollment status if this is related to a program enrollment
  const customFields = event.data.customFields?.textCustomFields || [];
  const enrollmentId = customFields.find(f => f.name === 'enrollment_id')?.value;

  if (enrollmentId) {
    await supabase
      .from('enrollments')
      .update({
        signature_status: 'sent',
        docusign_envelope_id: envelopeId,
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollmentId);
  }

  console.log(`Envelope ${envelopeId} sent for enrollment ${enrollmentId}`);
}

// Handle envelope delivered event
async function handleEnvelopeDelivered(supabase: any, event: DocuSignWebhookEvent) {
  const { envelopeId } = event.data;
  const customFields = event.data.customFields?.textCustomFields || [];
  const enrollmentId = customFields.find(f => f.name === 'enrollment_id')?.value;

  if (enrollmentId) {
    await supabase
      .from('enrollments')
      .update({
        signature_status: 'delivered',
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollmentId);
  }

  console.log(`Envelope ${envelopeId} delivered for enrollment ${enrollmentId}`);
}

// Handle envelope completed event
async function handleEnvelopeCompleted(supabase: any, event: DocuSignWebhookEvent) {
  const { envelopeId, envelopeSummary } = event.data;
  const customFields = event.data.customFields?.textCustomFields || [];
  const enrollmentId = customFields.find(f => f.name === 'enrollment_id')?.value;

  if (enrollmentId) {
    // Update enrollment with completed signature
    await supabase
      .from('enrollments')
      .update({
        signature_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollmentId);

    // Create notification for admin
    await supabase.from('notifications').insert({
      type: 'signature_completed',
      title: 'Contract Signed',
      message: `Enrollment contract has been signed for enrollment ${enrollmentId}`,
      data: {
        enrollment_id: enrollmentId,
        envelope_id: envelopeId
      },
      created_at: new Date().toISOString()
    });
  }

  console.log(`Envelope ${envelopeId} completed for enrollment ${enrollmentId}`);
}

// Handle envelope declined event
async function handleEnvelopeDeclined(supabase: any, event: DocuSignWebhookEvent) {
  const { envelopeId } = event.data;
  const customFields = event.data.customFields?.textCustomFields || [];
  const enrollmentId = customFields.find(f => f.name === 'enrollment_id')?.value;
  const declinedReason = event.data.recipients?.signers?.[0]?.declinedReason;

  if (enrollmentId) {
    await supabase
      .from('enrollments')
      .update({
        signature_status: 'declined',
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollmentId);

    // Create notification for admin
    await supabase.from('notifications').insert({
      type: 'signature_declined',
      title: 'Contract Declined',
      message: `Enrollment contract was declined: ${declinedReason || 'No reason provided'}`,
      data: {
        enrollment_id: enrollmentId,
        envelope_id: envelopeId,
        reason: declinedReason
      },
      created_at: new Date().toISOString()
    });
  }

  console.log(`Envelope ${envelopeId} declined for enrollment ${enrollmentId}: ${declinedReason}`);
}

// Handle envelope voided event
async function handleEnvelopeVoided(supabase: any, event: DocuSignWebhookEvent) {
  const { envelopeId } = event.data;
  const customFields = event.data.customFields?.textCustomFields || [];
  const enrollmentId = customFields.find(f => f.name === 'enrollment_id')?.value;

  if (enrollmentId) {
    await supabase
      .from('enrollments')
      .update({
        signature_status: 'voided',
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollmentId);
  }

  console.log(`Envelope ${envelopeId} voided for enrollment ${enrollmentId}`);
}

// Handle recipient completed event
async function handleRecipientCompleted(supabase: any, event: DocuSignWebhookEvent) {
  const { envelopeId } = event.data;
  const signer = event.data.recipients?.signers?.[0];

  if (signer) {
    console.log(`Recipient ${signer.name} (${signer.email}) completed signing envelope ${envelopeId}`);

    // You can add additional logic here if needed for specific recipient actions
  }
}

// GET /api/webhooks/docusign - Return webhook configuration info
export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: '/api/webhooks/docusign',
    method: 'POST',
    description: 'DocuSign Connect webhook endpoint',
    events: [
      'envelope-sent',
      'envelope-delivered',
      'envelope-completed',
      'envelope-declined',
      'envelope-voided',
      'recipient-completed'
    ],
    headers: {
      'X-DocuSign-Signature-1': 'HMAC signature for payload verification'
    }
  });
}