import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getDocuSignClientByTenantId } from '@/lib/docusign/client';

/**
 * POST /api/enrollments/token/:token/send-contract
 *
 * Send DocuSign contract for enrollment WITHOUT requiring authentication
 * Uses admin client to bypass RLS since users are not authenticated yet
 *
 * MEMORY-BASED WIZARD APPROACH:
 * - Profile data is passed in request body (not read from database)
 * - Wizard keeps profile data in React state until final completion
 *
 * Request Body:
 * - profile: { first_name, last_name, email, phone, address }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Use admin client to bypass RLS - enrollment links are accessed by unauthenticated users
    const supabase = createAdminClient();

    // Get profile data from request body (memory-based wizard)
    const body = await request.json();
    const { profile } = body;

    console.log('[Send Contract] Received profile data:', profile);

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
        token_expires_at,
        wizard_profile_data,
        product:products!enrollments_product_id_fkey (
          id,
          title,
          type,
          requires_signature,
          signature_template_id
        )
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
      .eq('tenant_id', enrollment.tenant_id)
      .eq('integration_key', 'docusign')
      .eq('is_enabled', true)
      .single();

    if (!integration) {
      return NextResponse.json(
        { error: 'DocuSign integration is not configured or enabled' },
        { status: 400 }
      );
    }

    // Use profile data from request body (memory-based wizard approach)
    const profileData = profile || {};

    console.log('[Send Contract] Using profile data:', profileData);

    if (!profileData.email || !profileData.first_name) {
      return NextResponse.json(
        { error: 'Profile data incomplete. Please complete your profile first.' },
        { status: 400 }
      );
    }

    // Prepare recipient information
    const recipientInfo = {
      email: profileData.email,
      name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || profileData.email,
      recipientId: enrollment.id, // Use enrollment ID since no user account exists yet
      clientUserId: enrollment.id // For embedded signing
    };

    // Prepare email subject
    const emailSubject = `Enrollment Agreement for ${product.title}`;

    // Prepare custom fields to track the enrollment
    const customFields = {
      enrollment_id: enrollment.id,
      product_id: product.id,
      tenant_id: enrollment.tenant_id,
      enrollment_token: params.token // Include token for tracking
    };

    // Return URL after signing (back to wizard with token)
    const returnUrl = `${request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL}/enroll/wizard/${enrollment.id}?token=${params.token}&docusign=complete`;

    try {
      // Get DocuSign client from database integration using tenant ID
      const docusignClient = await getDocuSignClientByTenantId(enrollment.tenant_id);

      // Create envelope using template
      const envelopeResponse = await docusignClient.sendEnvelopeFromTemplate(
        product.signature_template_id,
        recipientInfo,
        emailSubject,
        customFields
      );

      // Get embedded signing URL for immediate signing
      const signingUrl = await docusignClient.getRecipientViewUrl(
        envelopeResponse.envelopeId,
        recipientInfo,
        returnUrl
      );

      // Update enrollment with envelope information
      // Also save profile data for new users (when user_id is NULL)
      const updateData: any = {
        signature_status: 'sent',
        docusign_envelope_id: envelopeResponse.envelopeId,
        updated_at: new Date().toISOString()
      };

      // Save profile data if this is a new user enrollment (user_id is NULL)
      if (!enrollment.user_id && profileData) {
        updateData.wizard_profile_data = profileData;
        console.log('[Send Contract] Saving wizard_profile_data for new user:', profileData);
      }

      const { data: updateResult, error: updateError } = await supabase
        .from('enrollments')
        .update(updateData)
        .eq('id', enrollment.id)
        .select();

      if (updateError) {
        console.error('[Send Contract] Failed to update enrollment:', updateError);
        return NextResponse.json(
          { error: 'Failed to save enrollment data: ' + updateError.message },
          { status: 500 }
        );
      }

      console.log('[Send Contract] Successfully updated enrollment:', updateResult);

      // Log the event (without user_id since no account exists yet)
      await supabase.from('audit_events').insert({
        tenant_id: enrollment.tenant_id,
        user_id: null, // No user account yet
        action: 'signature_requested',
        resource_type: 'enrollment',
        resource_id: enrollment.id,
        details: {
          envelope_id: envelopeResponse.envelopeId,
          template_id: product.signature_template_id,
          recipient_email: recipientInfo.email,
          signing_method: 'embedded',
          unauthenticated: true // Flag that this was done without auth
        },
        created_at: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        envelope_id: envelopeResponse.envelopeId,
        status: envelopeResponse.status,
        signing_url: signingUrl,
        message: 'Signature request created successfully'
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

/**
 * GET /api/enrollments/token/:token/send-contract
 *
 * Get contract status using enrollment token
 * Uses admin client to bypass RLS since users are not authenticated yet
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Use admin client to bypass RLS - enrollment links are accessed by unauthenticated users
    const supabase = createAdminClient();

    // Get enrollment signature status
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .select('id, signature_status, docusign_envelope_id, updated_at, token_expires_at')
      .eq('enrollment_token', params.token)
      .single();

    if (error || !enrollment) {
      return NextResponse.json(
        { error: 'Invalid enrollment token' },
        { status: 404 }
      );
    }

    // Verify token not expired
    if (new Date(enrollment.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Enrollment token has expired' }, { status: 410 });
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
