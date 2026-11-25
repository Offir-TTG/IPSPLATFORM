import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';
import { createScheduledInvoice } from './invoiceService';
import { planSessionAmount } from './paymentEngine';
import { refreshEnrollmentTotals } from './dueSchedules';

/**
 * Pay as you go: a per-session plan charges nothing at enrollment (the card is
 * saved), and each session is charged when it is marked held.
 *
 * One payment_schedules row per session (payment_type 'session'), linked by
 * coaching_session_id, which the database keeps unique: marking the same
 * session held twice never charges twice. The charge goes through the same
 * saved-card path as membership renewals, so a declined card falls into the
 * existing retry and overdue handling.
 */

export type SessionChargeResult =
  | { ok: true; charged: false; reason: 'not_per_session' | 'gift' }
  | { ok: true; charged: true; amount: number; currency: string; scheduleId: string; alreadyCharged?: boolean }
  | { ok: false; error: string; scheduleId?: string };

/** The price of one session for this enrollment: the plan's price per session. */
export async function sessionPriceFor(enrollmentId: string): Promise<{ perSession: boolean; amount: number; currency: string; planId: string | null; sessionCount: number }> {
  const db = createAdminClient();
  const { data: enrollment } = await db
    .from('enrollments')
    .select('payment_plan_id, currency, product:products!enrollments_product_id_fkey(price, currency, session_count, payment_model, payment_plan)')
    .eq('id', enrollmentId)
    .maybeSingle();
  const product: any = Array.isArray((enrollment as any)?.product) ? (enrollment as any).product[0] : (enrollment as any)?.product;
  const planId = (enrollment as any)?.payment_plan_id ?? null;
  const { data: plan } = planId ? await db.from('payment_plans').select('*').eq('id', planId).maybeSingle() : { data: null };
  // A per-session plan template, or the product's own (custom) payment setting.
  const customPerSession = !plan && product?.payment_model === 'per_session';
  const perSession = plan?.plan_type === 'per_session' || customPerSession;
  // The price per session: the plan's, or the product's custom one; failing
  // both, the product total (sessions × price) divided back into one session.
  const count = Number(product?.session_count) || 0;
  const own = customPerSession ? Number(product?.payment_plan?.session_amount) : planSessionAmount(plan) ?? NaN;
  const amount = own > 0 ? own : count > 0 ? Number(product?.price ?? 0) / count : 0;
  return { perSession, amount: Math.round(amount * 100) / 100, currency: String((enrollment as any)?.currency || product?.currency || 'USD'), planId, sessionCount: count };
}

/**
 * The price of the n-th held session (1-based) of a package: the package's
 * own sessions at its price, then each approved offer's sessions at the
 * offer's price (0 for a gift), in the order they were approved. Past the
 * end, the last block's price.
 */
export async function priceOfHeldSession(enrollmentId: string, n: number, base: { amount: number; sessionCount: number }) {
  const db = createAdminClient();
  const { data: offers, error } = await db
    .from('coaching_offers')
    .select('sessions, session_amount, is_gift, decided_at, created_at')
    .eq('enrollment_id', enrollmentId)
    .eq('status', 'approved');
  const blocks: { sessions: number; amount: number }[] = [{ sessions: base.sessionCount || 0, amount: base.amount }];
  if (!error) {
    for (const o of [...(offers ?? [])].sort((a: any, b: any) => String(a.decided_at ?? a.created_at).localeCompare(String(b.decided_at ?? b.created_at)))) {
      blocks.push({ sessions: Number(o.sessions) || 0, amount: o.is_gift ? 0 : Number(o.session_amount) || 0 });
    }
  }
  let left = n;
  for (const b of blocks) {
    if (left <= b.sessions) return b.amount;
    left -= b.sessions;
  }
  return blocks[blocks.length - 1].amount;
}

