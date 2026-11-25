import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import { readSubscriptionDates, shiftPastPause } from './subscriptionState';

/**
 * One set of rules for "what does this enrollment owe right now", shared by
 * the pay page, the charge routes and enrollment completion, so they can't
 * disagree about whether someone has paid.
 */

export type ScheduleRow = {
  id: string;
  tenant_id: string;
  enrollment_id: string;
  payment_number: number;
  payment_type: string;
  amount: number | string;
  currency?: string | null;
  scheduled_date: string;
  status: string;
  stripe_payment_intent_id?: string | null;
  stripe_invoice_id?: string | null;
};

/** Schedules that still need paying and can be charged now. */
const CHARGEABLE = new Set(['pending', 'failed', 'overdue', 'adjusted']);
/** A charge is underway; charging again could double-charge. */
const IN_FLIGHT = new Set(['processing']);
/** Nothing is owed: done, called off, or paused by an admin. */
const SETTLED = new Set(['paid', 'cancelled', 'refunded', 'paused']);

/**
 * A schedule created for "now" is stamped with the server's clock when the
 * enrollment was set up, so it's already in the past by the time the client
 * pays. The margin covers clock and timezone differences, without letting
 * next month's installment count as due.
 */
const DUE_MARGIN_MS = 60 * 60 * 1000;

export function isDue(schedule: Pick<ScheduleRow, 'scheduled_date'>, now = new Date()): boolean {
  return new Date(schedule.scheduled_date).getTime() <= now.getTime() + DUE_MARGIN_MS;
}

export function isOwed(schedule: Pick<ScheduleRow, 'status'>): boolean {
  return !SETTLED.has(schedule.status);
}

/** Due and not yet paid, including charges still processing. */
export function dueUnpaid<T extends ScheduleRow>(schedules: T[], now = new Date()): T[] {
  return schedules
    .filter((s) => isDue(s, now) && isOwed(s))
    .sort((a, b) => a.payment_number - b.payment_number);
}

/** The one schedule the client may pay now: the earliest that's due. */
export function nextChargeable<T extends ScheduleRow>(schedules: T[], now = new Date()): T | null {
  const owed = dueUnpaid(schedules, now);
  if (owed.length === 0) return null;
  // Pay in order: never jump past an earlier payment that's still processing.
  const first = owed[0];
  return CHARGEABLE.has(first.status) ? first : null;
}

export function hasInFlightCharge(schedules: ScheduleRow[]): boolean {
  return schedules.some((s) => IN_FLIGHT.has(s.status));
}

/** Money already taken or being taken, so the plan can't be swapped. */
export function hasPaymentStarted(schedules: ScheduleRow[]): boolean {
  return schedules.some((s) => s.status === 'paid' || IN_FLIGHT.has(s.status));
}

/**
 * Records a payment Stripe has confirmed: the payment row (once per payment
 * intent) and the schedule marked paid. Errors are returned, never swallowed.
 */
export async function recordSchedulePaid(
  supabase: SupabaseClient,
  schedule: ScheduleRow,
  paymentIntent: Stripe.PaymentIntent,
  extra: { productId?: string | null; source: string },
): Promise<{ ok: true; paymentId: string } | { ok: false; error: string }> {
  const { data: existing, error: findError } = await supabase
    .from('payments')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .maybeSingle();
  if (findError) return { ok: false, error: findError.message };

  let paymentId = existing?.id as string | undefined;
  if (!paymentId) {
    const { data: inserted, error: insertError } = await supabase
      .from('payments')
      .insert({
        tenant_id: schedule.tenant_id,
        enrollment_id: schedule.enrollment_id,
        payment_schedule_id: schedule.id,
        product_id: extra.productId ?? null,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_invoice_id: (paymentIntent.invoice as string | null) ?? null,
        stripe_customer_id: (paymentIntent.customer as string | null) ?? null,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        payment_type: schedule.payment_type,
        status: 'paid',
        installment_number: schedule.payment_number,
        paid_at: new Date().toISOString(),
        metadata: {
          schedule_id: schedule.id,
          stripe_payment_method: paymentIntent.payment_method,
          charge_id: paymentIntent.latest_charge,
          recorded_by: extra.source,
        },
      })
      .select('id')
      .single();
    if (insertError || !inserted) {
      // The webhook may have recorded it a moment earlier.
      const { data: again } = await supabase
        .from('payments')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntent.id)
        .maybeSingle();
      if (!again) return { ok: false, error: insertError?.message ?? 'Payment not saved' };
      paymentId = again.id as string;
    } else {
      paymentId = inserted.id as string;
    }
  }

  const { error: scheduleError } = await supabase
    .from('payment_schedules')
    .update({
      status: 'paid',
      paid_date: new Date().toISOString(),
      payment_id: paymentId,
      stripe_payment_intent_id: paymentIntent.id,
      last_error: null,
    })
    .eq('id', schedule.id);
  if (scheduleError) return { ok: false, error: scheduleError.message };

  return { ok: true, paymentId };
}

