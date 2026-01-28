import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

/**
 * GET /api/enrollments/token/:token/payment/check-saved-card
 *
 * Check if user has a saved payment method on file
 * Used to skip payment step if card already saved
 * NO AUTHENTICATION REQUIRED - uses enrollment token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createAdminClient();

    // Get enrollment using token
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, tenant_id, token_expires_at, user_id, stripe_customer_id')
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

    // Get stripe_customer_id - check enrollment first, then user table
    let stripeCustomerId = enrollment.stripe_customer_id;

    // If no customer ID on enrollment and we have a user_id, check users table
    if (!stripeCustomerId && enrollment.user_id) {
      const { data: userData } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', enrollment.user_id)
        .single();

      if (userData?.stripe_customer_id) {
        stripeCustomerId = userData.stripe_customer_id;
        console.log('[Check Saved Card] Found customer ID from user table:', stripeCustomerId);
      }
    }

    // If no customer ID, user doesn't have saved card
    if (!stripeCustomerId) {
      console.log('[Check Saved Card] No Stripe customer ID found');
      return NextResponse.json({
        has_saved_card: false,
      });
    }

    // Get Stripe credentials
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('credentials')
      .eq('tenant_id', enrollment.tenant_id)
      .eq('integration_key', 'stripe')
      .single();

    if (integrationError || !integration?.credentials?.secret_key) {
      console.error('Stripe integration not configured for tenant:', enrollment.tenant_id);
      return NextResponse.json(
        { error: 'Payment processing not configured' },
        { status: 500 }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(integration.credentials.secret_key, {
      apiVersion: '2023-10-16',
    });

    // Check if customer exists in Stripe
    try {
      const customer = await stripe.customers.retrieve(stripeCustomerId);

      if (customer.deleted) {
        console.log('[Check Saved Card] Customer was deleted');
        return NextResponse.json({
          has_saved_card: false,
        });
      }

      // List ALL payment methods for this customer
      const paymentMethods = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: 'card',
        limit: 10, // Get up to 10 cards
      });

      if (paymentMethods.data.length === 0) {
        console.log('[Check Saved Card] No payment methods found for customer');
        return NextResponse.json({
          has_saved_card: false,
        });
      }

      // Get customer's default payment method
      const customerData = customer as Stripe.Customer;
      const defaultPaymentMethodId = customerData.invoice_settings?.default_payment_method as string | undefined;

      // Find default card or use first card
      let defaultCard = paymentMethods.data.find(pm => pm.id === defaultPaymentMethodId);
      if (!defaultCard) {
        defaultCard = paymentMethods.data[0];
      }

      // Return all cards with default marked
      const cards = paymentMethods.data
        .filter(pm => pm.type === 'card' && pm.card)
        .map(pm => ({
          id: pm.id,
          type: 'card' as const,
          last4: pm.card?.last4 || '',
          brand: pm.card?.brand || '',
          exp_month: pm.card?.exp_month || 0,
          exp_year: pm.card?.exp_year || 0,
          fingerprint: pm.card?.fingerprint || '', // Used to detect duplicates
          is_default: pm.id === defaultPaymentMethodId,
        }));

      console.log('[Check Saved Card] Found', cards.length, 'saved card(s) for customer:', stripeCustomerId);

      return NextResponse.json({
        has_saved_card: true,
        payment_methods: cards,
        default_payment_method: {
          id: defaultCard.id,
          type: 'card' as const,
          last4: defaultCard.card?.last4 || '',
          brand: defaultCard.card?.brand || '',
          exp_month: defaultCard.card?.exp_month || 0,
          exp_year: defaultCard.card?.exp_year || 0,
        },
      });

    } catch (error: any) {
      // Customer doesn't exist or error retrieving
      console.error('[Check Saved Card] Error retrieving customer:', error.message);
      return NextResponse.json({
        has_saved_card: false,
      });
    }

  } catch (error: any) {
    console.error('Error checking saved card:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
