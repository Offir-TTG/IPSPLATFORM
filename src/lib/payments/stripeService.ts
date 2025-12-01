import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export interface PaymentIntentRequest {
  enrollment_id: string;
  amount: number;
  currency: string;
  payment_type: 'deposit' | 'installment' | 'subscription' | 'full';
  schedule_id?: string;
  metadata?: Record<string, string>;
}

export interface SubscriptionRequest {
  enrollment_id: string;
  customer_id: string;
  price_id: string;
  payment_plan_id: string;
  schedule_ids: string[];
  metadata?: Record<string, string>;
}

/**
 * Create a Stripe payment intent for immediate payment
 */
export async function createPaymentIntent(
  request: PaymentIntentRequest,
  tenant_id: string,
  user_id: string
): Promise<{ client_secret: string; payment_intent_id: string }> {
  const supabase = await createClient();

  // Get enrollment details
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select(`
      id,
      user_id,
      users!inner(email, first_name, last_name),
      products!inner(product_name)
    `)
    .eq('id', request.enrollment_id)
    .eq('tenant_id', tenant_id)
    .single();

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  // Get user data (Supabase returns it as an array due to the join)
  const userData = Array.isArray(enrollment.users) ? enrollment.users[0] : enrollment.users;
  const productData = Array.isArray(enrollment.products) ? enrollment.products[0] : enrollment.products;

  // Get or create Stripe customer
  const customer = await getOrCreateStripeCustomer(
    tenant_id,
    user_id,
    userData.email,
    `${userData.first_name} ${userData.last_name}`.trim()
  );

  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(request.amount * 100), // Convert to cents
    currency: request.currency.toLowerCase(),
    customer: customer.id,
    metadata: {
      tenant_id,
      enrollment_id: request.enrollment_id,
      payment_type: request.payment_type,
      schedule_id: request.schedule_id || '',
      product_name: productData.product_name,
      ...request.metadata,
    },
    description: `Payment for ${productData.product_name} - ${request.payment_type}`,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return {
    client_secret: paymentIntent.client_secret!,
    payment_intent_id: paymentIntent.id,
  };
}

/**
 * Get or create a Stripe customer for a user
 */
async function getOrCreateStripeCustomer(
  tenant_id: string,
  user_id: string,
  email: string,
  name: string
): Promise<Stripe.Customer> {
  const supabase = await createClient();

  // Check if user already has a Stripe customer ID
  const { data: userData } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user_id)
    .eq('tenant_id', tenant_id)
    .single();

  if (userData?.stripe_customer_id) {
    try {
      // Retrieve existing customer
      const customer = await stripe.customers.retrieve(userData.stripe_customer_id);
      if (!customer.deleted) {
        return customer as Stripe.Customer;
      }
    } catch (error) {
      console.error('Error retrieving Stripe customer:', error);
      // Customer doesn't exist, create a new one below
    }
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      tenant_id,
      user_id,
    },
  });

  // Save Stripe customer ID to user record
  await supabase
    .from('users')
    .update({ stripe_customer_id: customer.id })
    .eq('id', user_id)
    .eq('tenant_id', tenant_id);

  return customer;
}

/**
 * Create a Stripe subscription for recurring payments
 */
export async function createSubscription(
  request: SubscriptionRequest,
  tenant_id: string
): Promise<{ subscription_id: string; client_secret?: string }> {
  const supabase = await createClient();

  // Get enrollment details
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select(`
      id,
      products!inner(product_name)
    `)
    .eq('id', request.enrollment_id)
    .eq('tenant_id', tenant_id)
    .single();

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  // Get product data (Supabase returns it as an array due to the join)
  const productData = Array.isArray(enrollment.products) ? enrollment.products[0] : enrollment.products;

  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer: request.customer_id,
    items: [
      {
        price: request.price_id,
      },
    ],
    metadata: {
      tenant_id,
      enrollment_id: request.enrollment_id,
      payment_plan_id: request.payment_plan_id,
      schedule_ids: request.schedule_ids.join(','),
      product_name: productData.product_name,
      ...request.metadata,
    },
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription',
    },
    expand: ['latest_invoice.payment_intent'],
  });

  // Store subscription info
  await supabase
    .from('subscriptions')
    .insert({
      tenant_id,
      enrollment_id: request.enrollment_id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: request.customer_id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      metadata: {
        payment_plan_id: request.payment_plan_id,
        schedule_ids: request.schedule_ids,
      },
    });

  const invoice = subscription.latest_invoice as Stripe.Invoice;
  const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;

  return {
    subscription_id: subscription.id,
    client_secret: paymentIntent?.client_secret || undefined,
  };
}