/** A schedule in one of these states is never changed by a later "failed" message. */
const FINAL = ['paid', 'refunded', 'cancelled'];

/**
 * Records a scheduled charge whose Stripe invoice is paid: one payment row per
 * invoice (the amount Stripe actually collected) and the schedule marked
 * paid, then the enrollment totals. The webhook, the charge itself, coaching
 * session charges and the catch-up check all use this, so they agree and a
 * repeat (or the webhook arriving after the charge recorded it) adds nothing.
 * A receipt invoice (paid out of band) or an invoice without our schedule is
 * skipped.
 */
export async function recordInvoicePaid(
  supabase: SupabaseClient,
  invoice: Stripe.Invoice,
  source: string,
): Promise<{ ok: true; paymentId: string | null; recorded: boolean; skipped?: string } | { ok: false; error: string }> {
  const scheduleId = invoice.metadata?.schedule_id;
  const tenantId = invoice.metadata?.tenant_id;
  if (!scheduleId || !tenantId) return { ok: true, paymentId: null, recorded: false, skipped: 'not one of our scheduled charges' };
  if ((invoice as any).paid_out_of_band) return { ok: true, paymentId: null, recorded: false, skipped: 'receipt invoice' };
  if (invoice.status !== 'paid') return { ok: false, error: `Invoice ${invoice.id} is ${invoice.status}, not paid` };

  const { data: schedule, error: readError } = await supabase
    .from('payment_schedules')
    .select('id, tenant_id, enrollment_id, amount, payment_number, payment_type, payment_plan_id, status, payment_id')
    .eq('id', scheduleId)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (readError) return { ok: false, error: readError.message };
  if (!schedule) return { ok: false, error: `Schedule ${scheduleId} not found` };

  const intentId = typeof invoice.payment_intent === 'string' ? invoice.payment_intent : (invoice.payment_intent as any)?.id ?? null;
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as any)?.id ?? null;
  const paidAt = invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() : new Date().toISOString();

  const { data: existing, error: findError } = await supabase.from('payments').select('id').eq('stripe_invoice_id', invoice.id).maybeSingle();
  if (findError) return { ok: false, error: findError.message };
  let paymentId = (existing?.id as string | undefined) ?? null;
  let recorded = false;
  if (!paymentId) {
    const { data: enrollment } = await supabase.from('enrollments').select('product_id').eq('id', schedule.enrollment_id).maybeSingle();
    const { data: inserted, error: insertError } = await supabase
      .from('payments')
      .insert({
        tenant_id: tenantId,
        enrollment_id: schedule.enrollment_id,
        payment_schedule_id: schedule.id,
        product_id: enrollment?.product_id ?? null,
        payment_plan_id: schedule.payment_plan_id ?? null,
        // What Stripe actually collected, not what the schedule expected.
        amount: invoice.amount_paid / 100,
        currency: String(invoice.currency).toUpperCase(),
        payment_type: schedule.payment_type,
        installment_number: schedule.payment_number,
        stripe_payment_intent_id: intentId,
        stripe_invoice_id: invoice.id,
        stripe_customer_id: customerId,
        status: 'paid',
        paid_at: paidAt,
        metadata: { schedule_id: schedule.id, payment_number: schedule.payment_number, payment_type: schedule.payment_type, recorded_by: source },
      })
      .select('id')
      .single();
    if (insertError || !inserted) {
      // Recorded a moment earlier by another path (the unique index stops a second row).
      const { data: again } = await supabase.from('payments').select('id').eq('stripe_invoice_id', invoice.id).maybeSingle();
      if (!again) return { ok: false, error: insertError?.message ?? 'Payment not saved' };
      paymentId = again.id as string;
    } else {
      paymentId = inserted.id as string;
      recorded = true;
    }
  }

  // A refunded schedule stays refunded; anything else is paid (money was taken).
  if (schedule.status !== 'refunded' && (schedule.status !== 'paid' || schedule.payment_id !== paymentId)) {
    const { error: scheduleError } = await supabase
      .from('payment_schedules')
      .update({
        status: 'paid',
        paid_date: paidAt,
        stripe_invoice_id: invoice.id,
        payment_id: paymentId,
        retry_count: 0,
        next_retry_date: null,
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', schedule.id)
      .neq('status', 'refunded');
    if (scheduleError) return { ok: false, error: scheduleError.message };
  }

  const totals = await refreshEnrollmentTotals(supabase, schedule.enrollment_id);
  if (!totals.ok) return { ok: false, error: totals.error ?? 'Totals not updated' };
  return { ok: true, paymentId, recorded };
}

/**
 * A charge that failed: the schedule becomes "failed" with the next retry
 * (after 1, 3, then 7 days; none after the last). A schedule that is already
 * paid, refunded or cancelled is left alone, so a late "failed" message can
 * never undo a payment. Returns what was set, or null when nothing changed.
 */
export async function recordChargeFailed(
  supabase: SupabaseClient,
  scheduleId: string,
  tenantId: string,
  reason: string,
  /** Only change a schedule in these states (e.g. "processing", so one failure is counted once). */
  onlyFrom?: string[],
): Promise<{ retryCount: number; nextRetryDate: string | null } | null> {
  const { data: schedule } = await supabase.from('payment_schedules').select('retry_count, status').eq('id', scheduleId).eq('tenant_id', tenantId).maybeSingle();
  if (!schedule || FINAL.includes(schedule.status)) return null;
  if (onlyFrom && !onlyFrom.includes(schedule.status)) return null;
  const retryCount = (Number(schedule.retry_count) || 0) + 1;
  const days = [1, 3, 7][retryCount - 1];
  const nextRetryDate = days ? new Date(Date.now() + days * 86_400_000).toISOString() : null;
  const { data, error } = await supabase
    .from('payment_schedules')
    .update({ status: 'failed', retry_count: retryCount, next_retry_date: nextRetryDate, last_error: reason, updated_at: new Date().toISOString() })
    .eq('id', scheduleId)
    .eq('tenant_id', tenantId)
    .eq('status', schedule.status)
    .select('id');
  if (error) throw new Error(`Schedule ${scheduleId} not marked failed: ${error.message}`);
  return data && data.length ? { retryCount, nextRetryDate } : null;
}

/**
 * Sets the enrollment's paid amount and payment status from its schedules,
 * so a repeated or out-of-order update can never add the same payment twice.
 */
export async function refreshEnrollmentTotals(
  supabase: SupabaseClient,
  enrollmentId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data: schedules, error } = await supabase
    .from('payment_schedules')
    .select('amount, status, scheduled_date, payment_type, payment_plan_id')
    .eq('enrollment_id', enrollmentId);
  if (error) return { ok: false, error: error.message };
  // '*' so the membership dates are read once their columns exist.
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('id', enrollmentId)
    .maybeSingle();
  // The overdue job suspends with payment_status "overdue" (there is no
  // separate reason column); that's how a payment suspension is told apart
  // from one an admin made for another reason.
  const suspendedForPayment = enrollment?.status === 'suspended' && enrollment?.payment_status === 'overdue';

  // A partly refunded payment keeps its schedule "paid"; the refunded part
  // comes off the paid amount. Fully refunded schedules are left out below.
  const { data: partlyRefunded, error: refundsError } = await supabase
    .from('payments')
    .select('refunded_amount')
    .eq('enrollment_id', enrollmentId)
    .eq('status', 'partially_refunded')
    .not('payment_schedule_id', 'is', null);
  if (refundsError) return { ok: false, error: refundsError.message };
  const refunded = (partlyRefunded ?? []).reduce((sum, p) => sum + Number(p.refunded_amount ?? 0), 0);

  const rows = schedules ?? [];
  const live = rows.filter((s) => s.status !== 'cancelled' && s.status !== 'refunded');
  const paid = live
    .filter((s) => s.status === 'paid')
    .reduce((sum, s) => sum + Number(s.amount), 0);
  const paidAmount = Math.max(0, Math.round((paid - refunded) * 100) / 100);
  const allPaid = live.length > 0 && live.every((s) => s.status === 'paid');
  const anyRefunded = refunded > 0 || rows.some((s) => s.status === 'refunded');
  // A cancelled enrollment stays cancelled (or refunded, once nothing paid is left).
  // Suspended for a late payment and nothing due is unpaid any more: the
  // client gets access back. Suspensions for any other reason stay.
  const stillOwing = rows.some((s) => isDue(s as any) && isOwed(s as any));
  const restoreAccess = suspendedForPayment && !stillOwing;

  const paymentStatus =
    enrollment?.status === 'cancelled'
      ? paidAmount <= 0 && anyRefunded ? 'refunded' : 'cancelled'
      : suspendedForPayment && !restoreAccess
        ? 'overdue'
        : allPaid ? 'paid' : paidAmount > 0 ? 'partial' : 'pending';

  const nextPaymentDate = await nextPaymentDateOf(supabase, rows, enrollment);

  const { error: updateError } = await supabase
    .from('enrollments')
    .update({
      paid_amount: paidAmount,
      payment_status: paymentStatus,
      next_payment_date: nextPaymentDate,
      updated_at: new Date().toISOString(),
      ...(restoreAccess ? { status: 'active' } : {}),
    })
    .eq('id', enrollmentId);
  return updateError ? { ok: false, error: updateError.message } : { ok: true };
}

