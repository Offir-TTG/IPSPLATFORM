/**
 * Read-only check that our payment records match Stripe, per tenant.
 * Changes nothing in the database or in Stripe, and prints no keys.
 *
 *   npx tsx scripts/audit-stripe-sync.ts [--out <report.md>] [--days 365]
 *
 * (server-only is resolved by Next; when run here, point NODE_PATH at a stub
 * folder holding an empty server-only package.)
 *
 * Checks, per tenant with a Stripe integration:
 *  1. schedule paid with us, but its invoice / intent isn't paid in Stripe
 *  2. paid in Stripe, but the schedule isn't paid with us
 *  3. amounts: Stripe collected vs schedule amount vs payment amount
 *  4. more than one payment row per intent / per invoice
 *  5. payments or schedules whose enrollment no longer exists
 *  6. refunds: Stripe amount_refunded vs payments.refunded_amount / status
 *  7. enrollment paid_amount / payment_status vs a fresh recalculation
 *  8. paid invoices / intents in Stripe (with our metadata) we have no record of; disputes
 *  9. the webhook endpoints in Stripe and the events they send
 */
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true } as any);

type Finding = { severity: 'high' | 'medium' | 'low' | 'info'; check: string; text: string };

const args = process.argv.slice(2);
const argOf = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const OUT = argOf('--out');
const DAYS = Number(argOf('--days') || 365);
const money = (n: number, c = 'USD') => `${Number(n).toFixed(2)} ${String(c).toUpperCase()}`;
const near = (a: number, b: number) => Math.abs(Number(a) - Number(b)) < 0.005;

