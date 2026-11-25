'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Download, RefreshCw, Search, SlidersHorizontal, Undo2, Wallet, WifiOff, X, XCircle } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { useHelp } from '@/hooks/useHelp';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import {
  ClearFilters,
  FilterSelect,
  IconButton,
  KpiItem,
  KpiStrip,
  ListCell,
  ListFooter,
  ListPanel,
  ListRow,
  ListRowMain,
  ListSearch,
  ListSkeleton,
  ListState,
  QuickPills,
  kitButton,
  usePagedList,
} from '@/components/admin/notifications/kit';
import { PaymentsHeader } from '@/components/admin/schedules/PaymentsHeader';
import { RefundDialog, type RefundTarget } from '@/components/admin/schedules/RefundDialog';

interface Transaction {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  enrollment_id: string;
  product_name: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_id: string;
  stripe_payment_intent_id?: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded' | 'partially_refunded';
  refund_amount?: number;
  failure_reason?: string;
  created_at: string;
  metadata?: { payment_number?: number; payment_type?: string; paid_date?: string } & Record<string, unknown>;
  payment_number?: number;
}

const STATUSES = ['completed', 'failed', 'refunded', 'partially_refunded', 'pending'] as const;
type StatusFilter = 'all' | (typeof STATUSES)[number];
const TONE: Record<string, { dot: string; text: string }> = {
  completed: { dot: 'bg-green-600', text: 'text-green-700 dark:text-green-400' },
  pending: { dot: 'bg-amber-500', text: 'text-amber-800 dark:text-amber-300' },
  failed: { dot: 'bg-red-600', text: 'text-red-700 dark:text-red-300' },
  refunded: { dot: 'bg-violet-500', text: 'text-violet-700 dark:text-violet-300' },
  partially_refunded: { dot: 'bg-violet-500', text: 'text-violet-700 dark:text-violet-300' },
};

/**
 * Payments · Done (it was the Transactions page): money that actually
 * moved. The numbers (received, completed, refunded, failed) filter the
 * list; search, product, payment method, dates and status pills; export to
 * CSV; ten to a page. Pressing a payment opens its drawer with the details
 * the old Details dialog showed, a link to the planned payment it paid,
 * and Refund. ?payment=<id> opens that payment's drawer.
 */