/**
 * Checks everything due is paid. When a schedule isn't marked paid yet but a
 * Stripe charge exists, asks Stripe directly, so a late webhook can't block a
 * client who has paid.
 */
export async function verifyDuePaid(
  supabase: SupabaseClient,
  stripe: Stripe | null,
  enrollmentId: string,
  productId: string | null,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const { data, error } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('enrollment_id', enrollmentId);
  if (error) return { ok: false, status: 500, error: 'Could not check payments' };

  const schedules = (data ?? []) as ScheduleRow[];
  if (schedules.length === 0) {
    return { ok: false, status: 503, error: 'Payment schedules not yet created. Please try again in a moment.' };
  }

  for (const schedule of dueUnpaid(schedules)) {
    if (!schedule.stripe_payment_intent_id || !stripe) {
      return { ok: false, status: 400, error: 'Payment required but not completed' };
    }
    const intent = await stripe.paymentIntents.retrieve(schedule.stripe_payment_intent_id);
    if (intent.status === 'processing') {
      return { ok: false, status: 409, error: 'Your payment is still being processed. Please try again in a few minutes.' };
    }
    if (intent.status !== 'succeeded') {
      return { ok: false, status: 400, error: 'Payment required but not completed' };
    }
    const recorded = await recordSchedulePaid(supabase, schedule, intent, {
      productId,
      source: 'enrollment-complete',
    });
    if (!recorded.ok) return { ok: false, status: 500, error: 'Payment received but not saved. Please contact us.' };
  }

  const totals = await refreshEnrollmentTotals(supabase, enrollmentId);
  if (!totals.ok) return { ok: false, status: 500, error: 'Could not update the enrollment' };
  return { ok: true };
}

