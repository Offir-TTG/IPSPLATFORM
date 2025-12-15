import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getDocuSignClientByTenantId } from '@/lib/docusign/client';

/**
 * POST /api/enrollments/token/:token/sync-signature
 *
 * Sync signature status from DocuSign when user returns from embedded signing
 * This ensures immediate status update without waiting for webhook
 * Uses admin client to bypass RLS since users are not authenticated yet
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createAdminClient();

    // Get enrollment details
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        id,
        tenant_id,
        docusign_envelope_id,
        signature_status,
        token_expires_at
      `)
      .eq('enrollment_token', params.token)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: 'Invalid enrollment token' },
        { status: 404 }
      );
    }

    // Verify token not expired
    if (new Date(enrollment.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Enrollment token has expired' }, { status: 410 });
    }

    // Check if there's a DocuSign envelope to sync
    if (!enrollment.docusign_envelope_id) {
      return NextResponse.json(
        { error: 'No DocuSign envelope found for this enrollment' },
        { status: 400 }
      );
    }

    // If already completed, no need to sync
    if (enrollment.signature_status === 'completed') {
      return NextResponse.json({
        success: true,
        signature_status: 'completed',
        message: 'Signature already marked as completed'
      });
    }

    try {
      // Get DocuSign client
      const docusignClient = await getDocuSignClientByTenantId(enrollment.tenant_id);

      // Check envelope status from DocuSign
      const envelopeStatus = await docusignClient.getEnvelopeStatus(enrollment.docusign_envelope_id);

      console.log('[Signature Sync] DocuSign envelope status:', envelopeStatus);

      // Update enrollment based on DocuSign status
      let newSignatureStatus = enrollment.signature_status;

      if (envelopeStatus.status === 'completed') {
        newSignatureStatus = 'completed';
      } else if (envelopeStatus.status === 'sent' || envelopeStatus.status === 'delivered') {
        newSignatureStatus = 'sent';
      } else if (envelopeStatus.status === 'declined') {
        newSignatureStatus = 'declined';
      } else if (envelopeStatus.status === 'voided') {
        newSignatureStatus = 'voided';
      }

      // Update enrollment if status changed
      if (newSignatureStatus !== enrollment.signature_status) {
        const { error: updateError } = await supabase
          .from('enrollments')
          .update({
            signature_status: newSignatureStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', enrollment.id);

        if (updateError) {
          console.error('[Signature Sync] Error updating enrollment:', updateError);
          throw new Error('Failed to update enrollment signature status');
        }

        console.log(`[Signature Sync] Updated signature_status from ${enrollment.signature_status} to ${newSignatureStatus}`);
      }

      return NextResponse.json({
        success: true,
        signature_status: newSignatureStatus,
        envelope_status: envelopeStatus.status,
        message: 'Signature status synced successfully'
      });

    } catch (docusignError) {
      console.error('[Signature Sync] DocuSign error:', docusignError);

      // Return current status even if DocuSign sync fails
      return NextResponse.json({
        success: false,
        signature_status: enrollment.signature_status,
        error: 'Failed to sync with DocuSign',
        details: docusignError instanceof Error ? docusignError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[Signature Sync] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync signature status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