async function all<T>(q: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await q(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

async function main() {
  const { createAdminClient } = await import('../src/lib/supabase/server');
  const { listIntegrations } = await import('../src/lib/integrations/store');
  const Stripe = (await import('stripe')).default;
  const db = createAdminClient();
  const lines: string[] = [];
  const say = (s = '') => {
    lines.push(s);
    console.log(s);
  };

  const { data: integrations, error } = await listIntegrations('stripe');
  if (error) throw new Error(String(error));
  const tenants = (integrations ?? []).filter((i: any) => i.credentials?.secret_key);
  say(`# Stripe sync check · ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`);
  say(`Tenants with a Stripe key: ${tenants.length} · Stripe objects from the last ${DAYS} days`);

  for (const integ of tenants as any[]) {
    const tenantId: string = integ.tenant_id;
    const key: string = integ.credentials.secret_key;
    const mode = key.startsWith('sk_live') ? 'LIVE' : key.startsWith('sk_test') ? 'test' : 'unknown';
    const stripe = new Stripe(key, { apiVersion: '2023-10-16' as any });
    const findings: Finding[] = [];
    const add = (severity: Finding['severity'], check: string, text: string) => findings.push({ severity, check, text });

    const [enrollments, schedules, payments, disputes] = await Promise.all([
      all<any>((f, t) => db.from('enrollments').select('id, user_id, status, total_amount, paid_amount, payment_status, payment_waived, currency').eq('tenant_id', tenantId).range(f, t)),
      all<any>((f, t) =>
        db
          .from('payment_schedules')
          .select('id, enrollment_id, payment_number, payment_type, amount, currency, status, scheduled_date, stripe_invoice_id, stripe_payment_intent_id, payment_id, coaching_session_id')
          .eq('tenant_id', tenantId)
          .range(f, t),
      ),
      all<any>((f, t) =>
        db
          .from('payments')
          .select('id, enrollment_id, payment_schedule_id, amount, currency, status, payment_type, refunded_amount, stripe_payment_intent_id, stripe_invoice_id, created_at')
          .eq('tenant_id', tenantId)
          .range(f, t),
      ),
      all<any>((f, t) => db.from('payment_disputes').select('*').eq('tenant_id', tenantId).range(f, t)).catch(() => [] as any[]),
    ]);
    const enrollmentIds = new Set(enrollments.map((e) => e.id));
    const scheduleById = new Map(schedules.map((s) => [s.id, s]));

    say('');
    say(`## Tenant ${tenantId.slice(0, 8)} · Stripe ${mode} mode`);
    say(`${enrollments.length} enrollments · ${schedules.length} schedules · ${payments.length} payments · ${disputes.length} disputes`);

    // Stripe objects, cached.
    const invoiceCache = new Map<string, any>();
    const intentCache = new Map<string, any>();
    const getInvoice = async (id: string) => {
      if (!invoiceCache.has(id)) invoiceCache.set(id, await stripe.invoices.retrieve(id).catch((e: any) => ({ __error: e?.message ?? String(e) })));
      return invoiceCache.get(id);
    };
    const getIntent = async (id: string) => {
      if (!intentCache.has(id)) intentCache.set(id, await stripe.paymentIntents.retrieve(id, { expand: ['latest_charge'] }).catch((e: any) => ({ __error: e?.message ?? String(e) })));
      return intentCache.get(id);
    };

    const foreignRows: string[] = [];
    // 1–3. Each schedule with a Stripe object.
    for (const s of schedules) {
      const label = `schedule ${s.id.slice(0, 8)} (#${s.payment_number}, ${s.payment_type}, ${money(s.amount, s.currency)}, ours: ${s.status})`;
      let stripePaid = false;
      let collected: number | null = null;
      let refs: string[] = [];
      let foreign = false;
      if (s.stripe_invoice_id) {
        const inv = await getInvoice(s.stripe_invoice_id);
        if (inv.__error) {
          if (/No such/i.test(inv.__error)) foreign = true;
          else add('medium', 'stripe-missing', `${label}: invoice ${s.stripe_invoice_id} could not be read (${inv.__error})`);
        }
        else {
          refs.push(`invoice ${inv.id} ${inv.status}`);
          // An out-of-band receipt invoice is "paid" but collected nothing through Stripe.
          if (inv.status === 'paid' && !inv.paid_out_of_band) {
            stripePaid = true;
            collected = inv.amount_paid / 100;
          }
          if (inv.status === 'paid' && inv.paid_out_of_band) refs.push('(receipt, paid out of band)');
        }
      }
      if (s.stripe_payment_intent_id) {
        const pi = await getIntent(s.stripe_payment_intent_id);
        if (pi.__error) {
          if (/No such/i.test(pi.__error)) foreign = true;
          else add('medium', 'stripe-missing', `${label}: payment intent ${s.stripe_payment_intent_id} could not be read (${pi.__error})`);
        }
        else {
          refs.push(`intent ${pi.id} ${pi.status}`);
          if (pi.status === 'succeeded') {
            stripePaid = true;
            collected = (collected ?? 0) + pi.amount_received / 100;
          }
        }
      }
      if (!s.stripe_invoice_id && !s.stripe_payment_intent_id) continue;
      // Not in this Stripe account at all: made under an earlier Stripe account (old test data).
      if (foreign && !stripePaid) {
        foreignRows.push(`${label}${enrollmentIds.has(s.enrollment_id) ? '' : ' · enrollment deleted'}`);
        continue;
      }
      const refText = refs.join(', ');
      if (s.status === 'paid' && !stripePaid) {
        const p = payments.find((x) => x.payment_schedule_id === s.id);
        // A manual payment (recorded by the team) has no Stripe charge on purpose.
        if (!(p && !p.stripe_payment_intent_id && !p.stripe_invoice_id)) add('high', '1 paid-not-in-stripe', `${label}: paid with us, but in Stripe: ${refText}`);
      }
      if (stripePaid && !['paid', 'refunded'].includes(s.status)) add('high', '2 stripe-paid-not-recorded', `${label}: Stripe collected ${money(collected ?? 0, s.currency)} (${refText}) but ours is "${s.status}"`);
      if (stripePaid && collected !== null && !near(collected, s.amount)) add('medium', '3 amount', `${label}: Stripe collected ${money(collected, s.currency)}, schedule says ${money(s.amount, s.currency)}`);
    }

    if (foreignRows.length)
      add('info', 'other-account', `${foreignRows.length} schedules point to Stripe invoices/payments that don't exist in this Stripe account (made under an earlier account, old test data): ${foreignRows.join(' | ')}`);

    // 3–4. Payments: amounts and duplicates.
    const byIntent = new Map<string, any[]>();
    const byInvoice = new Map<string, any[]>();
    for (const p of payments) {
      if (p.stripe_payment_intent_id) byIntent.set(p.stripe_payment_intent_id, [...(byIntent.get(p.stripe_payment_intent_id) ?? []), p]);
      if (p.stripe_invoice_id) byInvoice.set(p.stripe_invoice_id, [...(byInvoice.get(p.stripe_invoice_id) ?? []), p]);
      const s = p.payment_schedule_id ? scheduleById.get(p.payment_schedule_id) : null;
      if (s && !near(p.amount, s.amount)) add('low', '3 amount', `payment ${p.id.slice(0, 8)} is ${money(p.amount, p.currency)} but its schedule ${s.id.slice(0, 8)} is ${money(s.amount, s.currency)}`);
    }
    for (const [k, rows] of byIntent) if (rows.length > 1) add('high', '4 duplicate', `${rows.length} payment rows for intent ${k}: ${rows.map((r) => r.id.slice(0, 8)).join(', ')}`);
    for (const [k, rows] of byInvoice) if (rows.length > 1) add('high', '4 duplicate', `${rows.length} payment rows for invoice ${k}: ${rows.map((r) => r.id.slice(0, 8)).join(', ')}`);

    // 5. Orphans.
    const orphanSchedules = schedules.filter((s) => !enrollmentIds.has(s.enrollment_id));
    const orphanPayments = payments.filter((p) => p.enrollment_id && !enrollmentIds.has(p.enrollment_id));
    if (orphanSchedules.length) add('low', '5 orphan', `${orphanSchedules.length} schedules whose enrollment no longer exists (statuses: ${[...new Set(orphanSchedules.map((s) => s.status))].join(', ')})${orphanSchedules.some((s) => ['pending', 'failed', 'processing'].includes(s.status)) ? ' · SOME ARE STILL CHARGEABLE' : ''}`);
    if (orphanPayments.length) add('low', '5 orphan', `${orphanPayments.length} payments whose enrollment no longer exists`);

    // 6. Refunds (payments charged through an intent).
    for (const p of payments) {
      if (!p.stripe_payment_intent_id) continue;
      const pi = await getIntent(p.stripe_payment_intent_id);
      if (pi.__error) continue;
      const charge: any = pi.latest_charge && typeof pi.latest_charge === 'object' ? pi.latest_charge : null;
      const refunded = charge ? charge.amount_refunded / 100 : 0;
      const ours = Number(p.refunded_amount ?? 0);
      const oursFull = p.status === 'refunded';
      if (!near(refunded, ours) && !(oursFull && charge && charge.refunded))
        add('high', '6 refund', `payment ${p.id.slice(0, 8)} (${money(p.amount, p.currency)}): Stripe refunded ${money(refunded, p.currency)}, ours ${money(ours, p.currency)} (${p.status})`);
      if (charge?.refunded && p.status !== 'refunded') add('high', '6 refund', `payment ${p.id.slice(0, 8)}: fully refunded in Stripe, ours "${p.status}"`);
      if (charge?.disputed) add('medium', '8 dispute', `payment ${p.id.slice(0, 8)}: the charge is disputed in Stripe`);
    }

    // 7. Enrollment totals, recalculated as refreshEnrollmentTotals does.
    for (const e of enrollments) {
      const own = schedules.filter((s) => s.enrollment_id === e.id);
      if (!own.length) continue;
      const live = own.filter((s) => s.status !== 'cancelled' && s.status !== 'refunded');
      const partly = payments
        .filter((p) => p.enrollment_id === e.id && p.status === 'partially_refunded' && p.payment_schedule_id)
        .reduce((n, p) => n + Number(p.refunded_amount ?? 0), 0);
      const paid = Math.max(0, Math.round((live.filter((s) => s.status === 'paid').reduce((n, s) => n + Number(s.amount), 0) - partly) * 100) / 100);
      if (!near(paid, e.paid_amount ?? 0)) add('medium', '7 totals', `enrollment ${e.id.slice(0, 8)} (${e.status}): paid_amount ${money(e.paid_amount ?? 0, e.currency)}, schedules say ${money(paid, e.currency)}`);
      const allPaid = live.length > 0 && live.every((s) => s.status === 'paid');
      const expected = e.status === 'cancelled' ? null : e.payment_status === 'overdue' ? null : allPaid ? 'paid' : paid > 0 ? 'partial' : 'pending';
      if (expected && e.payment_status !== expected) add('low', '7 totals', `enrollment ${e.id.slice(0, 8)} (${e.status}): payment_status "${e.payment_status}", schedules say "${expected}"`);
    }

    // 8. Stripe side: paid objects with our metadata that we have no record of.
    const since = Math.floor(Date.now() / 1000) - DAYS * 86400;
    const knownInvoices = new Set(schedules.map((s) => s.stripe_invoice_id).filter(Boolean).concat(payments.map((p) => p.stripe_invoice_id).filter(Boolean)));
    const knownIntents = new Set(schedules.map((s) => s.stripe_payment_intent_id).filter(Boolean).concat(payments.map((p) => p.stripe_payment_intent_id).filter(Boolean)));
    let invoicesSeen = 0;
    let intentsSeen = 0;
    for await (const inv of stripe.invoices.list({ created: { gte: since }, limit: 100 }) as any) {
      invoicesSeen++;
      if (inv.metadata?.tenant_id && inv.metadata.tenant_id !== tenantId) continue;
      if (inv.status !== 'paid' || inv.paid_out_of_band) continue;
      if (!knownInvoices.has(inv.id)) {
        const sid = inv.metadata?.schedule_id;
        const chargeId = typeof inv.charge === 'string' ? inv.charge : inv.charge?.id;
        const ch: any = chargeId ? await stripe.charges.retrieve(chargeId).catch(() => null) : null;
        if (ch?.refunded) {
          add('info', '8 stripe-only (refunded)', `Stripe invoice ${inv.id} (${money(inv.amount_paid / 100, inv.currency)}) has no record with us, but it was fully refunded`);
          continue;
        }
        add('high', '8 stripe-only', `Stripe invoice ${inv.id} paid ${money(inv.amount_paid / 100, inv.currency)} on ${new Date(inv.created * 1000).toISOString().slice(0, 10)}${sid ? ` for schedule ${String(sid).slice(0, 8)}` : ''}, no record with us${sid && !scheduleById.has(sid) ? ' (that schedule no longer exists)' : ''}`);
      }
    }
    for await (const pi of stripe.paymentIntents.list({ created: { gte: since }, limit: 100 }) as any) {
      intentsSeen++;
      if (pi.status !== 'succeeded') continue;
      if (pi.metadata?.tenant_id && pi.metadata.tenant_id !== tenantId) continue;
      if (knownIntents.has(pi.id)) continue;
      // Intents created by our invoices are covered by the invoice check.
      if (pi.invoice && knownInvoices.has(typeof pi.invoice === 'string' ? pi.invoice : pi.invoice.id)) continue;
      if (pi.invoice) continue;
      if (pi.metadata?.purpose === 'saved_card_for_enrollment') continue;
      add(
        pi.metadata?.enrollment_id || pi.metadata?.schedule_id ? 'high' : 'medium',
        '8 stripe-only',
        `Stripe payment ${pi.id} succeeded ${money(pi.amount_received / 100, pi.currency)} on ${new Date(pi.created * 1000).toISOString().slice(0, 10)}${pi.metadata?.enrollment_id ? ` for enrollment ${String(pi.metadata.enrollment_id).slice(0, 8)}` : ' (no enrollment in its metadata)'}, no record with us`,
      );
    }
    let stripeDisputes = 0;
    const ourDisputeIds = new Set(disputes.map((d: any) => d.stripe_dispute_id).filter(Boolean));
    for await (const d of stripe.disputes.list({ created: { gte: since }, limit: 100 }) as any) {
      stripeDisputes++;
      if (!ourDisputeIds.has(d.id)) add('high', '8 dispute', `Stripe dispute ${d.id} (${money(d.amount / 100, d.currency)}, ${d.status}) has no record with us`);
    }
    say(`Stripe, last ${DAYS} days: ${invoicesSeen} invoices · ${intentsSeen} payment intents · ${stripeDisputes} disputes`);

    // 9. Webhook endpoints.
    const needed = ['payment_intent.succeeded', 'payment_intent.payment_failed', 'invoice.payment_succeeded', 'invoice.payment_failed', 'invoice.voided', 'invoice.marked_uncollectible', 'charge.refunded', 'charge.dispute.created', 'charge.dispute.updated', 'charge.dispute.closed'];
    const endpoints = await stripe.webhookEndpoints.list({ limit: 20 }).catch((e: any) => ({ data: [], __error: e?.message }));
    if ((endpoints as any).__error) add('medium', '9 webhook', `could not list webhook endpoints: ${(endpoints as any).__error}`);
    else if (!(endpoints.data as any[]).some((ep) => /\/api\/webhooks\/stripe/.test(ep.url) && (ep.enabled_events.includes('*') || ep.enabled_events.includes('invoice.payment_succeeded'))))
      add('high', '9 webhook', 'no webhook in this Stripe account sends payment events (invoice / payment_intent / charge) to the platform, so payments reach it only through its own checks');
    for (const ep of endpoints.data as any[]) {
      const events: string[] = ep.enabled_events ?? [];
      const missing = events.includes('*') ? [] : needed.filter((n) => !events.includes(n));
      say(`Webhook: ${ep.url} · ${ep.status} · ${events.includes('*') ? 'all events' : events.join(', ')}`);
      if (ep.status !== 'enabled') add('high', '9 webhook', `webhook ${ep.url} is ${ep.status}`);
      if (missing.length) add('medium', '9 webhook', `webhook ${ep.url} does not send: ${missing.join(', ')}`);
    }

    // Report.
    const order = { high: 0, medium: 1, low: 2, info: 3 } as const;
    findings.sort((a, b) => order[a.severity] - order[b.severity] || a.check.localeCompare(b.check));
    const counts = { high: 0, medium: 0, low: 0, info: 0 };
    for (const f of findings) counts[f.severity]++;
    say('');
    say(`Findings: ${counts.high} high · ${counts.medium} medium · ${counts.low} low · ${counts.info} info`);
    if (!findings.length) say('No differences found.');
    for (const f of findings) say(`- [${f.severity}] (${f.check}) ${f.text}`);
  }

  if (OUT) {
    fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8');
    console.log(`\nReport written to ${OUT}`);
  }
}

main().catch((e) => {
  console.error('Check failed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
