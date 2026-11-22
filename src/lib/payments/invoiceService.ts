/**
 * Invoice Service
 *
 * Charges payment schedules to the client's saved card through a Stripe
 * invoice, which also serves as the receipt. A schedule is charged on its due
 * date (or earlier when an admin presses "Charge now"); nothing is emailed for
 * the client to pay by hand.
 *
 * The webhook is the source of truth for the outcome: `invoice.payment_succeeded`
 * marks the schedule paid, `invoice.payment_failed` marks it failed and sets the
 * next retry date.
 */

import type Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { getStripeClient } from './getStripeClient';
import { isDue, recordSchedulePaid, refreshEnrollmentTotals, type ScheduleRow } from './dueSchedules';
import { PAYMENT_CONFIG } from './config';
import { fetchAllPages, loadEnrollmentsById, runInBatches } from './batch';
import { readSubscriptionDates, shiftPastPause } from './subscriptionState';
import { planSubscriptionAmount } from './paymentEngine';

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

/** A schedule marked "processing" more recently than this is still being charged. */
const UNDERWAY_MS = 15 * 60 * 1000;

/** Most payments one run looks at; the rest wait for the next hourly run. */
const CHARGES_PER_RUN = 300;

/** Charging these would be wrong: already settled or deliberately held. */
const NOT_CHARGEABLE = new Set(['paid', 'cancelled', 'refunded', 'paused']);

/** Enrollments whose payments are collected. Not draft/pending (wizard not
 *  finished) or cancelled/completed. Suspended ones are still owed. */
const COLLECTING = ['active', 'suspended'];

/**
 * Records a failure that happened before Stripe could try the card (no card,
 * no customer), so the retry cron spaces attempts out instead of looping.
 */
async function markFailedBeforeCharge(
  supabase: SupabaseAdmin,
  scheduleId: string,
  retryCount: number,
  reason: string,
) {
  const next = retryCount + 1;
  const days = PAYMENT_CONFIG.retryIntervals[next - 1];
  const nextRetry =
    next <= PAYMENT_CONFIG.maxRetries && days
      ? new Date(Date.now() + days * 86400000).toISOString()
      : null;
  await supabase
    .from('payment_schedules')
    .update({
      status: 'failed',
      retry_count: next,
      next_retry_date: nextRetry,
      last_error: reason,
    })
    .eq('id', scheduleId);
}

async function resolvePaymentMethod(
  stripe: Stripe,
  customerId: string,
  preferred?: string,
): Promise<string | undefined> {
  if (preferred) return preferred;
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return undefined;
  const fromSettings = customer.invoice_settings?.default_payment_method;
  if (fromSettings) return typeof fromSettings === 'string' ? fromSettings : fromSettings.id;
  const methods = await stripe.paymentMethods.list({ customer: customerId, limit: 1 });
  return methods.data[0]?.id;
}

/**
 * Charges one payment schedule to the saved card.
 *
 * @param chargeNow - true lets an admin charge before the due date; otherwise
 *   a schedule that isn't due yet is left alone.
 * @param paymentMethodId - card to use; defaults to the customer's default card.
 */
