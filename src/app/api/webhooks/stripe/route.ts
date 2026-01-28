import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/payments/stripeService';

export const dynamic = 'force-dynamic';

// Stripe webhook events
interface StripeWebhookEvent {
  id: string;
  object: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

// POST /api/webhooks/stripe - Handle Stripe webhook events
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Get the raw payload for signature verification
    const rawPayload = await request.text();

    // Get signature from headers
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Get webhook secret from integrations table
    const { data: integration } = await supabase
      .from('integrations')
      .select('credentials')
      .eq('integration_key', 'stripe')
      .single();

    if (!integration?.credentials?.webhook_secret) {
      console.error('Stripe webhook secret not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(integration.credentials.secret_key, {
      apiVersion: '2023-10-16',
    });

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawPayload,
        signature,
        integration.credentials.webhook_secret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log('Stripe webhook event received:', {
      type: event.type,
      id: event.id
    });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(supabase, event);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(supabase, event);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(supabase, event);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(supabase, event);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabase, event);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(supabase, event);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(supabase, event);
        break;

      case 'invoice.finalized':
        await handleInvoiceFinalized(supabase, event);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(supabase, event);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(supabase, event);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(supabase, event);
        break;

      case 'charge.dispute.updated':
        await handleDisputeUpdated(supabase, event);
        break;

      case 'charge.dispute.closed':
        await handleDisputeClosed(supabase, event);
        break;

      default:
        console.log('Unhandled Stripe event:', event.type);
    }

    // Store the webhook event for audit
    await supabase.from('webhook_events').insert({
      source: 'stripe',
      event_type: event.type,
      payload: event,
      processed_at: new Date().toISOString()
    });

    // Return success response to Stripe
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle checkout session completed
async function handleCheckoutSessionCompleted(supabase: any, event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;

  console.log('Checkout session completed:', session.id);

  // Get metadata (you should include enrollment_id or student_id in session metadata)
  const enrollmentId = session.metadata?.enrollment_id;
  const studentId = session.metadata?.student_id;
  const programId = session.metadata?.program_id;

  if (enrollmentId) {
    // Update enrollment payment status
    await supabase
      .from('enrollments')
      .update({
        payment_status: 'paid',
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
        payment_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollmentId);

    // Create notification
    await supabase.from('notifications').insert({
      type: 'payment_completed',
      title: 'Payment Completed',
      message: `Payment of ${(session.amount_total! / 100).toFixed(2)} ${session.currency?.toUpperCase()} received`,
      data: {
        enrollment_id: enrollmentId,
        session_id: session.id,
        amount: session.amount_total! / 100,
        currency: session.currency
      },
      created_at: new Date().toISOString()
    });

    console.log(`Enrollment ${enrollmentId} marked as paid`);
  }

  // You can also create a payment record
  if (studentId || enrollmentId) {
    await supabase.from('payments').insert({
      student_id: studentId,
      enrollment_id: enrollmentId,
      program_id: programId,
      amount: session.amount_total! / 100,
      currency: session.currency,
      status: 'completed',
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent as string,
      payment_method: session.payment_method_types?.[0],
      created_at: new Date().toISOString()
    });
  }
}

// Handle payment intent succeeded
async function handlePaymentIntentSucceeded(supabase: any, event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  console.log('[Webhook] ========================================');
  console.log('[Webhook] Payment intent succeeded:', paymentIntent.id);
  console.log('[Webhook] Amount:', paymentIntent.amount / 100, paymentIntent.currency);
  console.log('[Webhook] Status:', paymentIntent.status);

  const {
    id,
    amount,
    currency,
    metadata,
  } = paymentIntent;

  console.log('[Webhook] Metadata:', JSON.stringify(metadata, null, 2));

  const {
    tenant_id,
    enrollment_id,
    payment_type,
    schedule_id,
  } = metadata;

  if (!tenant_id || !enrollment_id) {
    console.error('[Webhook] ❌ Missing required metadata in payment intent');
    console.error('[Webhook] tenant_id:', tenant_id);
    console.error('[Webhook] enrollment_id:', enrollment_id);
    console.error('[Webhook] Full metadata:', metadata);
    // Fall back to old behavior
    await supabase
      .from('payments')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent', paymentIntent.id);
    return;
  }

  console.log('[Webhook] ✓ Metadata validation passed');
  console.log('[Webhook] tenant_id:', tenant_id);
  console.log('[Webhook] enrollment_id:', enrollment_id);
  console.log('[Webhook] schedule_id:', schedule_id);
  console.log('[Webhook] payment_type:', payment_type);

  // Get enrollment details
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('user_id, product_id')
    .eq('id', enrollment_id)
    .single();

  if (!enrollment) {
    console.error(`Enrollment not found: ${enrollment_id}`);
    return;
  }

  // Save Stripe customer ID to user if not already set
  // This ensures future installments can charge the saved payment method
  const stripeCustomerId = paymentIntent.customer as string;
  if (stripeCustomerId && enrollment.user_id) {
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', enrollment.user_id)
      .single();

    if (user && !user.stripe_customer_id) {
      await supabase
        .from('users')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', enrollment.user_id);

      console.log(`✓ Saved Stripe customer ID ${stripeCustomerId} to user ${enrollment.user_id}`);
    }
  }

  // Check if payment record already exists (prevent duplicates from webhook retries)
  console.log('[Webhook] Checking for existing payment record...');
  const { data: existingPayment, error: existingPaymentError } = await supabase
    .from('payments')
    .select('id')
    .eq('stripe_payment_intent_id', id)
    .eq('enrollment_id', enrollment_id)
    .single();

  if (existingPaymentError && existingPaymentError.code !== 'PGRST116') {
    console.error('[Webhook] Error checking existing payment:', existingPaymentError);
  }

  let paymentRecordId: string | undefined;

  if (existingPayment) {
    console.log(`[Webhook] ✓ Payment record already exists for intent ${id}, skipping creation`);
    paymentRecordId = existingPayment.id;
  } else {
    console.log('[Webhook] Creating new payment record...');

    // Extract Stripe IDs from payment intent
    const stripeInvoiceId = paymentIntent.invoice as string | null;
    const stripeCustomerId = paymentIntent.customer as string | null;
    const chargeId = (paymentIntent as any).charges?.data?.[0]?.id;

    // Create payment record
    const { data: newPayment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        tenant_id,
        enrollment_id,
        payment_schedule_id: schedule_id,
        product_id: enrollment.product_id,
        stripe_payment_intent_id: id,
        stripe_invoice_id: stripeInvoiceId,
        stripe_customer_id: stripeCustomerId,
        amount: amount / 100,
        currency: currency.toUpperCase(),
        payment_type,
        status: 'paid',
        installment_number: parseInt(metadata.payment_number || '1'),
        paid_at: new Date().toISOString(),
        metadata: {
          payment_type,
          schedule_id,
          stripe_payment_method: paymentIntent.payment_method,
          charge_id: chargeId,
        },
      })
      .select('id')
      .single();

    if (paymentError) {
      console.error('[Webhook] ❌ Error creating payment record:', paymentError);
      console.error('[Webhook] Payment data:', {
        tenant_id,
        enrollment_id,
        payment_schedule_id: schedule_id,
        product_id: enrollment.product_id,
        stripe_payment_intent_id: id,
        amount: amount / 100,
        currency: currency.toUpperCase(),
        payment_type,
      });
      return;
    }

    paymentRecordId = newPayment?.id;
    console.log(`[Webhook] ✓ Created payment record ${paymentRecordId} for intent ${id}`);
  }

  // Update payment schedule to paid and link to payment record
  if (schedule_id && paymentRecordId) {
    console.log(`[Webhook] Updating payment schedule ${schedule_id} to paid...`);

    // Extract Stripe IDs
    const stripeInvoiceId = paymentIntent.invoice as string | null;

    const { error: updateScheduleError } = await supabase
      .from('payment_schedules')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString(),
        payment_id: paymentRecordId,
        stripe_invoice_id: stripeInvoiceId,
        stripe_payment_intent_id: id,
      })
      .eq('id', schedule_id)
      .eq('tenant_id', tenant_id);

    if (updateScheduleError) {
      console.error('[Webhook] ❌ Error updating payment schedule:', updateScheduleError);
      console.error('[Webhook] Schedule update data:', {
        schedule_id,
        tenant_id,
        payment_id: paymentRecordId,
      });
    } else {
      console.log(`[Webhook] ✓ Updated payment schedule ${schedule_id} with payment_id ${paymentRecordId}`);
    }
  } else {
    console.warn('[Webhook] ⚠️ Skipping schedule update: schedule_id=' + schedule_id + ', paymentRecordId=' + paymentRecordId);
  }

  // Update enrollment payment status
  const { data: schedules } = await supabase
    .from('payment_schedules')
    .select('amount, status')
    .eq('enrollment_id', enrollment_id)
    .eq('tenant_id', tenant_id);

  if (schedules) {
    const totalAmount = schedules.reduce((sum: number, s: any) => sum + parseFloat(s.amount.toString()), 0);
    const paidAmount = schedules
      .filter((s: any) => s.status === 'paid')
      .reduce((sum: number, s: any) => sum + parseFloat(s.amount.toString()), 0);

    const isFullyPaid = paidAmount >= totalAmount;

    const { error: updateError } = await supabase
      .from('enrollments')
      .update({
        paid_amount: paidAmount,
        payment_status: isFullyPaid ? 'paid' : 'partial',
        // Note: Do NOT change enrollment.status here - that's controlled by the wizard completion
        // status only changes to 'active' when user completes the enrollment wizard
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollment_id)
      .eq('tenant_id', tenant_id);

    if (updateError) {
      console.error('Error updating enrollment:', updateError);
    } else {
      console.log(`✓ Updated enrollment: paid_amount=${paidAmount}, payment_status=${isFullyPaid ? 'paid' : 'partial'}`);
    }
  }

  console.log(`Payment succeeded for enrollment ${enrollment_id}: $${amount / 100}`);

  // Create a receipt invoice in Stripe for this payment
  try {
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id, first_name, last_name')
      .eq('id', enrollment.user_id)
      .single();

    if (user?.stripe_customer_id) {
      // Create invoice for the payment (as a receipt)
      const invoiceItem = await stripe.invoiceItems.create({
        customer: user.stripe_customer_id,
        amount: amount,
        currency: currency,
        description: metadata.product_name || `Payment ${payment_type}`,
        metadata: {
          tenant_id,
          enrollment_id,
          schedule_id: schedule_id || '',
          payment_type,
          payment_intent_id: id,
        },
      });

      const invoice = await stripe.invoices.create({
        customer: user.stripe_customer_id,
        collection_method: 'charge_automatically',
        auto_advance: false, // Don't auto-finalize
        metadata: {
          tenant_id,
          enrollment_id,
          schedule_id: schedule_id || '',
          payment_type,
          payment_intent_id: id,
        },
      });

      // Finalize and mark as paid (since payment already succeeded)
      await stripe.invoices.finalizeInvoice(invoice.id);
      await stripe.invoices.pay(invoice.id, {
        paid_out_of_band: true, // Mark as paid outside of Stripe
      });

      console.log(`✓ Created receipt invoice ${invoice.number} for payment ${id}`);

      // Save the invoice ID to payment_schedules for record-keeping
      if (schedule_id) {
        await supabase
          .from('payment_schedules')
          .update({ stripe_invoice_id: invoice.id })
          .eq('id', schedule_id)
          .eq('tenant_id', tenant_id);

        console.log(`✓ Saved receipt invoice ID ${invoice.id} to payment schedule ${schedule_id}`);
      }
    }
  } catch (invoiceError) {
    // Don't fail the webhook if invoice creation fails
    console.error('Error creating receipt invoice:', invoiceError);
  }

  // Trigger payment.completed event
  try {
    const { processTriggerEvent } = await import('@/lib/email/triggerEngine');

    // Get full enrollment details for trigger
    const { data: fullEnrollment } = await supabase
      .from('enrollments')
      .select(`
        *,
        products (
          id,
          title,
          type
        )
      `)
      .eq('id', enrollment_id)
      .single();

    // Get user details
    const { data: userData } = await supabase
      .from('users')
      .select('email, first_name, last_name, preferred_language')
      .eq('id', enrollment.user_id)
      .single();

    if (fullEnrollment && userData) {
      await processTriggerEvent({
        eventType: 'payment.completed',
        tenantId: tenant_id,
        eventData: {
          paymentId: id,
          enrollmentId: enrollment_id,
          userId: enrollment.user_id,
          productId: fullEnrollment.product_id,
          productName: fullEnrollment.products?.title || '',
          productType: fullEnrollment.products?.type || '',
          amount: amount / 100,
          currency: currency.toUpperCase(),
          paymentType: payment_type,
          paidAmount: fullEnrollment.paid_amount,
          totalAmount: fullEnrollment.total_amount,
          paymentStatus: fullEnrollment.payment_status,
          email: userData.email,
          userName: userData.first_name,
          languageCode: userData.preferred_language || 'en',
        },
        userId: enrollment.user_id,
        metadata: {
          stripePaymentIntentId: id,
          scheduleId: schedule_id,
        },
      });
    }
  } catch (triggerError) {
    console.error('Error processing payment.completed trigger:', triggerError);
    // Don't fail webhook if trigger fails
  }
}

