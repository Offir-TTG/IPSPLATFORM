import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendTemplateEmail } from '@/lib/email/emailService';
import crypto from 'crypto';

/**
 * POST /api/admin/enrollments/[id]/send-link
 *
 * Send enrollment invitation email with secure token
 *
 * Body:
 * - language: Email language code (e.g., 'en', 'he')
 *
 * Returns:
 * - success: true if email sent
 * - enrollment_url: The enrollment link sent to user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { language } = await request.json();

    // Verify admin access
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', authUser.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch enrollment with user and product details
    const { data: enrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select(`
        id,
        user_id,
        product_id,
        status,
        total_amount,
        currency,
        user:users!enrollments_user_id_fkey (
          id,
          email,
          first_name,
          last_name
        ),
        product:products!enrollments_product_id_fkey (
          id,
          title,
          type,
          payment_model,
          payment_plan,
          enrollment_invitation_template_key
        ),
        payment_plan:payment_plans!enrollments_payment_plan_id_fkey (
          id,
          plan_name
        )
      `)
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (fetchError || !enrollment) {
      console.error('Error fetching enrollment:', fetchError);
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Generate secure token (32 bytes, base64url encoded)
    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Update enrollment with token and status
    const { error: updateError } = await supabase
      .from('enrollments')
      .update({
        enrollment_token: token,
        token_expires_at: expiresAt.toISOString(),
        invitation_sent_at: new Date().toISOString(),
        invitation_sent_by: authUser.id,
        email_language: language || 'en',
        status: 'pending' // Change from draft to pending
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Error updating enrollment:', updateError);
      return NextResponse.json({ error: 'Failed to update enrollment' }, { status: 500 });
    }

    // Build enrollment URL
    const enrollmentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/enroll/${token}`;

    // Get organization name from tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', userData.tenant_id)
      .single();

    // Prepare email data
    const enrollmentUser = Array.isArray(enrollment.user) ? enrollment.user[0] : enrollment.user;
    const product = Array.isArray(enrollment.product) ? enrollment.product[0] : enrollment.product;
    const paymentPlan = enrollment.payment_plan
      ? (Array.isArray(enrollment.payment_plan) ? enrollment.payment_plan[0] : enrollment.payment_plan)
      : null;

    // Calculate days until expiration
    const expiresIn = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    // Determine which email template to use
    // Priority: product-specific template > default template
    const templateKey = product.enrollment_invitation_template_key || 'enrollment.invitation';

    // Send email using database template
    const emailResult = await sendTemplateEmail({
      tenantId: userData.tenant_id,
      templateKey,
      to: enrollmentUser.email,
      language: (language || 'en') as 'en' | 'he',
      variables: {
        userName: enrollmentUser.first_name || enrollmentUser.email.split('@')[0],
        productName: product.title,
        productType: product.type || 'course',
        organizationName: tenant?.name || 'IPS Platform',
        enrollmentUrl,
        expiresIn,
        totalAmount: enrollment.total_amount || 0,
        currency: enrollment.currency || 'USD',
        paymentPlanName: paymentPlan?.plan_name,
      },
      priority: 'high'
    });

    if (!emailResult.success) {
      console.error('Error sending email:', emailResult.error);
      return NextResponse.json(
        { error: emailResult.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Enrollment link sent successfully',
      enrollment_url: enrollmentUrl
    });

  } catch (error) {
    console.error('Error sending enrollment link:', error);
    return NextResponse.json(
      { error: 'Failed to send enrollment link' },
      { status: 500 }
    );
  }
}
