import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getCurrentTenant } from '@/lib/tenant/detection';
import { isUniqueViolation, newEnrollmentToken, startOrContinue, type StartOrContinue } from '@/lib/payments/openEnrollment';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { product_id } = body;

    if (!product_id) {
      return NextResponse.json(
        { error: 'product_id is required' },
        { status: 400 }
      );
    }

    // Get current tenant
    const tenant = await getCurrentTenant(request);
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Check if user is authenticated (optional - not required for guest enrollment)
    let userId: string | null = null;
    let userProfile: any = null;
    let clientInPortal = false;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;

      // Fetch user profile to pre-fill wizard. The verified user's own row,
      // read with the admin client (users RLS needs a tenant setting server
      // requests don't carry, as in the portal frame).
      const { data: profile } = await createAdminClient()
        .from('users')
        .select('id, email, first_name, last_name, phone, location, role')
        .eq('id', userId)
        .eq('tenant_id', tenant.id)
        .single();

      // A signed-in client continues in their portal ("להשלמה" on the
      // home page); staff testing a link stay in the wizard.
      clientInPortal = !!profile && profile.role !== 'admin' && profile.role !== 'super_admin';

      if (profile) {
        userProfile = {
          email: profile.email,
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone: profile.phone || '',
          address: profile.location || '',
        };
      }
    }

    // Validate product exists and is active
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title, type, price, currency, payment_model, payment_plan, requires_signature')
      .eq('id', product_id)
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found or inactive' },
        { status: 404 }
      );
    }

    // The one rule (lib/payments/openEnrollment): a signed-in client
    // continues their open enrollment in this product, is sent to the portal
    // when already enrolled, or to Billing when on hold. A guest always gets
    // one guest enrollment, joined to their account if they log in.
    const adminClient = createAdminClient();
    const decide = () => startOrContinue(adminClient, { tenantId: tenant.id, productId: product_id, userId });
    const answer = (found: Exclude<StartOrContinue, { kind: 'start' }>) => {
      if (found.kind === 'already_enrolled') {
        return NextResponse.json(
          { error: 'Already enrolled', redirect: '/dashboard', enrollment_id: found.enrollment.id },
          { status: 409 }
        );
      }
      if (found.kind === 'suspended') {
        return NextResponse.json(
          {
            error: 'Membership suspended',
            code: 'suspended',
            message: 'Your membership is on hold. Update your payment to continue.',
            redirect: '/billing',
            enrollment_id: found.enrollment.id,
          },
          { status: 409 }
        );
      }
      const token = found.enrollment.enrollment_token;
      return NextResponse.json({
        success: true,
        enrollment_id: found.enrollment.id,
        enrollment_token: token,
        wizard_url: `/enroll/${token}`,
        resumed: true,
        client_in_portal: clientInPortal,
      });
    };

    const found = await decide();
    if (found.kind !== 'start') return answer(found);

    // Determine total amount and payment status
    let totalAmount = 0;
    let currency = product.currency || 'USD';
    let paymentStatus = 'pending';

    if (product.payment_model === 'free') {
      totalAmount = 0;
      paymentStatus = 'paid';
    } else {
      totalAmount = product.price || 0;
      paymentStatus = 'pending';
    }

    // The enrollment link is the only thing protecting the client's details
    // and payment: 32 random bytes, like admin-sent links.
    const enrollmentToken = newEnrollmentToken();

    // Calculate token expiration (7 days from now)
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);

    // Create enrollment record
    const enrollmentData: any = {
      tenant_id: tenant.id,
      user_id: userId, // null for guest enrollment
      product_id,
      total_amount: totalAmount,
      paid_amount: 0,
      currency,
      status: 'draft',
      payment_status: paymentStatus,
      enrollment_type: 'self_enrolled',
      enrollment_token: enrollmentToken,
      token_expires_at: tokenExpiresAt.toISOString(),
    };

    // Store user profile data if available (for wizard pre-fill)
    if (userProfile) {
      enrollmentData.wizard_profile_data = userProfile;
    }

    // Create enrollment using admin client
    const { data: enrollment, error: enrollmentError } = await adminClient
      .from('enrollments')
      .insert(enrollmentData)
      .select('id, enrollment_token')
      .single();

    if (enrollmentError && isUniqueViolation(enrollmentError)) {
      // Another tab or click created the open enrollment a moment ago: continue it.
      const again = await decide();
      if (again.kind !== 'start') return answer(again);
    }
    if (enrollmentError || !enrollment) {
      console.error('Error creating enrollment:', enrollmentError);
      return NextResponse.json(
        { error: 'Failed to create enrollment' },
        { status: 500 }
      );
    }

    // Generate payment schedules for paid products
    if (paymentStatus !== 'paid' && product.payment_model !== 'free') {
      try {
        // Fetch payment plan if specified
        // Only an old product that stored a plan id here. Today the field holds
        // settings (an object), and the real charges are made when the client
        // picks a plan in the wizard (select-plan) or opens the payment step.
        let paymentPlan = null;
        if (typeof product.payment_plan === 'string' && product.payment_plan) {
          const { data: plan } = await adminClient
            .from('payment_plans')
            .select('*')
            .eq('id', product.payment_plan)
            .eq('tenant_id', tenant.id)
            .single();
          paymentPlan = plan;
        }

        // Generate and insert payment schedules
        if (paymentPlan) {
          const { generatePaymentSchedules } = await import('@/lib/payments/paymentEngine');
          const schedules = generatePaymentSchedules(
            enrollment.id,
            tenant.id,
            paymentPlan,
            totalAmount,
            new Date(), // Start immediately for public enrollments
            product.currency
          );

          const { error: schedulesError } = await adminClient
            .from('payment_schedules')
            .insert(schedules);

          if (schedulesError) {
            console.error('Failed to create payment schedules:', schedulesError);
            // Note: Enrollment exists but schedules failed
            // Log error but don't fail the enrollment
          }
        } else {
          console.warn('No payment plan found for product:', product_id);
        }
      } catch (scheduleError) {
        console.error('Error generating payment schedules:', scheduleError);
        // Continue - enrollment still valid even if schedules fail
      }
    }

    // Return enrollment token for wizard redirect
    return NextResponse.json({
      success: true,
      enrollment_id: enrollment.id,
      enrollment_token: enrollment.enrollment_token,
      wizard_url: `/enroll/${enrollment.enrollment_token}`,
      client_in_portal: clientInPortal,
    });

  } catch (error) {
    console.error('Error in public enroll API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