// Handle payment intent failed
async function handlePaymentIntentFailed(supabase: any, event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  console.log('Payment intent failed:', paymentIntent.id);

  const {
    id,
    metadata,
    last_payment_error,
  } = paymentIntent;

  const {
    tenant_id,
    enrollment_id,
    schedule_id,
  } = metadata;

  if (!tenant_id || !enrollment_id) {
    console.error('Missing required metadata in payment intent');
    // Fall back to old behavior
    await supabase
      .from('payments')
      .update({
        status: 'failed',
        failure_reason: paymentIntent.last_payment_error?.message,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent', paymentIntent.id);
    return;
  }

  // Update payment schedule to failed with retry logic
  if (schedule_id) {
    const { data: schedule } = await supabase
      .from('payment_schedules')
      .select('retry_count')
      .eq('id', schedule_id)
      .eq('tenant_id', tenant_id)
      .single();

    if (schedule) {
      const retryCount = (schedule.retry_count || 0) + 1;
      const maxRetries = 3;

      // Calculate next retry date (exponential backoff: 1 day, 3 days, 7 days)
      const retryDays = retryCount === 1 ? 1 : retryCount === 2 ? 3 : 7;
      const nextRetryDate = new Date();
      nextRetryDate.setDate(nextRetryDate.getDate() + retryDays);

      await supabase
        .from('payment_schedules')
        .update({
          status: 'failed',
          retry_count: retryCount,
          next_retry_date: retryCount < maxRetries ? nextRetryDate.toISOString() : null,
          last_error: last_payment_error?.message || 'Payment failed',
        })
        .eq('id', schedule_id)
        .eq('tenant_id', tenant_id);
    }
  }

  console.error(`Payment failed for enrollment ${enrollment_id}: ${last_payment_error?.message}`);

  // Trigger payment.failed event
  try {
    const { processTriggerEvent } = await import('@/lib/email/triggerEngine');

    // Get enrollment and user details
    const { data: fullEnrollment } = await supabase
      .from('enrollments')
      .select(`
        *,
        products (
          id,
          title,
          type
        )
      `)
      .eq('id', enrollment_id)
      .single();

    if (fullEnrollment) {
      const { data: userData } = await supabase
        .from('users')
        .select('email, first_name, last_name, preferred_language')
        .eq('id', fullEnrollment.user_id)
        .single();

      if (userData) {
        await processTriggerEvent({
          eventType: 'payment.failed',
          tenantId: tenant_id,
          eventData: {
            paymentId: paymentIntent.id,
            enrollmentId: enrollment_id,
            userId: fullEnrollment.user_id,
            productId: fullEnrollment.product_id,
            productName: fullEnrollment.products?.title || '',
            productType: fullEnrollment.products?.type || '',
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency.toUpperCase(),
            failureReason: last_payment_error?.message || 'Payment failed',
            email: userData.email,
            userName: userData.first_name,
            languageCode: userData.preferred_language || 'en',
          },
          userId: fullEnrollment.user_id,
          metadata: {
            stripePaymentIntentId: paymentIntent.id,
            scheduleId: schedule_id,
            errorCode: last_payment_error?.code,
          },
        });
      }
    }
  } catch (triggerError) {
    console.error('Error processing payment.failed trigger:', triggerError);
    // Don't fail webhook if trigger fails
  }
}

// Handle subscription created
async function handleSubscriptionCreated(supabase: any, event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  console.log('Subscription created:', subscription.id);

  const studentId = subscription.metadata?.student_id;
  const enrollmentId = subscription.metadata?.enrollment_id;

  if (studentId) {
    // Create or update subscription record
    await supabase.from('subscriptions').insert({
      student_id: studentId,
      enrollment_id: enrollmentId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      created_at: new Date().toISOString()
    });
  }
}

// Handle subscription updated
async function handleSubscriptionUpdated(supabase: any, event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  console.log('Subscription updated:', subscription.id);

  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);
}

// Handle subscription deleted
async function handleSubscriptionDeleted(supabase: any, event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  console.log('Subscription deleted:', subscription.id);

  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);
}

