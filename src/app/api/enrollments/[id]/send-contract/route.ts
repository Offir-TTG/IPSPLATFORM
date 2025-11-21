import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
import { getDocuSignClient } from '@/lib/docusign/client';

// POST /api/enrollments/[id]/send-contract - Send DocuSign contract for enrollment
export const POST = withAuth(async (
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) => {
  try {
    const supabase = await createClient();

    // Get enrollment details
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        *,
        student:students(*),
        program:programs(*)
      `)
      .eq('id', params.id)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { success: false, error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Check if contract is already signed
    if (enrollment.contract_signed) {
      return NextResponse.json(
        { success: false, error: 'Contract is already signed' },
        { status: 400 }
      );
    }

    // Check if program has DocuSign template configured
    if (!enrollment.program.docusign_template_id) {
      return NextResponse.json(
        { success: false, error: 'No DocuSign template configured for this program' },
        { status: 400 }
      );
    }

    // Check if DocuSign is configured and enabled
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('integration_key', 'docusign')
      .eq('is_enabled', true)
      .single();

    if (!integration) {
      return NextResponse.json(
        { success: false, error: 'DocuSign integration is not configured or enabled' },
        { status: 400 }
      );
    }

    // Prepare recipient information
    const recipientInfo = {
      email: enrollment.student.email,
      name: `${enrollment.student.first_name} ${enrollment.student.last_name}`,
      recipientId: enrollment.student.id,
      routingOrder: '1'
    };

    // Prepare email subject
    const emailSubject = `Contract for ${enrollment.program.name}`;

    // Prepare custom fields to track the enrollment
    const customFields = {
      enrollment_id: enrollment.id,
      program_id: enrollment.program.id,
      student_id: enrollment.student.id,
      tenant_id: enrollment.tenant_id
    };

    try {
      // Get DocuSign client from database integration
      const docusignClient = await getDocuSignClient();

      // Send the envelope
      const envelopeResponse = await docusignClient.sendEnvelopeFromTemplate(
        enrollment.program.docusign_template_id,
        recipientInfo,
        emailSubject,
        customFields
      );

      // Update enrollment with envelope information
      await supabase
        .from('enrollments')
        .update({
          signature_status: 'sent',
          signature_envelope_id: envelopeResponse.envelopeId,
          signature_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', enrollment.id);

      // Log the event
      await supabase.from('audit_events').insert({
        tenant_id: enrollment.tenant_id,
        user_id: user.id,
        action: 'contract_sent',
        resource_type: 'enrollment',
        resource_id: enrollment.id,
        details: {
          envelope_id: envelopeResponse.envelopeId,
          template_id: enrollment.program.docusign_template_id,
          recipient_email: recipientInfo.email
        },
        created_at: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        data: {
          envelopeId: envelopeResponse.envelopeId,
          status: envelopeResponse.status,
          message: 'Contract sent successfully'
        }
      });

    } catch (docusignError) {
      console.error('DocuSign error:', docusignError);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send contract',
          details: docusignError instanceof Error ? docusignError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Send contract error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send contract',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, ['admin', 'instructor']);

// GET /api/enrollments/[id]/send-contract - Get contract status
export const GET = withAuth(async (
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) => {
  try {
    const supabase = await createClient();

    // Get enrollment signature status
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .select('id, signature_status, signature_envelope_id, signature_sent_at, signature_completed_at, contract_signed')
      .eq('id', params.id)
      .single();

    if (error || !enrollment) {
      return NextResponse.json(
        { success: false, error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        enrollmentId: enrollment.id,
        signatureStatus: enrollment.signature_status,
        envelopeId: enrollment.signature_envelope_id,
        sentAt: enrollment.signature_sent_at,
        completedAt: enrollment.signature_completed_at,
        contractSigned: enrollment.contract_signed
      }
    });

  } catch (error) {
    console.error('Get contract status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get contract status'
      },
      { status: 500 }
    );
  }
}, ['admin', 'instructor', 'student']);