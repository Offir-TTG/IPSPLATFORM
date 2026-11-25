import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';
import { loadIntegration } from '@/lib/integrations/store';

/**
 * Keap history: a read-only copy of Keap's orders, their payments and card
 * transactions (Payments → Keap history). Nothing here touches enrollments
 * or payments. Brought in by steps that each fit one request (the host stops
 * a request at 60 seconds); the page calls the next step until done:
 *
 *   orders → payments (per order) → phones (per buyer) → transactions → done
 *
 * A refresh runs the same steps: orders are re-read (cheap), only new or
 * changed orders have their payments re-read, only new buyers get a phone
 * lookup, and transactions are read from the last refresh on.
 */

const BASE = 'https://api.infusionsoft.com/crm/rest/v1';
const STEP_BUDGET_MS = 40_000;
// Keap allows 240 requests a minute per key (and 30,000 a day): one request
// every 270 ms keeps under it, a few in flight at a time.
const CONCURRENCY = 3;
const MIN_GAP_MS = 270;

export type SyncStep = 'orders' | 'payments' | 'phones' | 'transactions' | 'done';
/** waitMs: Keap asked to slow down; the page waits this long, then calls the same step again. */
export type SyncResult = { step: SyncStep; offset: number; done: number; total: number | null; waitMs?: number; error?: string };

/** Keap said "too many requests": the step stops where it is and the page tries again after a pause. */
class KeapBusy extends Error {
  constructor(public waitMs: number, public daily: boolean) {
    super(daily ? 'The Keap daily limit is reached. Continue tomorrow; nothing is lost.' : 'Keap asked to slow down.');
  }
}

// One shared pace for every request in this run.
let nextSlot = 0;
async function pace() {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + MIN_GAP_MS;
  if (wait) await new Promise((r) => setTimeout(r, wait));
}

type Db = ReturnType<typeof createAdminClient>;

async function keapKey(tenantId: string): Promise<string> {
  const { data, error } = await loadIntegration(tenantId, 'keap');
  const key = (data as any)?.credentials?.api_key;
  if (error || !key) throw new Error('Keap is not connected. Add its key in Settings → Integrations → Keap.');
  return key;
}