export default function TransactionsPage() {
  useHelp('payments-transactions');
  const { t, direction, language } = useAdminLanguage();
  const { toast } = useToast();
  const rtl = direction === 'rtl';
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  const searchParams = useSearchParams();

  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [product, setProduct] = useState('all');
  const [method, setMethod] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(searchParams.get('payment'));
  const [refundFor, setRefundFor] = useState<RefundTarget | null>(null);
  const [exporting, setExporting] = useState(false);

  const ui = useRef({ t, toast });
  ui.current = { t, toast };

  // Everything is loaded once (the server returns every payment) and filtered here.
  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/payments/transactions?_t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setItems(data.transactions || []);
      setLoadError(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoadError(true);
      ui.current.toast({
        title: ui.current.t('common.error', 'Error'),
        description: ui.current.t('admin.payments.transactions.loadError', 'Failed to load transactions'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (status !== 'all' && status !== 'partially_refunded') params.append('status', status);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      const response = await fetch(`/api/admin/payments/transactions/export?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to export transactions');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: t('common.success', 'Success'), description: t('admin.payments.transactions.exportSuccess', 'Transactions exported successfully') });
    } catch (error: any) {
      toast({ title: t('common.error', 'Error'), description: error.message || t('admin.payments.transactions.exportError', 'Failed to export transactions'), variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const money = (amount: number, currency?: string) => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: currency || 'USD' }).format(amount || 0);
    } catch {
      return `${amount}`;
    }
  };
  const date = (iso?: string | null, withTime = false) =>
    iso
      ? new Date(iso).toLocaleString(locale, { day: 'numeric', month: 'short', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) })
      : '—';
  const statusLabel = (s: string) =>
    ({
      completed: t('admin.payments.transactions.status.completed', 'Completed'),
      pending: t('admin.payments.transactions.status.pending', 'Pending'),
      failed: t('admin.payments.transactions.status.failed', 'Failed'),
      refunded: t('admin.payments.transactions.status.refunded', 'Refunded'),
      partially_refunded: t('admin.payments.transactions.status.partiallyRefunded', 'Partially Refunded'),
    })[s] ?? s;
  const methodLabel = (m: string) => t(`admin.payments.paymentType.${(m || 'unknown').toLowerCase()}`, m || 'unknown');
  const paymentNo = (x: Transaction) => x.payment_number ?? x.metadata?.payment_number;
  const isRefunded = (x: Transaction) => x.status === 'refunded' || x.status === 'partially_refunded';

  // "All" shows money that moved; planned payments that are still pending have their own pill.
  const done = useMemo(() => items.filter((x) => x.status !== 'pending'), [items]);
  const counts = useMemo(
    () => ({
      received: items.filter((x) => x.status === 'completed' || x.status === 'partially_refunded').reduce((s, x) => s + Number(x.amount || 0) - Number(x.refund_amount || 0), 0),
      currency: items[0]?.currency || 'USD',
      done: done.length,
      completed: items.filter((x) => x.status === 'completed').length,
      refunded: items.filter(isRefunded).length,
      failed: items.filter((x) => x.status === 'failed').length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, done],
  );
  const products = useMemo(() => [...new Set(items.map((x) => x.product_name).filter(Boolean))].sort(), [items]);
  const methods = useMemo(() => [...new Set(items.map((x) => x.payment_method).filter(Boolean))].sort(), [items]);

  const beforeStatus = useMemo(() => {
    const q = search.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom).getTime() : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;
    return items.filter((x) => {
      const time = new Date(x.created_at).getTime();
      return (
        (product === 'all' || x.product_name === product) &&
        (method === 'all' || x.payment_method === method) &&
        (from === null || time >= from) &&
        (to === null || time <= to) &&
        (!q || `${x.user_name} ${x.user_email} ${x.product_name} ${x.transaction_id}`.toLowerCase().includes(q))
      );
    });
  }, [items, search, product, method, dateFrom, dateTo]);
  const shown = useMemo(
    () =>
      (status === 'all' ? beforeStatus.filter((x) => x.status !== 'pending') : beforeStatus.filter((x) => x.status === status)).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [beforeStatus, status],
  );
  const pill = (s: string) => beforeStatus.filter((x) => x.status === s).length;

  const paged = usePagedList(shown, `${search}|${status}|${product}|${method}|${dateFrom}|${dateTo}`);
  const moreCount = [dateFrom, dateTo].filter(Boolean).length;
  const filtersOn = !!search || status !== 'all' || product !== 'all' || method !== 'all' || moreCount > 0;
  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setProduct('all');
    setMethod('all');
    setDateFrom('');
    setDateTo('');
  };
  const toggleStatus = (s: StatusFilter) => setStatus((cur) => (cur === s ? 'all' : s));
  const filteredNow = t('admin.list.filteredNow', 'Filtered now');
  const num = (n: number) => n.toLocaleString();
  const open = items.find((x) => x.id === openId) ?? null;
  const COLS = '110px minmax(0,1.1fr) minmax(0,1.2fr) 120px 120px 150px';
  const field = 'h-11 w-full rounded-lg border border-border bg-card px-3 text-foreground outline-none focus:border-primary dark:[color-scheme:dark]';
  const initials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?';
  const refundTarget = (x: Transaction): RefundTarget => ({
    id: x.id,
    user_name: x.user_name,
    product_name: x.product_name,
    amount: Number(x.amount),
    currency: x.currency,
    refunded: Number(x.refund_amount || 0),
    payment_number: paymentNo(x),
  });

  let state: ReactNode = undefined;
  if (!loaded || (loading && items.length === 0)) state = <ListSkeleton />;
  else if (loadError && items.length === 0)
    state = (
      <ListState
        icon={WifiOff}
        tone="red"
        title={t('admin.list.loadError', "We couldn't load the list")}
        text={t('admin.list.loadErrorText', 'The internet connection may have dropped. Nothing was deleted.')}
        action={
          <button type="button" onClick={() => void load()} className={kitButton.primary}>
            {t('admin.list.retry', 'Try again')}
          </button>
        }
      />
    );
  else if (shown.length === 0)
    state = (
      <ListState
        icon={filtersOn ? Search : Wallet}
        tone={filtersOn ? 'grey' : 'primary'}
        title={t('admin.payments.transactions.noTransactionsFound', 'No Transactions Found')}
        text={filtersOn ? t('admin.list.noMatchText', 'Clear the search and filters to see the whole list.') : undefined}
        action={
          filtersOn ? (
            <button type="button" onClick={clearFilters} className={kitButton.secondary}>
              {t('admin.payments.transactions.clearFilters', 'Clear filters')}
            </button>
          ) : undefined
        }
      />
    );

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-5 p-4 md:p-6" dir={direction}>
        <PaymentsHeader active="done" badge={loaded ? num(counts.done) : undefined} onRecorded={() => void load()} />

        <KpiStrip label={t('admin.list.numbers', 'Numbers')}>
          <KpiItem
            icon={<Wallet />}
            label={t('admin.payments.combined.received', 'Received')}
            value={loaded ? money(counts.received, counts.currency) : '—'}
            subtitle={loaded ? t('admin.payments.combined.receivedSub', '{n} payments, after refunds').replace('{n}', num(counts.completed + pill('partially_refunded'))) : undefined}
            onClick={clearFilters}
          />
          <KpiItem
            icon={<CheckCircle2 />}
            tone="green"
            label={t('admin.payments.transactions.completed', 'Completed')}
            value={loaded ? num(counts.completed) : '—'}
            onClick={() => toggleStatus('completed')}
            active={status === 'completed'}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<Undo2 />}
            tone="grey"
            label={t('admin.payments.transactions.refunded', 'Refunded')}
            value={loaded ? num(counts.refunded) : '—'}
            subtitle={t('admin.payments.combined.refundedSub', 'Full or partial')}
            onClick={() => toggleStatus('refunded')}
            active={status === 'refunded'}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<XCircle />}
            tone={counts.failed > 0 ? 'amber' : 'grey'}
            label={t('admin.payments.transactions.status.failed', 'Failed')}
            value={loaded ? num(counts.failed) : '—'}
            onClick={() => toggleStatus('failed')}
            active={status === 'failed'}
            activeNote={filteredNow}
          />
        </KpiStrip>

        <ListPanel
          label={t('admin.payments.combined.tabDone', 'Done')}
          toolbar={
            <>
              <ListSearch
                value={search}
                onChange={setSearch}
                placeholder={t('admin.payments.combined.searchDone', 'Search by name, email or transaction number')}
                clearLabel={t('admin.users.list.clearSearch', 'Clear search')}
              />
              <FilterSelect
                label={t('admin.payments.transactions.table.product', 'Product')}
                value={product}
                onChange={setProduct}
                dir={direction}
                options={[{ value: 'all', label: t('common.allProducts', 'All products') }, ...products.map((p) => ({ value: p, label: p }))]}
              />
              <FilterSelect
                label={t('admin.payments.transactions.table.paymentType', 'Payment type')}
                value={method}
                onChange={setMethod}
                dir={direction}
                options={[{ value: 'all', label: t('admin.payments.schedules.typeAll', 'All Types') }, ...methods.map((m) => ({ value: m, label: methodLabel(m) }))]}
              />
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                className={`inline-flex h-11 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium ${
                  moreOpen || moreCount > 0 ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-foreground hover:bg-muted'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
                {t('admin.payments.combined.dates', 'Dates')}
                {moreCount > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">{moreCount}</span>
                )}
              </button>
              <button type="button" onClick={() => void exportCsv()} disabled={exporting} className={kitButton.secondary}>
                <Download className="h-4 w-4" aria-hidden />
                {t('admin.payments.combined.exportCsv', 'Export to CSV')}
              </button>
              <IconButton label={t('common.refresh', 'Refresh')} onClick={() => void load()} disabled={loading}>
                <RefreshCw className={`h-[18px] w-[18px] ${loading ? 'animate-spin' : ''}`} aria-hidden />
              </IconButton>
            </>
          }
          pills={
            <>
              <QuickPills<StatusFilter>
                label={t('admin.payments.transactions.table.status', 'Status')}
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'all', label: t('admin.payments.transactions.allStatuses', 'All'), count: beforeStatus.filter((x) => x.status !== 'pending').length },
                  ...STATUSES.map((s) => ({
                    value: s,
                    label: (
                      <span className="inline-flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${TONE[s].dot}`} aria-hidden />
                        {statusLabel(s)}
                      </span>
                    ),
                    count: pill(s),
                  })),
                ]}
              />
              <span className="shrink-0">
                <ClearFilters show={filtersOn} label={t('admin.payments.transactions.clearFilters', 'Clear filters')} onClear={clearFilters} />
              </span>
            </>
          }
          extra={
            moreOpen ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-muted-foreground">{t('common.dateFrom', 'From date')}</span>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={field} />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-muted-foreground">{t('common.dateTo', 'To date')}</span>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={field} />
                </label>
              </div>
            ) : undefined
          }
          columns={COLS}
          head={[
            t('admin.payments.transactions.table.date', 'Date'),
            t('admin.payments.transactions.table.user', 'User'),
            t('admin.payments.schedules.table.productPayment', 'Product and payment'),
            t('admin.payments.transactions.table.amount', 'Amount'),
            t('admin.payments.transactions.table.paymentType', 'Payment type'),
            t('admin.payments.transactions.table.status', 'Status'),
          ]}
          state={state}
          footer={
            loaded && shown.length > 0 ? (
              <ListFooter
                showingText={t('admin.users.list.showingRange', 'Showing {from}–{to} of {total}')
                  .replace('{from}', num(paged.start + 1))
                  .replace('{to}', num(paged.start + paged.pageItems.length))
                  .replace('{total}', num(shown.length))}
                pageText={t('admin.users.list.pageOf', 'Page {page} of {pages}').replace('{page}', String(paged.page)).replace('{pages}', String(paged.totalPages))}
                page={paged.page}
                totalPages={paged.totalPages}
                onPage={paged.setPage}
                prevLabel={t('admin.users.list.prevPage', 'Previous page')}
                nextLabel={t('admin.users.list.nextPage', 'Next page')}
                rtl={rtl}
              />
            ) : undefined
          }
        >
          {paged.pageItems.map((x) => {
            const tone = TONE[x.status] ?? TONE.pending;
            const n = paymentNo(x);
            return (
              <ListRow key={x.id} columns={COLS} onOpen={() => setOpenId(x.id)} label={`${x.user_name} · ${x.product_name}`} selected={openId === x.id} rtl={rtl}>
                <ListCell label={t('admin.payments.transactions.table.date', 'Date')}>{date(x.created_at)}</ListCell>
                <ListRowMain
                  lead={
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary" aria-hidden>
                      {initials(x.user_name)}
                    </span>
                  }
                  title={<bdi className="font-semibold">{x.user_name}</bdi>}
                  sub={<span dir="ltr">{x.user_email}</span>}
                />
                <ListCell label={t('admin.payments.transactions.table.product', 'Product')}>
                  <bdi className="block truncate font-medium">{x.product_name}</bdi>
                  {n != null && (
                    <span className="block text-[13px] text-muted-foreground">{t('admin.payments.schedules.drawer.paymentN', 'Payment {n}').replace('{n}', String(n))}</span>
                  )}
                </ListCell>
                <ListCell label={t('admin.payments.transactions.table.amount', 'Amount')}>
                  <span className="block font-bold tabular-nums">{money(Number(x.amount), x.currency)}</span>
                  {Number(x.refund_amount) > 0 && (
                    <span className="block text-[12.5px] text-violet-700 dark:text-violet-300">
                      {t('admin.payments.combined.refundedAmount', 'Refunded {amount}').replace('{amount}', money(Number(x.refund_amount), x.currency))}
                    </span>
                  )}
                </ListCell>
                <ListCell label={t('admin.payments.transactions.table.paymentType', 'Payment type')}>{methodLabel(x.payment_method)}</ListCell>
                <ListCell label={t('admin.payments.transactions.table.status', 'Status')}>
                  <span className={`inline-flex items-center gap-2 font-semibold ${tone.text}`}>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} aria-hidden />
                    {statusLabel(x.status)}
                  </span>
                  {x.status === 'failed' && x.failure_reason && (
                    <span className="block truncate text-[12.5px] text-red-700 dark:text-red-300" title={x.failure_reason}>
                      {x.failure_reason}
                    </span>
                  )}
                </ListCell>
              </ListRow>
            );
          })}
        </ListPanel>
      </div>

      <TransactionDrawer
        tx={open}
        onClose={() => setOpenId(null)}
        onRefund={(x) => setRefundFor(refundTarget(x))}
        money={money}
        date={date}
        statusLabel={statusLabel}
        methodLabel={methodLabel}
        paymentNo={paymentNo}
      />
      <RefundDialog
        target={refundFor}
        onClose={() => setRefundFor(null)}
        onDone={() => {
          setRefundFor(null);
          void load();
        }}
      />
    </AdminLayout>
  );
}

