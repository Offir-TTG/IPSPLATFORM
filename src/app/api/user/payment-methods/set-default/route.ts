import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// Helper to get Stripe instance with credentials from database
async function getStripeInstance(tenantId: string): Promise<Stripe> {
  const supabase = createAdminClient();

  console.log('[SetDefault API] Fetching Stripe credentials for tenant:', tenantId);

  const { data: integration } = await supabase
    .from('integrations')
    .select('credentials')
    .eq('tenant_id', tenantId)
    .eq('integration_key', 'stripe')
    .single();

  if (!integration?.credentials?.secret_key) {
    console.error('[SetDefault API] Stripe not configured for tenant:', tenantId);
    throw new Error('Stripe not configured');
  }

  console.log('[SetDefault API] Successfully loaded Stripe credentials');
  return new Stripe(integration.credentials.secret_key, {
    apiVersion: '2023-10-16',
  });
}

// POST - Set default payment method
export async function POST(request: NextRequest) {
  try {
    console.log('[SetDefault API] POST - Setting default payment method');
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[SetDefault API] Unauthorized - no user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[SetDefault API] User authenticated:', user.id);

    const { payment_method_id } = await request.json();

    if (!payment_method_id) {
      console.log('[SetDefault API] Missing payment_method_id');
      return NextResponse.json({ error: 'payment_method_id is required' }, { status: 400 });
    }

    console.log('[SetDefault API] Setting payment method:', payment_method_id);

    // Get user's Stripe customer ID and tenant_id
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData?.tenant_id) {
      console.error('[SetDefault API] User has no tenant_id');
      return NextResponse.json({ error: 'User tenant not found' }, { status: 404 });
    }

    if (!userData?.stripe_customer_id) {
      console.log('[SetDefault API] User has no Stripe customer ID');
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 });
    }

    console.log('[SetDefault API] User customer ID:', userData.stripe_customer_id);

    // Get Stripe instance with tenant-specific credentials
    const stripe = await getStripeInstance(userData.tenant_id);

    // Update customer's default payment method
    await stripe.customers.update(userData.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: payment_method_id,
      },
    });

    console.log('[SetDefault API] Successfully set default payment method');

    return NextResponse.json({
      success: true,
      message: 'Default payment method updated successfully',
    });
  } catch (error: any) {
    console.error('[SetDefault API] Error setting default payment method:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set default payment method' },
      { status: 500 }
    );
  }
}
