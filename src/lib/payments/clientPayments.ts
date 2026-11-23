/**
 * Payment actions a client takes from the portal, kept here with the rest of
 * the payment rules so the portal routes stay thin. Every function checks the
 * enrollment belongs to the calling user.
 */
import { createAdminClient } from '@/lib/supabase/server';
import { getStripeClient } from './getStripeClient';
import { nextChargeable, refreshEnrollmentTotals, type ScheduleRow } from './dueSchedules';
import { addPeriod, createScheduledInvoice } from './invoiceService';
import { planSubscriptionAmount } from './paymentEngine';
import { loadPriceChanges, readMemberPrice, upcomingForMember } from './subscriptionPrice';
import { closeUnpaidInvoice } from './refunds';
import { hasEnded, isPausedAt, readSubscriptionDates, shiftPastPause } from './subscriptionState';

type Fail = { ok: false; status: number; error: string };

async function ownEnrollment(userId: string, enrollmentId: string) {
  const supabase = createAdminClient();
  // '*' so the stop/pause dates are included once those columns exist.
  const { data } = await supabase.from('enrollments').select('*').eq('id', enrollmentId).maybeSingle();
  return data && data.user_id === userId ? (data as Record<string, any>) : null;
}

/**
 * "Pay now" for a payment that's due (including failed or overdue ones):
 * charges the client's saved card through the same charger the daily job
 * uses, so it can't double-charge. Only the earliest due payment can be paid;
 * future installments wait for their date.
 *
 * Returns `requires_action` with a client secret when the bank asks for 3-D
 * Secure: the screen confirms it with Stripe.js (`stripe.confirmCardPayment`),
 * then the webhook marks the payment paid. `processing` means Stripe accepted
 * the charge and the webhook will confirm it in a moment.
 */
export async function payScheduleForClient(
  userId: string,
  scheduleId: string,
): Promise<{ ok: true; status: 'paid' | 'processing' | 'requires_action'; client_secret?: string } | Fail> {
  const supabase = createAdminClient();
  const { data: schedule } = await supabase
    .from('payment_schedules')
    .select('id, enrollment_id')
    .eq('id', scheduleId)
    .maybeSingle();
  if (!schedule) return { ok: false, status: 404, error: 'Payment not found' };

  const enrollment = await ownEnrollment(userId, schedule.enrollment_id);
  if (!enrollment) return { ok: false, status: 404, error: 'Payment not found' };
  if (enrollment.is_parent) return { ok: false, status: 400, error: 'This enrollment is paid by another account' };
  if (!['active', 'suspended'].includes(enrollment.status)) {
    return { ok: false, status: 409, error: 'This enrollment is not open for payment' };
  }

  const { data: all } = await supabase.from('payment_schedules').select('*').eq('enrollment_id', enrollment.id);
  const next = nextChargeable((all ?? []) as ScheduleRow[]);
  if (!next || next.id !== scheduleId) {
    return { ok: false, status: 409, error: 'Only the earliest payment that is due can be paid now' };
  }

  const result = await createScheduledInvoice(scheduleId, enrollment.tenant_id, false);
  if (!result.invoice_id) {
    return { ok: false, status: 400, error: result.error ?? 'The payment could not be started' };
  }

  // Look at what Stripe did with the invoice's payment.
  const { stripe } = await getStripeClient(enrollment.tenant_id);
  const invoice = await stripe.invoices.retrieve(result.invoice_id, { expand: ['payment_intent'] });
  if (invoice.status === 'paid') return { ok: true, status: 'paid' };
  const intent = typeof invoice.payment_intent === 'object' ? invoice.payment_intent : null;
  if (intent?.status === 'requires_action' && intent.client_secret) {
    return { ok: true, status: 'requires_action', client_secret: intent.client_secret };
  }
  if (intent?.status === 'processing' || (!result.error && intent?.status === 'succeeded')) {
    return { ok: true, status: 'processing' };
  }
  return {
    ok: false,
    status: 402,
    error: intent?.last_payment_error?.message ?? result.error ?? 'The card was declined',
  };
}

