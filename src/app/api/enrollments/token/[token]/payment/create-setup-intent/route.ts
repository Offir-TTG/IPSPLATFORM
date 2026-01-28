import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

/**
 * POST /api/enrollments/token/:token/payment/create-setup-intent
 *
 * Create a Stripe Setup Intent for installment plans without deposits
 * Saves card without charging - for future automated payments
 * NO AUTHENTICATION REQUIRED - uses enrollment token
 * Fetches Stripe credentials from database (integrations table)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createAdminClient();

    // Get enrollment using token
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, tenant_id, token_expires_at, product_id, user_id, wizard_profile_data, stripe_customer_id, stripe_setup_intent_id')
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
      return NextResponse.json(
        { error: 'Enrollment token has expired' },
        { status: 410 }
      );
    }

    // Check if already has setup intent
    if (enrollment.stripe_setup_intent_id) {
      console.log('[Setup Intent] Existing setup intent found:', enrollment.stripe_setup_intent_id);
      // Try to retrieve it to check status
      try {
        const { data: integration } = await supabase
          .from('integrations')
          .select('credentials')
          .eq('tenant_id', enrollment.tenant_id)
          .eq('integration_key', 'stripe')
          .single();

        if (integration?.credentials?.secret_key && integration?.credentials?.publishable_key) {
          const stripe = new Stripe(integration.credentials.secret_key, {
            apiVersion: '2023-10-16',
          });

          const existingIntent = await stripe.setupIntents.retrieve(enrollment.stripe_setup_intent_id);

          if (existingIntent.status === 'requires_payment_method' ||
              existingIntent.status === 'requires_confirmation' ||
              existingIntent.status === 'requires_action') {
            console.log('[Setup Intent] Reusing existing intent with status:', existingIntent.status);
            return NextResponse.json({
              clientSecret: existingIntent.client_secret,
              setup_intent_id: existingIntent.id,
              publishableKey: integration.credentials.publishable_key,
              requires_payment_method: true,
            });
          }
        }
      } catch (error) {
        console.log('[Setup Intent] Could not retrieve existing intent, creating new one');
      }
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
      return NextResponse.json(
        { error: 'Payment processing not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Initialize Stripe with tenant-specific credentials
    const stripe = new Stripe(integration.credentials.secret_key, {
      apiVersion: '2023-10-16',
    });

    // Get or create Stripe customer
    // CRITICAL: Check user's Stripe customer FIRST to prevent duplicate customers
    let stripeCustomerId = enrollment.stripe_customer_id;

    // Step 1: Verify enrollment's customer still exists if we have an ID
    if (stripeCustomerId) {
      try {
        await stripe.customers.retrieve(stripeCustomerId);
        console.log('[Setup Intent] Using enrollment customer:', stripeCustomerId);
      } catch (error) {
        console.log('[Setup Intent] Enrollment customer no longer exists, will check user or create new');
        stripeCustomerId = null;
      }
    }

    // Step 2: If enrollment has no customer, check if USER has a Stripe customer
    // This prevents creating duplicate customers when user has multiple enrollments
    if (!stripeCustomerId && enrollment.user_id) {
      console.log('[Setup Intent] Enrollment has no customer, checking user:', enrollment.user_id);

      const { data: userData } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', enrollment.user_id)
        .single();

      if (userData?.stripe_customer_id) {
        console.log('[Setup Intent] User has existing customer:', userData.stripe_customer_id);

        // Verify customer still exists in Stripe
        try {
          await stripe.customers.retrieve(userData.stripe_customer_id);
          stripeCustomerId = userData.stripe_customer_id;
          console.log('[Setup Intent] ✓ Reusing user\'s existing Stripe customer');

          // Save customer ID to enrollment for future reference
          await supabase
            .from('enrollments')
            .update({ stripe_customer_id: stripeCustomerId })
            .eq('id', enrollment.id);
          console.log('[Setup Intent] ✓ Linked user\'s customer to enrollment');
        } catch (error) {
          console.log('[Setup Intent] User customer no longer exists in Stripe, will create new');
          stripeCustomerId = null;
        }
      }
    }

    // Step 3: Create new customer if needed
    if (!stripeCustomerId) {
      console.log('[Setup Intent] No existing customer found - creating new one');

      // Get profile data
      let profileData = enrollment.wizard_profile_data as any;
      let customerEmail: string | undefined;
      let customerName: string | undefined;

      // If user_id exists, fetch from users table instead
      if (enrollment.user_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('email, first_name, last_name')
          .eq('id', enrollment.user_id)
          .single();

        if (userData) {
          customerEmail = userData.email;
          customerName = userData.first_name && userData.last_name
            ? `${userData.first_name} ${userData.last_name}`
            : undefined;
          console.log('[Setup Intent] Using user profile for new customer:', customerEmail);
        }
      } else if (profileData?.email) {
        customerEmail = profileData.email;
        customerName = profileData?.first_name && profileData?.last_name
          ? `${profileData.first_name} ${profileData.last_name}`
          : undefined;
      }

      console.log('[Setup Intent] Profile data:', {
        hasEmail: !!customerEmail,
        hasName: !!customerName,
        userId: enrollment.user_id || 'none',
      });

      if (customerEmail) {
        const customer = await stripe.customers.create({
          email: customerEmail,
          name: customerName,
          metadata: {
            enrollment_id: enrollment.id,
            tenant_id: enrollment.tenant_id,
            user_id: enrollment.user_id || '',
          },
        });

        stripeCustomerId = customer.id;
        console.log('[Setup Intent] ✓ Created new Stripe customer:', stripeCustomerId);

        // Save customer ID to enrollment
        await supabase
          .from('enrollments')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', enrollment.id);
        console.log('[Setup Intent] ✓ Saved customer ID to enrollment');

        // CRITICAL: Also save to user table if user exists
        // This ensures future enrollments will reuse this customer
        if (enrollment.user_id) {
          await supabase
            .from('users')
            .update({ stripe_customer_id: stripeCustomerId })
            .eq('id', enrollment.user_id);
          console.log('[Setup Intent] ✓ Saved customer ID to user table - future enrollments will reuse this customer');
        }
      } else {
        return NextResponse.json(
          { error: 'Profile information required to save payment method' },
          { status: 400 }
        );
      }
    }

    // Get product details for metadata
    const { data: product } = await supabase
      .from('products')
      .select('title, type')
      .eq('id', enrollment.product_id)
      .single();

    // Create Setup Intent
    const setupIntentParams: Stripe.SetupIntentCreateParams = {
      customer: stripeCustomerId,
      usage: 'off_session', // Card will be used for future automated payments
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        enrollment_id: enrollment.id,
        tenant_id: enrollment.tenant_id,
        product_title: product?.title || 'Unknown Product',
        product_type: product?.type || 'unknown',
        purpose: 'installment_plan',
      },
      description: `Save payment method for ${product?.title || 'Product'} - Enrollment ${enrollment.id}`,
    };

    console.log('[Setup Intent] Creating setup intent for customer:', stripeCustomerId);
    const setupIntent = await stripe.setupIntents.create(setupIntentParams);
    console.log('[Setup Intent] Created:', setupIntent.id);

    // Store setup intent ID in enrollment
    const { error: updateError } = await supabase
      .from('enrollments')
      .update({ stripe_setup_intent_id: setupIntent.id })
      .eq('id', enrollment.id);

    if (updateError) {
      console.error('[Setup Intent] Failed to store setup intent ID:', updateError);
    } else {
      console.log('[Setup Intent] Stored setup intent ID in enrollment');
    }

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      setup_intent_id: setupIntent.id,
      publishableKey: integration.credentials.publishable_key,
      requires_payment_method: true,
    });

  } catch (error: any) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
