'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, Calendar, CheckCircle2, Clock, RefreshCw, Search, SlidersHorizontal, WifiOff, XCircle } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CardSelectionDialog } from '@/components/admin/CardSelectionDialog';
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
} from '@/components/admin/notifications/kit';
import { ScheduleDrawer } from '@/components/admin/schedules/ScheduleDrawer';
import { AdjustDateDialog, RecordManualPaymentDialog, RestructurePlanDialog } from '@/components/admin/schedules/ScheduleDialogs';
import { PaymentsHeader } from '@/components/admin/schedules/PaymentsHeader';
import { RefundDialog, type RefundTarget } from '@/components/admin/schedules/RefundDialog';
import { PAYMENT_TYPES, SCHEDULE_STATUSES, SCHEDULE_TONE, type PaymentSchedule } from '@/components/admin/schedules/types';

const PAGE_SIZE = 10;
const DAY_MS = 24 * 60 * 60 * 1000;
type StatusFilter = 'all' | (typeof SCHEDULE_STATUSES)[number];

/**
 * Payment schedules, in the admin list template: the numbers (overdue,
 * failed, this week, pending, paid; most filter the list), then one card
 * with search, product, type, more filters (dates, amounts), status pills,
 * the payments (paged by the server) and paging. Pressing a payment opens
 * its drawer with why it failed, the enrollment's payments, and the
 * actions: charge now and retry (both ask first), change card, adjust
 * date, restructure plan, record a manual payment. "Record off-schedule
 * payment" stays at the top. ?status=overdue opens the list filtered.
 */