/**
 * Create a Stripe invoice for installment payments
 */
export async function createInvoice(
  enrollment_id: string,
  tenant_id: string,
  customer_id: string,
  amount: number,
  currency: string,
  description: string,
  schedule_id: string,
  due_date?: Date
): Promise<{ invoice_id: string; hosted_invoice_url: string }> {
  const supabase = await createClient();

  // Get enrollment details
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select(`
      id,
      products!inner(product_name)
    `)
    .eq('id', enrollment_id)
    .eq('tenant_id', tenant_id)
    .single();

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  // Get product data (Supabase returns it as an array due to the join)
  const productData = Array.isArray(enrollment.products) ? enrollment.products[0] : enrollment.products;

  // Create invoice item
  const invoiceItem = await stripe.invoiceItems.create({
    customer: customer_id,
    amount: Math.round(amount * 100), // Convert to cents
    currency: currency.toLowerCase(),
    description,
    metadata: {
      tenant_id,
      enrollment_id,
      schedule_id,
      product_name: productData.product_name,
    },
  });

  // Create invoice
  const invoice = await stripe.invoices.create({
    customer: customer_id,
    collection_method: 'send_invoice',
    days_until_due: due_date
      ? Math.ceil((due_date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 7,
    metadata: {
      tenant_id,
      enrollment_id,
      schedule_id,
      product_name: productData.product_name,
    },
  });

  // Send the invoice
  await stripe.invoices.sendInvoice(invoice.id);

  return {
    invoice_id: invoice.id,
    hosted_invoice_url: invoice.hosted_invoice_url!,
  };
}

/**
 * Cancel a Stripe subscription
 */
export async function cancelSubscription(
  subscription_id: string,
  tenant_id: string,
  immediately: boolean = false
): Promise<void> {
  const supabase = await createClient();

  // Cancel in Stripe
  await stripe.subscriptions.cancel(subscription_id, {
    invoice_now: immediately,
    prorate: true,
  });

  // Update local record
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription_id)
    .eq('tenant_id', tenant_id);
}

/**
 * Process a refund for a payment
 */
export async function processRefund(
  payment_intent_id: string,
  tenant_id: string,
  amount?: number,
  reason?: string
): Promise<{ refund_id: string; amount: number }> {
  const supabase = await createClient();

  // Create refund in Stripe
  const refund = await stripe.refunds.create({
    payment_intent: payment_intent_id,
    amount: amount ? Math.round(amount * 100) : undefined, // Partial or full refund
    reason: reason === 'duplicate' ? 'duplicate' : reason === 'fraudulent' ? 'fraudulent' : 'requested_by_customer',
    metadata: {
      tenant_id,
    },
  });

  // Record refund in payments table
  const { data: payment } = await supabase
    .from('payments')
    .select('id, enrollment_id')
    .eq('stripe_payment_intent_id', payment_intent_id)
    .eq('tenant_id', tenant_id)
    .single();

  if (payment) {
    await supabase
      .from('payments')
      .update({
        status: 'refunded',
        refunded_amount: refund.amount / 100,
        metadata: {
          refund_id: refund.id,
          refund_reason: reason,
          refunded_at: new Date().toISOString(),
        },
      })
      .eq('id', payment.id);
  }

  return {
    refund_id: refund.id,
    amount: refund.amount / 100,
  };
}

/**
 * Retrieve payment intent status
 */
export async function getPaymentIntentStatus(
  payment_intent_id: string
): Promise<{
  status: string;
  amount: number;
  currency: string;
  metadata: Record<string, string>;
}> {
  const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

  return {
    status: paymentIntent.status,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency.toUpperCase(),
    metadata: paymentIntent.metadata as Record<string, string>,
  };
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('Stripe webhook secret not configured');
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error: any) {
    throw new Error(`Webhook signature verification failed: ${error.message}`);
  }
}

export { stripe };
