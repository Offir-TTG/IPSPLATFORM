import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendTemplateEmail } from '@/lib/email/emailService';
import crypto from 'crypto';

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
        total_amount,
        currency,
        expires_at,
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

    // Generate new enrollment token
    const newToken = crypto.randomBytes(32).toString('hex');

    // Use enrollment's expires_at if set, otherwise default to 7 days from now
    const tokenExpiresAt = enrollment.expires_at
      ? new Date(enrollment.expires_at)
      : (() => {
          const date = new Date();
          date.setDate(date.getDate() + 7);
          return date;
        })();

    // Reset enrollment to draft status with new token
    const { error: updateError } = await supabase
      .from('enrollments')
      .update({
        status: 'draft',
        enrollment_token: newToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        signature_status: null,
        docusign_envelope_id: null,
        paid_amount: 0,
        payment_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollment.id);

    if (updateError) {
      console.error('Error resetting enrollment:', updateError);
      return NextResponse.json(
        { error: 'Failed to reset enrollment' },
        { status: 500 }
      );
    }

    // Reset user onboarding
    await supabase
      .from('users')
      .update({
        onboarding_enrollment_id: null,
        onboarding_completed: false
      })
      .eq('id', enrollmentUser.id);

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

    try {
      await sendTemplateEmail({
        tenantId: enrollment.tenant_id,
        templateKey,
        to: enrollmentUser.email,
        language: (enrollmentUser.language_preference || 'en') as 'en' | 'he',
        variables: {
          userName: enrollmentUser.first_name || enrollmentUser.email.split('@')[0],
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
        recipient_email: enrollmentUser.email,
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
      recipient: enrollmentUser.email
    });

  } catch (error: any) {
    console.error('Error in POST /api/admin/enrollments/:id/resend-invitation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
