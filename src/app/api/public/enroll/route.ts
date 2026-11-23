import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getCurrentTenant } from '@/lib/tenant/detection';
import { randomBytes } from 'crypto';

/**
 * The enrollment link is the only thing protecting the client's details and
 * payment, so it gets the same strength as admin-sent links: 32 random bytes.
 * (It was 7 characters from Math.random, unique per tenant only, while the
 * link routes look it up across all tenants.) No uniqueness check needed.
 */
async function ensureUniqueToken(_supabase: unknown, _tenantId: string): Promise<string> {
  return randomBytes(32).toString('base64url');
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

    // Check for existing enrollment (only if user is logged in).
    //
    // A 'draft' enrollment isn't a real enrollment yet — it's an
    // unfinished wizard session. Returning 409 for drafts would lock
    // users out the moment they abandon the wizard, since enrollments
    // are inserted as 'draft' BEFORE the wizard runs. So: resume the
    // draft (return its token), and block re-enrollment only for
    // non-draft statuses (active / completed / etc.).
    if (userId) {
      // A client can have several enrollments in one product (admins may add
      // more, and a former member can rejoin), so look at all of them.
      const { data: existingRows } = await supabase
        .from('enrollments')
        .select('id, status, enrollment_token, token_expires_at, created_at')
        .eq('user_id', userId)
        .eq('product_id', product_id)
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });
      const existing = existingRows ?? [];

      // Already a member: nothing to start.
      const current = existing.find((e: any) => e.status === 'active' || e.status === 'completed');
      if (current) {
        return NextResponse.json(
          { error: 'Already enrolled', redirect: '/dashboard', enrollment_id: current.id },
          { status: 409 }
        );
      }

      // Suspended (e.g. payments failed): fix the payment, don't start over.
      const suspended = existing.find((e: any) => e.status === 'suspended');
      if (suspended) {
        return NextResponse.json(
          {
            error: 'Membership suspended',
            code: 'suspended',
            message: 'Your membership is on hold. Update your payment to continue.',
            redirect: '/billing',
            enrollment_id: suspended.id,
          },
          { status: 409 }
        );
      }

      // An unfinished signup (not sent yet, or sent and never finished):
      // continue it, with a fresh link if the old one expired.
      const unfinished = existing.find((e: any) => e.status === 'draft' || e.status === 'pending');
      if (unfinished) {
        const adminClient = createAdminClient();
        const expiresAt = unfinished.token_expires_at ? new Date(unfinished.token_expires_at) : null;
        const update: Record<string, string> = {};
        let token = unfinished.enrollment_token as string | null;
        if (!token) {
          token = await ensureUniqueToken(adminClient, tenant.id);
          update.enrollment_token = token;
        }
        if (!token || !expiresAt || expiresAt < new Date() || update.enrollment_token) {
          const newExpiry = new Date();
          newExpiry.setDate(newExpiry.getDate() + 7);
          update.token_expires_at = newExpiry.toISOString();
        }
        if (Object.keys(update).length) {
          await adminClient.from('enrollments').update(update).eq('id', unfinished.id);
        }

        return NextResponse.json({
          success: true,
          enrollment_id: unfinished.id,
          enrollment_token: token,
          wizard_url: `/enroll/${token}`,
          resumed: true,
        });
      }

      // Only cancelled or ended enrollments are left: a former member may
      // join again with a new enrollment; their old one and its history stay.
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
