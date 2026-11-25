'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Clock, GraduationCap, Mail, Pencil, RefreshCw, Search, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { useHelp } from '@/hooks/useHelp';
import { EditEnrollmentDialog } from '@/components/admin/EditEnrollmentDialog';
import { PaymentPlanDetailsDialog } from '@/components/admin/PaymentPlanDetailsDialog';
import { SendEnrollmentLinkDialog } from '@/components/admin/SendEnrollmentLinkDialog';
import { productTypeLook } from '@/components/admin/products/ProductDrawer';
import type { ProductType } from '@/types/product';
import {
  ClearFilters,
  FilterSelect,
  FilterCombo,
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
  NewButton,
  PageTitle,
  QuickPills,
  kitButton,
  usePagedList,
} from '@/components/admin/notifications/kit';
import { EnrollmentDrawer, type CrmTagInfo } from '@/components/admin/enrollments/EnrollmentDrawer';
import { CancelEnrollmentDialog, ManualPaymentDialog, ResetEnrollmentDialog } from '@/components/admin/enrollments/EnrollmentDialogs';
import { useEnrollmentFormat } from '@/components/admin/enrollments/useEnrollmentFormat';
import {
  ENROLLMENT_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_TONE,
  STATUS_TONE,
  type Enrollment,
  type ScheduleItem,
} from '@/components/admin/enrollments/types';

type StatusFilter = 'all' | (typeof ENROLLMENT_STATUSES)[number];

/**
 * Enrollments, in the admin list template: the numbers that need action
 * (each filters the list), then one card with search, payment and product
 * filters, status pills, the enrollments with "what to do next", and
 * paging. Pressing an enrollment opens its drawer with the payments and
 * every action (send link, reset, edit, cancel, plan details, record a
 * payment). New enrollments are made on their own step-by-step page.
 */
