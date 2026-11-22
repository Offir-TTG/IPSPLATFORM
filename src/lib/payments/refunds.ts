import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Refunds and invoice voiding shared by the admin cancel and refund actions,
 * so both use the tenant's own Stripe account, never refund more than was
 * paid, and can't refund twice on a double click.
 */

export type RefundablePayment = {
  id: string;
  payment_schedule_id: string | null;
  stripe_payment_intent_id: string;
  amount: number | string;
  refunded_amount: number | string | null;
  metadata: Record<string, unknown> | null;
};

const toCents = (value: number | string | null | undefined) => Math.round(Number(value ?? 0) * 100);

/** What can still be refunded on one payment, in cents. */
export function refundableCents(payment: Pick<RefundablePayment, 'amount' | 'refunded_amount'>): number {
  return Math.max(0, toCents(payment.amount) - toCents(payment.refunded_amount));
}

function stripeReason(reason: string): Stripe.RefundCreateParams.Reason {
  return reason === 'duplicate' ? 'duplicate' : reason === 'fraudulent' ? 'fraudulent' : 'requested_by_customer';
}

/**
 * Refunds part or all of one payment in Stripe, then records it on the payment
 * and, once fully refunded, on its schedule. The idempotency key is built from
 * what was already refunded, so a repeated click returns the same refund
 * instead of creating a second one.
 */
export async function refundPayment(
  supabase: SupabaseClient,
  stripe: Stripe,
  payment: RefundablePayment,
  cents: number,
  info: { tenantId: string; enrollmentId: string; reason: string; adminId: string; adminEmail?: string | null },
): Promise<{ ok: true; refund: Stripe.Refund; fullyRefunded: boolean } | { ok: false; error: string }> {
  const remaining = refundableCents(payment);
  if (cents <= 0 || cents > remaining) {
    return { ok: false, error: 'Refund amount is more than what is left to refund on this payment' };
  }
  const alreadyRefunded = toCents(payment.refunded_amount);

  let refund: Stripe.Refund;
  try {
    refund = await stripe.refunds.create(
      {
        payment_intent: payment.stripe_payment_intent_id,
        amount: cents,
        reason: stripeReason(info.reason),
        metadata: {
          tenant_id: info.tenantId,
          enrollment_id: info.enrollmentId,
          payment_id: payment.id,
          schedule_id: payment.payment_schedule_id ?? '',
          refund_reason: info.reason.slice(0, 450),
          refunded_by: info.adminId,
          refunded_by_email: info.adminEmail ?? '',
        },
      },
      { idempotencyKey: `refund:${payment.id}:${alreadyRefunded}:${cents}` },
    );
  } catch (error: any) {
    return { ok: false, error: error?.message ?? 'Stripe refused the refund' };
  }

  const totalRefunded = (alreadyRefunded + cents) / 100;
  const fullyRefunded = alreadyRefunded + cents >= toCents(payment.amount);
  const now = new Date().toISOString();

  const { error: paymentError } = await supabase
    .from('payments')
    .update({
      status: fullyRefunded ? 'refunded' : 'partially_refunded',
      refunded_amount: totalRefunded,
      refunded_at: now,
      refund_reason: info.reason,
      metadata: {
        ...(payment.metadata ?? {}),
        refund_id: refund.id,
        refund_reason: info.reason,
        refunded_at: now,
        refunded_by: info.adminId,
      },
    })
    .eq('id', payment.id);
  if (paymentError) {
    return { ok: false, error: `Refunded in Stripe (${refund.id}) but not saved: ${paymentError.message}` };
  }

  if (fullyRefunded && payment.payment_schedule_id) {
    const { error: scheduleError } = await supabase
      .from('payment_schedules')
      .update({ status: 'refunded', updated_at: now })
      .eq('id', payment.payment_schedule_id);
    if (scheduleError) {
      return { ok: false, error: `Refunded in Stripe (${refund.id}) but not saved: ${scheduleError.message}` };
    }
  }

  // Keep the local copy in step for callers refunding several times in a row.
  payment.refunded_amount = totalRefunded;
  return { ok: true, refund, fullyRefunded };
}

/** The enrollment's payments that can still be refunded, newest first. */
export async function loadRefundablePayments(
  supabase: SupabaseClient,
  tenantId: string,
  enrollmentId: string,
): Promise<{ ok: true; payments: RefundablePayment[] } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from('payments')
    .select('id, payment_schedule_id, stripe_payment_intent_id, amount, refunded_amount, metadata, paid_at, created_at')
    .eq('tenant_id', tenantId)
    .eq('enrollment_id', enrollmentId)
    .in('status', ['paid', 'partially_refunded'])
    .not('stripe_payment_intent_id', 'is', null)
    .order('created_at', { ascending: false });
  if (error) return { ok: false, error: error.message };
  const payments = (data ?? []).filter((p) => refundableCents(p as RefundablePayment) > 0) as RefundablePayment[];
  return { ok: true, payments };
}

/**
 * Makes an unpaid Stripe invoice unpayable: open invoices are voided, drafts
 * deleted. Returns 'paid' when the client already paid it, so the caller
 * doesn't cancel a payment that went through.
 */
export async function closeUnpaidInvoice(
  stripe: Stripe,
  invoiceId: string,
): Promise<'closed' | 'paid' | 'already_closed' | { error: string }> {
  try {
    const invoice = await stripe.invoices.retrieve(invoiceId);
    if (invoice.status === 'paid') return 'paid';
    if (invoice.status === 'open') {
      await stripe.invoices.voidInvoice(invoiceId);
      return 'closed';
    }
    if (invoice.status === 'draft') {
      await stripe.invoices.del(invoiceId);
      return 'closed';
    }
    return 'already_closed';
  } catch (error: any) {
    if (error?.code === 'resource_missing') return 'already_closed';
    return { error: error?.message ?? 'Could not close the invoice' };
  }
}
