'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, CreditCard, Info, PauseCircle, RefreshCw, Search, TrendingUp, Users, WifiOff } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
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
  NewButton,
  PageTitle,
  QuickPills,
  StatusDot,
  kitButton,
  usePagedList,
} from '@/components/admin/notifications/kit';
import { PlanDrawer } from '@/components/admin/plans/PlanDrawer';
import { PLAN_TONE, PLAN_TYPES, usePlanFormat, type PaymentPlan } from '@/components/admin/plans/planFormat';

type StatusFilter = 'all' | 'active' | 'inactive';

/**
 * Payment plans, in the admin list template: the numbers (each filters the
 * list), the auto-detection note, then one card with search, type, status
 * pills, the plans (highest priority first, as before) and paging. A row
 * opens a short summary in a drawer; creating and editing happen on their
 * own step-by-step page. Delete works as before.
 */
export default function PaymentPlansPage() {
  const { t, direction } = useAdminLanguage();
  const { toast } = useToast();
  const f = usePlanFormat();
  const rtl = direction === 'rtl';

  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [autoOnly, setAutoOnly] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const openId = searchParams.get('plan');
  const setOpenId = (id: string | null) => {
    const qs = new URLSearchParams(searchParams.toString());
    if (id) qs.set('plan', id);
    else qs.delete('plan');
    const query = qs.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  // `t` and `toast` change on every render, so they're read through a ref.
  const tRef = useRef({ t, toast });
  tRef.current = { t, toast };

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/payments/plans');
      if (!response.ok) throw new Error('Failed to fetch plans');
      const data = await response.json();
      setPlans(Array.isArray(data) ? data : []);
      setLoadError(false);
    } catch (error) {
      console.error('Error fetching payment plans:', error);
      setLoadError(true);
      tRef.current.toast({
        title: tRef.current.t('common.error', 'Error'),
        description: tRef.current.t('admin.payments.plans.loadError', 'Failed to load payment plans'),
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

  const remove = async (plan: PaymentPlan) => {
    if (!confirm(t('admin.payments.plans.deleteConfirm', 'Are you sure you want to delete this payment plan?'))) return;
    try {
      const response = await fetch(`/api/admin/payments/plans/${plan.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to delete plan');
      }
      toast({ title: t('common.success', 'Success'), description: t('admin.payments.plans.deleteSuccess', 'Payment plan deleted successfully') });
      if (openId === plan.id) setOpenId(null);
      void load();
    } catch (error: any) {
      console.error('Error deleting payment plan:', error);
      toast({ title: t('common.error', 'Error'), description: error.message || t('admin.payments.plans.deleteError', 'Failed to delete payment plan'), variant: 'destructive' });
    }
  };

  const counts = useMemo(
    () => ({
      all: plans.length,
      active: plans.filter((p) => p.is_active).length,
      inactive: plans.filter((p) => !p.is_active).length,
      auto: plans.filter((p) => p.auto_detect_enabled).length,
      used: plans.reduce((s, p) => s + (p.usage_count ?? 0), 0),
    }),
    [plans],
  );

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return plans
      .filter(
        (p) =>
          (type === 'all' || p.plan_type === type) &&
          (status === 'all' || (status === 'active' ? p.is_active : !p.is_active)) &&
          (!autoOnly || p.auto_detect_enabled) &&
          (!q || `${p.plan_name} ${p.plan_description ?? ''}`.toLowerCase().includes(q)),
      )
      .sort((a, b) => b.priority - a.priority);
  }, [plans, search, type, status, autoOnly]);

  const paged = usePagedList(shown, `${search}|${type}|${status}|${autoOnly}`);
  const filtersOn = !!search || type !== 'all' || status !== 'all' || autoOnly;
  const clearFilters = () => {
    setSearch('');
    setType('all');
    setStatus('all');
    setAutoOnly(false);
  };
  const toggleStatus = (s: StatusFilter) => setStatus((cur) => (cur === s ? 'all' : s));
  const filteredNow = t('admin.list.filteredNow', 'Filtered now');
  const num = (n: number) => n.toLocaleString();
  const openPlan = plans.find((p) => p.id === openId) ?? null;
  const COLS = 'minmax(0,1.1fr) 130px minmax(0,1.2fr) 80px 110px';
  const createButton = <NewButton href="/admin/payments/plans/new">{t('admin.payments.plans.createPlan', 'Create Plan')}</NewButton>;

  let state: ReactNode = undefined;
  if (!loaded || (loading && plans.length === 0)) state = <ListSkeleton />;
  else if (loadError && plans.length === 0)
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
  else if (plans.length === 0)
    state = (
      <ListState
        icon={CreditCard}
        title={t('admin.payments.plans.noPlans', 'No Payment Plans')}
        text={t('admin.payments.plans.noPlansDesc', 'Get started by creating your first payment plan.')}
        action={createButton}
      />
    );
  else if (shown.length === 0)
    state = (
      <ListState
        icon={Search}
        tone="grey"
        title={t('admin.payments.plans.noMatch', 'No plans match')}
        text={t('admin.list.noMatchText', 'Clear the search and filters to see the whole list.')}
        action={
          <button type="button" onClick={clearFilters} className={kitButton.secondary}>
            {t('admin.users.filters.clear', 'Clear Filters')}
          </button>
        }
      />
    );

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-5 p-4 md:p-6" dir={direction}>
        <PageTitle
          icon={CreditCard}
          title={t('admin.payments.plans.title', 'Payment Plans')}
          badge={loaded ? num(counts.all) : undefined}
          description={t('admin.payments.plans.description', 'Configure and manage payment plans')}
          actions={createButton}
        />

        <KpiStrip label={t('admin.list.numbers', 'Numbers')}>
          <KpiItem icon={<CreditCard />} label={t('admin.payments.plans.kpi.all', 'All plans')} value={loaded ? num(counts.all) : '—'} onClick={clearFilters} />
          <KpiItem
            icon={<CheckCircle2 />}
            tone="green"
            label={t('admin.payments.products.active', 'Active')}
            value={loaded ? num(counts.active) : '—'}
            onClick={() => toggleStatus('active')}
            active={status === 'active'}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<PauseCircle />}
            tone="grey"
            label={t('admin.payments.plans.inactive', 'Inactive')}
            value={loaded ? num(counts.inactive) : '—'}
            onClick={() => toggleStatus('inactive')}
            active={status === 'inactive'}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<TrendingUp />}
            tone="blue"
            label={t('admin.payments.plans.autoDetect', 'Auto-Detect')}
            value={loaded ? num(counts.auto) : '—'}
            subtitle={t('admin.payments.plans.kpi.autoSub', 'Assigned automatically')}
            onClick={() => setAutoOnly((v) => !v)}
            active={autoOnly}
            activeNote={filteredNow}
          />
        </KpiStrip>

        {/* What auto-detection does, as before */}
        <p className="flex items-start gap-2.5 rounded-xl border border-border bg-primary/5 px-4 py-3 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span>
            <b>{t('admin.payments.plans.autoDetection', 'Auto-Detection')}: </b>
            {t('admin.payments.plans.autoDetectionDesc', 'Payment plans with auto-detection enabled will be automatically assigned to enrollments based on priority.')}
          </span>
        </p>

        <ListPanel
          label={t('admin.payments.plans.title', 'Payment Plans')}
          toolbar={
            <>
              <ListSearch
                value={search}
                onChange={setSearch}
                placeholder={t('admin.payments.plans.searchPlaceholder', 'Search by name or description')}
                clearLabel={t('admin.users.list.clearSearch', 'Clear search')}
              />
              <FilterSelect
                label={t('admin.payments.plans.form.planType', 'Payment Type')}
                value={type}
                onChange={setType}
                dir={direction}
                options={[{ value: 'all', label: t('admin.payments.plans.allTypes', 'All types') }, ...PLAN_TYPES.map((p) => ({ value: p, label: f.typeLabel(p) }))]}
              />
              <IconButton label={t('common.refresh', 'Refresh')} onClick={() => void load()} disabled={loading}>
                <RefreshCw className={`h-[18px] w-[18px] ${loading ? 'animate-spin' : ''}`} aria-hidden />
              </IconButton>
            </>
          }
          pills={
            <>
              <QuickPills<StatusFilter>
                label={t('admin.payments.products.status', 'Status')}
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'all', label: t('admin.payments.products.all', 'All'), count: counts.all },
                  {
                    value: 'active',
                    label: (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden />
                        {t('admin.payments.products.active', 'Active')}
                      </span>
                    ),
                    count: counts.active,
                  },
                  {
                    value: 'inactive',
                    label: (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-slate-400" aria-hidden />
                        {t('admin.payments.plans.inactive', 'Inactive')}
                      </span>
                    ),
                    count: counts.inactive,
                  },
                ]}
              />
              <span className="shrink-0">
                <ClearFilters show={filtersOn} label={t('admin.users.filters.clear', 'Clear Filters')} onClear={clearFilters} />
              </span>
            </>
          }
          columns={COLS}
          head={[
            t('admin.payments.plans.table.plan', 'Plan'),
            t('admin.payments.plans.form.planType', 'Payment Type'),
            t('admin.payments.plans.drawer.howCharged', 'How it charges'),
            t('admin.payments.plans.priority', 'Priority'),
            t('admin.payments.products.status', 'Status'),
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
          {paged.pageItems.map((p) => {
            const tone = PLAN_TONE[p.plan_type] ?? PLAN_TONE.one_time;
            return (
              <ListRow key={p.id} columns={COLS} onOpen={() => setOpenId(p.id)} label={p.plan_name} selected={openId === p.id} rtl={rtl}>
                <ListRowMain
                  lead={
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone.tile}`}>
                      <CreditCard className="h-[18px] w-[18px]" aria-hidden />
                    </span>
                  }
                  title={<bdi className="font-semibold">{p.plan_name}</bdi>}
                  extra={
                    <>
                      {p.is_default && (
                        <span className="rounded-full border border-primary/40 px-2 py-0.5 text-[11.5px] font-semibold text-primary">{t('admin.payments.plans.default', 'Default')}</span>
                      )}
                      {p.auto_detect_enabled && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11.5px] font-medium text-foreground/80">
                          <TrendingUp className="h-3 w-3" aria-hidden />
                          {t('admin.payments.plans.autoDetect', 'Auto-Detect')}
                        </span>
                      )}
                    </>
                  }
                  sub={p.plan_description ? <span className="line-clamp-1" dir="auto">{p.plan_description}</span> : undefined}
                />
                <ListCell label={t('admin.payments.plans.form.planType', 'Payment Type')}>
                  <span className={`inline-flex items-center gap-2 font-semibold ${tone.text}`}>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} aria-hidden />
                    {f.typeLabel(p.plan_type)}
                  </span>
                </ListCell>
                <ListCell label={t('admin.payments.plans.drawer.howCharged', 'How it charges')}>
                  <span className="block">{f.details(p)}</span>
                  {p.usage_count !== undefined && (
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-muted-foreground">
                      <Users className="h-3.5 w-3.5" aria-hidden />
                      {p.usage_count} {t('admin.payments.plans.enrollments', 'enrollments')}
                    </span>
                  )}
                </ListCell>
                <ListCell label={t('admin.payments.plans.priority', 'Priority')}>
                  <span className="font-semibold tabular-nums">{p.priority}</span>
                </ListCell>
                <ListCell label={t('admin.payments.products.status', 'Status')}>
                  <StatusDot tone={p.is_active ? 'green' : 'grey'}>
                    {p.is_active ? t('admin.payments.products.active', 'Active') : t('admin.payments.plans.inactive', 'Inactive')}
                  </StatusDot>
                </ListCell>
              </ListRow>
            );
          })}
        </ListPanel>
      </div>

      <PlanDrawer plan={openPlan} onClose={() => setOpenId(null)} onDelete={remove} />
    </AdminLayout>
  );
}