// Handle invoice payment succeeded (for automatic recurring payments)
async function handleInvoicePaymentSucceeded(supabase: any, event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const scheduleId = invoice.metadata?.schedule_id;
  const enrollmentId = invoice.metadata?.enrollment_id;
  const tenantId = invoice.metadata?.tenant_id;

  console.log('[Webhook] Invoice payment succeeded:', {
    invoice_id: invoice.id,
    schedule_id: scheduleId,
    enrollment_id: enrollmentId,
    amount_paid: invoice.amount_paid / 100,
    total: invoice.total / 100,
    amount_due: invoice.amount_due / 100,
  });

  if (!scheduleId || !tenantId) {
    console.log('[Webhook] No schedule_id or tenant_id in invoice metadata, skipping');
    return;
  }

  // Update schedule to paid
  await supabase
    .from('payment_schedules')
    .update({
      status: 'paid',
      paid_date: new Date().toISOString(),
      stripe_invoice_id: invoice.id,
      retry_count: 0,
      last_error: null,
    })
    .eq('id', scheduleId)
    .eq('tenant_id', tenantId);

  console.log(`[Webhook] ✓ Updated schedule ${scheduleId} to paid`);

  // Get schedule details to update enrollment
  const { data: schedule } = await supabase
    .from('payment_schedules')
    .select('amount, enrollment_id, payment_number, payment_type, payment_plan_id')
    .eq('id', scheduleId)
    .single();

  if (schedule && enrollmentId) {
    // Update enrollment paid_amount
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('paid_amount, total_amount, product_id')
      .eq('id', enrollmentId)
      .eq('tenant_id', tenantId)
      .single();

    if (enrollment) {
      const newPaidAmount = parseFloat(enrollment.paid_amount.toString()) + parseFloat(schedule.amount.toString());
      const isFullyPaid = newPaidAmount >= parseFloat(enrollment.total_amount.toString());

      await supabase
        .from('enrollments')
        .update({
          paid_amount: newPaidAmount,
          payment_status: isFullyPaid ? 'paid' : 'partial',
          updated_at: new Date().toISOString(),
        })
        .eq('id', enrollmentId)
        .eq('tenant_id', tenantId);

      console.log(`[Webhook] ✓ Updated enrollment: paid_amount=${newPaidAmount}, payment_status=${isFullyPaid ? 'paid' : 'partial'}`);
    }

    // Create payment record
    // Use schedule amount (correct amount charged) instead of invoice.amount_paid (can be 0)
    const paymentData = {
      tenant_id: tenantId,
      enrollment_id: enrollmentId,
      payment_schedule_id: scheduleId,
      product_id: enrollment.product_id,
      payment_plan_id: schedule.payment_plan_id,
      amount: parseFloat(schedule.amount.toString()),
      currency: invoice.currency.toUpperCase(),
      payment_type: schedule.payment_type,
      installment_number: schedule.payment_number,
      stripe_payment_intent_id: invoice.payment_intent as string,
      stripe_invoice_id: invoice.id,
      stripe_customer_id: invoice.customer as string,
      status: 'paid',
      paid_at: new Date().toISOString(),
      metadata: {
        payment_number: schedule.payment_number,
        payment_type: schedule.payment_type,
        schedule_id: scheduleId,
      },
    };

    console.log('[Webhook] Creating payment record with data:', paymentData);

    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      console.error('[Webhook] ❌ Failed to create payment record:', paymentError);
    } else {
      console.log('[Webhook] ✓ Created payment record:', paymentRecord);
    }

    // Trigger payment.completed event
    try {
      const { processTriggerEvent } = await import('@/lib/email/triggerEngine');

      const { data: fullEnrollment } = await supabase
        .from('enrollments')
        .select(`
          *,
          products (
            id,
            title,
            type
          )
        `)
        .eq('id', enrollmentId)
        .single();

      if (fullEnrollment) {
        const { data: userData } = await supabase
          .from('users')
          .select('email, first_name, last_name, preferred_language')
          .eq('id', fullEnrollment.user_id)
          .single();

        if (userData) {
          await processTriggerEvent({
            eventType: 'payment.completed',
            tenantId: tenantId,
            eventData: {
              paymentId: invoice.payment_intent as string,
              enrollmentId: enrollmentId,
              userId: fullEnrollment.user_id,
              productId: fullEnrollment.product_id,
              productName: fullEnrollment.products?.title || '',
              productType: fullEnrollment.products?.type || '',
              amount: invoice.amount_paid / 100,
              currency: invoice.currency.toUpperCase(),
              paymentType: invoice.metadata?.payment_type || 'installment',
              paidAmount: fullEnrollment.paid_amount,
              totalAmount: fullEnrollment.total_amount,
              paymentStatus: fullEnrollment.payment_status,
              email: userData.email,
              userName: userData.first_name,
              languageCode: userData.preferred_language || 'en',
            },
            userId: fullEnrollment.user_id,
            metadata: {
              stripeInvoiceId: invoice.id,
              scheduleId: scheduleId,
            },
          });
        }
      }
    } catch (triggerError) {
      console.error('[Webhook] Error processing payment.completed trigger:', triggerError);
    }
  }
}