/** The next charge after `date`: the same rule as the renewal job's addPeriod (copied to avoid a circular import). */
function addPeriodLocal(date: Date, frequency: string): Date {
  const next = new Date(date);
  if (frequency === 'weekly') {
    next.setDate(next.getDate() + 7);
    return next;
  }
  const months = frequency === 'annually' ? 12 : frequency === 'quarterly' ? 3 : 1;
  const day = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
}

/**
 * enrollments.next_payment_date, kept in step with the schedules: the earliest
 * payment still owed; for a running membership with everything paid, the
 * next renewal (the last paid period + its frequency, as the renewal job
 * adds it); otherwise none.
 */
async function nextPaymentDateOf(
  supabase: SupabaseClient,
  rows: Array<{ status: string; scheduled_date: string; payment_type?: string | null; payment_plan_id?: string | null }>,
  enrollment: Record<string, any> | null,
): Promise<string | null> {
  if (!enrollment || enrollment.status === 'cancelled' || enrollment.status === 'completed') return null;
  const owed = rows
    .filter((s) => s.status !== 'cancelled' && s.status !== 'refunded' && isOwed(s as any))
    .map((s) => s.scheduled_date)
    .sort();
  if (owed.length) return owed[0];

  const paidPeriods = rows.filter((s) => s.payment_type === 'subscription' && s.status === 'paid').sort((a, b) => (a.scheduled_date < b.scheduled_date ? -1 : 1));
  const last = paidPeriods[paidPeriods.length - 1];
  if (!last) return null;
  const dates = readSubscriptionDates(enrollment);
  if (dates.endsAt) return null;
  const planId = enrollment.payment_plan_id ?? last.payment_plan_id ?? null;
  let frequency = 'monthly';
  if (planId) {
    const { data: plan } = await supabase.from('payment_plans').select('subscription_frequency').eq('id', planId).maybeSingle();
    frequency = plan?.subscription_frequency || frequency;
  }
  return shiftPastPause(addPeriodLocal(new Date(last.scheduled_date), frequency), dates).toISOString();
}