export default function EnrollmentsPage() {
  useHelp('enrollments-overview');
  const { t, direction, language } = useAdminLanguage();
  const f = useEnrollmentFormat();
  const rtl = direction === 'rtl';

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [payment, setPayment] = useState<string>('all');
  const [product, setProduct] = useState<string>('all');
  // CRM tag filter ('' = all), with the tags' names from the CRM.
  const [tag, setTag] = useState<string>('');
  const [crmTagNames, setCrmTagNames] = useState<Map<string, CrmTagInfo>>(new Map());
  useEffect(() => {
    void fetch('/api/admin/crm/tags')
      .then((r) => r.json())
      .then((j) => {
        if (!j?.success) return;
        setCrmTagNames(
          new Map(
            (j.tags ?? []).map((x: any) => [
              x.slug,
              { name: (language === 'he' ? x.label_he || x.label_en : x.label_en || x.label_he) || x.slug, color: x.category?.color ?? null },
            ]),
          ),
        );
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [refreshKey, setRefreshKey] = useState(0);

  // Dialogs (the same ones as before), opened from the drawer.
  const [sendLinkFor, setSendLinkFor] = useState<Enrollment | null>(null);
  const [sendLanguage, setSendLanguage] = useState('en');
  const [sendingLink, setSendingLink] = useState(false);
  const [resetFor, setResetFor] = useState<Enrollment | null>(null);
  const [resetting, setResetting] = useState(false);
  const [editFor, setEditFor] = useState<Enrollment | null>(null);
  const [cancelFor, setCancelFor] = useState<Enrollment | null>(null);
  const [planFor, setPlanFor] = useState<Enrollment | null>(null);
  const [paymentFor, setPaymentFor] = useState<{ enrollment: Enrollment; schedule: ScheduleItem; label: string } | null>(null);

  // The open enrollment lives in the address (?enrollment=), like the other drawers.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const openId = searchParams.get('enrollment');
  const setOpenId = (id: string | null) => {
    const qs = new URLSearchParams(searchParams.toString());
    if (id) qs.set('enrollment', id);
    else qs.delete('enrollment');
    const query = qs.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  // Search waits a moment while typing.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Everything is loaded once and filtered here, so the numbers always
  // cover every enrollment (not just the filtered ones). `t` is read
  // through a ref: it changes on every render, and as a dependency it made
  // the list reload endlessly.
  const tRef = useRef(t);
  tRef.current = t;
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/enrollments?_t=${Date.now()}`);
      if (!response.ok) throw new Error('Failed to fetch enrollments');
      const data = await response.json();
      setEnrollments(data.enrollments || []);
      setLoadError(false);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      setLoadError(true);
      toast.error(tRef.current('admin.enrollments.loadError', 'Failed to load enrollments'));
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const changed = () => {
    void load();
    setRefreshKey((k) => k + 1);
  };

  // ── Actions (same requests and messages as before) ──
  const sendLink = async () => {
    if (!sendLinkFor) return;
    setSendingLink(true);
    try {
      const response = await fetch(`/api/admin/enrollments/${sendLinkFor.id}/send-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: sendLanguage }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send link');
      }
      toast.success(t('admin.enrollments.sendLink.success', 'Enrollment link sent successfully'));
      setSendLinkFor(null);
      changed();
    } catch (error: any) {
      console.error('Error sending link:', error);
      toast.error(error.message || t('admin.enrollments.sendLink.error', 'Failed to send enrollment link'));
    } finally {
      setSendingLink(false);
    }
  };

  const reset = async (resetSignature: boolean, resetPayment: boolean) => {
    if (!resetFor) return;
    setResetting(true);
    try {
      const params = new URLSearchParams();
      if (resetSignature) params.append('reset_signature', 'true');
      if (resetPayment) params.append('reset_payment', 'true');
      params.append('reset_profile', 'true'); // Always reset profile for complete restart
      const response = await fetch(`/api/admin/enrollments/${resetFor.id}/reset?${params.toString()}`, { method: 'POST' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset enrollment');
      }
      const data = await response.json();
      toast.success(t('admin.enrollments.reset.success', 'Enrollment reset successfully'));
      toast.info(t('admin.enrollments.reset.wizardInfo', 'User can now restart at: ') + data.wizard_url, { duration: 5000 });
      setResetFor(null);
      changed();
    } catch (error: any) {
      console.error('Error resetting enrollment:', error);
      toast.error(error.message || t('admin.enrollments.reset.error', 'Failed to reset enrollment'));
    } finally {
      setResetting(false);
    }
  };

  const cancel = async (enrollmentId: string, reason: string, refundAmount?: number) => {
    try {
      const response = await fetch(`/api/admin/enrollments/${enrollmentId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, refund_amount: refundAmount }),
      });
      if (!response.ok) {
        const error = await response.json();
        if (error.cancelled) {
          // Cancelled, but the refund didn't go through: show why and refresh.
          toast.error(error.error, { duration: 15000 });
          setCancelFor(null);
          changed();
          return;
        }
        throw new Error(error.error || 'Failed to cancel enrollment');
      }
      toast.success(t('admin.enrollments.cancel.success', 'Enrollment cancelled successfully'));
      setCancelFor(null);
      changed();
    } catch (error: any) {
      console.error('Error cancelling enrollment:', error);
      toast.error(error.message || t('admin.enrollments.cancel.error', 'Failed to cancel enrollment'));
    }
  };

  const recordPayment = async (_enrollmentId: string, scheduleId: string, paymentMethod: string, reference: string, notes: string) => {
    try {
      const response = await fetch(`/api/admin/payments/schedules/${scheduleId}/record-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_method: paymentMethod, transaction_reference: reference, notes }),
      });
      if (!response.ok) throw new Error('Failed to record payment');
      toast.success(t('admin.enrollments.manualPayment.success', 'Manual payment recorded successfully'));
      setPaymentFor(null);
      changed();
    } catch (error: any) {
      console.error('Error recording payment:', error);
      toast.error(error.message || t('admin.enrollments.manualPayment.error', 'Failed to record payment'));
    }
  };

  const openSendLink = (e: Enrollment) => {
    setSendLanguage(language || 'en');
    setSendLinkFor(e);
  };

  // ── Numbers, filters, rows ──
  const count = (s: string) => enrollments.filter((e) => e.status === s).length;
  const overdue = enrollments.filter((e) => e.payment_status === 'overdue' && e.status !== 'cancelled');
  const overdueOwed = overdue.reduce((sum, e) => sum + Math.max(0, Number(e.total_amount || 0) - Number(e.paid_amount || 0)), 0);
  const overdueCurrency = overdue[0]?.currency || 'USD';

  const productOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of enrollments) if (e.product_id && !seen.has(e.product_id)) seen.set(e.product_id, e.product_name);
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([value, label]) => ({ value, label }));
  }, [enrollments]);

  // The CRM tags the enrollments carry, named from the CRM when it answers.
  const tagOptions = useMemo(() => {
    const slugs = new Set<string>();
    for (const e of enrollments) for (const s of e.crm_tag_slugs ?? []) slugs.add(s);
    return [...slugs].map((s) => ({ value: s, label: crmTagNames.get(s)?.name ?? s })).sort((a, b) => a.label.localeCompare(b.label));
  }, [enrollments, crmTagNames]);

  const beforeStatus = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return enrollments.filter(
      (e) =>
        (payment === 'all' || e.payment_status === payment) &&
        (product === 'all' || e.product_id === product) &&
        (!tag || (e.crm_tag_slugs ?? []).includes(tag)) &&
        (!q || `${e.user_name} ${e.user_email} ${e.product_name}`.toLowerCase().includes(q)),
    );
  }, [enrollments, debounced, payment, product, tag]);
  const shown = status === 'all' ? beforeStatus : beforeStatus.filter((e) => e.status === status);
  const pillCount = (s: string) => beforeStatus.filter((e) => e.status === s).length;

  const paged = usePagedList(shown, `${debounced}|${status}|${payment}|${product}|${tag}`);
  const filtersOn = !!search || status !== 'all' || payment !== 'all' || product !== 'all' || !!tag;
  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setPayment('all');
    setProduct('all');
    setTag('');
  };
  const toggleStatus = (s: StatusFilter) => setStatus((cur) => (cur === s ? 'all' : s));
  const filteredNow = t('admin.list.filteredNow', 'Filtered now');
  const num = (n: number) => n.toLocaleString();
  const openEnrollment = enrollments.find((e) => e.id === openId) ?? null;
  const COLS = 'minmax(0,1.15fr) minmax(0,1.25fr) 110px 170px 200px';
  const createButton = <NewButton href="/admin/enrollments/new">{t('admin.enrollments.createEnrollment', 'New enrollment')}</NewButton>;
  const initials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?';

  let state: ReactNode = undefined;
  if (!loaded || (loading && enrollments.length === 0)) state = <ListSkeleton />;
  else if (loadError && enrollments.length === 0)
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
  else if (enrollments.length === 0)
    state = (
      <ListState
        icon={GraduationCap}
        title={t('admin.enrollments.noEnrollments', 'No enrollments found')}
        text={t('admin.enrollments.noEnrollmentsDescription', 'Create an enrollment to get started.')}
        action={createButton}
      />
    );
  else if (shown.length === 0)
    state = (
      <ListState
        icon={Search}
        tone="grey"
        title={t('admin.enrollments.noEnrollments', 'No enrollments found')}
        text={t('admin.list.noMatchText', 'Clear the search and filters to see the whole list.')}
        action={
          <button type="button" onClick={clearFilters} className={kitButton.secondary}>
            {t('admin.enrollments.clearFilters', 'Clear filters')}
          </button>
        }
      />
    );

  const chipTone = {
    red: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300',
    amber: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-5 p-4 md:p-6" dir={direction}>
        <PageTitle
          icon={GraduationCap}
          title={t('admin.enrollments.title', 'Enrollments')}
          badge={loaded ? num(enrollments.length) : undefined}
          description={t('admin.enrollments.description', 'Manage user enrollments and payments')}
          actions={createButton}
        />

        <KpiStrip label={t('admin.list.numbers', 'Numbers')}>
          <KpiItem
            icon={<Pencil />}
            tone="grey"
            label={t('admin.enrollments.stats.draft', 'Drafts')}
            value={loaded ? num(count('draft')) : '—'}
            subtitle={t('admin.enrollments.stats.draftDesc', 'Link not sent yet')}
            onClick={() => toggleStatus('draft')}
            active={status === 'draft'}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<Clock />}
            tone="amber"
            label={t('admin.enrollments.stats.pending', 'Waiting for the parent')}
            value={loaded ? num(count('pending')) : '—'}
            subtitle={t('admin.enrollments.stats.pendingDesc', 'Got the link, not finished')}
            onClick={() => toggleStatus('pending')}
            active={status === 'pending'}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<AlertCircle />}
            tone={overdue.length > 0 ? 'amber' : 'grey'}
            label={t('admin.enrollments.stats.overdue', 'Payment overdue')}
            value={loaded ? num(overdue.length) : '—'}
            subtitle={
              loaded && overdue.length > 0
                ? t('admin.enrollments.stats.overdueOwed', '{amount} still to pay').replace('{amount}', f.money(overdueOwed, overdueCurrency))
                : undefined
            }
            onClick={() => setPayment((cur) => (cur === 'overdue' ? 'all' : 'overdue'))}
            active={payment === 'overdue'}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<CheckCircle2 />}
            tone="green"
            label={t('admin.enrollments.stats.active', 'Active')}
            value={loaded ? num(count('active')) : '—'}
            subtitle={t('admin.enrollments.stats.activeDesc', 'Currently enrolled')}
            onClick={() => toggleStatus('active')}
            active={status === 'active'}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<GraduationCap />}
            tone="blue"
            label={t('admin.enrollments.stats.completed', 'Completed')}
            value={loaded ? num(count('completed')) : '—'}
            subtitle={t('admin.enrollments.stats.completedDesc', 'Finished')}
            onClick={() => toggleStatus('completed')}
            active={status === 'completed'}
            activeNote={filteredNow}
          />
        </KpiStrip>

        <ListPanel
          label={t('admin.enrollments.title', 'Enrollments')}
          toolbar={
            <>
              <ListSearch
                value={search}
                onChange={setSearch}
                placeholder={t('admin.enrollments.searchPlaceholder', 'User name, email, or product')}
                clearLabel={t('admin.users.list.clearSearch', 'Clear search')}
              />
              <FilterSelect
                label={t('admin.enrollments.paymentStatus', 'Payment')}
                value={payment}
                onChange={setPayment}
                dir={direction}
                options={[
                  { value: 'all', label: t('admin.enrollments.allPaymentStatuses', 'All') },
                  ...PAYMENT_STATUSES.map((p) => ({ value: p, label: f.paymentLabel(p) })),
                ]}
              />
              <FilterSelect
                label={t('admin.enrollments.table.product', 'Product')}
                value={product}
                onChange={setProduct}
                dir={direction}
                options={[{ value: 'all', label: t('admin.enrollments.allProducts', 'All products') }, ...productOptions]}
              />
              <FilterCombo
                label={t('admin.enrollments.crmTag', 'CRM tag')}
                value={tag}
                onChange={setTag}
                dir={direction}
                searchPlaceholder={t('admin.enrollments.crmTagSearch', 'Search a tag...')}
                emptyText={t('admin.enrollments.crmTagNone', 'No tag by that name.')}
                options={[{ value: '', label: t('admin.enrollments.allTags', 'All tags') }, ...tagOptions]}
              />
              <IconButton label={t('common.refresh', 'Refresh')} onClick={() => void load()} disabled={loading}>
                <RefreshCw className={`h-[18px] w-[18px] ${loading ? 'animate-spin' : ''}`} aria-hidden />
              </IconButton>
            </>
          }
          pills={
            <>
              <QuickPills<StatusFilter>
                label={t('admin.enrollments.status', 'Status')}
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'all', label: t('admin.enrollments.allStatuses', 'All'), count: beforeStatus.length },
                  ...ENROLLMENT_STATUSES.map((s) => ({
                    value: s,
                    label: (
                      <span className="inline-flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${STATUS_TONE[s].dot}`} aria-hidden />
                        {f.statusLabel(s)}
                      </span>
                    ),
                    count: pillCount(s),
                  })),
                ]}
              />
              <span className="shrink-0">
                <ClearFilters show={filtersOn} label={t('admin.enrollments.clearFilters', 'Clear filters')} onClear={clearFilters} />
              </span>
            </>
          }
          columns={COLS}
          head={[
            t('admin.enrollments.table.student', 'Client'),
            t('admin.enrollments.table.productAndPlan', 'Product and payment plan'),
            t('admin.enrollments.table.status', 'Status'),
            t('admin.enrollments.table.paid', 'Paid'),
            t('admin.enrollments.table.nextStep', 'Next step'),
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
          {paged.pageItems.map((e) => {
            const tone = STATUS_TONE[e.status] ?? STATUS_TONE.draft;
            const payTone = PAYMENT_TONE[e.payment_status] ?? PAYMENT_TONE.pending;
            const look = productTypeLook((e.product_type || '').toLowerCase() as ProductType);
            const TypeIcon = look.icon;
            const total = Number(e.total_amount || 0);
            const pct = total > 0 ? Math.min(100, Math.round((Number(e.paid_amount || 0) / total) * 100)) : 0;
            const step = f.nextStep(e);
            return (
              <ListRow key={e.id} columns={COLS} onOpen={() => setOpenId(e.id)} label={e.user_name} selected={openId === e.id} rtl={rtl}>
                <ListRowMain
                  lead={
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary" aria-hidden>
                      {initials(e.user_name)}
                    </span>
                  }
                  title={<bdi className="font-semibold">{e.user_name}</bdi>}
                  sub={<span dir="ltr">{e.user_email}</span>}
                />
                <ListCell label={t('admin.enrollments.table.product', 'Product')}>
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className={`hidden h-9 w-9 shrink-0 place-items-center rounded-[10px] md:grid ${look.tile}`} aria-hidden>
                      <TypeIcon className="h-[17px] w-[17px]" />
                    </span>
                    <span className="min-w-0">
                      <bdi className="block truncate font-medium">{e.product_name}</bdi>
                      <span className="block truncate text-[13px] text-muted-foreground">{f.planName(e)}</span>
                    </span>
                  </span>
                </ListCell>
                <ListCell label={t('admin.enrollments.table.status', 'Status')}>
                  <span className={`inline-flex items-center gap-2 font-semibold ${tone.text}`}>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} aria-hidden />
                    {f.enrollmentStatus(e)}
                  </span>
                </ListCell>
                <ListCell label={t('admin.enrollments.table.paid', 'Paid')}>
                  {total > 0 ? (
                    <span className="block w-full max-w-[11rem]">
                      <span className="flex items-baseline justify-between gap-2 text-[13.5px] font-semibold tabular-nums">
                        <span dir="ltr">
                          {f.money(e.paid_amount, e.currency)} / {f.money(total, e.currency)}
                        </span>
                        <span className={`text-[12.5px] ${payTone.text}`}>{f.paymentLabel(e.payment_status)}</span>
                      </span>
                      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                        <span className={`block h-full rounded-full ${payTone.bar}`} style={{ width: `${pct}%` }} />
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">{t('admin.enrollments.paymentPlan.free', 'Free')}</span>
                  )}
                </ListCell>
                <ListCell label={t('admin.enrollments.table.nextStep', 'Next step')}>
                  {step.kind === 'send' ? (
                    <button
                      type="button"
                      onClick={() => openSendLink(e)}
                      className="relative z-10 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-semibold text-primary hover:bg-muted"
                    >
                      <Mail className="h-4 w-4" aria-hidden />
                      {t('admin.enrollments.sendLink', 'Send link')}
                    </button>
                  ) : step.kind === 'chip' ? (
                    <span className={`inline-flex max-w-full items-center gap-1.5 truncate rounded-full px-2.5 py-1 text-[12.5px] font-semibold ${chipTone[step.tone]}`}>
                      {step.text}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">{step.text}</span>
                  )}
                </ListCell>
              </ListRow>
            );
          })}
        </ListPanel>
      </div>

      <EnrollmentDrawer
        enrollment={openEnrollment}
        tagInfo={crmTagNames}
        refreshKey={refreshKey}
        onClose={() => setOpenId(null)}
        onSendLink={openSendLink}
        onReset={setResetFor}
        onEdit={setEditFor}
        onCancel={setCancelFor}
        onPlanDetails={setPlanFor}
        onRecordPayment={(enrollment, schedule, label) => setPaymentFor({ enrollment, schedule, label })}
      />

      {/* The same dialogs as before */}
      <SendEnrollmentLinkDialog
        open={!!sendLinkFor}
        enrollment={sendLinkFor}
        selectedLanguage={sendLanguage}
        onLanguageChange={setSendLanguage}
        onClose={() => setSendLinkFor(null)}
        onSend={sendLink}
        sending={sendingLink}
      />
      <ResetEnrollmentDialog open={!!resetFor} enrollment={resetFor} onClose={() => setResetFor(null)} onReset={reset} resetting={resetting} />
      <EditEnrollmentDialog
        open={!!editFor}
        enrollment={editFor}
        onClose={() => setEditFor(null)}
        onSuccess={() => {
          setEditFor(null);
          changed();
        }}
      />
      <CancelEnrollmentDialog open={!!cancelFor} enrollment={cancelFor} onClose={() => setCancelFor(null)} onCancel={cancel} />
      <PaymentPlanDetailsDialog open={!!planFor} enrollment={planFor} onClose={() => setPlanFor(null)} />
      <ManualPaymentDialog
        open={!!paymentFor}
        enrollment={paymentFor?.enrollment ?? null}
        schedule={paymentFor?.schedule ?? null}
        scheduleLabel={paymentFor?.label}
        onClose={() => setPaymentFor(null)}
        onRecord={recordPayment}
      />
    </AdminLayout>
  );
}