export type SubscriptionSummary = {
  ok: true;
  amount: number;
  currency: string;
  interval: string;
  /** When the next charge happens; null when stopped or cancelled. */
  next_charge_date: string | null;
  /** The end of the period already paid for. */
  paid_through: string | null;
  /**
   * active: renews normally · past_due: a payment is owed ·
   * ending: stopped, access until `ends_at` · paused: no access until
   * `paused_until` · pause_scheduled: a pause starts at `paused_from` ·
   * cancelled: closed.
   */
  state: 'active' | 'past_due' | 'ending' | 'paused' | 'pause_scheduled' | 'cancelled';
  ends_at: string | null;
  paused_from: string | null;
  paused_until: string | null;
  /** What the client may do now. */
  can_stop: boolean;
  can_resume: boolean;
  can_pause: boolean;
  can_switch: boolean;
  /** The plan the next charge uses. */
  current_plan_id: string | null;
  /** The product's membership plans the client can choose between. */
  plans: { plan_id: string; name: string; amount: number; interval: string; current: boolean }[];
  /**
   * A scheduled price change that will reach this member: the new price and
   * the date it takes effect (from their first renewal on or after it).
   * Null when nothing changes for them.
   */
  upcoming_price: { amount: number; effective_date: string } | null;
};

/**
 * A product's active subscription plans (its default plan plus the
 * alternatives), with each plan's own price or the product price.
 */
async function subscriptionPlansFor(productId: string | null): Promise<{ plan_id: string; name: string; amount: number; interval: string }[]> {
  if (!productId) return [];
  const supabase = createAdminClient();
  const { data: product } = await supabase.from('products').select('*').eq('id', productId).maybeSingle();
  if (!product) return [];
  const ids = new Set<string>();
  if (product.default_payment_plan_id) ids.add(product.default_payment_plan_id);
  for (const id of product.alternative_payment_plan_ids ?? []) ids.add(id);
  if (typeof product.payment_plan === 'string') ids.add(product.payment_plan);
  if (ids.size === 0) return [];
  const { data: plans } = await supabase.from('payment_plans').select('*').in('id', [...ids]);
  return (plans ?? [])
    .filter((p: any) => p.plan_type === 'subscription' && p.is_active !== false)
    .map((p: any) => ({
      plan_id: p.id,
      name: p.plan_name,
      amount: planSubscriptionAmount(p) ?? Number(product.price ?? 0),
      interval: p.subscription_frequency || 'monthly',
    }));
}

/** What the portal shows for a subscription. Read-only. */
export async function getSubscriptionSummary(userId: string, enrollmentId: string): Promise<SubscriptionSummary | Fail> {
  const enrollment = await ownEnrollment(userId, enrollmentId);
  if (!enrollment) return { ok: false, status: 404, error: 'Enrollment not found' };

  const supabase = createAdminClient();
  const { data: rows } = await supabase
    .from('payment_schedules')
    .select('payment_number, amount, currency, scheduled_date, status, payment_plan_id')
    .eq('enrollment_id', enrollment.id)
    .eq('payment_type', 'subscription')
    .order('payment_number', { ascending: false });
  const latest = rows?.[0];
  if (!latest) return { ok: false, status: 404, error: 'Not a subscription' };

  // How often: the plan's setting, else the product's, else monthly
  // (the same rule the renewal job uses).
  let interval = 'monthly';
  const planId = latest.payment_plan_id ?? enrollment.payment_plan_id;
  if (planId) {
    const { data: plan } = await supabase.from('payment_plans').select('subscription_frequency').eq('id', planId).maybeSingle();
    interval = plan?.subscription_frequency || interval;
  } else if (enrollment.product_id) {
    const { data: product } = await supabase.from('products').select('payment_plan').eq('id', enrollment.product_id).maybeSingle();
    interval = (product?.payment_plan as any)?.subscription_interval || interval;
  }

  const live = (rows ?? []).filter((r) => r.status !== 'cancelled' && r.status !== 'refunded');
  const owed = live.some((r) => ['pending', 'failed', 'overdue', 'adjusted', 'processing'].includes(r.status));
  const lastPaid = live.find((r) => r.status === 'paid');
  const paidThrough = lastPaid ? addPeriod(new Date(lastPaid.scheduled_date), interval) : null;
  const dates = readSubscriptionDates(enrollment);
  const now = new Date();
  const cancelled = enrollment.status === 'cancelled' || hasEnded(dates, now);

  let state: SubscriptionSummary['state'];
  if (cancelled) state = 'cancelled';
  else if (dates.endsAt) state = 'ending';
  else if (isPausedAt(dates, now)) state = 'paused';
  else if (dates.pausedFrom && dates.pausedFrom > now) state = 'pause_scheduled';
  else if (owed) state = 'past_due';
  else state = 'active';

  const latestLive = live[0];
  let nextCharge: Date | null = null;
  if (!cancelled && !dates.endsAt) {
    // An unpaid period is charged now; otherwise the next one starts when
    // the paid one ends, or when a pause ends.
    nextCharge = latestLive && latestLive.status !== 'paid' ? new Date(latestLive.scheduled_date) : paidThrough;
    if (nextCharge) nextCharge = shiftPastPause(nextCharge, dates);
  }
  const pauseActiveOrComing = !!(dates.pausedUntil && dates.pausedUntil > now);

  // The next charge uses the plan the client is on now (after a switch, the
  // new plan's price), and that plan's frequency.
  const currentPlanId: string | null = enrollment.payment_plan_id ?? latest.payment_plan_id ?? null;
  const productPlans = await subscriptionPlansFor(enrollment.product_id);
  const currentPlan = productPlans.find((p) => p.plan_id === currentPlanId);
  // The member's own price (a change for new members only never reaches
  // them); after a plan switch, the new plan's price.
  const memberPrice = readMemberPrice((enrollment as any).subscription_price, currentPlanId);
  const samePlan = (latest.payment_plan_id ?? null) === currentPlanId;
  const nextAmount = memberPrice?.amount ?? (samePlan ? Number(latest.amount) : currentPlan?.amount ?? Number(latest.amount));

  // A scheduled change for everyone that hasn't reached them yet.
  const { data: planRow } = currentPlanId
    ? await supabase.from('payment_plans').select('subscription_amount').eq('id', currentPlanId).maybeSingle()
    : { data: null };
  const upcoming = cancelled || dates.endsAt
    ? null
    : upcomingForMember(
        memberPrice ?? { amount: nextAmount, plan_id: currentPlanId, set_at: String(latest.scheduled_date).slice(0, 10) },
        await loadPriceChanges(supabase, [enrollment.product_id]),
        currentPlanId,
        planSubscriptionAmount(planRow) !== null,
      );

  return {
    ok: true,
    amount: nextAmount,
    currency: String(latest.currency || enrollment.currency || 'USD').toUpperCase(),
    interval,
    next_charge_date: nextCharge?.toISOString() ?? null,
    paid_through: paidThrough?.toISOString() ?? null,
    state,
    ends_at: dates.endsAt?.toISOString() ?? null,
    paused_from: dates.pausedFrom?.toISOString() ?? null,
    paused_until: dates.pausedUntil?.toISOString() ?? null,
    can_stop: !cancelled && !dates.endsAt,
    can_resume: !cancelled && (!!dates.endsAt || pauseActiveOrComing),
    can_pause: state === 'active' && !!paidThrough && paidThrough > now,
    can_switch: (state === 'active' || state === 'pause_scheduled') && productPlans.length > 1,
    current_plan_id: currentPlanId,
    plans: productPlans.map((p) => ({ ...p, current: p.plan_id === currentPlanId })),
    upcoming_price: upcoming ? { amount: Number(upcoming.new_amount), effective_date: upcoming.effective_date } : null,
  };
}

