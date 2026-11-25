import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendTemplateEmail } from '@/lib/email/emailService';
import { isUserEligibleForCommunication } from '@/lib/users/communication-eligible';
import crypto from 'crypto';
import { reasonNotToRestart } from '@/lib/payments/enrollmentLink';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/enrollments/:id/resend-invitation
 *
 * Resend enrollment invitation with a new token
 * This resets the enrollment to 'draft' status and generates a new invitation link
 * Admin only endpoint
 */
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
      .select('id, role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check admin permission
    if (!['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get enrollment with user and product details
    const { data: enrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select(`
        id,
        user_id,
        product_id,
        tenant_id,
        status,
        signature_status,
        total_amount,
        currency,
        expires_at,
        wizard_profile_data,
        user:users!enrollments_user_id_fkey (
          id,
          email,
          first_name,
          last_name,
          language_preference
        ),
        product:products!enrollments_product_id_fkey (
          id,
          title,
          type,
          enrollment_invitation_template_key
        )
      `)
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (fetchError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    const enrollmentUser = Array.isArray(enrollment.user) ? enrollment.user[0] : enrollment.user;
    const product = Array.isArray(enrollment.product) ? enrollment.product[0] : enrollment.product;

    // Never restart an enrollment that's done or where money was taken: it
    // used to set the paid amount to 0 and clear a signed contract.
    const blocked = await reasonNotToRestart(supabase, enrollment.id, enrollment.status);
    if (blocked) {
      return NextResponse.json({ error: blocked }, { status: 409 });
    }
    const keepSignature = enrollment.signature_status === 'completed';

    // Who gets it: the client's account, or, for a new person who has no
    // account yet, the email and name kept on the enrollment. (This read
    // enrollmentUser.id unchecked and crashed for a new person.)
    const profile = (enrollment.wizard_profile_data ?? null) as { email?: string; first_name?: string; last_name?: string } | null;
    const recipient = enrollmentUser
      ? { email: enrollmentUser.email as string, firstName: enrollmentUser.first_name as string | null, language: enrollmentUser.language_preference as string | null }
      : profile?.email
        ? { email: profile.email, firstName: profile.first_name ?? null, language: null }
        : null;
    if (!recipient?.email) {
      return NextResponse.json({ error: 'This enrollment has no client or email to send to' }, { status: 400 });
    }

    // Generate new enrollment token (using base64url to match send-link endpoint)
    const newToken = crypto.randomBytes(32).toString('base64url');

    // Use enrollment's expires_at if set, otherwise default to 7 days from now
    const tokenExpiresAt = enrollment.expires_at
      ? new Date(enrollment.expires_at)
      : (() => {
          const date = new Date();
          date.setDate(date.getDate() + 7);
          return date;
        })();

    // Reset enrollment to draft status with new token
    console.log('[Resend Invitation] Resetting enrollment:', enrollment.id);
    console.log('[Resend Invitation] Setting wizard_profile_data to null');

    const { error: updateError } = await supabase
      .from('enrollments')
      .update({
        status: 'draft',
        enrollment_token: newToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        ...(keepSignature ? {} : { signature_status: null, docusign_envelope_id: null }),
        paid_amount: 0,
        payment_status: 'pending',
        // Clear the previous attempt, but keep a new person's email and name:
        // they are the only record of who the enrollment is for.
        wizard_profile_data: enrollmentUser || !profile?.email
          ? null
          : { email: profile.email, first_name: profile.first_name || '', last_name: profile.last_name || '' },
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollment.id);

    if (updateError) {
      console.error('[Resend Invitation] Error resetting enrollment:', updateError);
      return NextResponse.json(
        { error: 'Failed to reset enrollment' },
        { status: 500 }
      );
    }

    console.log('[Resend Invitation] Successfully reset enrollment');

    // Reset user onboarding
    if (enrollmentUser?.id) {
      await supabase
        .from('users')
        .update({
          onboarding_enrollment_id: null,
          onboarding_completed: false
        })
        .eq('id', enrollmentUser.id);
    }

    // Get organization name
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', enrollment.tenant_id)
      .single();

    // Send invitation email
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/enroll/${newToken}`;
    const templateKey = product.enrollment_invitation_template_key || 'enrollment.invitation';

    // Calculate days until expiration
    const expiresIn = Math.ceil((tokenExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    // Communication-eligibility gate. `invited` status is allowed (the
    // invitation flow itself depends on it); we block only inactive /
    // suspended. The admin sees an explicit error so they know to
    // reactivate the user first instead of silently dropping the send.
    const eligible = enrollmentUser?.id
      ? await isUserEligibleForCommunication(supabase, enrollmentUser.id)
      : true;
    if (!eligible) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Cannot resend invitation — recipient is inactive or suspended. Reactivate the user first.',
        },
        { status: 409 },
      );
    }

    try {
      await sendTemplateEmail({
        tenantId: enrollment.tenant_id,
        templateKey,
        to: recipient.email,
        language: (recipient.language || 'en') as 'en' | 'he',
        variables: {
          userName: recipient.firstName || recipient.email.split('@')[0],
          productName: product.title,
          productType: product.type || 'course',
          organizationName: tenant?.name || 'IPS Platform',
          invitationUrl,
          totalAmount: enrollment.total_amount || 0,
          currency: enrollment.currency || 'USD',
          expiresIn,
          expiryDays: expiresIn // Legacy variable name for backward compatibility
        },
        priority: 'high'
      });
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      // Don't fail the request - admin can manually share link
    }

    // Log audit event
    await supabase.from('audit_events').insert({
      tenant_id: enrollment.tenant_id,
      user_id: userData.id,
      action: 'enrollment_invitation_resent',
      resource_type: 'enrollment',
      resource_id: enrollment.id,
      details: {
        recipient_email: recipient.email,
        new_token: newToken,
        expires_at: tokenExpiresAt.toISOString()
      },
      created_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      enrollment_id: enrollment.id,
      invitation_url: invitationUrl,
      token_expires_at: tokenExpiresAt.toISOString(),
      email_sent: true,
      recipient: recipient.email
    });

  } catch (error: any) {
    console.error('Error in POST /api/admin/enrollments/:id/resend-invitation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