async function keapGet(key: string, path: string): Promise<any> {
  await pace();
  const res = await fetch(BASE + path, { headers: { 'X-Keap-API-Key': key, Accept: 'application/json' }, cache: 'no-store' });
  if (res.status === 429) {
    const used = Number(res.headers.get('x-keap-product-quota-used'));
    const limit = Number(res.headers.get('x-keap-product-quota-limit'));
    const daily = Number.isFinite(used) && Number.isFinite(limit) && limit > 0 && used >= limit;
    const retry = Number(res.headers.get('retry-after'));
    throw new KeapBusy(daily ? 0 : Math.min(60_000, Math.max(5_000, (Number.isFinite(retry) && retry > 0 ? retry : 15) * 1000)), daily);
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Keap ${res.status} on ${path.split('?')[0]}`);
  // Close to the minute's limit: let the minute roll over before the next request.
  const left = Number(res.headers.get('x-keap-product-throttle-available'));
  if (Number.isFinite(left) && left < 15) nextSlot = Math.max(nextSlot, Date.now() + 15_000);
  return res.json();
}

/** Paid in full, partly, not at all, refunded, or free: from the amounts (Keap's own status is not reliable). */
export function payStateOf(total: number, paid: number, refunded: number): 'full' | 'partial' | 'unpaid' | 'refunded' | 'free' {
  if (refunded > 0) return 'refunded';
  if (total <= 0) return 'free';
  if (paid >= total - 0.005) return 'full';
  if (paid > 0) return 'partial';
  return 'unpaid';
}

const num = (v: any) => (Number.isFinite(Number(v)) ? Math.round(Number(v) * 100) / 100 : 0);
const when = (v: any) => (v ? new Date(v).toISOString() : null);

function orderRow(tenantId: string, o: any) {
  const items = (o.order_items ?? []).map((i: any) => ({
    name: i.product?.name ?? i.name ?? '',
    qty: Number(i.quantity) || 1,
    price: num(i.price),
    type: i.type ?? null,
  }));
  const total = num(o.total);
  const paid = num(o.total_paid);
  const refunded = num(o.refund_total);
  const p = o.payment_plan;
  const plan =
    p && Number(p.number_of_payments) > 1
      ? { payments: Number(p.number_of_payments), every_days: Number(p.days_between_payments) || null, first_amount: num(p.initial_payment_amount), start: when(p.plan_start_date) }
      : null;
  return {
    tenant_id: tenantId,
    keap_order_id: Number(o.id),
    keap_contact_id: o.contact_id ? Number(o.contact_id) : o.contact?.id ? Number(o.contact.id) : null,
    first_name: o.contact?.first_name ?? null,
    last_name: o.contact?.last_name ?? null,
    email: o.contact?.email ?? null,
    shipping_phone: o.shipping_information?.phone || null,
    title: o.title ?? null,
    keap_status: o.status ?? null,
    pay_state: payStateOf(total, paid, refunded),
    order_type: o.order_type || null,
    order_date: when(o.order_date ?? o.creation_date),
    total,
    total_paid: paid,
    refund_total: refunded,
    items,
    product_names: [...new Set(items.map((i: any) => i.name).filter(Boolean))],
    plan,
    notes: o.notes || null,
    invoice_number: o.invoice_number ? Number(o.invoice_number) : null,
    keap_modified_at: when(o.modification_date),
    updated_at: new Date().toISOString(),
  };
}

/** Runs tasks a few at a time until done, the time is up, or Keap asks to slow down. */
async function pool<T>(items: T[], deadline: number, worker: (item: T) => Promise<void>): Promise<{ finished: number; busy: KeapBusy | null }> {
  let next = 0;
  let finished = 0;
  let busy: KeapBusy | null = null;
  async function lane() {
    while (!busy && next < items.length && Date.now() < deadline) {
      const item = items[next++];
      try {
        await worker(item);
        finished++;
      } catch (e) {
        if (e instanceof KeapBusy) busy = e;
        else throw e;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, lane));
  return { finished, busy };
}

async function settingsOf(db: Db, tenantId: string): Promise<Record<string, any>> {
  const { data } = await db.from('integrations').select('settings').eq('tenant_id', tenantId).eq('integration_key', 'keap').maybeSingle();
  return (data?.settings as Record<string, any>) ?? {};
}
async function saveSettings(db: Db, tenantId: string, patch: Record<string, any>) {
  const current = await settingsOf(db, tenantId);
  await db
    .from('integrations')
    .update({ settings: { ...current, history: { ...(current.history ?? {}), ...patch } } })
    .eq('tenant_id', tenantId)
    .eq('integration_key', 'keap');
}

/** Orders, page by page. New or changed orders get their payments read again. */
async function stepOrders(db: Db, tenantId: string, key: string, offset: number, deadline: number, progress: { offset: number }): Promise<SyncResult> {
  let total: number | null = null;
  while (Date.now() < deadline) {
    const page = await keapGet(key, `/orders?limit=500&offset=${offset}`);
    const orders: any[] = page?.orders ?? [];
    total = page?.count ?? total;
    if (orders.length) {
      const rows = orders.map((o) => orderRow(tenantId, o));
      const ids = rows.map((r) => r.keap_order_id);
      const { data: existing, error: readError } = await db.from('keap_orders').select('keap_order_id, keap_modified_at').eq('tenant_id', tenantId).in('keap_order_id', ids);
      if (readError) throw new Error(readError.message);
      const before = new Map((existing ?? []).map((e: any) => [Number(e.keap_order_id), e.keap_modified_at]));
      const withFlag = rows.map((r) => {
        const had = before.has(r.keap_order_id);
        const changed = !had || (r.keap_modified_at && new Date(r.keap_modified_at).getTime() !== new Date(before.get(r.keap_order_id) ?? 0).getTime());
        return changed ? { ...r, payments_synced_at: null } : r;
      });
      const { error } = await db.from('keap_orders').upsert(withFlag, { onConflict: 'tenant_id,keap_order_id' });
      if (error) throw new Error(error.message);
    }
    offset += orders.length;
    progress.offset = offset;
    if (orders.length < 500) return { step: 'payments', offset: 0, done: offset, total };
  }
  return { step: 'orders', offset, done: offset, total };
}

/** Each new or changed order's payments. Free orders and orders with nothing paid have none. */
async function stepPayments(db: Db, tenantId: string, key: string, deadline: number): Promise<SyncResult> {
  const { count: left } = await db.from('keap_orders').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).is('payments_synced_at', null);
  const { data: todo, error } = await db
    .from('keap_orders')
    .select('keap_order_id, total_paid, refund_total')
    .eq('tenant_id', tenantId)
    .is('payments_synced_at', null)
    .limit(600);
  if (error) throw new Error(error.message);
  if (!todo?.length) return { step: 'phones', offset: 0, done: 0, total: 0 };

  const now = new Date().toISOString();
  const nothingPaid = todo.filter((o: any) => Number(o.total_paid) <= 0 && Number(o.refund_total) <= 0).map((o: any) => o.keap_order_id);
  if (nothingPaid.length) {
    await db.from('keap_orders').update({ payments_synced_at: now }).eq('tenant_id', tenantId).in('keap_order_id', nothingPaid);
  }
  const withPayments = todo.filter((o: any) => !nothingPaid.includes(o.keap_order_id));
  const { finished, busy } = await pool(withPayments, deadline, async (o: any) => {
    const data = await keapGet(key, `/orders/${o.keap_order_id}/payments`);
    const list: any[] = Array.isArray(data) ? data : data?.payments ?? [];
    if (list.length) {
      const rows = list.map((p) => ({
        tenant_id: tenantId,
        keap_payment_id: Number(p.id ?? p.payment_id),
        keap_order_id: Number(o.keap_order_id),
        pay_date: when(p.pay_date),
        amount: num(p.amount),
        pay_status: p.pay_status ?? null,
        disputed: !!p.disputed,
        refund_of_payment_id: p.refund_invoice_payment_id ? Number(p.refund_invoice_payment_id) : null,
      }));
      const { error: upsertError } = await db.from('keap_payments').upsert(rows, { onConflict: 'tenant_id,keap_payment_id' });
      if (upsertError) throw new Error(upsertError.message);
    }
    await db.from('keap_orders').update({ payments_synced_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('keap_order_id', o.keap_order_id);
  });
  const remaining = Math.max(0, (left ?? 0) - nothingPaid.length - finished);
  if (busy) throw busy;
  return { step: remaining > 0 ? 'payments' : 'phones', offset: 0, done: finished + nothingPaid.length, total: left ?? null };
}

/** One phone per buyer: from their Keap contact card, else the order's shipping phone. */
async function stepPhones(db: Db, tenantId: string, key: string, deadline: number): Promise<SyncResult> {
  const { data: todo, error } = await db
    .from('keap_orders')
    .select('keap_contact_id, shipping_phone')
    .eq('tenant_id', tenantId)
    .eq('phone_checked', false)
    .not('keap_contact_id', 'is', null)
    .limit(1500);
  if (error) throw new Error(error.message);
  const contacts = new Map<number, string | null>();
  for (const r of todo ?? []) if (!contacts.has(Number(r.keap_contact_id)) || (!contacts.get(Number(r.keap_contact_id)) && r.shipping_phone)) contacts.set(Number(r.keap_contact_id), r.shipping_phone || null);
  if (!contacts.size) return { step: 'transactions', offset: 0, done: 0, total: 0 };

  const { finished, busy } = await pool([...contacts.entries()], deadline, async ([contactId, shipping]) => {
    const c = await keapGet(key, `/contacts/${contactId}?optional_properties=phone_numbers`);
    const phone = (c?.phone_numbers ?? []).map((p: any) => p?.number).find(Boolean) || shipping || null;
    await db.from('keap_orders').update({ phone, phone_checked: true }).eq('tenant_id', tenantId).eq('keap_contact_id', contactId);
  });
  if (busy) throw busy;
  const more = finished < contacts.size || (todo?.length ?? 0) >= 1500;
  return { step: more ? 'phones' : 'transactions', offset: 0, done: finished, total: null };
}

/** Card transactions (attempts), from the last refresh on. */
async function stepTransactions(db: Db, tenantId: string, key: string, offset: number, deadline: number, progress: { offset: number }): Promise<SyncResult> {
  const settings = await settingsOf(db, tenantId);
  const since: string | undefined = settings.history?.transactions_since;
  let total: number | null = null;
  while (Date.now() < deadline) {
    const page = await keapGet(key, `/transactions?limit=1000&offset=${offset}${since ? `&since=${encodeURIComponent(since)}` : ''}`);
    const list: any[] = page?.transactions ?? [];
    total = page?.count ?? total;
    if (list.length) {
      const rows = list.map((t) => ({
        tenant_id: tenantId,
        keap_transaction_id: Number(t.id),
        keap_contact_id: t.contact_id ? Number(t.contact_id) : null,
        order_ids: String(t.order_ids ?? '')
          .split(',')
          .map((s) => Number(s.trim()))
          .filter((n) => Number.isFinite(n) && n > 0),
        amount: num(t.amount),
        status: t.status ?? null,
        gateway: t.gateway ?? null,
        collection_method: t.collection_method ?? null,
        transaction_date: when(t.transaction_date),
      }));
      const { error } = await db.from('keap_transactions').upsert(rows, { onConflict: 'tenant_id,keap_transaction_id' });
      if (error) throw new Error(error.message);
    }
    offset += list.length;
    progress.offset = offset;
    if (list.length < 1000) return { step: 'done', offset: 0, done: offset, total };
  }
  return { step: 'transactions', offset, done: offset, total };
}

/** Runs one step (as much as fits) and says what comes next. */
export async function runKeapSyncStep(tenantId: string, step: SyncStep, offset: number): Promise<SyncResult> {
  const db = createAdminClient();
  const key = await keapKey(tenantId);
  const deadline = Date.now() + STEP_BUDGET_MS;
  if (step === 'orders' && offset === 0) await saveSettings(db, tenantId, { started_at: new Date().toISOString() });
  let result: SyncResult;
  const progress = { offset };
  try {
    if (step === 'orders') result = await stepOrders(db, tenantId, key, offset, deadline, progress);
    else if (step === 'payments') result = await stepPayments(db, tenantId, key, deadline);
    else if (step === 'phones') result = await stepPhones(db, tenantId, key, deadline);
    else if (step === 'transactions') result = await stepTransactions(db, tenantId, key, offset, deadline, progress);
    else result = { step: 'done', offset: 0, done: 0, total: null };
  } catch (e) {
    if (!(e instanceof KeapBusy)) throw e;
    // Keep what was done; the page waits and calls the same step again.
    if (e.daily) return { step, offset: progress.offset, done: 0, total: null, error: e.message };
    return { step, offset: progress.offset, done: 0, total: null, waitMs: e.waitMs };
  }
  if (result.step === 'done') {
    // Next refresh reads transactions from a day before this one started (a margin for late ones).
    const settings = await settingsOf(db, tenantId);
    const started = settings.history?.started_at ? new Date(settings.history.started_at) : new Date();
    await saveSettings(db, tenantId, { last_synced_at: new Date().toISOString(), transactions_since: new Date(started.getTime() - 86400000).toISOString() });
  }
  return result;
}

export async function keapHistoryStatus(tenantId: string) {
  const db = createAdminClient();
  const [{ count }, settings, { data: oldest }, connected] = await Promise.all([
    db.from('keap_orders').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    settingsOf(db, tenantId),
    db.from('keap_orders').select('order_date').eq('tenant_id', tenantId).not('order_date', 'is', null).order('order_date', { ascending: true }).limit(1),
    loadIntegration(tenantId, 'keap').then((r) => !!(r.data as any)?.credentials?.api_key).catch(() => false),
  ]);
  return {
    connected,
    orders: count ?? 0,
    oldest: oldest?.[0]?.order_date ?? null,
    lastSyncedAt: settings.history?.last_synced_at ?? null,
  };
}
