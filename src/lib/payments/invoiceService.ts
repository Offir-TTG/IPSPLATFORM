/**
 * Invoice Service
 *
 * Handles creation and management of Stripe invoices for automatic recurring payments.
 * Invoices are created in advance and automatically charged by Stripe on the due date.
 */

import { createAdminClient } from '@/lib/supabase/server';
import { getStripeClient } from './getStripeClient';

/**
 * Creates a Stripe invoice for a payment schedule
 * The invoice will automatically charge on the due date via Stripe's automation
 *
 * @param scheduleId - ID of the payment schedule
 * @param tenantId - Tenant ID for database isolation
 * @param chargeNow - If true, charges immediately instead of on scheduled_date
 * @param paymentMethodId - Optional payment method ID to use (defaults to customer's default)
 * @returns Object with invoice_id or error message
 */
export async function createScheduledInvoice(
  scheduleId: string,
  tenantId: string,
  chargeNow: boolean = false,
  paymentMethodId?: string
): Promise<{ invoice_id: string; error?: string }> {
  try {
    console.log(`[Invoice Service] Starting invoice creation for schedule ${scheduleId}, tenant ${tenantId}`);

    const supabase = createAdminClient();

    // Get Stripe client with credentials from database
    console.log(`[Invoice Service] Fetching Stripe client for tenant ${tenantId}`);
    const { stripe } = await getStripeClient(tenantId);

    if (!stripe) {
      console.error('[Invoice Service] Failed to get Stripe client');
      return { invoice_id: '', error: 'Stripe client initialization failed' };
    }

    console.log('[Invoice Service] Stripe client initialized successfully');

    // 1. Get schedule details
    console.log('[Invoice Service] Fetching schedule details from database');
    const { data: schedule, error: scheduleError } = await supabase
      .from('payment_schedules')
      .select('id, amount, currency, scheduled_date, payment_type, payment_number, enrollment_id')
      .eq('id', scheduleId)
      .eq('tenant_id', tenantId)
      .single();

    if (scheduleError || !schedule) {
      console.error('[Invoice Service] Schedule not found:', scheduleError);
      return { invoice_id: '', error: 'Schedule not found' };
    }

    console.log(`[Invoice Service] Schedule found: ${schedule.id}, amount: ${schedule.amount} ${schedule.currency}, due: ${schedule.scheduled_date}`);

    // 2. Get enrollment details
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, user_id, product_id, stripe_customer_id')
      .eq('id', schedule.enrollment_id)
      .eq('tenant_id', tenantId)
      .single();

    if (enrollmentError || !enrollment) {
      console.error('[Invoice Service] Enrollment not found:', enrollmentError);
      return { invoice_id: '', error: 'Enrollment not found' };
    }

    // 3. Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, stripe_customer_id')
      .eq('id', enrollment.user_id)
      .single();

    if (userError || !user) {
      console.error('[Invoice Service] User not found:', userError);
      return { invoice_id: '', error: 'User not found' };
    }

    // 4. Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title')
      .eq('id', enrollment.product_id)
      .single();

    if (productError || !product) {
      console.error('[Invoice Service] Product not found:', productError);
      return { invoice_id: '', error: 'Product not found' };
    }

    // 5. Get Stripe customer ID with saved payment method
    // Priority: enrollment customer (has payment method) > user customer > create new
    let customerId = enrollment.stripe_customer_id || user.stripe_customer_id;

    if (!customerId) {
      console.log(`[Invoice Service] No existing customer found, creating new customer for ${user.email}`);
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.first_name} ${user.last_name}`.trim(),
        metadata: {
          user_id: user.id,
          tenant_id: tenantId,
        },
      });

      customerId = customer.id;
      console.log(`[Invoice Service] Created Stripe customer: ${customerId}`);

      // Save customer ID to both enrollment and user
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);

      await supabase
        .from('enrollments')
        .update({ stripe_customer_id: customerId })
        .eq('id', enrollment.id);

      console.error('[Invoice Service] ⚠️ WARNING: New customer has no payment method! Charge will fail.');
      console.error('[Invoice Service] This should not happen - enrollment should have customer with saved payment method.');
    } else if (enrollment.stripe_customer_id) {
      console.log(`[Invoice Service] Using enrollment's Stripe customer (has saved payment method): ${customerId}`);

      // Sync customer ID to user if missing
      if (!user.stripe_customer_id) {
        await supabase
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id);
        console.log(`[Invoice Service] Synced customer ID to user record`);
      }
    } else {
      console.log(`[Invoice Service] Using user's Stripe customer: ${customerId}`);
    }

    // Get or verify payment method for charging
    let selectedPaymentMethodId: string | undefined = paymentMethodId; // Use provided payment method if specified

    if (!selectedPaymentMethodId) {
      // No payment method specified - get customer's DEFAULT payment method (not just any card)
      console.log('[Invoice Service] No payment method specified, fetching customer\'s default payment method');
      try {
        // Retrieve customer to get their default payment method
        const customer = await stripe.customers.retrieve(customerId);

        if (customer.deleted) {
          console.error(`[Invoice Service] ⚠️ CRITICAL: Customer ${customerId} has been deleted!`);
        } else {
          // Check for default payment method in invoice_settings
          const defaultPaymentMethod = (customer as any).invoice_settings?.default_payment_method;

          if (defaultPaymentMethod) {
            selectedPaymentMethodId = typeof defaultPaymentMethod === 'string'
              ? defaultPaymentMethod
              : defaultPaymentMethod.id;

            // Fetch payment method details for logging
            if (selectedPaymentMethodId) {
              const pm = await stripe.paymentMethods.retrieve(selectedPaymentMethodId);
              console.log(`[Invoice Service] ✓ Using customer's DEFAULT payment method: ${pm.type} ending in ${(pm as any).card?.last4 || 'N/A'} (${selectedPaymentMethodId})`);
            }
          } else {
            // No default set - fall back to first available payment method
            console.log('[Invoice Service] No default payment method set, fetching first available');
            const paymentMethods = await stripe.paymentMethods.list({
              customer: customerId,
              limit: 1,
            });

            if (paymentMethods.data.length === 0) {
              console.error(`[Invoice Service] ⚠️ CRITICAL: Customer ${customerId} has NO payment method!`);
              console.error(`[Invoice Service] Invoice will be created but charge will fail.`);
              console.error(`[Invoice Service] User needs to add payment method first.`);
            } else {
              const pm = paymentMethods.data[0];
              selectedPaymentMethodId = pm.id;
              console.log(`[Invoice Service] ✓ Using first available payment method: ${pm.type} ending in ${(pm as any).card?.last4 || 'N/A'} (${selectedPaymentMethodId})`);
            }
          }
        }
      } catch (error) {
        console.error(`[Invoice Service] Error fetching customer's default payment method:`, error);
      }
    } else {
      console.log(`[Invoice Service] ✓ Using specified payment method: ${selectedPaymentMethodId}`);
    }

    // 6. Calculate due date timestamp (Unix timestamp in seconds)
    const dueDate = Math.floor(new Date(schedule.scheduled_date).getTime() / 1000);

    // 7. Create invoice FIRST (so invoice item can be attached to it)
    let invoice;
    if (chargeNow) {
      // Charge immediately - use charge_automatically without due_date
      console.log(`[Invoice Service] Creating Stripe invoice for immediate charge`);
      invoice = await stripe.invoices.create({
        customer: customerId,
        collection_method: 'charge_automatically', // Charge immediately when finalized
        auto_advance: true,
        metadata: {
          tenant_id: tenantId,
          enrollment_id: enrollment.id,
          schedule_id: scheduleId,
          payment_type: schedule.payment_type,
        },
        description: `Payment for ${product.title}`,
      });
    } else {
      // Charge on scheduled date - use send_invoice with due_date
      console.log(`[Invoice Service] Creating Stripe invoice with due_date: ${new Date(dueDate * 1000).toISOString()}`);
      invoice = await stripe.invoices.create({
        customer: customerId,
        collection_method: 'send_invoice', // Required for due_date
        due_date: dueDate,
        auto_advance: true, // Automatically finalize and charge on due_date
        metadata: {
          tenant_id: tenantId,
          enrollment_id: enrollment.id,
          schedule_id: scheduleId,
          payment_type: schedule.payment_type,
        },
        description: `Payment for ${product.title}`,
      });
    }
    console.log(`[Invoice Service] Stripe invoice created: ${invoice.id}`);

    // 8. Create invoice item and attach to invoice
    console.log(`[Invoice Service] Creating invoice item: ${schedule.amount} ${schedule.currency}`);
    await stripe.invoiceItems.create({
      customer: customerId,
      invoice: invoice.id, // IMPORTANT: Explicitly attach to this invoice
      amount: Math.round(schedule.amount * 100), // Convert to cents
      currency: schedule.currency.toLowerCase(),
      description: `${product.title} - Payment #${schedule.payment_number}`,
      metadata: {
        tenant_id: tenantId,
        enrollment_id: enrollment.id,
        schedule_id: scheduleId,
        payment_type: schedule.payment_type,
      },
    });
    console.log('[Invoice Service] Invoice item created and attached to invoice');

    // 9. Finalize the invoice immediately (now with the invoice item attached)
    // For chargeNow: charges immediately
    // For scheduled: prepares invoice to auto-charge on due_date
    console.log(`[Invoice Service] Finalizing invoice ${invoice.id}`);
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    console.log(`[Invoice Service] Invoice finalized. Status: ${finalizedInvoice.status}, Amount due: ${finalizedInvoice.amount_due / 100}`);

    // For charge_automatically, explicitly pay the invoice if it's not already paid
    if (chargeNow && finalizedInvoice.status !== 'paid') {
      console.log(`[Invoice Service] Explicitly paying invoice ${invoice.id} with payment method ${selectedPaymentMethodId || 'default'}`);
      try {
        // Specify payment method to avoid "no default_payment_method" error
        const payOptions: any = {};
        if (selectedPaymentMethodId) {
          payOptions.payment_method = selectedPaymentMethodId;
        }

        const paidInvoice = await stripe.invoices.pay(invoice.id, payOptions);
        console.log(`[Invoice Service] Invoice paid successfully. Status: ${paidInvoice.status}, Amount paid: ${paidInvoice.amount_paid / 100}`);
      } catch (payError: any) {
        console.error(`[Invoice Service] Failed to pay invoice:`, payError.message);
        // Don't throw - let the invoice remain unpaid and handle via webhook
      }
    }

    console.log(
      `[Invoice Service] ✓ Created and finalized invoice ${invoice.id} for schedule ${scheduleId}, due ${schedule.scheduled_date}`
    );

    // 10. Store invoice ID in payment schedule
    await supabase
      .from('payment_schedules')
      .update({
        stripe_invoice_id: invoice.id,
        status: 'processing',
      })
      .eq('id', scheduleId);

    return { invoice_id: invoice.id };
  } catch (error) {
    console.error('[Invoice Service] Error creating scheduled invoice:', error);
    return {
      invoice_id: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch creates invoices for all pending schedules that are due within N days
 * This function is typically called by a cron job daily to ensure all upcoming
 * payments have invoices created in advance
 *
 * @param daysAhead - Number of days ahead to create invoices (default: 30)
 * @returns Statistics about invoice creation success/failures
 */
export async function createUpcomingInvoices(daysAhead: number = 30): Promise<{
  created: number;
  failed: number;
  errors: string[];
}> {
  const supabase = createAdminClient();

  // Calculate future date boundary
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  // Get schedules due within next N days that don't have invoices yet
  const { data: schedules, error } = await supabase
    .from('payment_schedules')
    .select('id, tenant_id, scheduled_date')
    .in('status', ['pending', 'failed', 'adjusted']) // Include failed for retries and adjusted schedules
    .lte('scheduled_date', futureDate.toISOString())
    .is('stripe_invoice_id', null); // No invoice created yet

  if (error || !schedules) {
    return {
      created: 0,
      failed: 0,
      errors: [error?.message || 'Query failed'],
    };
  }

  console.log(`[Invoice Service] Found ${schedules.length} schedules needing invoices`);

  const results = {
    created: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Process each schedule
  for (const schedule of schedules) {
    // Check if schedule is due today or in the past - if so, charge immediately
    // Otherwise, Stripe will reject due_date in the past
    const scheduledDate = new Date(schedule.scheduled_date);
    const now = new Date();
    const chargeNow = scheduledDate <= now;

    if (chargeNow) {
      console.log(`[Invoice Service] Schedule ${schedule.id} is due now or overdue, charging immediately`);
    }

    const result = await createScheduledInvoice(schedule.id, schedule.tenant_id, chargeNow);

    if (result.error) {
      results.failed++;
      results.errors.push(`Schedule ${schedule.id}: ${result.error}`);
    } else {
      results.created++;
    }

    // Rate limit: Stripe allows 100 requests per second
    // Wait 20ms between requests to stay well under limit
    await new Promise(resolve => setTimeout(resolve, 20));
  }

  console.log(
    `[Invoice Service] Batch complete: ${results.created} created, ${results.failed} failed`
  );

  return results;
}
