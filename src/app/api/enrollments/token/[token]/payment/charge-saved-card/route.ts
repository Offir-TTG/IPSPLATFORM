import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { nextChargeable, recordInvoicePaid, recordSchedulePaid, refreshEnrollmentTotals, type ScheduleRow } from '@/lib/payments/dueSchedules';
import { loadIntegration } from '@/lib/integrations/store';

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
    const { data: integration, error: integrationError } = await loadIntegration(enrollment.tenant_id, 'stripe');

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

    // A charge already started for this payment: never start a second one.
    if (schedule.stripe_payment_intent_id) {
      const earlier = await stripe.paymentIntents.retrieve(schedule.stripe_payment_intent_id);
      if (earlier.status === 'succeeded') {
        const recorded = await recordSchedulePaid(supabase, schedule, earlier, {
          productId: enrollment.product_id,
          source: 'charge-saved-card',
        });
        if (!recorded.ok) {
          return NextResponse.json({ error: 'Payment received but not saved. Please contact us.' }, { status: 500 });
        }
        await refreshEnrollmentTotals(supabase, enrollment.id);
        return NextResponse.json({ success: true, message: 'Payment already completed', already_paid: true });
      }
      if (earlier.status === 'processing') {
        return NextResponse.json(
          { error: 'Your payment is still being processed. Please wait a few minutes.' },
          { status: 409 },
        );
      }
    }

    // Only the earliest payment that's due may be charged now.
    const { data: allSchedules, error: allSchedulesError } = await supabase
      .from('payment_schedules')
      .select('*')
      .eq('enrollment_id', enrollment.id);
    if (allSchedulesError) {
      return NextResponse.json({ error: 'Could not check payments' }, { status: 500 });
    }
    if (nextChargeable((allSchedules ?? []) as ScheduleRow[])?.id !== schedule.id) {
      return NextResponse.json({ error: "This payment isn't due yet." }, { status: 400 });
    }

    // An invoice from an earlier automatic charge: record it if it was paid
    // after all; otherwise close it, so it can't also be charged later.
    if (schedule.stripe_invoice_id) {
      const earlierInvoice = await stripe.invoices.retrieve(schedule.stripe_invoice_id).catch(() => null);
      if (earlierInvoice?.status === 'paid') {
        await recordInvoicePaid(supabase, earlierInvoice, 'charge-saved-card-check');
        return NextResponse.json({ success: true, message: 'Payment already completed', already_paid: true });
      }
      if (earlierInvoice?.status === 'open') {
        try {
          await stripe.invoices.voidInvoice(earlierInvoice.id);
        } catch {
          return NextResponse.json({ error: 'This payment is being charged right now. Try again in a few minutes.' }, { status: 409 });
        }
      }
      if (earlierInvoice) {
        // Cleared, and re-read so the claim below compares against this change.
        const { data: fresh } = await supabase.from('payment_schedules').update({ stripe_invoice_id: null }).eq('id', schedule.id).select('status, updated_at').single();
        if (fresh) {
          schedule.status = fresh.status;
          schedule.updated_at = fresh.updated_at;
        }
      }
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

    // Take the payment for this charge first, so a second click (or the
    // scheduled charger) can't start another one at the same moment.
    const claimAt = new Date().toISOString();
    let claim = supabase.from('payment_schedules').update({ status: 'processing', updated_at: claimAt }).eq('id', schedule.id).eq('status', schedule.status);
    claim = schedule.updated_at ? claim.eq('updated_at', schedule.updated_at) : claim.is('updated_at', null);
    const { data: claimed, error: claimError } = await claim.select('id');
    if (claimError || !claimed || claimed.length === 0) {
      return NextResponse.json({ error: 'This payment is already being charged. Please wait a moment and refresh.' }, { status: 409 });
    }
    const putBack = () =>
      supabase.from('payment_schedules').update({ status: schedule.status, updated_at: new Date().toISOString() }).eq('id', schedule.id).eq('status', 'processing');

    // Create Payment Intent with saved payment method. The key is the same
    // for every retry of this attempt (a double click or a resent request
    // returns the same charge); a new attempt after a failed one gets a new key.
    let paymentIntent: Stripe.PaymentIntent;
    try {
    paymentIntent = await stripe.paymentIntents.create({
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
    }, {
      idempotencyKey: `charge-saved:${schedule.id}:${paymentMethodId}:${schedule.stripe_payment_intent_id ?? 'first'}:${Math.round(schedule.amount * 100)}`,
    });
    } catch (chargeError: any) {
      // Declined or refused by Stripe: nothing was taken, the payment is open again.
      const failedIntent = chargeError?.raw?.payment_intent?.id ?? chargeError?.payment_intent?.id;
      if (failedIntent) await supabase.from('payment_schedules').update({ stripe_payment_intent_id: failedIntent }).eq('id', schedule.id);
      await putBack();
      throw chargeError;
    }

    await supabase
      .from('payment_schedules')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', schedule.id);

    console.log('[Charge Saved Card] Payment Intent created:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
    });

    // Check if payment succeeded
    if (paymentIntent.status !== 'succeeded') {
      console.error('[Charge Saved Card] Payment did not succeed:', paymentIntent.status);
      if (paymentIntent.status !== 'processing') await putBack();
      return NextResponse.json(
        { error: `Payment ${paymentIntent.status}. Please try again or use a different card.` },
        { status: 400 }
      );
    }

    const recorded = await recordSchedulePaid(supabase, schedule, paymentIntent, {
      productId: enrollment.product_id,
      source: 'charge-saved-card',
    });
    if (!recorded.ok) {
      console.error('[Charge Saved Card] Paid in Stripe but not saved:', recorded.error);
      return NextResponse.json({ error: 'Payment received but not saved. Please contact us.' }, { status: 500 });
    }
    const totals = await refreshEnrollmentTotals(supabase, enrollment.id);
    if (!totals.ok) console.error('[Charge Saved Card] Could not update totals:', totals.error);

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
