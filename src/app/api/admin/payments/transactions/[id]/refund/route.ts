import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type Stripe from 'stripe';
import { getStripeClient } from '@/lib/payments/getStripeClient';
import { refreshEnrollmentTotals } from '@/lib/payments/dueSchedules';
import { refundPayment, refundableCents, type RefundablePayment } from '@/lib/payments/refunds';
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

    const { stripe } = await getStripeClient(userData.tenant_id);

    // The payment record carries what was already refunded, so a second
    // partial refund can't go past what's left.
    const { data: paymentRow } = await adminClient
      .from('payments')
      .select('id, payment_schedule_id, stripe_payment_intent_id, amount, refunded_amount, metadata')
      .eq('tenant_id', userData.tenant_id)
      .eq('stripe_payment_intent_id', stripePaymentIntentId)
      .maybeSingle();

    const payment: RefundablePayment = paymentRow
      ? { ...(paymentRow as RefundablePayment), payment_schedule_id: paymentRow.payment_schedule_id ?? scheduleId }
      : {
          // Older payments recorded only on the schedule.
          id: `schedule-${scheduleId}`,
          payment_schedule_id: scheduleId,
          stripe_payment_intent_id: stripePaymentIntentId,
          amount: schedule.amount,
          refunded_amount: 0,
          metadata: null,
        };

    const leftCents = refundableCents(payment);
    const refundCents = is_full_refund ? leftCents : Math.round(Number(amount) * 100);

    if (!Number.isFinite(refundCents) || refundCents <= 0) {
      return NextResponse.json({ error: 'Invalid refund amount' }, { status: 400 });
    }
    if (refundCents > leftCents) {
      return NextResponse.json(
        { error: `Only ${(leftCents / 100).toFixed(2)} ${schedule.currency} is left to refund on this payment` },
        { status: 400 }
      );
    }

    let stripeRefund: Stripe.Refund;
    if (paymentRow) {
      const result = await refundPayment(adminClient, stripe, payment, refundCents, {
        tenantId: userData.tenant_id,
        enrollmentId: schedule.enrollment_id,
        reason,
        adminId: user.id,
        adminEmail: userData.email,
      });
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      stripeRefund = result.refund;
    } else {
      stripeRefund = await stripe.refunds.create(
        {
          payment_intent: stripePaymentIntentId,
          amount: refundCents,
          reason: reason === 'duplicate' ? 'duplicate' : reason === 'fraudulent' ? 'fraudulent' : 'requested_by_customer',
          metadata: {
            tenant_id: userData.tenant_id,
            schedule_id: scheduleId,
            enrollment_id: schedule.enrollment_id,
            refunded_by: user.id,
          },
        },
        { idempotencyKey: `refund:schedule:${scheduleId}:${refundCents}` },
      );
      if (refundCents >= leftCents) {
        const { error: updateScheduleError } = await adminClient
          .from('payment_schedules')
          .update({ status: 'refunded', updated_at: new Date().toISOString() })
          .eq('id', scheduleId);
        if (updateScheduleError) {
          return NextResponse.json(
            { error: `Refunded in Stripe (${stripeRefund.id}) but not saved: ${updateScheduleError.message}` },
            { status: 500 }
          );
        }
      }
    }

    const refundAmount = refundCents / 100;

    // Paid amount and status worked out again, partial refunds included.
    await refreshEnrollmentTotals(adminClient, schedule.enrollment_id);

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