/** Charges a held session to the saved card (per-session plans only). */
export async function chargeHeldSession(tenantId: string, sessionId: string): Promise<SessionChargeResult> {
  const db = createAdminClient();
  const { data: session } = await db
    .from('coaching_sessions')
    .select('id, enrollment_id, status, tenant_id')
    .eq('id', sessionId)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (!session) return { ok: false, error: 'Session not found' };
  if (session.status !== 'done') return { ok: false, error: 'Only a session that was held is charged' };

  const base = await sessionPriceFor(session.enrollment_id);
  if (!base.perSession) return { ok: true, charged: false, reason: 'not_per_session' };

  // Which held session this is (by date), to price sessions added later.
  const { data: held } = await db
    .from('coaching_sessions')
    .select('id, starts_at')
    .eq('enrollment_id', session.enrollment_id)
    .eq('status', 'done')
    .order('starts_at', { ascending: true })
    .order('id', { ascending: true });
  const position = Math.max(1, (held ?? []).findIndex((h: any) => h.id === session.id) + 1);
  const price = { ...base, amount: Math.round((await priceOfHeldSession(session.enrollment_id, position, base)) * 100) / 100 };
  if (price.amount === 0 && position > (base.sessionCount || 0)) return { ok: true, charged: false, reason: 'gift' };
  if (!(price.amount > 0)) return { ok: false, error: 'This package has no price per session' };

  // Already charged (or charging) for this session: retry an unpaid one, never add another.
  let { data: schedule } = await db
    .from('payment_schedules')
    .select('id, status, amount, currency')
    .eq('coaching_session_id', session.id)
    .maybeSingle();

  if (schedule?.status === 'paid') {
    return { ok: true, charged: true, amount: Number(schedule.amount), currency: schedule.currency, scheduleId: schedule.id, alreadyCharged: true };
  }

  if (!schedule) {
    const { data: last } = await db
      .from('payment_schedules')
      .select('payment_number')
      .eq('enrollment_id', session.enrollment_id)
      .order('payment_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    const now = new Date().toISOString();
    const { data: inserted, error: insertError } = await db
      .from('payment_schedules')
      .insert({
        tenant_id: tenantId,
        enrollment_id: session.enrollment_id,
        payment_plan_id: price.planId,
        payment_number: (Number(last?.payment_number) || 0) + 1,
        payment_type: 'session',
        amount: price.amount,
        currency: price.currency,
        original_due_date: now,
        scheduled_date: now,
        status: 'pending',
        coaching_session_id: session.id,
        adjustment_history: [],
        retry_count: 0,
      })
      .select('id, status, amount, currency')
      .single();
    if (insertError) {
      // Another click added it a moment ago: use that one.
      if (insertError.code === '23505') {
        ({ data: schedule } = await db.from('payment_schedules').select('id, status, amount, currency').eq('coaching_session_id', session.id).maybeSingle());
      } else {
        return { ok: false, error: insertError.message };
      }
    } else {
      schedule = inserted;
    }
  }
  if (!schedule) return { ok: false, error: 'Could not create the charge for this session' };

  const charge = await createScheduledInvoice(schedule.id, tenantId, true);
  // Record it as paid now if Stripe already took the money, rather than
  // waiting for Stripe's message (it may not reach this server).
  if (!charge.error) await syncSessionCharge(tenantId, schedule.id).catch((e) => console.error('[perSession] sync after charge', e));
  await refreshEnrollmentTotals(db as any, session.enrollment_id);
  if (charge.error) return { ok: false, error: charge.error, scheduleId: schedule.id };
  return { ok: true, charged: true, amount: Number(schedule.amount), currency: schedule.currency, scheduleId: schedule.id };
}

/**
 * A session charge whose Stripe invoice is paid: recorded through the same
 * function as every other scheduled charge (one payment per invoice, the
 * schedule marked paid, totals updated). Safe to run again, and safe
 * alongside the webhook. Returns the charge's status after.
 */
export async function syncSessionCharge(tenantId: string, scheduleId: string): Promise<{ status: string; error?: string }> {
  const db = createAdminClient();
  const { data: s } = await db.from('payment_schedules').select('id, status, stripe_invoice_id').eq('id', scheduleId).eq('tenant_id', tenantId).maybeSingle();
  if (!s) return { status: 'missing' };
  if (s.status === 'paid' || !s.stripe_invoice_id) return { status: s.status };
  const { getStripeClient } = await import('./getStripeClient');
  const { recordInvoicePaid } = await import('./dueSchedules');
  const { stripe } = await getStripeClient(tenantId);
  const invoice = await stripe.invoices.retrieve(s.stripe_invoice_id);
  if (invoice.status !== 'paid') return { status: s.status };
  const recorded = await recordInvoicePaid(db as any, invoice, 'session-sync');
  return recorded.ok ? { status: 'paid' } : { status: s.status, error: recorded.error };
}