/**
 * One payment that moved: the numbers (amount, refunded, can still be
 * refunded), the planned payment it paid (link to the Planned tab), the
 * details the old Details dialog had, and Refund.
 */
function TransactionDrawer({
  tx,
  onClose,
  onRefund,
  money,
  date,
  statusLabel,
  methodLabel,
  paymentNo,
}: {
  tx: Transaction | null;
  onClose: () => void;
  onRefund: (x: Transaction) => void;
  money: (amount: number, currency?: string) => string;
  date: (iso?: string | null, withTime?: boolean) => string;
  statusLabel: (s: string) => string;
  methodLabel: (m: string) => string;
  paymentNo: (x: Transaction) => number | undefined;
}) {
  const { t, direction } = useAdminLanguage();
  const rtl = direction === 'rtl';
  if (!tx) return null;
  const tone = TONE[tx.status] ?? TONE.pending;
  const refunded = Number(tx.refund_amount || 0);
  const left = Math.max(0, Number(tx.amount) - refunded);
  const canRefund = (tx.status === 'completed' || tx.status === 'partially_refunded') && left > 0;
  const n = paymentNo(tx);
  const meta = tx.metadata ?? {};

  return (
    <Sheet open={!!tx} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side={rtl ? 'left' : 'right'}
        dir={direction}
        className="flex w-full flex-col gap-0 border-0 p-0 shadow-2xl outline-none focus:outline-none focus-visible:outline-none dark:[color-scheme:dark] sm:max-w-[520px] [&>[data-default-close]]:hidden"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close', 'Close')}
          className="absolute end-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>

        <header className="shrink-0 border-b border-border bg-primary/[0.04] px-6 pb-5 pt-6">
          <p className={`inline-flex items-center gap-2 pe-10 text-[13.5px] font-semibold ${tone.text}`}>
            <span className={`h-2 w-2 rounded-full ${tone.dot}`} aria-hidden />
            {statusLabel(tx.status)} · {methodLabel(tx.payment_method)}
          </p>
          <SheetTitle className="mt-1.5 pe-10 text-[23px] font-extrabold leading-tight tracking-tight [font-family:inherit] [overflow-wrap:anywhere]">
            <bdi>{tx.user_name}</bdi> · {money(Number(tx.amount), tx.currency)}
          </SheetTitle>
          <SheetDescription asChild>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <bdi>{tx.product_name}</bdi>
              <span>{date(tx.created_at)}</span>
            </div>
          </SheetDescription>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label={t('admin.payments.transactions.table.amount', 'Amount')} value={money(Number(tx.amount), tx.currency)} />
            <Stat label={t('admin.payments.transactions.refunded', 'Refunded')} value={money(refunded, tx.currency)} />
            <Stat label={t('admin.payments.combined.canRefund', 'Can refund')} value={money(canRefund ? left : 0, tx.currency)} />
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-6 py-5">
          {tx.enrollment_id && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-primary/30 bg-primary/5 px-3.5 py-3 text-sm">
              <span>
                {n != null
                  ? t('admin.payments.combined.paidPayment', 'Paid payment {n} in the plan').replace('{n}', String(n))
                  : t('admin.payments.combined.paidPlanned', 'Paid a planned payment')}
              </span>
              <Link
                href={`/admin/payments/schedules?enrollment=${encodeURIComponent(tx.enrollment_id)}&payment=${encodeURIComponent(tx.id)}`}
                className="font-bold text-primary hover:underline"
              >
                {t('admin.payments.combined.openPlanned', 'Open in Planned')}
              </Link>
            </div>
          )}

          {tx.status === 'failed' && tx.failure_reason && (
            <div className="rounded-[14px] border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
              <b>{t('admin.payments.transactions.details.failureReason', 'Failure reason')}: </b>
              {tx.failure_reason}
            </div>
          )}

          <section className="overflow-hidden rounded-[14px] border border-border">
            <h3 className="bg-primary/[0.06] px-3.5 py-2.5 text-sm font-bold text-primary [font-family:inherit]">
              {t('admin.payments.transactions.details.title', 'Transaction details')}
            </h3>
            <dl className="m-0 divide-y divide-border px-3.5 text-sm">
              <Row label={t('admin.payments.transactions.details.transactionId', 'Transaction ID')}>
                <span dir="ltr" className="font-mono text-[13px]">
                  {tx.transaction_id}
                </span>
              </Row>
              {tx.stripe_payment_intent_id && (
                <Row label={t('admin.payments.transactions.details.stripePaymentIntent', 'Stripe payment intent')}>
                  <span dir="ltr" className="font-mono text-[13px]">
                    {tx.stripe_payment_intent_id}
                  </span>
                </Row>
              )}
              <Row label={t('admin.payments.transactions.table.paymentType', 'Payment type')}>{methodLabel(tx.payment_method)}</Row>
              <Row label={t('admin.payments.transactions.details.metadata.scheduledDate', 'Scheduled date')}>{date(tx.created_at)}</Row>
              {meta.paid_date && <Row label={t('admin.payments.transactions.details.metadata.paidDate', 'Paid date')}>{date(meta.paid_date, true)}</Row>}
              {refunded > 0 && <Row label={t('admin.payments.transactions.refund.amount', 'Refund amount')}>{money(refunded, tx.currency)}</Row>}
              <Row label={t('admin.payments.transactions.table.user', 'User')}>
                <span dir="ltr">{tx.user_email || tx.user_name}</span>
              </Row>
            </dl>
          </section>
        </div>

        {canRefund && (
          <footer className="shrink-0 border-t border-border bg-card px-6 py-4">
            <button
              type="button"
              onClick={() => onRefund(tx)}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-card px-3 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <Undo2 className="h-4 w-4" aria-hidden />
              {t('admin.payments.combined.refund', 'Refund')}
            </button>
          </footer>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card px-3 py-2.5">
      <div className="truncate text-[12.5px] text-muted-foreground">{label}</div>
      <div className="truncate text-lg font-extrabold tabular-nums" title={value}>
        {value}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="m-0 min-w-0 text-end font-medium [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}
