import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendTemplateEmail } from '@/lib/email/emailService';

/**
 * POST /api/enrollments/token/[token]/accept
 *
 * Accept enrollment invitation
 * Requires authentication - user must be logged in
 *
 * Returns:
 * - success: true if accepted
 * - requires_payment: boolean indicating if payment is needed
 * - payment_url: URL to payment page if payment required
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to accept enrollment' },
        { status: 401 }
      );
    }

    // Get user record
    const { data: userData } = await supabase
      .from('users')
      .select('id, email, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json(
        { error: 'User record not found' },
        { status: 404 }
      );
    }

    // Fetch enrollment by token with product details
    const { data: enrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select(`
        id,
        user_id,
        status,
        token_expires_at,
        total_amount,
        currency,
        email_language,
        product_id,
        tenant_id,
        product:products!enrollments_product_id_fkey (
          id,
          title,
          type,
          enrollment_confirmation_template_key
        ),
        payment_plan:payment_plans!enrollments_payment_plan_id_fkey (
          id,
          plan_name
        )
      `)
      .eq('enrollment_token', params.token)
      .single();

    if (fetchError || !enrollment) {
      return NextResponse.json({ error: 'Invalid enrollment' }, { status: 404 });
    }

    // Verify token not expired
    if (new Date(enrollment.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation expired' }, { status: 410 });
    }

    // Verify user matches enrollment
    if (enrollment.user_id !== userData.id) {
      return NextResponse.json(
        { error: 'This enrollment is for a different user' },
        { status: 403 }
      );
    }

    // Verify tenant matches
    if (enrollment.tenant_id !== userData.tenant_id) {
      return NextResponse.json(
        { error: 'Tenant mismatch' },
        { status: 403 }
      );
    }

    // Update enrollment status to active
    const { error: updateError } = await supabase
      .from('enrollments')
      .update({
        status: 'active',
        enrolled_at: new Date().toISOString()
      })
      .eq('id', enrollment.id);

    if (updateError) {
      console.error('Error updating enrollment:', updateError);
      return NextResponse.json(
        { error: 'Failed to accept enrollment' },
        { status: 500 }
      );
    }

    // Set onboarding fields to guide user through completion
    const { error: onboardingError } = await supabase
      .from('users')
      .update({
        onboarding_enrollment_id: enrollment.id,
        onboarding_completed: false
      })
      .eq('id', userData.id);

    if (onboardingError) {
      console.error('Error setting onboarding fields:', onboardingError);
      // Don't fail the request - onboarding is not critical
    }

    // Send enrollment confirmation email
    const product = Array.isArray(enrollment.product) ? enrollment.product[0] : enrollment.product;
    const paymentPlan = enrollment.payment_plan
      ? (Array.isArray(enrollment.payment_plan) ? enrollment.payment_plan[0] : enrollment.payment_plan)
      : null;

    // Get organization name from tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', enrollment.tenant_id)
      .single();

    // Determine which email template to use
    const templateKey = product.enrollment_confirmation_template_key || 'enrollment.confirmation';

    // Send confirmation email
    try {
      await sendTemplateEmail({
        tenantId: enrollment.tenant_id,
        templateKey,
        to: userData.email,
        language: (enrollment.email_language || 'en') as 'en' | 'he',
        variables: {
          userName: user.user_metadata?.first_name || userData.email.split('@')[0],
          productName: product.title,
          productType: product.type || 'course',
          organizationName: tenant?.name || 'IPS Platform',
          enrollmentId: enrollment.id,
          totalAmount: enrollment.total_amount || 0,
          currency: enrollment.currency || 'USD',
          paymentPlanName: paymentPlan?.plan_name,
        },
        priority: 'high'
      });
    } catch (emailError) {
      // Log error but don't fail the enrollment acceptance
      console.error('Error sending confirmation email:', emailError);
    }

    // Determine if payment is required
    const requiresPayment = enrollment.total_amount > 0;

    return NextResponse.json({
      success: true,
      requires_payment: requiresPayment,
      payment_url: requiresPayment ? `/payments/${enrollment.id}` : null,
      enrollment_id: enrollment.id
    });

  } catch (error) {
    console.error('Error accepting enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to accept enrollment' },
      { status: 500 }
    );
  }
}
