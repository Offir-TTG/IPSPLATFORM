import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getDocuSignClientByTenantId } from '@/lib/docusign/client';

/**
 * GET /api/enrollments/token/:token/check-signature
 *
 * Check the actual DocuSign envelope status and update enrollment signature_status
 * This is needed because webhooks don't work in local development
 * Uses admin client to bypass RLS since users are not authenticated yet
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createAdminClient();

    // Get enrollment with envelope ID
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, tenant_id, docusign_envelope_id, signature_status, token_expires_at')
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

    // If no envelope ID, nothing to check
    if (!enrollment.docusign_envelope_id) {
      return NextResponse.json({
        signature_status: enrollment.signature_status,
        checked: false,
        message: 'No DocuSign envelope ID found'
      });
    }

    console.log('[Check Signature] Checking DocuSign status for envelope:', enrollment.docusign_envelope_id);

    try {
      // Get DocuSign client
      const docusignClient = await getDocuSignClientByTenantId(enrollment.tenant_id);

      // Get envelope status from DocuSign
      const envelopeStatus = await docusignClient.getEnvelopeStatus(enrollment.docusign_envelope_id);

      console.log('[Check Signature] DocuSign envelope status:', envelopeStatus);

      // Map DocuSign status to our signature_status
      let newSignatureStatus = enrollment.signature_status;

      switch (envelopeStatus.status) {
        case 'completed':
          newSignatureStatus = 'completed';
          break;
        case 'sent':
          newSignatureStatus = 'sent';
          break;
        case 'delivered':
          newSignatureStatus = 'delivered';
          break;
        case 'declined':
          newSignatureStatus = 'declined';
          break;
        case 'voided':
          newSignatureStatus = 'voided';
          break;
      }

      // Update enrollment if status changed
      if (newSignatureStatus !== enrollment.signature_status) {
        console.log('[Check Signature] Updating signature status:', {
          old: enrollment.signature_status,
          new: newSignatureStatus
        });

        const { error: updateError } = await supabase
          .from('enrollments')
          .update({
            signature_status: newSignatureStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', enrollment.id);

        if (updateError) {
          console.error('[Check Signature] Failed to update signature status:', updateError);
        }
      }

      return NextResponse.json({
        signature_status: newSignatureStatus,
        envelope_status: envelopeStatus.status,
        checked: true,
        updated: newSignatureStatus !== enrollment.signature_status
      });

    } catch (docusignError) {
      console.error('[Check Signature] DocuSign error:', docusignError);

      // Return current status even if DocuSign check fails
      return NextResponse.json({
        signature_status: enrollment.signature_status,
        checked: false,
        error: docusignError instanceof Error ? docusignError.message : 'Failed to check DocuSign status'
      });
    }

  } catch (error) {
    console.error('[Check Signature] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
