import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDocuSignClient } from '@/lib/docusign/client';

// POST /api/enrollments/[id]/send-contract - Send DocuSign contract for enrollment (embedded signing)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get enrollment details with product
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        id,
        user_id,
        product_id,
        tenant_id,
        signature_status,
        docusign_envelope_id,
        product:products!enrollments_product_id_fkey (
          id,
          title,
          type,
          requires_signature,
          signature_template_id
        )
      `)
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (enrollment.user_id !== userData.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const product = Array.isArray(enrollment.product) ? enrollment.product[0] : enrollment.product;

    // Check if signature is already complete
    if (enrollment.signature_status === 'completed') {
      return NextResponse.json(
        { error: 'Contract is already signed' },
        { status: 400 }
      );
    }

    // Check if product requires signature
    if (!product.requires_signature) {
      return NextResponse.json(
        { error: 'This enrollment does not require a signature' },
        { status: 400 }
      );
    }

    // Check if product has DocuSign template configured
    if (!product.signature_template_id) {
      return NextResponse.json(
        { error: 'No DocuSign template configured for this product' },
        { status: 400 }
      );
    }

    // Check if DocuSign is configured and enabled
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .eq('integration_key', 'docusign')
      .eq('is_enabled', true)
      .single();

    if (!integration) {
      return NextResponse.json(
        { error: 'DocuSign integration is not configured or enabled' },
        { status: 400 }
      );
    }

    // Prepare recipient information
    const recipientInfo = {
      email: userData.email,
      name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email,
      recipientId: userData.id,
      clientUserId: userData.id // For embedded signing
    };

    // Prepare email subject
    const emailSubject = `Enrollment Agreement for ${product.title}`;

    // Prepare custom fields to track the enrollment
    const customFields = {
      enrollment_id: enrollment.id,
      product_id: product.id,
      user_id: userData.id,
      tenant_id: enrollment.tenant_id
    };

    // Return URL after signing (back to wizard)
    const returnUrl = `${request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL}/enroll/wizard/${enrollment.id}?docusign=complete`;

    try {
      // Get DocuSign client from database integration
      const docusignClient = await getDocuSignClient();

      // Create envelope using template (for now, use regular template sending)
      // TODO: Implement embedded signing when DocuSignClient supports it
      const envelopeResponse = await docusignClient.sendEnvelopeFromTemplate(
        product.signature_template_id,
        recipientInfo,
        emailSubject,
        customFields
      );

      // Update enrollment with envelope information
      await supabase
        .from('enrollments')
        .update({
          signature_status: 'sent',
          docusign_envelope_id: envelopeResponse.envelopeId,
          updated_at: new Date().toISOString()
        })
        .eq('id', enrollment.id);

      // Log the event
      await supabase.from('audit_events').insert({
        tenant_id: enrollment.tenant_id,
        user_id: userData.id,
        action: 'signature_requested',
        resource_type: 'enrollment',
        resource_id: enrollment.id,
        details: {
          envelope_id: envelopeResponse.envelopeId,
          template_id: product.signature_template_id,
          recipient_email: recipientInfo.email,
          signing_method: 'embedded'
        },
        created_at: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        envelope_id: envelopeResponse.envelopeId,
        status: envelopeResponse.status,
        message: 'Signature request sent via email'
      });

    } catch (docusignError) {
      console.error('DocuSign error:', docusignError);

      return NextResponse.json(
        {
          error: 'Failed to create signature request',
          details: docusignError instanceof Error ? docusignError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Send contract error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send contract',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/enrollments/[id]/send-contract - Get contract status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get enrollment signature status
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .select('id, user_id, signature_status, docusign_envelope_id, updated_at')
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (error || !enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (enrollment.user_id !== userData.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      enrollment_id: enrollment.id,
      signature_status: enrollment.signature_status,
      envelope_id: enrollment.docusign_envelope_id,
      updated_at: enrollment.updated_at
    });

  } catch (error) {
    console.error('Get contract status error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get contract status'
      },
      { status: 500 }
    );
  }
}