/**
 * Client actions on their membership.
 *
 * - stop: no more charges; access stays until the end of the paid period
 *   (`ends_at`), then the enrollment closes by itself. Unpaid periods after
 *   that date are cancelled and their Stripe invoices voided.
 * - resume: undoes a stop before its date, or ends/cancels a pause (billing
 *   restarts when the pause would have ended, or now if it's already running).
 * - pause_month: the next month isn't charged and has no access; billing
 *   resumes by itself after it. Only when nothing is owed.
 *
 * Needs the 20261122_subscription_stop_pause.sql columns; without them it
 * answers 503 instead of failing halfway.
 */
export async function changeSubscription(
  userId: string,
  enrollmentId: string,
  action: 'stop' | 'resume' | 'pause_month' | 'switch_plan',
  /** For switch_plan: one of `summary.plans`. */
  planId?: string,
): Promise<SubscriptionSummary | Fail> {
  const summary = await getSubscriptionSummary(userId, enrollmentId);
  if (!summary.ok) return summary;
  const enrollment = (await ownEnrollment(userId, enrollmentId))!;
  if (!('subscription_ends_at' in enrollment)) {
    return { ok: false, status: 503, error: 'Membership changes are not switched on yet' };
  }
  const supabase = createAdminClient();
  const now = new Date();

  if (action === 'stop') {
    if (!summary.can_stop) return { ok: false, status: 409, error: 'This membership is already stopped' };
    const endsAt = summary.paid_through && new Date(summary.paid_through) > now ? new Date(summary.paid_through) : now;

    // Nothing more is collected: unpaid periods are cancelled and their
    // invoices voided. Refused while a charge is underway.
    const { data: unpaid } = await supabase
      .from('payment_schedules')
      .select('id, status, stripe_invoice_id, stripe_payment_intent_id')
      .eq('enrollment_id', enrollmentId)
      .in('status', ['pending', 'failed', 'overdue', 'adjusted', 'processing']);
    if ((unpaid ?? []).some((s) => s.status === 'processing')) {
      return { ok: false, status: 409, error: 'A payment is being processed right now. Please try again in a few minutes.' };
    }
    const { stripe } = await getStripeClient(enrollment.tenant_id);
    for (const s of unpaid ?? []) {
      if (s.stripe_invoice_id) {
        const closed = await closeUnpaidInvoice(stripe, s.stripe_invoice_id);
        if (closed === 'paid') {
          return { ok: false, status: 409, error: 'A payment just went through. Please refresh and try again.' };
        }
        if (typeof closed === 'object') return { ok: false, status: 502, error: closed.error };
      } else if (s.stripe_payment_intent_id) {
        await stripe.paymentIntents.cancel(s.stripe_payment_intent_id).catch(() => null);
      }
    }
    if ((unpaid ?? []).length) {
      const { error } = await supabase
        .from('payment_schedules')
        .update({ status: 'cancelled', adjustment_reason: 'Membership stopped by the client', updated_at: now.toISOString() })
        .in('id', (unpaid ?? []).map((s) => s.id));
      if (error) return { ok: false, status: 500, error: error.message };
    }
    const { error } = await supabase
      .from('enrollments')
      .update({
        subscription_ends_at: endsAt.toISOString(),
        subscription_paused_from: null,
        subscription_paused_until: null,
        updated_at: now.toISOString(),
      })
      .eq('id', enrollmentId);
    if (error) return { ok: false, status: 500, error: error.message };
    await refreshEnrollmentTotals(supabase, enrollmentId);
  }

  if (action === 'resume') {
    if (!summary.can_resume) return { ok: false, status: 409, error: 'There is nothing to resume' };
    const dates = readSubscriptionDates(enrollment);
    const update: Record<string, string | null> = { updated_at: now.toISOString() };
    if (dates.endsAt) {
      // Billing carries on from the end of the paid period.
      update.subscription_ends_at = null;
    } else if (isPausedAt(dates, now)) {
      // Pause cut short: billing restarts now.
      update.subscription_paused_until = now.toISOString();
    } else {
      update.subscription_paused_from = null;
      update.subscription_paused_until = null;
    }
    const { error } = await supabase.from('enrollments').update(update).eq('id', enrollmentId);
    if (error) return { ok: false, status: 500, error: error.message };
  }

  if (action === 'pause_month') {
    if (!summary.can_pause || !summary.paid_through) {
      return { ok: false, status: 409, error: 'A pause is only possible on a paid-up membership with no pause already set' };
    }
    const pausedFrom = new Date(summary.paid_through);
    const pausedUntil = addPeriod(pausedFrom, 'monthly');
    // A charge already created for the paused month is called off.
    const { data: inWindow } = await supabase
      .from('payment_schedules')
      .select('id, status, stripe_invoice_id')
      .eq('enrollment_id', enrollmentId)
      .in('status', ['pending', 'adjusted'])
      .gte('scheduled_date', pausedFrom.toISOString())
      .lt('scheduled_date', pausedUntil.toISOString());
    if ((inWindow ?? []).length) {
      const { stripe } = await getStripeClient(enrollment.tenant_id);
      for (const s of inWindow ?? []) {
        if (s.stripe_invoice_id) await closeUnpaidInvoice(stripe, s.stripe_invoice_id);
      }
      await supabase
        .from('payment_schedules')
        .update({ status: 'cancelled', adjustment_reason: 'Membership paused by the client', updated_at: now.toISOString() })
        .in('id', (inWindow ?? []).map((s) => s.id));
    }
    const { error } = await supabase
      .from('enrollments')
      .update({
        subscription_paused_from: pausedFrom.toISOString(),
        subscription_paused_until: pausedUntil.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', enrollmentId);
    if (error) return { ok: false, status: 500, error: error.message };
  }

  if (action === 'switch_plan') {
    // Monthly ⇄ yearly: the period already paid runs to its end on the old
    // plan; from the next charge the new plan's price and frequency apply.
    if (!summary.can_switch) {
      return { ok: false, status: 409, error: 'The plan can be changed only on a paid-up membership that has another plan' };
    }
    const target = summary.plans.find((p) => p.plan_id === planId);
    if (!target) return { ok: false, status: 400, error: 'Choose one of the plans offered for this membership' };
    if (target.current) return { ok: false, status: 409, error: 'You are already on this plan' };
    const { error } = await supabase
      .from('enrollments')
      .update({ payment_plan_id: target.plan_id, updated_at: now.toISOString() })
      .eq('id', enrollmentId);
    if (error) return { ok: false, status: 500, error: error.message };
  }

  return getSubscriptionSummary(userId, enrollmentId);
}