export async function createScheduledInvoice(
  scheduleId: string,
  tenantId: string,
  chargeNow: boolean = false,
  paymentMethodId?: string
): Promise<{ invoice_id: string; error?: string }> {
  const supabase = createAdminClient();
  // Set once this call has taken the schedule, so an unexpected error before
  // Stripe is asked to charge can put the status back.
  let claimedFrom: string | null = null;
  let chargeAttempted = false;
  try {
    const { stripe } = await getStripeClient(tenantId);

    const { data: schedule, error: scheduleError } = await supabase
      .from('payment_schedules')
      .select('id, tenant_id, amount, currency, scheduled_date, payment_type, payment_number, enrollment_id, status, stripe_invoice_id, stripe_payment_intent_id, retry_count, updated_at')
      .eq('id', scheduleId)
      .eq('tenant_id', tenantId)
      .single();
    if (scheduleError || !schedule) {
      return { invoice_id: '', error: 'Schedule not found' };
    }
    if (NOT_CHARGEABLE.has(schedule.status)) {
      return { invoice_id: '', error: `This payment is ${schedule.status} and can't be charged` };
    }
    if (!chargeNow && !isDue(schedule)) {
      return { invoice_id: '', error: 'This payment is not due yet' };
    }
    if (
      schedule.status === 'processing' &&
      schedule.updated_at &&
      Date.now() - new Date(schedule.updated_at).getTime() < UNDERWAY_MS
    ) {
      return { invoice_id: '', error: 'A charge for this payment is already underway. Check again in a few minutes.' };
    }

    // The client may have paid on the pay page a moment ago, before the
    // webhook arrived. Charging again would take the money twice.
    if (schedule.stripe_payment_intent_id && !schedule.stripe_invoice_id) {
      const intent = await stripe.paymentIntents.retrieve(schedule.stripe_payment_intent_id).catch(() => null);
      if (intent?.status === 'processing') {
        return { invoice_id: '', error: 'The client is paying this right now. Check again in a few minutes.' };
      }
      if (intent?.status === 'succeeded') {
        const recorded = await recordSchedulePaid(supabase, schedule as ScheduleRow, intent, {
          productId: null,
          source: 'charge-check',
        });
        if (recorded.ok) await refreshEnrollmentTotals(supabase, schedule.enrollment_id);
        return { invoice_id: '', error: 'The client already paid this payment. It is now marked paid.' };
      }
    }

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, user_id, product_id, stripe_customer_id, is_parent')
      .eq('id', schedule.enrollment_id)
      .eq('tenant_id', tenantId)
      .single();
    if (enrollmentError || !enrollment) {
      return { invoice_id: '', error: 'Enrollment not found' };
    }
    if (enrollment.is_parent) {
      return { invoice_id: '', error: 'Parent enrollments are not charged' };
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, stripe_customer_id')
      .eq('id', enrollment.user_id)
      .single();
    const { data: product } = await supabase
      .from('products')
      .select('title')
      .eq('id', enrollment.product_id)
      .single();

    // The enrollment's customer holds the card saved at checkout.
    const customerId = enrollment.stripe_customer_id || user?.stripe_customer_id;
    if (!customerId) {
      await markFailedBeforeCharge(supabase, schedule.id, schedule.retry_count ?? 0, 'No saved card on file');
      return { invoice_id: '', error: 'No saved card on file' };
    }
    if (user && !user.stripe_customer_id) {
      await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    const cardId = await resolvePaymentMethod(stripe, customerId, paymentMethodId);
    if (!cardId) {
      await markFailedBeforeCharge(supabase, schedule.id, schedule.retry_count ?? 0, 'No saved card on file');
      return { invoice_id: '', error: 'No saved card on file' };
    }

    // An invoice from an earlier attempt that's still open is paid again,
    // never duplicated. A voided one is replaced.
    let invoice: Stripe.Invoice | null = null;
    if (schedule.stripe_invoice_id) {
      const earlier = await stripe.invoices.retrieve(schedule.stripe_invoice_id);
      if (earlier.status === 'paid') {
        // Collected; the webhook records it.
        return { invoice_id: earlier.id };
      }
      if (earlier.status === 'open' || earlier.status === 'draft') {
        invoice = earlier;
      }
      if (earlier.status === 'open' && earlier.payment_intent) {
        const intentId = typeof earlier.payment_intent === 'string' ? earlier.payment_intent : earlier.payment_intent.id;
        const intent = await stripe.paymentIntents.retrieve(intentId).catch(() => null);
        if (intent?.status === 'processing' || intent?.status === 'succeeded') {
          return { invoice_id: earlier.id, error: 'A charge for this payment is already underway. Check again in a few minutes.' };
        }
      }
    }

    // Take the schedule only if nobody changed it since it was read, so two
    // clicks (or a click during the daily run) can't both charge.
    const claimAt = new Date().toISOString();
    let claim = supabase
      .from('payment_schedules')
      .update({ status: 'processing', updated_at: claimAt })
      .eq('id', schedule.id)
      .eq('status', schedule.status);
    claim = schedule.updated_at ? claim.eq('updated_at', schedule.updated_at) : claim.is('updated_at', null);
    const { data: claimed, error: claimError } = await claim.select('id');
    if (claimError) {
      return { invoice_id: '', error: claimError.message };
    }
    if (!claimed || claimed.length === 0) {
      return { invoice_id: '', error: 'This payment was just changed or is being charged. Refresh and try again.' };
    }
    claimedFrom = schedule.status;

    if (!invoice) {
      const attempt = schedule.stripe_invoice_id ?? 'first';
      invoice = await stripe.invoices.create(
        {
          customer: customerId,
          collection_method: 'charge_automatically',
          default_payment_method: cardId,
          auto_advance: false,
          pending_invoice_items_behavior: 'exclude',
          metadata: {
            tenant_id: tenantId,
            enrollment_id: enrollment.id,
            schedule_id: schedule.id,
            payment_type: schedule.payment_type,
          },
          description: `Payment for ${product?.title ?? 'your enrollment'}`,
        },
        { idempotencyKey: `schedule-invoice:${schedule.id}:${attempt}` },
      );
      await stripe.invoiceItems.create(
        {
          customer: customerId,
          invoice: invoice.id,
          amount: Math.round(Number(schedule.amount) * 100),
          currency: String(schedule.currency || 'USD').toLowerCase(),
          description: `${product?.title ?? 'Payment'} - Payment #${schedule.payment_number}`,
          metadata: {
            tenant_id: tenantId,
            enrollment_id: enrollment.id,
            schedule_id: schedule.id,
            payment_type: schedule.payment_type,
          },
        },
        { idempotencyKey: `schedule-item:${schedule.id}:${attempt}` },
      );
    }

    // Saved before charging, so a crash mid-charge can't lead to a second invoice.
    await supabase
      .from('payment_schedules')
      .update({ stripe_invoice_id: invoice.id, status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', schedule.id);

    if (invoice.status === 'draft') {
      invoice = await stripe.invoices.finalizeInvoice(invoice.id, { auto_advance: false });
    }
    if (invoice.status !== 'paid') {
      chargeAttempted = true;
      try {
        await stripe.invoices.pay(invoice.id, { payment_method: cardId });
      } catch (payError: any) {
        // The card was declined or needs the client. invoice.payment_failed
        // marks the schedule failed and schedules the retry.
        return { invoice_id: invoice.id, error: payError?.message ?? 'Payment failed' };
      }
    }

    return { invoice_id: invoice.id };
  } catch (error) {
    console.error('[Invoice Service] Error charging schedule:', error);
    if (claimedFrom && !chargeAttempted) {
      // Nothing was charged: put the status back so it isn't stuck "processing".
      await supabase
        .from('payment_schedules')
        .update({ status: claimedFrom, updated_at: new Date().toISOString() })
        .eq('id', scheduleId)
        .eq('status', 'processing');
    }
    return {
      invoice_id: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function addPeriod(date: Date, frequency: string): Date {
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
 * Memberships the client stopped, whose paid period has now ended: the
 * enrollment is closed (access ends). Anything still unpaid on it is
 * cancelled. Runs hourly with the renewals.
 */
export async function closeEndedSubscriptions(): Promise<{ closed: number; errors: string[] }> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data: ended, error } = await supabase
    .from('enrollments')
    .select('id, payment_metadata')
    .lte('subscription_ends_at', now)
    .in('status', COLLECTING)
    .limit(500);
  if (error) {
    // Before the stop/pause migration runs, the column doesn't exist yet.
    return { closed: 0, errors: /does not exist/.test(error.message) ? [] : [error.message] };
  }

  let closed = 0;
  const errors: string[] = [];
  for (const enrollment of ended ?? []) {
    const { error: cancelError } = await supabase
      .from('payment_schedules')
      .update({ status: 'cancelled', updated_at: now })
      .eq('enrollment_id', enrollment.id)
      .in('status', ['pending', 'failed', 'overdue', 'adjusted']);
    const { error: closeError } = await supabase
      .from('enrollments')
      .update({
        status: 'cancelled',
        payment_status: 'cancelled',
        cancelled_at: now,
        payment_metadata: {
          ...((enrollment.payment_metadata as Record<string, unknown> | null) ?? {}),
          cancelled_at: now,
          cancellation_reason: 'Membership stopped by the client; paid period ended',
        },
        updated_at: now,
      })
      .eq('id', enrollment.id)
      .in('status', COLLECTING);
    if (cancelError || closeError) errors.push(`Enrollment ${enrollment.id}: ${(cancelError ?? closeError)!.message}`);
    else closed++;
  }
  return { closed, errors };
}

/**
 * Subscriptions only ever had their first payment created. Once the latest
 * period is paid and the next one has started, this adds that next payment so
 * the daily run charges it. Cancelled enrollments get nothing.
 */
export async function createDueSubscriptionRenewals(): Promise<{ created: number; errors: string[] }> {
  const supabase = createAdminClient();
  const errors: string[] = [];
  let created = 0;

  // Every subscription payment, page by page: a plain query stops at 1,000
  // rows, which would silently skip renewals once there are more.
  const { data: allRows, error } = await fetchAllPages<any>((from, to) =>
    supabase
      .from('payment_schedules')
      .select('id, tenant_id, enrollment_id, payment_plan_id, payment_number, amount, currency, scheduled_date, status')
      .eq('payment_type', 'subscription')
      .order('id', { ascending: true })
      .range(from, to),
  );
  if (error) return { created, errors: [error] };

  // Only enrollments still collecting (read separately; see loadEnrollmentsById).
  // '*' so the stop/pause dates are read when those columns exist.
  const { data: enrollmentsById, error: enrollmentError } = await loadEnrollmentsById<{ id: string; status: string; product_id: string; [k: string]: any }>(
    supabase,
    allRows.map((r) => r.enrollment_id),
    '*',
  );
  if (enrollmentError) return { created, errors: [enrollmentError] };
  const rows = allRows
    .filter((r) => COLLECTING.includes(enrollmentsById.get(r.enrollment_id)?.status ?? ''))
    .map((r) => ({ ...r, enrollments: enrollmentsById.get(r.enrollment_id) }));

  // The latest period that counts (cancelled or refunded ones don't, or a
  // membership resumed after a stop would never renew), and the highest
  // number used so far, so a new period never reuses a number.
  const latest = new Map<string, any>();
  const highestNumber = new Map<string, number>();
  for (const row of rows) {
    highestNumber.set(row.enrollment_id, Math.max(highestNumber.get(row.enrollment_id) ?? 0, row.payment_number));
    if (row.status === 'cancelled' || row.status === 'refunded') continue;
    const current = latest.get(row.enrollment_id);
    if (!current || row.payment_number > current.payment_number) latest.set(row.enrollment_id, row);
  }

  // Each plan or product is read once per run, not once per subscriber.
  const planCache = new Map<string, any>();
  async function planFor(planId: string): Promise<any> {
    if (!planCache.has(planId)) {
      // '*' so the plan price is read once its column exists.
      const { data } = await supabase.from('payment_plans').select('*').eq('id', planId).maybeSingle();
      planCache.set(planId, data ?? null);
    }
    return planCache.get(planId);
  }
  const frequencyCache = new Map<string, string>();
  async function frequencyFor(last: any): Promise<string> {
    const key = last.payment_plan_id ? `plan:${last.payment_plan_id}` : `product:${(last.enrollments as any)?.product_id}`;
    const cached = frequencyCache.get(key);
    if (cached) return cached;
    let frequency = 'monthly';
    if (last.payment_plan_id) {
      const { data: plan } = await supabase
        .from('payment_plans')
        .select('subscription_frequency')
        .eq('id', last.payment_plan_id)
        .maybeSingle();
      frequency = plan?.subscription_frequency || frequency;
    } else {
      const { data: product } = await supabase
        .from('products')
        .select('payment_plan')
        .eq('id', (last.enrollments as any)?.product_id)
        .maybeSingle();
      frequency = (product?.payment_plan as any)?.subscription_interval || frequency;
    }
    frequencyCache.set(key, frequency);
    return frequency;
  }

  for (const last of latest.values()) {
    if (last.status !== 'paid') continue; // the current period isn't settled yet

    // Stopped by the client: no more charges.
    const dates = readSubscriptionDates(last.enrollments);
    if (dates.endsAt) continue;

    const frequency = await frequencyFor(last);

    // A renewal that falls in a pause starts when the pause ends.
    const nextDate = shiftPastPause(addPeriod(new Date(last.scheduled_date), frequency), dates);
    if (!isDue({ scheduled_date: nextDate.toISOString() })) continue;

    // The plan the client is on now (they may have switched monthly/yearly):
    // its price from this period on. The period that just ended was timed by
    // the previous plan, above.
    const currentPlanId = (last.enrollments as any)?.payment_plan_id ?? last.payment_plan_id;
    const currentPlan = currentPlanId ? await planFor(currentPlanId) : null;

    const { error: insertError } = await supabase.from('payment_schedules').insert({
      tenant_id: last.tenant_id,
      enrollment_id: last.enrollment_id,
      payment_plan_id: currentPlanId,
      payment_number: (highestNumber.get(last.enrollment_id) ?? last.payment_number) + 1,
      payment_type: 'subscription',
      amount: planSubscriptionAmount(currentPlan) ?? last.amount,
      currency: last.currency,
      original_due_date: nextDate.toISOString(),
      scheduled_date: nextDate.toISOString(),
      status: 'pending',
      adjustment_history: [],
      retry_count: 0,
    });
    // A duplicate payment number means another run already added it.
    if (insertError && insertError.code !== '23505') errors.push(`Enrollment ${last.enrollment_id}: ${insertError.message}`);
    else if (!insertError) created++;
  }
  return { created, errors };
}

/**
 * The daily run: adds due subscription renewals, then charges every payment
 * that has come due. Failed ones are left to the retry cron.
 *
 * @param _daysAhead - kept for callers; invoices are no longer created ahead.
 */
export async function createUpcomingInvoices(_daysAhead: number = 30): Promise<{
  created: number;
  failed: number;
  remaining: number;
  errors: string[];
}> {
  const supabase = createAdminClient();
  // The renewal scan reads every subscription; once an hour is plenty
  // (the job runs every 15 minutes, and a renewal is due by the day).
  const hourly = new Date().getUTCMinutes() < 15;
  const ended = hourly ? await closeEndedSubscriptions() : { closed: 0, errors: [] as string[] };
  const renewals = hourly
    ? await createDueSubscriptionRenewals()
    : { created: 0, errors: [] as string[] };
  renewals.errors.unshift(...ended.errors);
  const results = { created: 0, failed: 0, remaining: 0, errors: [...renewals.errors] };

  // Oldest first, a bounded slice per run; the job runs hourly, so a busy
  // day is worked through over several runs instead of timing out.
  const dueBy = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const dayAgoIso = new Date(Date.now() - 86400000).toISOString();
  // Enrollments are filtered in code (no join is possible, see
  // loadEnrollmentsById). Unfinished wizard drafts also have due deposits,
  // so read page by page until there are enough chargeable payments, rather
  // than letting old drafts fill every slot.
  const schedules: { id: string; tenant_id: string }[] = [];
  for (let page = 0; page < 10 && schedules.length < CHARGES_PER_RUN; page++) {
    const { data: candidates, error } = await supabase
      .from('payment_schedules')
      .select('id, tenant_id, enrollment_id')
      // "Processing" means a charge is underway; only pick it up again once
      // it has been stuck for a day (webhook never arrived, old invoices).
      .or(`status.in.(pending,adjusted),and(status.eq.processing,updated_at.lt."${dayAgoIso}")`)
      .lte('scheduled_date', dueBy)
      .order('scheduled_date', { ascending: true })
      .order('id', { ascending: true })
      .range(page * 1000, page * 1000 + 999);
    if (error) {
      return { ...results, errors: [...results.errors, error.message] };
    }
    const { data: enrollmentsById, error: enrollmentError } = await loadEnrollmentsById<{ id: string; status: string; is_parent: boolean | null }>(
      supabase,
      (candidates ?? []).map((c) => c.enrollment_id),
      'id, status, is_parent',
    );
    if (enrollmentError) {
      return { ...results, errors: [...results.errors, enrollmentError] };
    }
    for (const c of candidates ?? []) {
      const enrollment = enrollmentsById.get(c.enrollment_id);
      // Only enrollments being collected; parent enrollments aren't charged.
      if (!enrollment || !COLLECTING.includes(enrollment.status) || enrollment.is_parent) continue;
      schedules.push({ id: c.id, tenant_id: c.tenant_id });
      if (schedules.length >= CHARGES_PER_RUN) break;
    }
    if (!candidates || candidates.length < 1000) break;
  }

  const batch = await runInBatches(schedules, (schedule) =>
    createScheduledInvoice(schedule.id, schedule.tenant_id).then((result) => ({ id: schedule.id, result })),
  );
  for (const { id, result } of batch.results) {
    if (result.error) {
      results.failed++;
      results.errors.push(`Schedule ${id}: ${result.error}`);
    } else {
      results.created++;
    }
  }
  results.remaining = batch.remaining;

  console.log(`[Invoice Service] Run: ${renewals.created} renewals added, ${results.created} charged, ${results.failed} failed, ${results.remaining} left for the next run`);
  return results;
}
