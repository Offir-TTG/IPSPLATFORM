import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

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
    const supabase = await createClient();

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

  // Update payment record if exists
  await supabase
    .from('payments')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent', paymentIntent.id);
}

// Handle payment intent failed
async function handlePaymentIntentFailed(supabase: any, event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  console.log('Payment intent failed:', paymentIntent.id);

  // Update payment record
  await supabase
    .from('payments')
    .update({
      status: 'failed',
      failure_reason: paymentIntent.last_payment_error?.message,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent', paymentIntent.id);

  // Update enrollment if linked
  const { data: payment } = await supabase
    .from('payments')
    .select('enrollment_id')
    .eq('stripe_payment_intent', paymentIntent.id)
    .single();

  if (payment?.enrollment_id) {
    await supabase
      .from('enrollments')
      .update({
        payment_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.enrollment_id);

    // Create notification
    await supabase.from('notifications').insert({
      type: 'payment_failed',
      title: 'Payment Failed',
      message: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
      data: {
        enrollment_id: payment.enrollment_id,
        payment_intent: paymentIntent.id
      },
      created_at: new Date().toISOString()
    });
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
