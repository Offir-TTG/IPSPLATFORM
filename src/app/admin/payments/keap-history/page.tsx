'use client';

export const dynamic = 'force-dynamic';

/**
 * Payments → Keap history (approved mockup "Keap order history"), in the
 * admin list template: search and filters, the state chips, the rows (each
 * opens the drawer), paging. A read-only copy of Keap's orders, their
 * payments and card attempts; nothing here is linked to enrollments or
 * payments. The first visit imports the history; "Refresh from Keap" brings
 * in what changed, until Keap is closed.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Archive, Check, Loader2, RefreshCw, SearchX } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import {
  ClearFilters,
  FilterCombo,
  FilterSelect,
  ListFooter,
  ListPanel,
  ListRow,
  ListRowMain,
  ListCell,
  ListSearch,
  ListSkeleton,
  ListState,
  PageTitle,
  QuickPills,
  StatusDot,
} from '@/components/admin/notifications/kit';
import { DrawerDetails, DrawerLead, DrawerSection, DrawerShell, DrawerStat, drawerButton } from '@/components/admin/drawer-kit';

type State = 'full' | 'partial' | 'unpaid' | 'refunded' | 'free';
type Row = {
  keap_order_id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  pay_state: State;
  order_date: string | null;
  total: number;
  total_paid: number;
  currency: string;
  plan: { payments: number; every_days: number | null } | null;
  /** The same email as a client in this portal / a contact in the marketing CRM. */
  portal_user: { id: string; href: string } | null;
  crm_contact: { id: string; href: string; archived: boolean } | null;
};
type Meta = { connected: boolean; orders: number; oldest: string | null; lastSyncedAt: string | null; products: string[] };
type Client = { name: string; email: string; orders: number; paid: number; currency: string; since: string | null };
type Detail = {
  order: any;
  payments: Array<{ keap_payment_id: number; pay_date: string | null; amount: number; pay_status: string | null; disputed: boolean; refund_of_payment_id: number | null }>;
  failedCount: number;
  failed?: Array<{ keap_transaction_id: number; transaction_date: string | null; amount: number; status: string | null }>;
};
type SyncStep = 'orders' | 'payments' | 'phones' | 'transactions' | 'done';

const K = 'admin.keapHistory.';
const COLS = 'minmax(0,1.3fr) minmax(0,1.6fr) minmax(0,0.7fr) minmax(0,0.95fr) minmax(0,0.8fr)';
const STATE_DOT: Record<State, 'green' | 'orange' | 'red' | 'grey'> = { full: 'green', partial: 'orange', unpaid: 'red', refunded: 'grey', free: 'grey' };
const STATE_BG: Record<State, string> = { full: 'bg-green-500', partial: 'bg-amber-500', unpaid: 'bg-red-500', refunded: 'bg-slate-400', free: 'bg-slate-400' };

