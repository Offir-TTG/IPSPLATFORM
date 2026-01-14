import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getCurrentTenant } from '@/lib/tenant/detection';

// Generate unique enrollment token
function generateEnrollmentToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 7; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Ensure token is unique
async function ensureUniqueToken(supabase: any, tenantId: string): Promise<string> {
  let token = generateEnrollmentToken();
  let exists = true;

  while (exists) {
    const { data } = await supabase
      .from('enrollments')
      .select('id')
      .eq('enrollment_token', token)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    exists = !!data;
    if (exists) token = generateEnrollmentToken();
  }

  return token;
}

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

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;

      // Fetch user profile to pre-fill wizard
      const { data: profile } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, phone, location')
        .eq('id', userId)
        .eq('tenant_id', tenant.id)
        .single();

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

    // Check for duplicate enrollment (only if user is logged in)
    if (userId) {
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id, status')
        .eq('user_id', userId)
        .eq('product_id', product_id)
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      if (existingEnrollment) {
        return NextResponse.json(
          {
            error: 'Already enrolled',
            redirect: '/dashboard',
            enrollment_id: existingEnrollment.id
          },
          { status: 409 }
        );
      }
    }

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

    // Use admin client to bypass RLS for enrollment operations
    const adminClient = createAdminClient();

    // Generate unique enrollment token
    const enrollmentToken = await ensureUniqueToken(adminClient, tenant.id);

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

    if (enrollmentError) {
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
        let paymentPlan = null;
        if (product.payment_plan) {
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
            new Date() // Start immediately for public enrollments
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
      wizard_url: `/enroll/${enrollment.enrollment_token}`
    });

  } catch (error) {
    console.error('Error in public enroll API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
