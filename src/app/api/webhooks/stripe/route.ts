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

      case 'invoice.paid':
        await handleInvoicePaid(supabase, event);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(supabase, event);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(supabase, event);
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

  console.log('Payment intent succeeded:', paymentIntent.id);

  const {
    id,
    amount,
    currency,
    metadata,
  } = paymentIntent;

  const {
    tenant_id,
    enrollment_id,
    payment_type,
    schedule_id,
  } = metadata;

  if (!tenant_id || !enrollment_id) {
    console.error('Missing required metadata in payment intent');
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

  // Get enrollment details
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('user_id')
    .eq('id', enrollment_id)
    .single();

  if (!enrollment) {
    console.error(`Enrollment not found: ${enrollment_id}`);
    return;
  }

  // Check if payment record already exists (prevent duplicates from webhook retries)
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id')
    .eq('stripe_payment_intent_id', id)
    .eq('enrollment_id', enrollment_id)
    .single();

  if (existingPayment) {
    console.log(`Payment record already exists for intent ${id}, skipping creation`);
  } else {
    // Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        tenant_id,
        enrollment_id,
        payment_schedule_id: schedule_id,
        product_id: enrollment.product_id,
        stripe_payment_intent_id: id,
        amount: amount / 100,
        currency: currency.toUpperCase(),
        payment_type,
        status: 'succeeded',
        installment_number: parseInt(metadata.payment_number || '1'),
        paid_at: new Date().toISOString(),
        metadata: {
          payment_type,
          schedule_id,
          stripe_payment_method: paymentIntent.payment_method,
          charge_id: (paymentIntent as any).charges?.data?.[0]?.id,
        },
      });

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return;
    }

    console.log(`✓ Created payment record for intent ${id}`);
  }

  // Update payment schedule to paid
  if (schedule_id) {
    await supabase
      .from('payment_schedules')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString(),
      })
      .eq('id', schedule_id)
      .eq('tenant_id', tenant_id);
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

  console.log('Invoice payment failed:', invoice.id);

  // Create notification for admin
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
}

// Handle charge refunded
async function handleChargeRefunded(supabase: any, event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;

  console.log('Charge refunded:', charge.id);

  // Update payment record
  await supabase
    .from('payments')
    .update({
      status: 'refunded',
      refunded_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent', charge.payment_intent);

  // Update enrollment if linked
  const { data: payment } = await supabase
    .from('payments')
    .select('enrollment_id')
    .eq('stripe_payment_intent', charge.payment_intent)
    .single();

  if (payment?.enrollment_id) {
    await supabase
      .from('enrollments')
      .update({
        payment_status: 'refunded',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.enrollment_id);

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
      'invoice.paid',
      'invoice.payment_failed',
      'charge.refunded'
    ],
    headers: {
      'stripe-signature': 'Webhook signature for payload verification'
    }
  });
}