export default function KeapHistoryPage() {
  const { t, direction } = useAdminLanguage();
  const rtl = direction === 'rtl';
  const [meta, setMeta] = useState<Meta | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState('');
  const [state, setState] = useState<'all' | State>('all');
  const [product, setProduct] = useState('');
  const [year, setYear] = useState('all');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [showFailed, setShowFailed] = useState(false);
  const [sync, setSync] = useState<{ running: boolean; step: SyncStep; offset: number; text: string; error: string | null } | null>(null);
  const pageSize = 25;

  const stateLabel = (s: State) =>
    ({
      full: t(`${K}state.full`, 'Paid in full'),
      partial: t(`${K}state.partial`, 'Partly paid'),
      unpaid: t(`${K}state.unpaid`, 'Not paid'),
      refunded: t(`${K}state.refunded`, 'Refunded'),
      free: t(`${K}state.free`, 'Free'),
    })[s];
  const money = (n: number, currency = 'USD') => {
    try {
      return new Intl.NumberFormat(rtl ? 'he-IL' : 'en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(Number(n) || 0);
    } catch {
      return `${n} ${currency}`;
    }
  };
  const date = (d: string | null) => (d ? new Date(d).toLocaleDateString(rtl ? 'he-IL' : 'en-GB') : '—');
  const fullName = (r: { first_name: string | null; last_name: string | null }) => `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || '—';
  const planLine = (plan: Row['plan']) =>
    plan
      ? t(`${K}planLine`, '{n} payments · every {d} days').replace('{n}', String(plan.payments)).replace('{d}', String(plan.every_days ?? '—'))
      : t(`${K}onePayment`, 'One payment');

  // A link can open the page on one person (?q=email, from the CRM contact).
  useEffect(() => {
    const fromLink = new URLSearchParams(window.location.search).get('q');
    if (fromLink) setQ(fromLink);
  }, []);

  // Search: typed text waits a moment; filters apply at once.
  const [debouncedQ, setDebouncedQ] = useState('');
  useEffect(() => {
    const h = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(h);
  }, [q]);
  useEffect(() => setPage(1), [debouncedQ, state, product, year]);

  const load = useCallback(
    async (withMeta = false) => {
      setLoading(true);
      const sp = new URLSearchParams();
      if (debouncedQ) sp.set('q', debouncedQ);
      if (state !== 'all') sp.set('state', state);
      if (product) sp.set('product', product);
      if (year !== 'all') sp.set('year', year);
      sp.set('page', String(page));
      if (withMeta) sp.set('meta', '1');
      try {
        const res = await fetch(`/api/admin/keap-history?${sp}`, { cache: 'no-store' });
        const json = await res.json();
        if (res.ok) {
          setRows(json.rows ?? []);
          setCount(json.count ?? 0);
          setCounts(json.counts ?? {});
          setClient(json.client ?? null);
          if (json.meta) setMeta(json.meta);
        }
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    },
    [debouncedQ, state, product, year, page],
  );
  const first = useRef(true);
  useEffect(() => {
    void load(first.current);
    first.current = false;
  }, [load]);

  // The order's details, when one is opened.
  useEffect(() => {
    setDetail(null);
    setShowFailed(false);
    if (openId == null) return;
    void fetch(`/api/admin/keap-history/${openId}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => d?.order && setDetail(d));
  }, [openId]);
  const loadFailed = async () => {
    if (openId == null) return;
    const d = await fetch(`/api/admin/keap-history/${openId}?failed=1`, { cache: 'no-store' }).then((r) => r.json());
    if (d?.order) setDetail(d);
    setShowFailed(true);
  };

  // Import / refresh: one step at a time until done; a stop can be continued.
  const stepText = (step: SyncStep, done: number, total: number | null) => {
    if (step === 'orders') return t(`${K}sync.orders`, 'Bringing in orders… {done} of {total}').replace('{done}', String(done)).replace('{total}', total != null ? String(total) : '…');
    if (step === 'payments') return t(`${K}sync.payments`, "Bringing in each order's payments…");
    if (step === 'phones') return t(`${K}sync.phones`, "Bringing in buyers' phone numbers…");
    if (step === 'transactions') return t(`${K}sync.transactions`, 'Bringing in card attempts… {done} of {total}').replace('{done}', String(done)).replace('{total}', total != null ? String(total) : '…');
    return t(`${K}sync.done`, 'Done');
  };
  const runSync = async (from?: { step: SyncStep; offset: number }) => {
    let step: SyncStep = from?.step ?? 'orders';
    let offset = from?.offset ?? 0;
    setSync({ running: true, step, offset, text: stepText(step, 0, null), error: null });
    while (step !== 'done') {
      try {
        const res = await fetch('/api/admin/keap-history/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step, offset }) });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || t(`${K}sync.failed`, 'The import stopped.'));
        if (json.error) throw new Error(json.error);
        // Keap asked to slow down: wait, then the same step again (progress is kept).
        if (json.waitMs) {
          step = json.step;
          offset = json.offset ?? offset;
          const secs = Math.ceil(json.waitMs / 1000);
          setSync({ running: true, step, offset, text: t(`${K}sync.pause`, 'Keap asked to slow down. Continuing in {s} seconds…').replace('{s}', String(secs)), error: null });
          await new Promise((r) => setTimeout(r, json.waitMs));
          continue;
        }
        const shown = json.step === 'orders' || json.step === 'transactions' ? json.offset : json.done;
        step = json.step;
        offset = json.offset ?? 0;
        setSync({ running: true, step, offset, text: stepText(step, shown, json.total ?? null), error: null });
      } catch (e) {
        setSync({ running: false, step, offset, text: '', error: e instanceof Error ? e.message : String(e) });
        return;
      }
    }
    setSync(null);
    await load(true);
  };

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const thisYear = new Date().getFullYear();
  const fromYear = meta?.oldest ? new Date(meta.oldest).getFullYear() : thisYear;
  const years = Array.from({ length: thisYear - fromYear + 1 }, (_, i) => String(thisYear - i));
  const filtersOn = !!q || state !== 'all' || !!product || year !== 'all';
  const clearFilters = () => {
    setQ('');
    setState('all');
    setProduct('');
    setYear('all');
  };
  const num = (n: number) => n.toLocaleString(rtl ? 'he-IL' : 'en-US');

  let listState: React.ReactNode = undefined;
  if (!loaded || (loading && rows.length === 0)) listState = <ListSkeleton />;
  else if (rows.length === 0)
    listState = (
      <ListState
        icon={SearchX}
        tone="grey"
        title={t(`${K}none`, 'No orders match.')}
        action={filtersOn ? <ClearFilters show label={t('admin.users.filters.clear', 'Clear Filters')} onClear={clearFilters} /> : undefined}
      />
    );

  const syncBox = sync && (
    <div className="grid gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
      {sync.running ? (
        <>
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
            {sync.text}
          </span>
          <span className="text-[13px] text-muted-foreground">{t(`${K}sync.keepOpen`, 'Keep this page open until it finishes. If it stops, start again and it continues, with no duplicates.')}</span>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <span role="alert" className="text-sm font-semibold text-red-700">{sync.error}</span>
          <button type="button" onClick={() => runSync({ step: sync.step, offset: sync.offset })} className="min-h-[40px] rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
            {t(`${K}sync.continue`, 'Continue')}
          </button>
        </div>
      )}
    </div>
  );

  // The drawer's payment plan progress.
  const planDone = detail ? detail.payments.filter((p) => Number(p.amount) > 0 && !p.refund_of_payment_id).length : 0;
  const planN = Number(detail?.order?.plan?.payments) || 1;

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-5 p-4 md:p-6" dir={direction}>
        <PageTitle
          icon={Archive}
          title={t(`${K}title`, 'Keap history')}
          description={t(`${K}description`, "Keap's orders and payments, read-only. Not linked to today's enrollments and payments.")}
          actions={
            meta && meta.orders > 0 ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[13px] text-muted-foreground">
                  {t(`${K}summary`, '{n} orders · since {from}').replace('{n}', num(meta.orders)).replace('{from}', meta.oldest ? date(meta.oldest) : '—')}
                  {meta.lastSyncedAt ? ` · ${t(`${K}lastSynced`, 'Updated {date}').replace('{date}', date(meta.lastSyncedAt))}` : ''}
                </span>
                <button
                  type="button"
                  disabled={!!sync?.running || !meta.connected}
                  onClick={() => runSync()}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-primary hover:bg-muted disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${sync?.running ? 'animate-spin' : ''}`} aria-hidden />
                  {t(`${K}refresh`, 'Refresh from Keap')}
                </button>
              </div>
            ) : undefined
          }
        />

        {meta && !meta.connected && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {t(`${K}notConnected`, 'Keap is not connected. Add its key in Settings → Integrations → Keap.')}
            <Link href="/admin/config/integrations?i=keap" className="font-semibold text-primary">
              {t(`${K}toSettings`, 'Go to Settings')}
            </Link>
          </div>
        )}

        {/* First time: nothing imported yet. */}
        {meta && meta.connected && meta.orders === 0 && !sync && (
          <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm md:max-w-2xl">
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-900">
              <Check className="h-5 w-5 shrink-0" aria-hidden />
              <span>
                <b>{t(`${K}connected`, 'Keap is connected')}</b> · {t(`${K}connectedHint`, 'The connection is set in Settings → Integrations → Keap.')}
              </span>
            </div>
            <div className="grid gap-1.5 text-sm leading-relaxed">
              <b>{t(`${K}whatIn`, 'What comes in')}</b>
              <span>{t(`${K}whatInOrders`, "Every order: items, amounts, state, and the buyer's name, email and phone as written in Keap.")}</span>
              <span>{t(`${K}whatInPayments`, "Each order's payments and its payment plan. Failed card attempts are kept and shown only on request.")}</span>
              <b className="mt-1">{t(`${K}whatNot`, 'What does not come in')}</b>
              <span>{t(`${K}whatNotText`, "Contacts, tags and active subscriptions. Nothing is created in today's enrollments or payments.")}</span>
            </div>
            <button type="button" onClick={() => runSync()} className="min-h-[50px] rounded-xl bg-primary text-base font-bold text-primary-foreground">
              {t(`${K}import`, 'Bring in the history')}
            </button>
          </section>
        )}

        {syncBox}

        {meta && meta.orders > 0 && (
          <ListPanel
            label={t(`${K}title`, 'Keap history')}
            toolbar={
              <>
                <ListSearch
                  value={q}
                  onChange={setQ}
                  placeholder={t(`${K}searchPlaceholder`, 'Search by name, email, phone or order number…')}
                  clearLabel={t('admin.users.list.clearSearch', 'Clear search')}
                />
                <FilterCombo
                  label={t(`${K}product`, 'Product')}
                  value={product}
                  onChange={setProduct}
                  dir={direction}
                  searchPlaceholder={t(`${K}productSearch`, 'Search a product…')}
                  emptyText={t(`${K}productNone`, 'No product by that name.')}
                  options={[{ value: '', label: t(`${K}allProducts`, 'All products ({n})').replace('{n}', String(meta.products.length)) }, ...meta.products.map((p) => ({ value: p, label: p }))]}
                />
                <FilterSelect
                  label={t(`${K}year`, 'Year')}
                  value={year}
                  onChange={setYear}
                  dir={direction}
                  options={[{ value: 'all', label: t(`${K}allYears`, 'All years') }, ...years.map((y) => ({ value: y, label: y }))]}
                />
              </>
            }
            pills={
              <>
                <QuickPills<'all' | State>
                  label={t(`${K}col.state`, 'State')}
                  value={state}
                  onChange={setState}
                  options={[
                    { value: 'all', label: t(`${K}all`, 'All'), count: counts.all },
                    ...(['full', 'partial', 'unpaid', 'refunded', 'free'] as const).map((s) => ({
                      value: s,
                      label: (
                        <span className="inline-flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${STATE_BG[s]}`} aria-hidden />
                          {stateLabel(s)}
                        </span>
                      ),
                      count: counts[s],
                    })),
                  ]}
                />
                <span className="shrink-0">
                  <ClearFilters show={filtersOn} label={t('admin.users.filters.clear', 'Clear Filters')} onClear={clearFilters} />
                </span>
              </>
            }
            extra={
              client ? (
                <div className="flex flex-wrap items-center gap-3.5 text-sm">
                  <span className="flex min-w-0 flex-col">
                    <b className="text-[15px]">{client.name || '—'}</b>
                    <span dir="ltr" className="text-muted-foreground [text-align:inherit]">{client.email}</span>
                  </span>
                  <span className="ms-auto flex flex-wrap gap-6">
                    <span className="flex flex-col"><span className="text-xs text-muted-foreground">{t(`${K}clientOrders`, 'Orders')}</span><b>{client.orders}</b></span>
                    <span className="flex flex-col"><span className="text-xs text-muted-foreground">{t(`${K}clientPaid`, 'Paid in total')}</span><b className="text-green-700 dark:text-green-400">{money(client.paid, client.currency)}</b></span>
                    <span className="flex flex-col"><span className="text-xs text-muted-foreground">{t(`${K}clientSince`, 'Client since')}</span><b>{date(client.since)}</b></span>
                  </span>
                </div>
              ) : undefined
            }
            columns={COLS}
            head={[t(`${K}col.client`, 'Client'), t(`${K}col.order`, 'Order'), t(`${K}col.date`, 'Date'), t(`${K}col.paid`, 'Paid / total'), t(`${K}col.state`, 'State')]}
            state={listState}
            footer={
              loaded && count > 0 ? (
                <ListFooter
                  showingText={t('admin.users.list.showingRange', 'Showing {from}–{to} of {total}')
                    .replace('{from}', num((page - 1) * pageSize + 1))
                    .replace('{to}', num(Math.min(page * pageSize, count)))
                    .replace('{total}', num(count))}
                  pageText={t('admin.users.list.pageOf', 'Page {page} of {pages}').replace('{page}', String(page)).replace('{pages}', String(totalPages))}
                  page={page}
                  totalPages={totalPages}
                  onPage={setPage}
                  prevLabel={t('admin.users.list.prevPage', 'Previous page')}
                  nextLabel={t('admin.users.list.nextPage', 'Next page')}
                  rtl={rtl}
                />
              ) : undefined
            }
          >
            {rows.map((r) => (
              <ListRow key={r.keap_order_id} columns={COLS} onOpen={() => setOpenId(r.keap_order_id)} label={`${fullName(r)} · ${r.title ?? ''}`} selected={openId === r.keap_order_id} rtl={rtl}>
                <ListRowMain
                  title={<bdi className="font-semibold">{fullName(r)}</bdi>}
                  extra={
                    (r.portal_user || r.crm_contact) && (
                      <span className="relative z-10 inline-flex flex-wrap gap-1">
                        {r.portal_user && (
                          <Link
                            href={r.portal_user.href}
                            title={t(`${K}badge.portalHint`, 'This email is a client in the portal. Open the client.')}
                            className="rounded-full bg-primary/10 px-2 py-0.5 text-[11.5px] font-bold text-primary no-underline hover:bg-primary/20"
                          >
                            {t(`${K}badge.portal`, 'Portal client')}
                          </Link>
                        )}
                        {r.crm_contact && (
                          <a
                            href={r.crm_contact.href}
                            target="_blank"
                            rel="noreferrer"
                            title={t(`${K}badge.crmHint`, 'This email is a contact in the CRM. Opens the CRM in a new tab.')}
                            className={`rounded-full px-2 py-0.5 text-[11.5px] font-bold no-underline ${r.crm_contact.archived ? 'bg-muted text-muted-foreground' : 'bg-sky-100 text-sky-800 hover:bg-sky-200 dark:bg-sky-950/50 dark:text-sky-300'}`}
                          >
                            {r.crm_contact.archived ? t(`${K}badge.crmArchived`, 'In CRM (archived)') : t(`${K}badge.crm`, 'In CRM')}
                          </a>
                        )}
                      </span>
                    )
                  }
                  sub={<bdi dir="ltr">{r.email}</bdi>}
                />
                <ListCell label={t(`${K}col.order`, 'Order')}>
                  <bdi className="block">{r.title}</bdi>
                  <span className="text-[12.5px] text-muted-foreground">#{r.keap_order_id} · {r.pay_state === 'free' ? t(`${K}noPayment`, 'No payment') : planLine(r.plan)}</span>
                </ListCell>
                <ListCell label={t(`${K}col.date`, 'Date')}>{date(r.order_date)}</ListCell>
                <ListCell label={t(`${K}col.paid`, 'Paid / total')}>
                  <b>{money(r.total_paid, r.currency)}</b> <span className="text-muted-foreground">/ {money(r.total, r.currency)}</span>
                </ListCell>
                <ListCell label={t(`${K}col.state`, 'State')}>
                  <StatusDot tone={STATE_DOT[r.pay_state]}>{stateLabel(r.pay_state)}</StatusDot>
                </ListCell>
              </ListRow>
            ))}
          </ListPanel>
        )}
      </div>

      {/* One order: the standard admin drawer. */}
      <DrawerShell
        open={openId != null}
        onClose={() => setOpenId(null)}
        status={detail ? `${t(`${K}orderNo`, 'Order #{id}').replace('{id}', String(detail.order.keap_order_id))} · ${stateLabel(detail.order.pay_state)}` : '…'}
        statusDot={detail ? STATE_BG[detail.order.pay_state as State] : 'bg-muted-foreground/40'}
        lead={<DrawerLead icon={<Archive className="h-5 w-5" aria-hidden />} />}
        title={detail?.order?.title ?? ''}
        subtitle={detail ? `${fullName(detail.order)} · ${date(detail.order.order_date)}${detail.order.order_type ? ` · ${detail.order.order_type}` : ''}` : undefined}
        description={t(`${K}title`, 'Keap history')}
        stats={
          detail ? (
            <>
              <DrawerStat small label={t(`${K}total`, 'Total')} value={money(detail.order.total, detail.order.currency)} />
              <DrawerStat small label={t(`${K}paid`, 'Paid')} value={money(detail.order.total_paid, detail.order.currency)} className="text-green-700 dark:text-green-400" />
              <DrawerStat small label={t(`${K}balance`, 'Balance')} value={money(Math.max(0, Number(detail.order.total) - Number(detail.order.total_paid)), detail.order.currency)} />
            </>
          ) : (
            <span className="col-span-3 grid place-items-center py-3"><Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden /></span>
          )
        }
        footer={
          detail?.order?.email ? (
            <button
              type="button"
              className={drawerButton}
              onClick={() => {
                setQ(detail.order.email);
                setState('all');
                setProduct('');
                setYear('all');
                setOpenId(null);
              }}
            >
              {t(`${K}allOfClient`, "All of this client's orders")}
            </button>
          ) : (
            <span />
          )
        }
      >
        {detail && (
          <>
            {(detail.order.portal_user || detail.order.crm_contact) && (
              <div className="flex flex-wrap gap-2">
                {detail.order.portal_user && (
                  <Link
                    href={detail.order.portal_user.href}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-primary/10 px-3 text-[13px] font-bold text-primary no-underline hover:bg-primary/20"
                  >
                    {t(`${K}badge.portal`, 'Portal client')} ←
                  </Link>
                )}
                {detail.order.crm_contact && (
                  <a
                    href={detail.order.crm_contact.href}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-[13px] font-bold no-underline ${detail.order.crm_contact.archived ? 'bg-muted text-muted-foreground' : 'bg-sky-100 text-sky-800 hover:bg-sky-200 dark:bg-sky-950/50 dark:text-sky-300'}`}
                  >
                    {detail.order.crm_contact.archived ? t(`${K}badge.crmArchived`, 'In CRM (archived)') : t(`${K}badge.crm`, 'In CRM')} ↗
                  </a>
                )}
              </div>
            )}

            <DrawerSection title={t(`${K}buyer`, 'The client (as written in Keap)')}>
              <DrawerDetails
                rows={[
                  { label: t(`${K}col.client`, 'Client'), value: <bdi>{fullName(detail.order)}</bdi> },
                  ...(detail.order.email ? [{ label: t(`${K}email`, 'Email'), value: <bdi dir="ltr">{detail.order.email}</bdi> }] : []),
                  ...(detail.order.phone ? [{ label: t(`${K}phone`, 'Phone'), value: <bdi dir="ltr">{detail.order.phone}</bdi> }] : []),
                ]}
              />
            </DrawerSection>

            <DrawerSection title={t(`${K}items`, 'Items')}>
              <DrawerDetails
                rows={[
                  ...(detail.order.items ?? []).map((it: any, i: number) => ({ label: `${it.name} × ${it.qty}${'​'.repeat(i)}`, value: money(it.price, detail.order.currency) })),
                  ...(Number(detail.order.refund_total) > 0 ? [{ label: t(`${K}refunded`, 'Refunded'), value: money(detail.order.refund_total, detail.order.currency) }] : []),
                ]}
              />
            </DrawerSection>

            {detail.order.plan && (
              <DrawerSection title={t(`${K}plan`, 'Payment plan')}>
                <div className="grid gap-2 px-3.5 py-3">
                  <span className="text-sm text-muted-foreground">{planLine(detail.order.plan)}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-primary/15">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.round((100 * planDone) / planN))}%` }} />
                  </div>
                  <span className="text-[13px]">{t(`${K}planProgress`, '{done} of {n} payments made').replace('{done}', String(Math.min(planDone, planN))).replace('{n}', String(planN))}</span>
                </div>
              </DrawerSection>
            )}

            <DrawerSection title={t(`${K}payments`, 'Payments')}>
              <div className="grid gap-1.5 px-3.5 py-3">
                {detail.payments.length === 0 && <span className="text-sm text-muted-foreground">{t(`${K}noPayments`, 'No payments recorded.')}</span>}
                {detail.payments.map((p) => (
                  <div key={p.keap_payment_id} className="flex items-center justify-between gap-3 text-sm">
                    <span>{date(p.pay_date)}</span>
                    <span className="flex items-center gap-2.5">
                      <b className="tabular-nums">{money(p.amount, detail.order.currency)}</b>
                      <StatusDot tone={p.refund_of_payment_id ? 'grey' : /approved/i.test(p.pay_status ?? '') ? 'green' : 'grey'}>
                        {p.refund_of_payment_id ? t(`${K}payRefund`, 'Refund') : /approved/i.test(p.pay_status ?? '') ? t(`${K}payApproved`, 'Approved') : p.pay_status ?? '—'}
                      </StatusDot>
                    </span>
                  </div>
                ))}
                {detail.failedCount > 0 && !showFailed && (
                  <button type="button" onClick={loadFailed} className="justify-self-start py-1 text-[13px] font-semibold text-muted-foreground hover:text-foreground">
                    {t(`${K}showFailed`, 'Show {n} failed card attempts').replace('{n}', String(detail.failedCount))}
                  </button>
                )}
                {showFailed &&
                  (detail.failed ?? []).map((f) => (
                    <div key={f.keap_transaction_id} className="flex items-center justify-between gap-3 text-[13px] text-muted-foreground">
                      <span>{date(f.transaction_date)}</span>
                      <span className="flex items-center gap-2.5">
                        <span className="tabular-nums">{money(f.amount, detail.order.currency)}</span>
                        <StatusDot tone="red">{f.status}</StatusDot>
                      </span>
                    </div>
                  ))}
              </div>
            </DrawerSection>

            {detail.order.notes && (
              <DrawerSection title={t(`${K}notes`, 'Notes in Keap')}>
                <p className="whitespace-pre-line px-3.5 py-3 text-sm">{detail.order.notes}</p>
              </DrawerSection>
            )}

            <p className="text-[12.5px] text-muted-foreground">
              {t(`${K}readOnly`, 'Read-only. Keap order number: {id} · status in Keap: {status}')
                .replace('{id}', String(detail.order.keap_order_id))
                .replace('{status}', detail.order.keap_status ?? '—')}
            </p>
          </>
        )}
      </DrawerShell>
    </AdminLayout>
  );
}
