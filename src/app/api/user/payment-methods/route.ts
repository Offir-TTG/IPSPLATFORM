import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// Helper to get Stripe instance with credentials from database
async function getStripeInstance(tenantId: string): Promise<Stripe> {
  const supabase = createAdminClient();

  console.log('[PaymentMethods API] Fetching Stripe credentials for tenant:', tenantId);

  const { data: integration } = await supabase
    .from('integrations')
    .select('credentials')
    .eq('tenant_id', tenantId)
    .eq('integration_key', 'stripe')
    .single();

  if (!integration?.credentials?.secret_key) {
    console.error('[PaymentMethods API] Stripe not configured for tenant:', tenantId);
    throw new Error('Stripe not configured');
  }

  console.log('[PaymentMethods API] Successfully loaded Stripe credentials');
  return new Stripe(integration.credentials.secret_key, {
    apiVersion: '2023-10-16',
  });
}

// GET - List user's payment methods
export async function GET() {
  try {
    console.log('[PaymentMethods API] GET - Fetching payment methods');
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[PaymentMethods API] Unauthorized - no user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[PaymentMethods API] User authenticated:', user.id);

    // Get user's tenant_id and Stripe customer ID
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id, tenant_id')
      .eq('id', user.id)
      .single();

    console.log('[PaymentMethods API] User data:', {
      hasCustomerId: !!userData?.stripe_customer_id,
      hasTenantId: !!userData?.tenant_id,
      customerId: userData?.stripe_customer_id,
    });

    if (!userData?.tenant_id) {
      console.error('[PaymentMethods API] User has no tenant_id');
      return NextResponse.json({ error: 'User tenant not found' }, { status: 404 });
    }

    // Get Stripe instance with tenant-specific credentials
    const stripe = await getStripeInstance(userData.tenant_id);

    if (!userData?.stripe_customer_id) {
      console.log('[PaymentMethods API] User has no Stripe customer ID - returning empty list');
      return NextResponse.json({
        success: true,
        paymentMethods: [],
        message: 'No payment methods found',
      });
    }

    try {
      console.log('[PaymentMethods API] Fetching payment methods from Stripe for customer:', userData.stripe_customer_id);

      // Fetch payment methods from Stripe
      const paymentMethods = await stripe.paymentMethods.list({
        customer: userData.stripe_customer_id,
        type: 'card',
      });

      console.log('[PaymentMethods API] Found', paymentMethods.data.length, 'payment methods');

      // Get customer to find default payment method
      const customer = await stripe.customers.retrieve(userData.stripe_customer_id) as Stripe.Customer;
      const defaultPaymentMethodId = typeof customer.invoice_settings.default_payment_method === 'string'
        ? customer.invoice_settings.default_payment_method
        : customer.invoice_settings.default_payment_method?.id;

      console.log('[PaymentMethods API] Default payment method:', defaultPaymentMethodId || 'none');

      const formattedMethods = paymentMethods.data.map(pm => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
        isDefault: pm.id === defaultPaymentMethodId,
      }));

      console.log('[PaymentMethods API] Returning', formattedMethods.length, 'formatted payment methods');

      return NextResponse.json({
        success: true,
        paymentMethods: formattedMethods,
      });
    } catch (stripeError: any) {
      // If customer doesn't exist in Stripe, clear the invalid ID from database
      if (stripeError.code === 'resource_missing') {
        console.log('[PaymentMethods API] Stripe customer not found, clearing invalid ID from database');
        await supabase
          .from('users')
          .update({ stripe_customer_id: null })
          .eq('id', user.id);

        return NextResponse.json({
          success: true,
          paymentMethods: [],
          message: 'No payment methods found',
        });
      }
      console.error('[PaymentMethods API] Stripe error:', stripeError);
      throw stripeError;
    }
  } catch (error: any) {
    console.error('[PaymentMethods API] Error fetching payment methods:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

// POST - Create setup intent for adding new payment method
export async function POST() {
  try {
    console.log('[PaymentMethods API] POST - Creating setup intent');
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[PaymentMethods API] Unauthorized - no user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[PaymentMethods API] User authenticated:', user.id);

    // Get or create Stripe customer
    let { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id, email, first_name, last_name, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData?.tenant_id) {
      console.error('[PaymentMethods API] User has no tenant_id');
      return NextResponse.json({ error: 'User tenant not found' }, { status: 404 });
    }

    // Get Stripe instance with tenant-specific credentials
    const stripe = await getStripeInstance(userData.tenant_id);

    let customerId = userData?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData?.email || user.email!,
        name: `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim(),
        metadata: {
          user_id: user.id,
        },
      });

      customerId = customer.id;

      // Update user with Stripe customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });

    return NextResponse.json({
      success: true,
      clientSecret: setupIntent.client_secret,
    });
  } catch (error: any) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create setup intent' },
      { status: 500 }
    );
  }
}

// DELETE - Remove payment method
export async function DELETE(request: NextRequest) {
  try {
    console.log('[PaymentMethods API] DELETE - Removing payment method');
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[PaymentMethods API] Unauthorized - no user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[PaymentMethods API] User authenticated:', user.id);

    // Get user's tenant_id
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData?.tenant_id) {
      console.error('[PaymentMethods API] User has no tenant_id');
      return NextResponse.json({ error: 'User tenant not found' }, { status: 404 });
    }

    // Get Stripe instance with tenant-specific credentials
    const stripe = await getStripeInstance(userData.tenant_id);

    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('payment_method_id');

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'payment_method_id is required' }, { status: 400 });
    }

    // Detach payment method from customer
    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({
      success: true,
      message: 'Payment method removed successfully',
    });
  } catch (error: any) {
    console.error('Error removing payment method:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove payment method' },
      { status: 500 }
    );
  }
}
