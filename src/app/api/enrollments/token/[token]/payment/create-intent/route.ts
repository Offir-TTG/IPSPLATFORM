import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

/**
 * POST /api/enrollments/token/:token/payment/create-intent
 *
 * Create a Stripe payment intent for a specific payment schedule
 * NO AUTHENTICATION REQUIRED - uses enrollment token
 * Fetches Stripe credentials from database (integrations table)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { schedule_id } = body;

    if (!schedule_id) {
      return NextResponse.json(
        { error: 'schedule_id is required' },
        { status: 400 }
      );
    }

    // Validate token parameter
    if (!params?.token) {
      return NextResponse.json(
        { error: 'Invalid enrollment token' },
        { status: 400 }
      );
    }

    // Get enrollment using token
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, tenant_id, token_expires_at, product_id, total_amount, currency')
      .eq('enrollment_token', params.token)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: 'Invalid enrollment token' },
        { status: 404 }
      );
    }

    // Verify token not expired
    if (enrollment.token_expires_at && new Date(enrollment.token_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Enrollment token has expired' },
        { status: 410 }
      );
    }

    // Get Stripe credentials from integrations table
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('credentials')
      .eq('tenant_id', enrollment.tenant_id)
      .eq('integration_key', 'stripe')
      .single();

    if (integrationError || !integration?.credentials?.secret_key || !integration?.credentials?.publishable_key) {
      console.error('Stripe integration not configured for tenant:', enrollment.tenant_id);
      console.error('Integration error:', integrationError);
      console.error('Has secret key:', !!integration?.credentials?.secret_key);
      console.error('Has publishable key:', !!integration?.credentials?.publishable_key);
      return NextResponse.json(
        { error: 'Payment processing not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Initialize Stripe with tenant-specific credentials
    const stripe = new Stripe(integration.credentials.secret_key, {
      apiVersion: '2023-10-16',
    });

    // Get payment schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('payment_schedules')
      .select('*')
      .eq('id', schedule_id)
      .eq('enrollment_id', enrollment.id)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json(
        { error: 'Payment schedule not found' },
        { status: 404 }
      );
    }

    // Check if already paid
    if (schedule.status === 'paid') {
      return NextResponse.json(
        { error: 'This payment has already been completed' },
        { status: 400 }
      );
    }

    // Check if there's an existing incomplete payment intent for this schedule
    const existingIntentId = schedule.stripe_payment_intent_id;
    console.log('[Stripe] Checking for existing intent. Schedule ID:', schedule_id, 'Intent ID:', existingIntentId);

    if (existingIntentId) {
      try {
        // Try to retrieve the existing payment intent
        const existingIntent = await stripe.paymentIntents.retrieve(existingIntentId);
        console.log('[Stripe] Found existing intent with status:', existingIntent.status);

        // If it's still incomplete, reuse it
        if (existingIntent.status === 'requires_payment_method' ||
            existingIntent.status === 'requires_confirmation' ||
            existingIntent.status === 'requires_action') {
          console.log('[Stripe] ✓ Reusing existing payment intent:', existingIntentId);
          return NextResponse.json({
            clientSecret: existingIntent.client_secret,
            payment_intent_id: existingIntent.id,
            publishableKey: integration.credentials.publishable_key,
          });
        } else {
          console.log('[Stripe] Existing intent status is', existingIntent.status, '- creating new one');
        }
      } catch (error: any) {
        // Intent doesn't exist or error retrieving it, create new one
        console.log('[Stripe] Could not retrieve existing intent:', error.message);
      }
    } else {
      console.log('[Stripe] No existing intent ID found - creating new one');
    }

    // Get product details for description
    const { data: product } = await supabase
      .from('products')
      .select('title, type')
      .eq('id', enrollment.product_id)
      .single();

    // Get all payment schedules for this enrollment to show full plan
    const { data: allSchedules } = await supabase
      .from('payment_schedules')
      .select('*')
      .eq('enrollment_id', enrollment.id)
      .order('payment_number', { ascending: true });

    // Calculate payment plan summary
    const totalPayments = allSchedules?.length || 0;
    const completedPayments = allSchedules?.filter(s => s.status === 'paid').length || 0;
    const totalAmount = parseFloat((allSchedules?.reduce((sum, s) => sum + s.amount, 0) || 0).toFixed(2));
    const paidAmount = parseFloat((allSchedules?.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.amount, 0) || 0).toFixed(2));

    // Helper function to format date safely
    const formatDate = (dateString: string) => {
      if (!dateString) return 'Not set';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Not set';
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // Helper function to format amount
    const formatAmount = (amount: number) => parseFloat(amount.toFixed(2));

    // Build payment plan details for description
    const paymentPlanDetails = allSchedules?.map((s, idx) =>
      `${idx + 1}. ${s.payment_type === 'deposit' ? 'Deposit' : `Payment ${s.payment_number || idx + 1}`}: ${s.currency || 'USD'} ${formatAmount(s.amount || 0)} - Due: ${formatDate(s.scheduled_date)} - ${s.status === 'paid' ? '✓ Paid' : s.id === schedule.id ? '← Current' : 'Pending'}`
    ).join('\n') || '';

    // Get or create Stripe customer for this enrollment
    // CRITICAL: Check user's Stripe customer FIRST to prevent duplicate customers
    let stripeCustomerId: string | undefined;

    // Step 1: Check if enrollment already has a Stripe customer
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('stripe_customer_id, user_id')
      .eq('id', enrollment.id)
      .single();

    if (existingEnrollment?.stripe_customer_id) {
      console.log('[Stripe] Enrollment has customer:', existingEnrollment.stripe_customer_id);
      const tempCustomerId = existingEnrollment.stripe_customer_id;

      // Verify customer still exists in Stripe
      try {
        await stripe.customers.retrieve(tempCustomerId);
        stripeCustomerId = tempCustomerId;
        console.log('[Stripe] Verified enrollment customer exists in Stripe');
      } catch (error) {
        console.log('[Stripe] Enrollment customer no longer exists, will check user or create new');
        stripeCustomerId = undefined;
      }
    }

    // Step 2: If enrollment has no customer, check if USER has a Stripe customer
    // This prevents creating duplicate customers when user has multiple enrollments
    if (!stripeCustomerId && existingEnrollment?.user_id) {
      console.log('[Stripe] Enrollment has no customer, checking user:', existingEnrollment.user_id);

      const { data: userData } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', existingEnrollment.user_id)
        .single();

      if (userData?.stripe_customer_id) {
        console.log('[Stripe] User has existing customer:', userData.stripe_customer_id);

        // Verify customer still exists in Stripe
        try {
          await stripe.customers.retrieve(userData.stripe_customer_id);
          stripeCustomerId = userData.stripe_customer_id;
          console.log('[Stripe] ✓ Reusing user\'s existing Stripe customer');

          // Save customer ID to enrollment for future reference
          await supabase
            .from('enrollments')
            .update({ stripe_customer_id: stripeCustomerId })
            .eq('id', enrollment.id);
          console.log('[Stripe] ✓ Linked user\'s customer to enrollment');
        } catch (error) {
          console.log('[Stripe] User customer no longer exists in Stripe, will create new');
          stripeCustomerId = undefined;
        }
      }
    }

    // Step 3: Create new customer if needed
    if (!stripeCustomerId) {
      console.log('[Stripe] No existing customer found - creating new one');

      // Get profile data if available
      const { data: enrollmentData } = await supabase
        .from('enrollments')
        .select('wizard_profile_data, user_id')
        .eq('id', enrollment.id)
        .single();

      const profileData = enrollmentData?.wizard_profile_data as any;
      const userId = enrollmentData?.user_id;

      // Try to get email from user table if user exists
      let customerEmail = profileData?.email;
      let customerName: string | undefined;

      if (userId) {
        const { data: userData } = await supabase
          .from('users')
          .select('email, first_name, last_name')
          .eq('id', userId)
          .single();

        if (userData) {
          customerEmail = userData.email;
          customerName = userData.first_name && userData.last_name
            ? `${userData.first_name} ${userData.last_name}`
            : undefined;
          console.log('[Stripe] Using user profile for new customer:', customerEmail);
        }
      } else if (profileData?.first_name && profileData?.last_name) {
        customerName = `${profileData.first_name} ${profileData.last_name}`;
      }

      console.log('[Stripe] ===== CUSTOMER CREATION DEBUG =====');
      console.log('[Stripe] Enrollment ID:', enrollment.id);
      console.log('[Stripe] User ID:', userId || 'none');
      console.log('[Stripe] Customer email:', customerEmail || 'MISSING');
      console.log('[Stripe] Customer name:', customerName || 'MISSING');
      console.log('[Stripe] =====================================');

      // Only create customer if we have email
      // This prevents creating "Guest" customers without info
      if (customerEmail) {
        const customer = await stripe.customers.create({
          email: customerEmail,
          name: customerName,
          metadata: {
            enrollment_id: enrollment.id,
            tenant_id: enrollment.tenant_id,
            user_id: userId || '',
          },
        });

        stripeCustomerId = customer.id;
        console.log('[Stripe] ✓ Created new Stripe customer:', stripeCustomerId);

        // Save customer ID to enrollment
        await supabase
          .from('enrollments')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', enrollment.id);
        console.log('[Stripe] ✓ Saved customer ID to enrollment');

        // CRITICAL: Also save to user table if user exists
        // This ensures future enrollments will reuse this customer
        if (userId) {
          await supabase
            .from('users')
            .update({ stripe_customer_id: stripeCustomerId })
            .eq('id', userId);
          console.log('[Stripe] ✓ Saved customer ID to user table - future enrollments will reuse this customer');
        }
      } else {
        console.warn('[Stripe] ⚠️ No email available - payment intent will be created without customer');
        console.warn('[Stripe] Stripe will create a guest customer, which will be updated at enrollment completion');
      }
    }

    // Validate schedule data
    if (!schedule.currency) {
      console.error('[Stripe] Payment schedule missing currency:', schedule);
      return NextResponse.json(
        { error: 'Payment schedule is missing currency information' },
        { status: 500 }
      );
    }

    if (!schedule.amount || schedule.amount <= 0) {
      console.error('[Stripe] Payment schedule has invalid amount:', schedule);
      return NextResponse.json(
        { error: 'Payment schedule has invalid amount' },
        { status: 500 }
      );
    }

    // Create Stripe payment intent
    const paymentIntentParams: any = {
      amount: Math.round(schedule.amount * 100), // Convert to cents
      currency: schedule.currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      // CRITICAL: Save payment method to customer for future installment payments
      setup_future_usage: 'off_session',
      metadata: {
        enrollment_id: enrollment.id,
        schedule_id: schedule.id,
        tenant_id: enrollment.tenant_id,
        payment_type: schedule.payment_type || 'payment',
        payment_number: (schedule.payment_number || 1).toString(),
        product_title: product?.title || 'Unknown Product',
        product_type: product?.type || 'unknown',
        // Payment plan summary
        total_payments: totalPayments.toString(),
        current_payment: (schedule.payment_number || 1).toString(),
        total_amount: totalAmount.toString(),
        paid_amount: paidAmount.toString(),
        remaining_amount: (totalAmount - paidAmount).toString(),
      },
      description: `${schedule.payment_type === 'deposit' ? 'Deposit' : `Payment ${schedule.payment_number || 1}/${totalPayments}`} for ${product?.title || 'Product'}

PAYMENT PLAN (${completedPayments + 1}/${totalPayments}):
${paymentPlanDetails}

Total Plan: ${schedule.currency} ${formatAmount(totalAmount)}
Paid So Far: ${schedule.currency} ${formatAmount(paidAmount)}
This Payment: ${schedule.currency} ${formatAmount(schedule.amount)}
Remaining After: ${schedule.currency} ${formatAmount(totalAmount - paidAmount - schedule.amount)}`,
    };

    // Add customer ID if we have one
    if (stripeCustomerId) {
      paymentIntentParams.customer = stripeCustomerId;
      console.log('[Stripe] Payment intent will use customer:', stripeCustomerId);
      console.log('[Stripe] Payment method will be saved to customer for future payments (setup_future_usage: off_session)');
    } else {
      console.log('[Stripe] Payment intent will be created without customer (Stripe will auto-create guest customer)');
    }

    console.log('[Stripe] Creating payment intent with params:', {
      amount: paymentIntentParams.amount,
      currency: paymentIntentParams.currency,
      customer: paymentIntentParams.customer || 'none',
      setup_future_usage: paymentIntentParams.setup_future_usage,
    });

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    console.log('[Stripe] ✓ Payment intent created:', paymentIntent.id);
    console.log('[Stripe] Customer:', paymentIntent.customer);
    console.log('[Stripe] Setup future usage:', paymentIntent.setup_future_usage);

    // Store payment intent ID in schedule
    console.log('[Stripe] Storing payment intent ID in schedule:', paymentIntent.id);
    const { error: updateError } = await supabase
      .from('payment_schedules')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
      })
      .eq('id', schedule_id);

    if (updateError) {
      console.error('[Stripe] Failed to store payment intent ID:', updateError);
    } else {
      console.log('[Stripe] ✓ Successfully stored payment intent ID');
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      publishableKey: integration.credentials.publishable_key,
    });

  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