export default function SchedulesPage() {
  const { t, direction, language } = useAdminLanguage();
  const { toast } = useToast();
  const rtl = direction === 'rtl';
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  const searchParams = useSearchParams();

  const initialStatus = searchParams.get('status');
  const [status, setStatus] = useState<StatusFilter>(
    initialStatus && (SCHEDULE_STATUSES as readonly string[]).includes(initialStatus) ? (initialStatus as StatusFilter) : 'all',
  );
  const [paymentType, setPaymentType] = useState('all');
  const [productId, setProductId] = useState('all');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<PaymentSchedule[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [products, setProducts] = useState<{ id: string; title: string }[]>([]);
  const [counts, setCounts] = useState<{ overdue: number; failed: number; week: number; pending: number; paid: number } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // The open payment and the dialogs (the same ones as before).
  const [open, setOpen] = useState<PaymentSchedule | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'charge' | 'retry'; schedule: PaymentSchedule } | null>(null);
  const [adjustFor, setAdjustFor] = useState<PaymentSchedule | null>(null);
  const [manualFor, setManualFor] = useState<PaymentSchedule | null>(null);
  const [cardFor, setCardFor] = useState<PaymentSchedule | null>(null);
  const [restructure, setRestructure] = useState<{ enrollmentId: string; schedules: PaymentSchedule[] } | null>(null);
  const [refundFor, setRefundFor] = useState<RefundTarget | null>(null);

  // `t` and `toast` change on every render, so they're read through a ref.
  const ui = useRef({ t, toast });
  ui.current = { t, toast };

  // Search waits a moment while typing.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Back to page 1 when a filter changes.
  const filterKey = [status, paymentType, productId, debounced, dateFrom, dateTo, minAmount, maxAmount].join('|');
  const [lastKey, setLastKey] = useState(filterKey);
  if (lastKey !== filterKey) {
    setLastKey(filterKey);
    setPage(1);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), _t: String(Date.now()) });
      if (status !== 'all') params.set('status', status);
      if (paymentType !== 'all') params.set('paymentType', paymentType);
      if (productId !== 'all') params.set('productId', productId);
      if (debounced) params.set('userSearch', debounced);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (minAmount) params.set('minAmount', minAmount);
      if (maxAmount) params.set('maxAmount', maxAmount);
      const response = await fetch(`/api/admin/payments/schedules?${params}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch schedules');
      const data = await response.json();
      const list: PaymentSchedule[] = data.schedules || [];
      setRows(list);
      setTotal(data.total ?? list.length);
      setLoadError(false);
      // Keep the open drawer in step with the fresh data.
      setOpen((cur) => (cur ? (list.find((r) => r.id === cur.id) ?? cur) : cur));
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setLoadError(true);
      ui.current.toast({
        title: ui.current.t('common.error', 'Error'),
        description: ui.current.t('admin.payments.schedules.loadError', 'Failed to load payment schedules'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [page, status, paymentType, productId, debounced, dateFrom, dateTo, minAmount, maxAmount]);

  // The numbers: one small count per status (exact, for everything).
  const loadCounts = useCallback(async () => {
    try {
      const count = async (query: string) => {
        const res = await fetch(`/api/admin/payments/schedules?${query}&limit=1&_t=${Date.now()}`, { cache: 'no-store' });
        const data = res.ok ? await res.json() : null;
        return Number(data?.total ?? 0);
      };
      const [overdue, failed, week, pending, paid] = await Promise.all([
        count('status=overdue'),
        count('status=failed'),
        count('upcoming=true&days_ahead=7'),
        count('status=pending'),
        count('status=paid'),
      ]);
      setCounts({ overdue, failed, week, pending, paid });
    } catch (error) {
      console.error('Error counting schedules:', error);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  // From the Done tab: ?enrollment=&payment= opens that payment's drawer.
  useEffect(() => {
    const enrollmentId = searchParams.get('enrollment');
    const paymentId = searchParams.get('payment');
    if (!enrollmentId || !paymentId) return;
    void (async () => {
      try {
        const res = await fetch(`/api/admin/payments/schedules?enrollment_id=${encodeURIComponent(enrollmentId)}&limit=200&_t=${Date.now()}`, { cache: 'no-store' });
        const data = res.ok ? await res.json() : null;
        const found = ((data?.schedules ?? []) as PaymentSchedule[]).find((r) => r.id === paymentId);
        if (found) setOpen(found);
      } catch {
        // The list still works without it.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Products for the filter, once.
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/products', { credentials: 'include', cache: 'no-store' });
        const data = res.ok ? await res.json() : null;
        if (data?.success && Array.isArray(data.data)) setProducts(data.data.map((p: { id: string; title: string }) => ({ id: p.id, title: p.title })));
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    })();
  }, []);

  // After charging, watch for the result for a while (as before: every second, about 20 seconds).
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadRef = useRef(load);
  loadRef.current = load;
  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    let n = 0;
    pollRef.current = setInterval(() => {
      n += 1;
      if (n >= 20) {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        void loadCounts();
      } else {
        void loadRef.current();
      }
    }, 1000);
  };
  useEffect(
    () => () => {
      if (pollRef.current) clearInterval(pollRef.current);
    },
    [],
  );

  const changed = () => {
    void load();
    void loadCounts();
    setRefreshKey((k) => k + 1);
  };
  const fail = (error: any, key: string, fallback: string) =>
    toast({ title: t('common.error', 'Error'), description: error?.message || t(key, fallback), variant: 'destructive' });
  const done = (key: string, fallback: string) => toast({ title: t('common.success', 'Success'), description: t(key, fallback) });

  // ── Actions (same requests as before) ──
  const chargeNow = async (s: PaymentSchedule) => {
    try {
      const response = await fetch(`/api/admin/payments/schedules/${s.id}/charge-now`, { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to charge payment');
      }
      done('admin.payments.schedules.chargeNowSuccess', 'Payment initiated successfully. Invoice will be charged automatically.');
      changed();
      startPolling();
    } catch (error: any) {
      fail(error, 'admin.payments.schedules.chargeNowError', 'Failed to charge payment');
    }
  };

  const retry = async (s: PaymentSchedule) => {
    try {
      const response = await fetch(`/api/admin/payments/schedules/${s.id}/retry`, { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to retry payment');
      }
      done('admin.payments.schedules.retrySuccess', 'Payment retry initiated');
      changed();
      startPolling();
    } catch (error: any) {
      fail(error, 'admin.payments.schedules.retryError', 'Failed to retry payment');
    }
  };

  const adjustDate = async (scheduleId: string, newDate: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/payments/schedules/${scheduleId}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_date: newDate, reason }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to adjust date');
      }
      done('admin.payments.schedules.adjustSuccess', 'Payment date adjusted successfully');
      setAdjustFor(null);
      changed();
    } catch (error: any) {
      fail(error, 'admin.payments.schedules.adjustError', 'Failed to adjust payment date');
    }
  };

  const recordManual = async (scheduleId: string, payload: { payment_method: string; transaction_reference?: string; notes?: string }) => {
    try {
      const response = await fetch(`/api/admin/payments/schedules/${scheduleId}/record-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Failed (HTTP ${response.status})`);
      }
      done('admin.payments.schedules.recordManualSuccess', 'Manual payment recorded; schedule marked as paid.');
      setManualFor(null);
      changed();
    } catch (error: any) {
      fail(error, 'admin.payments.schedules.recordManualError', 'Failed to record manual payment');
    }
  };

  const restructurePlan = async (enrollmentId: string, newInstallmentCount: number, startDate: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/payments/schedules/${enrollmentId}/restructure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_installment_count: newInstallmentCount, start_date: startDate, reason }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to restructure plan');
      }
      done('admin.payments.schedules.restructureSuccess', 'Payment plan restructured successfully');
      setRestructure(null);
      changed();
    } catch (error: any) {
      fail(error, 'admin.payments.schedules.restructureError', 'Failed to restructure payment plan');
    }
  };

  // ── Rows ──
  const money = (amount: number, currency?: string) => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: currency || 'USD' }).format(amount || 0);
    } catch {
      return `${amount}`;
    }
  };
  const date = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';
  const dayOnly = (iso?: string | null) => (iso ? iso.split('T')[0] : '');
  const statusLabel = (s: string) => t(`common.${s}`, s);
  const typeLabel = (type: string) => t(`admin.payments.schedules.paymentType.${type}`, type);
  const num = (n: number) => n.toLocaleString();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const moreCount = [dateFrom, dateTo, minAmount, maxAmount].filter(Boolean).length;
  const filtersOn = status !== 'all' || paymentType !== 'all' || productId !== 'all' || !!search || moreCount > 0;
  const clearFilters = () => {
    setStatus('all');
    setPaymentType('all');
    setProductId('all');
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setMinAmount('');
    setMaxAmount('');
  };
  const toggleStatus = (s: StatusFilter) => setStatus((cur) => (cur === s ? 'all' : s));
  const filteredNow = t('admin.list.filteredNow', 'Filtered now');
  const COLS = 'minmax(0,1.1fr) minmax(0,1.2fr) 110px 150px 190px';
  const initials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?';
  const field = 'h-11 w-full rounded-lg border border-border bg-card px-3 text-foreground outline-none focus:border-primary dark:[color-scheme:dark]';

  let state: ReactNode = undefined;
  if (!loaded || (loading && rows.length === 0)) state = <ListSkeleton />;
  else if (loadError && rows.length === 0)
    state = (
      <ListState
        icon={WifiOff}
        tone="red"
        title={t('admin.list.loadError', "We couldn't load the list")}
        text={t('admin.list.loadErrorText', 'The internet connection may have dropped. Nothing was deleted.')}
        action={
          <button type="button" onClick={changed} className={kitButton.primary}>
            {t('admin.list.retry', 'Try again')}
          </button>
        }
      />
    );
  else if (rows.length === 0)
    state = (
      <ListState
        icon={filtersOn ? Search : Calendar}
        tone={filtersOn ? 'grey' : 'primary'}
        title={t('admin.payments.schedules.noSchedulesFound', 'No Schedules Found')}
        text={filtersOn ? t('admin.list.noMatchText', 'Clear the search and filters to see the whole list.') : undefined}
        action={
          filtersOn ? (
            <button type="button" onClick={clearFilters} className={kitButton.secondary}>
              {t('common.clearFilters', 'Clear filters')}
            </button>
          ) : undefined
        }
      />
    );

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-5 p-4 md:p-6" dir={direction}>
        <PaymentsHeader active="planned" badge={loaded ? num(total) : undefined} onRecorded={changed} />

        <KpiStrip label={t('admin.list.numbers', 'Numbers')}>
          <KpiItem
            icon={<AlertCircle />}
            tone={counts && counts.overdue > 0 ? 'amber' : 'grey'}
            label={t('common.overdue', 'Overdue')}
            value={counts ? num(counts.overdue) : '—'}
            onClick={() => toggleStatus('overdue')}
            active={status === 'overdue'}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<XCircle />}
            tone={counts && counts.failed > 0 ? 'amber' : 'grey'}
            label={t('common.failed', 'Failed')}
            value={counts ? num(counts.failed) : '—'}
            onClick={() => toggleStatus('failed')}
            active={status === 'failed'}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<Calendar />}
            tone="blue"
            label={t('admin.payments.schedules.kpi.week', 'This week')}
            value={counts ? num(counts.week) : '—'}
            subtitle={t('admin.payments.schedules.kpi.weekSub', 'Due in the next 7 days')}
          />
          <KpiItem
            icon={<Clock />}
            tone="grey"
            label={t('common.pending', 'Pending')}
            value={counts ? num(counts.pending) : '—'}
            onClick={() => toggleStatus('pending')}
            active={status === 'pending'}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<CheckCircle2 />}
            tone="green"
            label={t('common.paid', 'Paid')}
            value={counts ? num(counts.paid) : '—'}
            onClick={() => toggleStatus('paid')}
            active={status === 'paid'}
            activeNote={filteredNow}
          />
        </KpiStrip>

        <ListPanel
          label={t('admin.payments.schedules.title', 'Payment Schedules')}
          toolbar={
            <>
              <ListSearch
                value={search}
                onChange={setSearch}
                placeholder={t('admin.payments.schedules.searchUserPlaceholder', 'Name or email...')}
                clearLabel={t('admin.users.list.clearSearch', 'Clear search')}
              />
              <FilterSelect
                label={t('admin.payments.schedules.product', 'Product')}
                value={productId}
                onChange={setProductId}
                dir={direction}
                options={[{ value: 'all', label: t('common.allProducts', 'All products') }, ...products.map((p) => ({ value: p.id, label: p.title }))]}
              />
              <FilterSelect
                label={t('admin.payments.schedules.type', 'Type')}
                value={paymentType}
                onChange={setPaymentType}
                dir={direction}
                options={[{ value: 'all', label: t('admin.payments.schedules.typeAll', 'All Types') }, ...PAYMENT_TYPES.map((p) => ({ value: p, label: typeLabel(p) }))]}
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
                {t('admin.audit.moreFilters', 'More filters')}
                {moreCount > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">{moreCount}</span>
                )}
              </button>
              <IconButton label={t('common.refresh', 'Refresh')} onClick={changed} disabled={loading}>
                <RefreshCw className={`h-[18px] w-[18px] ${loading ? 'animate-spin' : ''}`} aria-hidden />
              </IconButton>
            </>
          }
          pills={
            <>
              <QuickPills<StatusFilter>
                label={t('common.status', 'Status')}
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'all', label: t('common.allStatuses', 'All') },
                  ...SCHEDULE_STATUSES.map((s) => ({
                    value: s,
                    label: (
                      <span className="inline-flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${SCHEDULE_TONE[s].dot}`} aria-hidden />
                        {statusLabel(s)}
                      </span>
                    ),
                  })),
                ]}
              />
              <span className="shrink-0">
                <ClearFilters show={filtersOn} label={t('common.clearFilters', 'Clear filters')} onClear={clearFilters} />
              </span>
            </>
          }
          extra={
            moreOpen ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-muted-foreground">{t('common.dateFrom', 'From date')}</span>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={field} />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-muted-foreground">{t('common.dateTo', 'To date')}</span>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={field} />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-muted-foreground">{t('admin.payments.schedules.minAmount', 'Min Amount')}</span>
                  <input type="number" min={0} step="0.01" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} placeholder="0" className={field} />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-muted-foreground">{t('admin.payments.schedules.maxAmount', 'Max Amount')}</span>
                  <input type="number" min={0} step="0.01" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} placeholder="999999" className={field} />
                </label>
              </div>
            ) : undefined
          }
          columns={COLS}
          head={[
            t('common.user', 'User'),
            t('admin.payments.schedules.table.productPayment', 'Product and payment'),
            t('common.amount', 'Amount'),
            t('admin.payments.schedules.table.due', 'Due date'),
            t('common.status', 'Status'),
          ]}
          state={state}
          footer={
            loaded && total > 0 ? (
              <ListFooter
                showingText={t('admin.users.list.showingRange', 'Showing {from}–{to} of {total}')
                  .replace('{from}', num((page - 1) * PAGE_SIZE + 1))
                  .replace('{to}', num((page - 1) * PAGE_SIZE + rows.length))
                  .replace('{total}', num(total))}
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
          {rows.map((s) => {
            const tone = SCHEDULE_TONE[s.status] ?? SCHEDULE_TONE.pending;
            const moved = dayOnly(s.original_due_date) && dayOnly(s.original_due_date) !== dayOnly(s.scheduled_date);
            const lateDays = s.status === 'overdue' ? Math.max(1, Math.floor((Date.now() - new Date(s.scheduled_date).getTime()) / DAY_MS)) : 0;
            const paidDiff = s.paid_date ? Math.round((new Date(dayOnly(s.paid_date)).getTime() - new Date(dayOnly(s.scheduled_date)).getTime()) / DAY_MS) : 0;
            return (
              <ListRow key={s.id} columns={COLS} onOpen={() => setOpen(s)} label={`${s.user_name} · ${s.product_name}`} selected={open?.id === s.id} rtl={rtl}>
                <ListRowMain
                  lead={
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary" aria-hidden>
                      {initials(s.user_name)}
                    </span>
                  }
                  title={<bdi className="font-semibold">{s.user_name}</bdi>}
                  sub={<span dir="ltr">{s.user_email}</span>}
                />
                <ListCell label={t('admin.payments.schedules.product', 'Product')}>
                  <bdi className="block truncate font-medium">{s.product_name}</bdi>
                  <span className="block text-[13px] text-muted-foreground">
                    #{s.payment_number} · {typeLabel(s.payment_type)}
                  </span>
                </ListCell>
                <ListCell label={t('common.amount', 'Amount')}>
                  <span className="font-bold tabular-nums">{money(Number(s.amount), s.currency)}</span>
                </ListCell>
                <ListCell label={t('admin.payments.schedules.table.due', 'Due date')}>
                  <span className="block">{date(s.scheduled_date)}</span>
                  {moved ? (
                    <span className="block text-[12.5px] text-violet-700 dark:text-violet-300">
                      {t('admin.payments.schedules.movedFrom', 'Moved from {date}').replace('{date}', date(s.original_due_date))}
                    </span>
                  ) : lateDays > 0 ? (
                    <span className="block text-[12.5px] text-red-700 dark:text-red-300">
                      {t('admin.payments.schedules.daysAgo', '{n} days ago').replace('{n}', String(lateDays))}
                    </span>
                  ) : null}
                </ListCell>
                <ListCell label={t('common.status', 'Status')}>
                  <span className={`inline-flex items-center gap-2 font-semibold ${tone.text}`}>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot} ${s.status === 'processing' ? 'animate-pulse' : ''}`} aria-hidden />
                    {statusLabel(s.status)}
                  </span>
                  {s.status === 'failed' && s.last_error && (
                    <span className="block truncate text-[12.5px] text-red-700 dark:text-red-300" title={s.last_error}>
                      {s.last_error}
                    </span>
                  )}
                  {s.status === 'paid' && paidDiff !== 0 && (
                    <span className={`block text-[12.5px] ${paidDiff > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-400'}`}>
                      {paidDiff > 0
                        ? t('admin.payments.schedules.drawer.paidLate', '{n} days late').replace('{n}', String(paidDiff))
                        : t('admin.payments.schedules.drawer.paidEarly', '{n} days early').replace('{n}', String(-paidDiff))}
                    </span>
                  )}
                </ListCell>
              </ListRow>
            );
          })}
        </ListPanel>
      </div>

      <ScheduleDrawer
        schedule={open}
        refreshKey={refreshKey}
        onClose={() => setOpen(null)}
        onChargeNow={(s) => setConfirm({ kind: 'charge', schedule: s })}
        onRetry={(s) => setConfirm({ kind: 'retry', schedule: s })}
        onChangeCard={setCardFor}
        onAdjust={setAdjustFor}
        onRestructure={(enrollmentId, all) => setRestructure({ enrollmentId, schedules: all })}
        onRecordManual={setManualFor}
        onRefund={(s) =>
          setRefundFor({ id: s.id, user_name: s.user_name, product_name: s.product_name, amount: Number(s.amount), currency: s.currency, payment_number: s.payment_number })
        }
      />

      {/* Charging asks first (new: it used to charge on one click) */}
      <AlertDialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent dir={direction}>
          <AlertDialogHeader className="text-start">
            <AlertDialogTitle>
              {confirm?.kind === 'retry'
                ? t('admin.payments.schedules.confirm.retryTitle', 'Try charging {amount} again?').replace('{amount}', money(Number(confirm?.schedule.amount ?? 0), confirm?.schedule.currency))
                : t('admin.payments.schedules.confirm.chargeTitle', 'Charge {amount} now?').replace('{amount}', money(Number(confirm?.schedule.amount ?? 0), confirm?.schedule.currency))}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.payments.schedules.confirm.text', 'The saved card of {name} will be charged right away for payment {n} of {product}.')
                .replace('{name}', confirm?.schedule.user_name ?? '')
                .replace('{n}', String(confirm?.schedule.payment_number ?? ''))
                .replace('{product}', confirm?.schedule.product_name ?? '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>{t('admin.payments.schedules.confirm.notNow', 'Not now')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const c = confirm;
                setConfirm(null);
                if (!c) return;
                if (c.kind === 'retry') void retry(c.schedule);
                else void chargeNow(c.schedule);
              }}
            >
              {confirm?.kind === 'retry' ? t('admin.payments.schedules.retryPayment', 'Retry Payment') : t('admin.payments.schedules.chargeNow', 'Charge Now')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* The same dialogs as before */}
      <AdjustDateDialog open={!!adjustFor} schedule={adjustFor} onClose={() => setAdjustFor(null)} onAdjust={adjustDate} direction={direction} />
      <RecordManualPaymentDialog open={!!manualFor} schedule={manualFor} onClose={() => setManualFor(null)} onRecord={recordManual} />
      <RefundDialog
        target={refundFor}
        onClose={() => setRefundFor(null)}
        onDone={() => {
          setRefundFor(null);
          changed();
        }}
      />
      <RestructurePlanDialog
        open={!!restructure}
        enrollmentId={restructure?.enrollmentId ?? null}
        schedules={restructure?.schedules ?? []}
        onClose={() => setRestructure(null)}
        onRestructure={restructurePlan}
        direction={direction}
      />
      <CardSelectionDialog
        open={!!cardFor}
        scheduleId={cardFor?.id || null}
        scheduleName={cardFor?.user_name}
        mode="change"
        onClose={() => setCardFor(null)}
        onCharged={changed}
        direction={direction}
      />
    </AdminLayout>
  );
}