// Handle invoice finalized (invoice ready for automatic charging)
async function handleInvoiceFinalized(supabase: any, event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const scheduleId = invoice.metadata?.schedule_id;

  console.log('[Webhook] Invoice finalized:', {
    invoice_id: invoice.id,
    schedule_id: scheduleId,
    due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : 'N/A',
  });

  if (scheduleId) {
    console.log(`[Webhook] Invoice ${invoice.id} finalized, Stripe will automatically charge on due_date`);
  }
}

// Handle invoice paid
async function handleInvoicePaid(supabase: any, event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;

  console.log('Invoice paid:', invoice.id);

  // You can create a payment record for this invoice
  if (invoice.subscription) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('student_id, enrollment_id')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();

    if (subscription) {
      await supabase.from('payments').insert({
        student_id: subscription.student_id,
        enrollment_id: subscription.enrollment_id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: 'completed',
        stripe_invoice_id: invoice.id,
        stripe_payment_intent: invoice.payment_intent as string,
        created_at: new Date().toISOString()
      });
    }
  }
}

// Handle invoice payment failed
async function handleInvoicePaymentFailed(supabase: any, event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const scheduleId = invoice.metadata?.schedule_id;
  const enrollmentId = invoice.metadata?.enrollment_id;
  const tenantId = invoice.metadata?.tenant_id;

  console.log('[Webhook] Invoice payment failed:', {
    invoice_id: invoice.id,
    schedule_id: scheduleId,
    enrollment_id: enrollmentId,
    error: invoice.last_finalization_error?.message,
  });

  if (!scheduleId || !tenantId) {
    console.log('[Webhook] No schedule_id or tenant_id, creating admin notification only');

    // Create notification for admin (legacy behavior)
    await supabase.from('notifications').insert({
      type: 'invoice_payment_failed',
      title: 'Invoice Payment Failed',
      message: `Invoice ${invoice.number} payment failed`,
      data: {
        invoice_id: invoice.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency
      },
      created_at: new Date().toISOString()
    });

    return;
  }

  // Get current retry count
  const { data: schedule } = await supabase
    .from('payment_schedules')
    .select('retry_count')
    .eq('id', scheduleId)
    .single();

  const retryCount = (schedule?.retry_count || 0) + 1;

  // Calculate next retry date (exponential backoff: 1, 3, 7 days)
  let nextRetryDate: Date | null = null;
  if (retryCount === 1) {
    nextRetryDate = new Date();
    nextRetryDate.setDate(nextRetryDate.getDate() + 1); // +1 day
  } else if (retryCount === 2) {
    nextRetryDate = new Date();
    nextRetryDate.setDate(nextRetryDate.getDate() + 3); // +3 days
  } else if (retryCount === 3) {
    nextRetryDate = new Date();
    nextRetryDate.setDate(nextRetryDate.getDate() + 7); // +7 days
  }
  // After 3 retries, nextRetryDate stays null (no more auto-retries)

  await supabase
    .from('payment_schedules')
    .update({
      status: 'failed',
      retry_count: retryCount,
      next_retry_date: nextRetryDate?.toISOString() || null,
      last_error: invoice.last_finalization_error?.message || 'Payment failed',
    })
    .eq('id', scheduleId)
    .eq('tenant_id', tenantId);

  console.log(`[Webhook] ✓ Updated schedule ${scheduleId}: retry_count=${retryCount}, next_retry=${nextRetryDate?.toISOString() || 'none'}`);

  // Trigger payment.failed event
  try {
    const { processTriggerEvent } = await import('@/lib/email/triggerEngine');

    const { data: fullEnrollment } = await supabase
      .from('enrollments')
      .select(`
        *,
        products (
          id,
          title,
          type
        )
      `)
      .eq('id', enrollmentId)
      .single();

    if (fullEnrollment) {
      const { data: userData } = await supabase
        .from('users')
        .select('email, first_name, last_name, preferred_language')
        .eq('id', fullEnrollment.user_id)
        .single();

      if (userData) {
        await processTriggerEvent({
          eventType: 'payment.failed',
          tenantId: tenantId,
          eventData: {
            paymentId: invoice.id,
            enrollmentId: enrollmentId,
            userId: fullEnrollment.user_id,
            productId: fullEnrollment.product_id,
            productName: fullEnrollment.products?.title || '',
            productType: fullEnrollment.products?.type || '',
            amount: invoice.amount_due / 100,
            currency: invoice.currency.toUpperCase(),
            failureReason: invoice.last_finalization_error?.message || 'Payment failed',
            retryCount: retryCount,
            nextRetryDate: nextRetryDate?.toISOString(),
            email: userData.email,
            userName: userData.first_name,
            languageCode: userData.preferred_language || 'en',
          },
          userId: fullEnrollment.user_id,
          metadata: {
            stripeInvoiceId: invoice.id,
            scheduleId: scheduleId,
          },
        });
      }
    }
  } catch (triggerError) {
    console.error('[Webhook] Error processing payment.failed trigger:', triggerError);
  }
}

