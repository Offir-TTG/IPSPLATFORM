import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

/**
 * POST /api/enrollments/token/:token/payment/charge-saved-card
 *
 * Charge a saved payment method for a payment schedule
 * Used when user selects "Use This Card" with an existing saved card
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
    const { schedule_id, payment_method_id } = body;

    console.log('[Charge Saved Card] Request:', {
      token: params.token,
      schedule_id,
      payment_method_id,
    });

    // Validate enrollment token
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, tenant_id, token_expires_at, product_id, total_amount, currency, stripe_customer_id, is_parent')
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

    // CRITICAL: Parent enrollments should never be charged
    if (enrollment.is_parent) {
      console.log('[Charge Saved Card] Parent enrollment - skipping charge');
      return NextResponse.json({
        success: true,
        message: 'Parent enrollment - no charge required',
        skip_payment: true,
      });
    }

    // Validate required parameters
    if (!schedule_id) {
      return NextResponse.json(
        { error: 'schedule_id is required' },
        { status: 400 }
      );
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
      return NextResponse.json({
        success: true,
        message: 'Payment already completed',
        already_paid: true,
      });
    }

    // Get customer's default payment method if not provided
    let paymentMethodId = payment_method_id;

    if (!paymentMethodId && enrollment.stripe_customer_id) {
      console.log('[Charge Saved Card] No payment method specified, getting default from customer');

      const customer = await stripe.customers.retrieve(enrollment.stripe_customer_id) as Stripe.Customer;

      if (customer.invoice_settings?.default_payment_method) {
        paymentMethodId = customer.invoice_settings.default_payment_method as string;
        console.log('[Charge Saved Card] Using default payment method:', paymentMethodId);
      } else {
        // Get first available payment method
        const paymentMethods = await stripe.paymentMethods.list({
          customer: enrollment.stripe_customer_id,
          type: 'card',
          limit: 1,
        });

        if (paymentMethods.data.length > 0) {
          paymentMethodId = paymentMethods.data[0].id;
          console.log('[Charge Saved Card] Using first available payment method:', paymentMethodId);
        } else {
          return NextResponse.json(
            { error: 'No saved payment method found' },
            { status: 400 }
          );
        }
      }
    }

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method required' },
        { status: 400 }
      );
    }

    // Get product details for metadata
    const { data: product } = await supabase
      .from('products')
      .select('title, type')
      .eq('id', enrollment.product_id)
      .single();

    console.log('[Charge Saved Card] Creating Payment Intent:', {
      amount: schedule.amount,
      currency: schedule.currency,
      customer: enrollment.stripe_customer_id,
      payment_method: paymentMethodId,
    });

    // Create Payment Intent with saved payment method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(schedule.amount * 100), // Convert to cents
      currency: schedule.currency.toLowerCase(),
      customer: enrollment.stripe_customer_id,
      payment_method: paymentMethodId,
      off_session: true, // Charge immediately without user interaction
      confirm: true, // Confirm immediately
      metadata: {
        enrollment_id: enrollment.id,
        schedule_id: schedule.id,
        tenant_id: enrollment.tenant_id,
        payment_type: schedule.payment_type || 'payment',
        payment_number: (schedule.payment_number || 1).toString(),
        product_title: product?.title || 'Unknown Product',
        product_type: product?.type || 'unknown',
      },
      description: `${schedule.payment_type === 'deposit' ? 'Deposit' : `Payment ${schedule.payment_number || 1}`} for ${product?.title || 'Product'}`,
    });

    console.log('[Charge Saved Card] Payment Intent created:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
    });

    // Check if payment succeeded
    if (paymentIntent.status !== 'succeeded') {
      console.error('[Charge Saved Card] Payment did not succeed:', paymentIntent.status);
      return NextResponse.json(
        { error: `Payment ${paymentIntent.status}. Please try again or use a different card.` },
        { status: 400 }
      );
    }

    // Update payment schedule
    await supabase
      .from('payment_schedules')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString(),
        stripe_payment_intent_id: paymentIntent.id,
      })
      .eq('id', schedule_id);

    // Create payment record
    const chargeId = (paymentIntent as any).charges?.data?.[0]?.id;

    await supabase
      .from('payments')
      .insert({
        tenant_id: enrollment.tenant_id,
        enrollment_id: enrollment.id,
        payment_schedule_id: schedule.id,
        product_id: enrollment.product_id,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_customer_id: enrollment.stripe_customer_id,
        amount: schedule.amount,
        currency: schedule.currency,
        payment_type: schedule.payment_type,
        status: 'succeeded',
        installment_number: schedule.payment_number || 1,
        paid_at: new Date().toISOString(),
        metadata: {
          payment_type: schedule.payment_type,
          schedule_id: schedule.id,
          stripe_payment_method: paymentMethodId,
          charge_id: chargeId,
          used_saved_card: true,
        },
      });

    // Update enrollment paid_amount
    const newPaidAmount = (enrollment.total_amount || 0) >= schedule.amount
      ? schedule.amount
      : enrollment.total_amount;

    const paymentStatus = newPaidAmount >= enrollment.total_amount ? 'paid' : 'partial';

    await supabase
      .from('enrollments')
      .update({
        paid_amount: newPaidAmount,
        payment_status: paymentStatus,
      })
      .eq('id', enrollment.id);

    console.log('[Charge Saved Card] ✓ Payment successful');

    return NextResponse.json({
      success: true,
      payment_intent_id: paymentIntent.id,
      message: 'Payment completed successfully',
    });

  } catch (error: any) {
    console.error('[Charge Saved Card] Error:', error);

    // Handle Stripe errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: error.message || 'Card was declined' },
        { status: 400 }
      );
    }

    if (error.code === 'authentication_required' || error.code === 'card_declined') {
      return NextResponse.json(
        { error: 'Payment requires additional authentication. Please use a different payment method.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to process payment' },
      { status: 500 }
    );
  }
}
