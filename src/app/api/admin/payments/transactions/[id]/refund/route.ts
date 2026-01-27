import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getStripeClient } from '@/lib/payments/getStripeClient';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/payments/transactions/[id]/refund
 * Process a refund for a payment transaction
 *
 * Body:
 * - amount: number (optional - defaults to full refund)
 * - reason: string (required)
 * - is_full_refund: boolean
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient(); // For database updates that bypass RLS
    const { id: scheduleId } = await params;

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id, email')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { amount, reason, is_full_refund } = body;

    if (!reason) {
      return NextResponse.json(
        { error: 'Refund reason is required' },
        { status: 400 }
      );
    }

    // Get the payment schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('payment_schedules')
      .select(`
        id,
        enrollment_id,
        amount,
        currency,
        status,
        stripe_payment_intent_id,
        stripe_invoice_id,
        payment_number,
        payment_type
      `)
      .eq('id', scheduleId)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (scheduleError || !schedule) {
      console.error('Error fetching payment schedule:', scheduleError);
      return NextResponse.json(
        { error: 'Payment schedule not found' },
        { status: 404 }
      );
    }

    // Verify the payment is in a refundable state
    if (schedule.status !== 'paid') {
      return NextResponse.json(
        { error: `Cannot refund payment with status: ${schedule.status}` },
        { status: 400 }
      );
    }

    // Try to get stripe_payment_intent_id from payment_schedules or payments table
    let stripePaymentIntentId = schedule.stripe_payment_intent_id;

    console.log('[Refund] Payment Schedule Details:');
    console.log(`  - Schedule ID: ${scheduleId}`);
    console.log(`  - Enrollment ID: ${schedule.enrollment_id}`);
    console.log(`  - Amount: ${schedule.amount} ${schedule.currency}`);
    console.log(`  - Payment Number: ${schedule.payment_number}`);
    console.log(`  - Status: ${schedule.status}`);
    console.log(`  - Stripe Payment Intent ID from schedule: ${schedule.stripe_payment_intent_id || 'NULL'}`);
    console.log(`  - Stripe Invoice ID from schedule: ${schedule.stripe_invoice_id || 'NULL'}`);

    if (!stripePaymentIntentId) {
      console.log('[Refund] No payment intent ID in schedule, checking payments table...');

      // Check payments table for the payment intent ID
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('payment_schedule_id', scheduleId)
        .eq('enrollment_id', schedule.enrollment_id)
        .maybeSingle();

      console.log('[Refund] Payment record query result:');
      console.log(`  - Found: ${paymentRecord ? 'YES' : 'NO'}`);
      console.log(`  - Error: ${paymentError ? paymentError.message : 'NONE'}`);

      if (paymentRecord) {
        console.log('[Refund] Payment Record Details:');
        console.log(`  - Payment ID: ${paymentRecord.id}`);
        console.log(`  - Status: ${paymentRecord.status}`);
        console.log(`  - Stripe Payment Intent ID: ${paymentRecord.stripe_payment_intent_id || 'NULL'}`);
        console.log(`  - Stripe Invoice ID: ${paymentRecord.stripe_invoice_id || 'NULL'}`);
        console.log(`  - Stripe Customer ID: ${paymentRecord.stripe_customer_id || 'NULL'}`);

        if (paymentRecord.stripe_payment_intent_id) {
          stripePaymentIntentId = paymentRecord.stripe_payment_intent_id;
          console.log(`[Refund] ✓ Found payment intent in payments table: ${stripePaymentIntentId}`);
        } else if (paymentRecord.stripe_invoice_id) {
          // If we have an invoice ID, we can retrieve the payment intent from the invoice
          console.log(`[Refund] Found invoice ID: ${paymentRecord.stripe_invoice_id}, fetching from Stripe...`);
          try {
            const { stripe } = await getStripeClient(userData.tenant_id);
            const invoice = await stripe.invoices.retrieve(paymentRecord.stripe_invoice_id);
            console.log(`[Refund] Invoice retrieved from Stripe:`);
            console.log(`  - Invoice ID: ${invoice.id}`);
            console.log(`  - Payment Intent: ${invoice.payment_intent || 'NULL'}`);
            console.log(`  - Status: ${invoice.status}`);

            if (invoice.payment_intent) {
              stripePaymentIntentId = invoice.payment_intent as string;
              console.log(`[Refund] ✓ Retrieved payment intent from invoice: ${stripePaymentIntentId}`);
            }
          } catch (error: any) {
            console.error('[Refund] Error retrieving invoice from Stripe:', error.message);
          }
        }
      } else {
        console.log('[Refund] ❌ No payment record found in payments table');

        // Check if schedule itself has an invoice ID
        if (schedule.stripe_invoice_id) {
          console.log(`[Refund] Found invoice ID in schedule: ${schedule.stripe_invoice_id}, fetching from Stripe...`);
          try {
            const { stripe } = await getStripeClient(userData.tenant_id);
            const invoice = await stripe.invoices.retrieve(schedule.stripe_invoice_id);
            console.log(`[Refund] Invoice retrieved from Stripe:`);
            console.log(`  - Invoice ID: ${invoice.id}`);
            console.log(`  - Payment Intent: ${invoice.payment_intent || 'NULL'}`);
            console.log(`  - Status: ${invoice.status}`);

            if (invoice.payment_intent) {
              stripePaymentIntentId = invoice.payment_intent as string;
              console.log(`[Refund] ✓ Retrieved payment intent from schedule's invoice: ${stripePaymentIntentId}`);
            }
          } catch (error: any) {
            console.error('[Refund] Error retrieving invoice from Stripe:', error.message);
          }
        }
      }
    }

    if (!stripePaymentIntentId) {
      console.log('[Refund] ❌ FINAL RESULT: No payment intent found');
      return NextResponse.json(
        {
          error: 'No Stripe payment intent found for this transaction. This payment may have been processed outside of Stripe or before payment tracking was implemented. Manual refund may be required through the Stripe dashboard.',
          debug: {
            scheduleId,
            hasSchedulePaymentIntent: !!schedule.stripe_payment_intent_id,
            hasScheduleInvoice: !!schedule.stripe_invoice_id,
            paymentRecordFound: false,
          }
        },
        { status: 400 }
      );
    }

    console.log(`[Refund] ✓ Payment intent ID confirmed: ${stripePaymentIntentId}`);

    // Get enrollment data for audit log
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select(`
        id,
        user_id,
        product_id
      `)
      .eq('id', schedule.enrollment_id)
      .single();

    // Get user and product data separately
    let userName = 'Unknown';
    let productName = 'Unknown';

    if (enrollment) {
      const { data: user } = await supabase
        .from('users')
        .select('first_name, last_name, email')
        .eq('id', enrollment.user_id)
        .single();

      const { data: product } = await supabase
        .from('products')
        .select('title')
        .eq('id', enrollment.product_id)
        .single();

      if (user) {
        userName = `${user.first_name} ${user.last_name}`;
      }
      if (product) {
        productName = product.title;
      }
    }

    // Calculate refund amount
    const refundAmount = is_full_refund ? schedule.amount : amount;

    if (!refundAmount || refundAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid refund amount' },
        { status: 400 }
      );
    }

    if (refundAmount > parseFloat(schedule.amount.toString())) {
      return NextResponse.json(
        { error: 'Refund amount cannot exceed payment amount' },
        { status: 400 }
      );
    }

    console.log(`[Refund] Processing refund for schedule ${scheduleId}`);
    console.log(`[Refund] Amount: ${refundAmount} ${schedule.currency}`);
    console.log(`[Refund] Payment Intent: ${stripePaymentIntentId}`);
    console.log(`[Refund] Reason: ${reason}`);

    // Get Stripe client
    const { stripe } = await getStripeClient(userData.tenant_id);

    // Process refund in Stripe
    const stripeRefund = await stripe.refunds.create({
      payment_intent: stripePaymentIntentId,
      amount: Math.round(refundAmount * 100), // Convert to cents
      reason: reason === 'duplicate' ? 'duplicate' : reason === 'fraudulent' ? 'fraudulent' : 'requested_by_customer',
      metadata: {
        tenant_id: userData.tenant_id,
        schedule_id: scheduleId,
        enrollment_id: schedule.enrollment_id,
        refund_reason: reason,
        refunded_by: user.id,
        refunded_by_email: userData.email || 'unknown',
      },
    });

    console.log(`[Refund] ✓ Stripe refund created: ${stripeRefund.id}`);
    console.log(`[Refund] Stripe refund status: ${stripeRefund.status}`);

    // Update payment schedule status
    const isPartialRefund = refundAmount < parseFloat(schedule.amount.toString());
    const newScheduleStatus = isPartialRefund ? 'paid' : 'refunded';

    const { error: updateScheduleError } = await adminClient
      .from('payment_schedules')
      .update({
        status: newScheduleStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scheduleId);

    if (updateScheduleError) {
      console.error('[Refund] Error updating payment schedule:', updateScheduleError);
      // Don't fail silently - this is critical
      return NextResponse.json(
        { error: `Failed to update payment schedule: ${updateScheduleError.message}` },
        { status: 500 }
      );
    } else {
      console.log(`[Refund] ✓ Payment schedule updated to status: ${newScheduleStatus}`);
    }

    // Update or create payment record
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, amount, status, refunded_amount, metadata')
      .eq('payment_schedule_id', scheduleId)
      .eq('enrollment_id', schedule.enrollment_id)
      .single();

    if (existingPayment) {
      // Update existing payment record
      const totalRefunded = (existingPayment.refunded_amount || 0) + refundAmount;
      const paymentStatus = totalRefunded >= existingPayment.amount ? 'refunded' : 'partially_refunded';

      const { error: updatePaymentError } = await adminClient
        .from('payments')
        .update({
          status: paymentStatus,
          refunded_amount: totalRefunded,
          refunded_at: new Date().toISOString(),
          refund_reason: reason,
          metadata: {
            ...(existingPayment.metadata || {}),
            refund_id: stripeRefund.id,
            refund_reason: reason,
            refunded_at: new Date().toISOString(),
            refunded_by: user.id,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPayment.id);

      if (updatePaymentError) {
        console.error('[Refund] Error updating payment record:', updatePaymentError);
        // Log but don't fail - payment record is optional
      } else {
        console.log(`[Refund] ✓ Payment record updated to status: ${paymentStatus}`);
      }
    }

    // Update enrollment paid_amount
    const { data: paidSchedules } = await adminClient
      .from('payment_schedules')
      .select('amount')
      .eq('enrollment_id', schedule.enrollment_id)
      .eq('status', 'paid');

    const totalPaid = paidSchedules
      ? paidSchedules.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0)
      : 0;

    const { error: enrollmentError } = await adminClient
      .from('enrollments')
      .update({
        paid_amount: totalPaid,
        updated_at: new Date().toISOString(),
      })
      .eq('id', schedule.enrollment_id);

    if (enrollmentError) {
      console.error('[Refund] Error updating enrollment:', enrollmentError);
      // Log but don't fail - enrollment update is not critical for refund
    } else {
      console.log(`[Refund] ✓ Enrollment paid_amount updated to: ${totalPaid}`);
    }

    return NextResponse.json({
      success: true,
      refund_id: stripeRefund.id,
      amount: refundAmount,
      currency: schedule.currency,
      status: stripeRefund.status,
      message: `Refund of ${refundAmount} ${schedule.currency} processed successfully`,
    });

  } catch (error: any) {
    console.error('Error processing refund:', error);

    // Handle Stripe-specific errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to process refund' },
      { status: 500 }
    );
  }
}