// Handle charge refunded
async function handleChargeRefunded(supabase: any, event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;

  console.log('[Webhook] Charge refunded:', {
    charge_id: charge.id,
    payment_intent: charge.payment_intent,
    amount_refunded: charge.amount_refunded / 100,
    currency: charge.currency,
  });

  // Get existing payment record to calculate total refunded
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, amount, refunded_amount, payment_schedule_id')
    .eq('stripe_payment_intent_id', charge.payment_intent)
    .maybeSingle();

  if (!existingPayment) {
    console.log('[Webhook] No payment record found for payment intent:', charge.payment_intent);
    return;
  }

  const totalRefunded = (charge.amount_refunded || 0) / 100;
  const isFullRefund = totalRefunded >= existingPayment.amount;
  const newStatus = isFullRefund ? 'refunded' : 'partially_refunded';

  console.log('[Webhook] Updating payment record:', {
    payment_id: existingPayment.id,
    new_status: newStatus,
    refunded_amount: totalRefunded,
  });

  // Update payment record with refund details
  await supabase
    .from('payments')
    .update({
      status: newStatus,
      refunded_amount: totalRefunded,
      refunded_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', existingPayment.id);

  // Update payment_schedule status
  if (existingPayment.payment_schedule_id) {
    await supabase
      .from('payment_schedules')
      .update({
        status: isFullRefund ? 'refunded' : 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', existingPayment.payment_schedule_id);

    console.log('[Webhook] Updated payment schedule status to:', isFullRefund ? 'refunded' : 'paid');
  }

  // Update enrollment if linked - don't set to refunded unless fully refunded
  const { data: payment } = await supabase
    .from('payments')
    .select('enrollment_id')
    .eq('id', existingPayment.id)
    .single();

  if (payment?.enrollment_id && isFullRefund) {
    // Recalculate enrollment paid_amount
    const { data: allSchedules } = await supabase
      .from('payment_schedules')
      .select('amount')
      .eq('enrollment_id', payment.enrollment_id)
      .eq('status', 'paid');

    const totalPaid = allSchedules
      ? allSchedules.reduce((sum: number, s: any) => sum + parseFloat(s.amount.toString()), 0)
      : 0;

    await supabase
      .from('enrollments')
      .update({
        paid_amount: totalPaid,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.enrollment_id);

    console.log('[Webhook] Updated enrollment paid_amount to:', totalPaid);

    // Create notification
    await supabase.from('notifications').insert({
      type: 'payment_refunded',
      title: 'Payment Refunded',
      message: `Payment of ${(charge.amount_refunded / 100).toFixed(2)} ${charge.currency.toUpperCase()} has been refunded`,
      data: {
        enrollment_id: payment.enrollment_id,
        charge_id: charge.id,
        amount: charge.amount_refunded / 100
      },
      created_at: new Date().toISOString()
    });
  }
}

// Handle dispute created (chargeback initiated)
async function handleDisputeCreated(supabase: any, event: Stripe.Event) {
  const dispute = event.data.object as Stripe.Dispute;

  console.log('[Webhook] Dispute created:', {
    dispute_id: dispute.id,
    charge_id: dispute.charge,
    amount: dispute.amount / 100,
    reason: dispute.reason,
    status: dispute.status,
  });

  // Find the payment record by charge ID
  const { data: payment } = await supabase
    .from('payments')
    .select('id, tenant_id, enrollment_id, user_id')
    .eq('metadata->charge_id', dispute.charge)
    .maybeSingle();

  if (!payment) {
    console.log('[Webhook] No payment found for charge:', dispute.charge);
    // Try to find by payment intent
    const { data: paymentByIntent } = await supabase
      .from('payments')
      .select('id, tenant_id, enrollment_id, user_id')
      .eq('stripe_payment_intent_id', dispute.payment_intent)
      .maybeSingle();

    if (!paymentByIntent) {
      console.log('[Webhook] No payment found for payment intent:', dispute.payment_intent);
      return;
    }

    // Use payment found by intent
    Object.assign(payment, paymentByIntent);
  }

  // Get enrollment to find user_id if not in payment
  let userId = payment.user_id;
  if (!userId && payment.enrollment_id) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('user_id')
      .eq('id', payment.enrollment_id)
      .single();

    userId = enrollment?.user_id;
  }

  // Map Stripe dispute status to our status
  let disputeStatus = 'needs_response';
  if (dispute.status === 'warning_needs_response' || dispute.status === 'needs_response') {
    disputeStatus = 'needs_response';
  } else if (dispute.status === 'under_review' || dispute.status === 'warning_under_review') {
    disputeStatus = 'under_review';
  } else if (dispute.status === 'won') {
    disputeStatus = 'won';
  } else if (dispute.status === 'lost') {
    disputeStatus = 'lost';
  } else if (dispute.status === 'warning_closed') {
    disputeStatus = 'closed';
  }

  // Create dispute record
  const { error: disputeError } = await supabase
    .from('payment_disputes')
    .insert({
      tenant_id: payment.tenant_id,
      payment_id: payment.id,
      enrollment_id: payment.enrollment_id,
      user_id: userId,
      stripe_dispute_id: dispute.id,
      stripe_charge_id: dispute.charge as string,
      amount: dispute.amount / 100,
      currency: dispute.currency.toUpperCase(),
      reason: dispute.reason,
      status: disputeStatus,
      evidence_due_date: dispute.evidence_details?.due_by
        ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
        : null,
      evidence_submitted: dispute.evidence_details?.submission_count ? dispute.evidence_details.submission_count > 0 : false,
      metadata: {
        stripe_dispute_status: dispute.status,
        is_charge_refundable: dispute.is_charge_refundable,
        network_reason_code: dispute.network_reason_code,
      },
    });

  if (disputeError) {
    console.error('[Webhook] Error creating dispute record:', disputeError);
  } else {
    console.log(`[Webhook] ✓ Created dispute record for ${dispute.id}`);
  }

  // Create admin notification
  await supabase.from('notifications').insert({
    type: 'payment_dispute_created',
    title: 'Payment Dispute Created',
    message: `A payment dispute of ${(dispute.amount / 100).toFixed(2)} ${dispute.currency.toUpperCase()} has been filed. Reason: ${dispute.reason}`,
    data: {
      dispute_id: dispute.id,
      payment_id: payment.id,
      amount: dispute.amount / 100,
      currency: dispute.currency,
      reason: dispute.reason,
      evidence_due: dispute.evidence_details?.due_by,
    },
    created_at: new Date().toISOString()
  });
}

// Handle dispute updated
async function handleDisputeUpdated(supabase: any, event: Stripe.Event) {
  const dispute = event.data.object as Stripe.Dispute;

  console.log('[Webhook] Dispute updated:', {
    dispute_id: dispute.id,
    status: dispute.status,
    evidence_submitted: dispute.evidence_details?.submission_count || 0,
  });

  // Map Stripe status to our status
  let disputeStatus = 'needs_response';
  if (dispute.status === 'warning_needs_response' || dispute.status === 'needs_response') {
    disputeStatus = 'needs_response';
  } else if (dispute.status === 'under_review' || dispute.status === 'warning_under_review') {
    disputeStatus = 'under_review';
  } else if (dispute.status === 'won') {
    disputeStatus = 'won';
  } else if (dispute.status === 'lost') {
    disputeStatus = 'lost';
  } else if (dispute.status === 'warning_closed') {
    disputeStatus = 'closed';
  }

  // Update dispute record
  const updateData: any = {
    status: disputeStatus,
    evidence_submitted: dispute.evidence_details?.submission_count ? dispute.evidence_details.submission_count > 0 : false,
    updated_at: new Date().toISOString(),
  };

  // Update evidence submission timestamp if evidence was submitted
  if (dispute.evidence_details?.submission_count && dispute.evidence_details.submission_count > 0) {
    updateData.evidence_submitted_at = new Date().toISOString();
  }

  // Update evidence due date if changed
  if (dispute.evidence_details?.due_by) {
    updateData.evidence_due_date = new Date(dispute.evidence_details.due_by * 1000).toISOString();
  }

  const { error: updateError } = await supabase
    .from('payment_disputes')
    .update(updateData)
    .eq('stripe_dispute_id', dispute.id);

  if (updateError) {
    console.error('[Webhook] Error updating dispute:', updateError);
  } else {
    console.log(`[Webhook] ✓ Updated dispute ${dispute.id} to status: ${disputeStatus}`);
  }
}

// Handle dispute closed (final outcome)
async function handleDisputeClosed(supabase: any, event: Stripe.Event) {
  const dispute = event.data.object as Stripe.Dispute;

  console.log('[Webhook] Dispute closed:', {
    dispute_id: dispute.id,
    status: dispute.status,
  });

  // Map final status
  let finalStatus = 'closed';
  if (dispute.status === 'won') {
    finalStatus = 'won';
  } else if (dispute.status === 'lost') {
    finalStatus = 'lost';
  } else if (dispute.status === 'warning_closed') {
    finalStatus = 'closed';
  }

  // Update dispute record with final status
  const { error: updateError } = await supabase
    .from('payment_disputes')
    .update({
      status: finalStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_dispute_id', dispute.id);

  if (updateError) {
    console.error('[Webhook] Error updating dispute to closed:', updateError);
  } else {
    console.log(`[Webhook] ✓ Dispute ${dispute.id} closed with status: ${finalStatus}`);
  }

  // Get dispute details for notification
  const { data: disputeRecord } = await supabase
    .from('payment_disputes')
    .select('amount, currency, payment_id')
    .eq('stripe_dispute_id', dispute.id)
    .single();

  // Create admin notification
  if (disputeRecord) {
    await supabase.from('notifications').insert({
      type: 'payment_dispute_closed',
      title: `Payment Dispute ${finalStatus === 'won' ? 'Won' : 'Lost'}`,
      message: `Dispute for ${disputeRecord.amount} ${disputeRecord.currency} has been ${finalStatus === 'won' ? 'won' : 'lost'}.`,
      data: {
        dispute_id: dispute.id,
        payment_id: disputeRecord.payment_id,
        amount: disputeRecord.amount,
        currency: disputeRecord.currency,
        outcome: finalStatus,
      },
      created_at: new Date().toISOString()
    });
  }
}

// GET /api/webhooks/stripe - Return webhook configuration info
export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: '/api/webhooks/stripe',
    method: 'POST',
    description: 'Stripe webhook endpoint',
    events: [
      'checkout.session.completed',
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
      'invoice.finalized',
      'invoice.paid',
      'charge.refunded',
      'charge.dispute.created',
      'charge.dispute.updated',
      'charge.dispute.closed'
    ],
    headers: {
      'stripe-signature': 'Webhook signature for payload verification'
    }
  });
}
