'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  Clock,
  FileText,
  LogIn,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  SlidersHorizontal,
  Trash2,
  WifiOff,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { AuditEventDetails, useAuditFormatters } from '@/components/admin/users/activity/UserAuditTable';
import {
  ClearFilters,
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
  PageTitle,
  QuickPills,
  kitButton,
} from '@/components/admin/notifications/kit';
import type { AuditEvent } from '@/lib/audit/types';

const PAGE_SIZE = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

const EVENT_TYPES = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'ACCESS'] as const;
const CATEGORIES = ['ALL', 'SECURITY', 'AUTH', 'CONFIG', 'DATA', 'ADMIN', 'STUDENT_RECORD', 'GRADE', 'ATTENDANCE'] as const;
const RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
const STATUSES = ['success', 'failure', 'partial'] as const;

type Filters = {
  dateFrom?: string;
  dateTo?: string;
  eventTypes?: string[];
  category?: string;
  riskLevels?: string[];
  status?: string[];
  search?: string;
};

/** Icon and colour for each kind of action. */
const TYPE_LOOK: Record<string, { icon: LucideIcon; tile: string }> = {
  CREATE: { icon: Plus, tile: 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300' },
  UPDATE: { icon: Pencil, tile: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' },
  DELETE: { icon: Trash2, tile: 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300' },
  LOGIN: { icon: LogIn, tile: 'bg-primary/10 text-primary' },
  LOGOUT: { icon: LogIn, tile: 'bg-muted text-foreground/70' },
};
const DEFAULT_LOOK = { icon: FileText, tile: 'bg-muted text-foreground/70' };

const RISK_TONE: Record<string, { dot: string; text: string }> = {
  critical: { dot: 'bg-red-600', text: 'text-red-700 dark:text-red-300' },
  high: { dot: 'bg-amber-500', text: 'text-amber-800 dark:text-amber-300' },
  medium: { dot: 'bg-violet-500', text: 'text-violet-700 dark:text-violet-300' },
  low: { dot: 'bg-slate-400', text: 'text-muted-foreground' },
};
const STATUS_TONE: Record<string, { dot: string; text: string }> = {
  success: { dot: 'bg-green-600', text: '' },
  failure: { dot: 'bg-red-600', text: 'text-red-700 dark:text-red-300' },
  partial: { dot: 'bg-amber-500', text: 'text-amber-800 dark:text-amber-300' },
};

const sameSet = (a: string[] | undefined, b: string[]) => !!a && a.length === b.length && b.every((v) => a.includes(v));
/** A datetime-local value (what the From/To boxes hold) for a moment. */
const localInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

/**
 * Audit trail, in the admin list template: the numbers strip (each number
 * filters the list), then one card with search, category pills, more
 * filters, the events and paging. Pressing an event opens its drawer with
 * who, what, and what changed. Same data, filters and paging as before.
 */
export default function AdminAuditPage() {
  const { t, direction } = useAdminLanguage();
  const rtl = direction === 'rtl';
  const locale = rtl ? 'he-IL' : 'en-GB';
  const { formatActionName, formatResource } = useAuditFormatters();

  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<Filters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<AuditEvent | null>(null);
  const [stats, setStats] = useState({ totalEvents: 0, highRiskEvents: 0, failedEvents: 0, todayEvents: 0 });

  const changeFilters = (next: Filters) => {
    setFilters(next);
    setPage(1);
  };
  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => changeFilters({ ...filters, [key]: value });
  const toggleIn = (key: 'eventTypes' | 'riskLevels' | 'status', value: string) => {
    const cur = filters[key] ?? [];
    const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    setFilter(key, next.length ? next : undefined);
  };

  // Search waits a moment while typing (as before: short words go straight away).
  useEffect(() => {
    const apply = () => setFilters((f) => (f.search === (searchTerm || undefined) ? f : { ...f, search: searchTerm || undefined }));
    if (searchTerm.length <= 2) {
      apply();
      setPage(1);
      return;
    }
    const timer = setTimeout(() => {
      apply();
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ limit: PAGE_SIZE.toString(), offset: ((page - 1) * PAGE_SIZE).toString() });
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.eventTypes) params.append('event_types', filters.eventTypes.join(','));
      if (filters.category) params.append('event_categories', filters.category);
      if (filters.riskLevels) params.append('risk_levels', filters.riskLevels.join(','));
      if (filters.status) params.append('status', filters.status.join(','));
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/audit/events?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load audit events');
      setEvents(data.data || []);
      setTotalCount(data.count || 0);
    } catch (err: any) {
      console.error('Load events error:', err);
      setError(err.message || 'Failed to load audit events');
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [filters, page]);

  const loadStats = useCallback(async () => {
    try {
      const yesterday = new Date(Date.now() - DAY_MS);
      const [total, highRisk, failed, today] = await Promise.all(
        [
          '/api/audit/events?limit=1',
          '/api/audit/events?risk_levels=high,critical&limit=1',
          '/api/audit/events?status=failure&limit=1',
          `/api/audit/events?date_from=${yesterday.toISOString()}&limit=1`,
        ].map((u) => fetch(u).then((r) => r.json())),
      );
      setStats({
        totalEvents: total.count || 0,
        highRiskEvents: highRisk.count || 0,
        failedEvents: failed.count || 0,
        todayEvents: today.count || 0,
      });
    } catch (err) {
      console.error('Load stats error:', err);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);
  useEffect(() => {
    void loadStats();
  }, [loadStats, filters, page]);

  const refresh = () => {
    void loadEvents();
    void loadStats();
  };

  const clearAll = () => {
    setSearchTerm('');
    changeFilters({});
  };

  // The numbers filter the list: high risk, failed, last 24 hours.
  const HIGH = ['high', 'critical'];
  const highOn = sameSet(filters.riskLevels, HIGH);
  const failedOn = sameSet(filters.status, ['failure']);
  const todayOn = !!filters.dateFrom && !filters.dateTo && Date.now() - new Date(filters.dateFrom).getTime() <= DAY_MS + 60000;
  const filteredNow = t('admin.list.filteredNow', 'Filtered now');

  const moreCount = [filters.dateFrom, filters.dateTo, filters.eventTypes?.length, filters.riskLevels?.length, filters.status?.length].filter(Boolean).length;
  const filtersOn = !!filters.search || !!filters.category || moreCount > 0;

  const typeLabel = (type: string) => t(`audit.eventType.${type}`, type.charAt(0) + type.slice(1).toLowerCase());
  const riskLabel = (r: string) => t(`admin.audit.filters.riskLevel.${r}`, r.charAt(0).toUpperCase() + r.slice(1));
  const statusLabel = (s: string) => t(`admin.audit.filters.statusValue.${s}`, s.charAt(0).toUpperCase() + s.slice(1));
  const categoryLabel = (c: string) =>
    ({
      ALL: t('admin.audit.filters.allCategories', 'All Categories'),
      SECURITY: t('admin.audit.filters.category.security', 'Security'),
      AUTH: t('admin.audit.filters.category.auth', 'Authentication'),
      CONFIG: t('admin.audit.filters.category.config', 'Configuration'),
      DATA: t('admin.audit.filters.category.data', 'Data'),
      ADMIN: t('admin.audit.filters.category.admin', 'Admin'),
      STUDENT_RECORD: t('admin.audit.filters.category.studentRecord', 'Student Records'),
      GRADE: t('admin.audit.filters.category.grade', 'Grades'),
      ATTENDANCE: t('admin.audit.filters.category.attendance', 'Attendance'),
    })[c] ?? c;

  const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  const resourceName = (ev: AuditEvent) => {
    const cleaned = (ev.resource_name || '').replace(UUID_RE, '').replace(/\s{2,}/g, ' ').trim();
    // Skip a name that only repeats the resource type in English.
    return cleaned && cleaned.toLowerCase().replace(/\s+/g, '_') !== (ev.resource_type ?? '').toLowerCase() ? cleaned : '';
  };
  const timeText = (iso: string) => {
    const d = new Date(iso);
    const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
    return d.toDateString() === new Date().toDateString()
      ? t('admin.notifications.todayAt', 'Today, {time}').replace('{time}', time)
      : `${d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}, ${time}`;
  };
  const fullDate = (iso: string) =>
    new Date(iso).toLocaleString(locale, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const num = (n: number) => n.toLocaleString();
  const COLS = 'minmax(0,1fr) 210px 100px 100px 110px 140px';

  let state: ReactNode = undefined;
  if (!loaded || (loading && events.length === 0)) state = <ListSkeleton />;
  else if (error && events.length === 0)
    state = (
      <ListState
        icon={WifiOff}
        tone="red"
        title={t('admin.list.loadError', "We couldn't load the list")}
        text={t('admin.list.loadErrorText', 'The internet connection may have dropped. Nothing was deleted.')}
        action={
          <button type="button" onClick={refresh} className={kitButton.primary}>
            {t('admin.list.retry', 'Try again')}
          </button>
        }
      />
    );
  else if (events.length === 0 && filtersOn)
    state = (
      <ListState
        icon={Search}
        tone="grey"
        title={t('admin.audit.table.noEvents', 'No audit events found')}
        text={t('admin.list.noMatchText', 'Clear the search and filters to see the whole list.')}
        action={
          <button type="button" onClick={clearAll} className={kitButton.secondary}>
            {t('admin.notifications.clearFilters', 'Clear filters')}
          </button>
        }
      />
    );
  else if (events.length === 0) state = <ListState icon={Shield} title={t('admin.audit.table.noEvents', 'No audit events found')} />;

  const chip = (on: boolean) =>
    `inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-sm ${
      on ? 'border-primary bg-primary font-semibold text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-muted'
    }`;

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-5 p-4 md:p-6" dir={direction}>
        <PageTitle
          icon={Shield}
          title={t('admin.audit.title', 'Audit Trail')}
          badge={loaded ? num(stats.totalEvents) : undefined}
          description={t('admin.audit.subtitle', 'Monitor all system activities and compliance events')}
        />

        <KpiStrip label={t('admin.list.numbers', 'Numbers')}>
          <KpiItem icon={<Shield />} label={t('admin.audit.stats.total', 'Total Events')} value={num(stats.totalEvents)} onClick={clearAll} />
          <KpiItem
            icon={<AlertTriangle />}
            tone={stats.highRiskEvents > 0 ? 'amber' : 'grey'}
            label={t('admin.audit.stats.highRisk', 'High Risk')}
            value={num(stats.highRiskEvents)}
            onClick={() => setFilter('riskLevels', highOn ? undefined : HIGH)}
            active={highOn}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<XCircle />}
            tone={stats.failedEvents > 0 ? 'amber' : 'grey'}
            label={t('admin.audit.stats.failed', 'Failed Actions')}
            value={num(stats.failedEvents)}
            onClick={() => setFilter('status', failedOn ? undefined : ['failure'])}
            active={failedOn}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<Clock />}
            tone="blue"
            label={t('admin.audit.stats.today', 'Last 24 Hours')}
            value={num(stats.todayEvents)}
            onClick={() => changeFilters({ ...filters, dateTo: undefined, dateFrom: todayOn ? undefined : localInput(new Date(Date.now() - DAY_MS)) })}
            active={todayOn}
            activeNote={filteredNow}
          />
        </KpiStrip>

        <ListPanel
          label={t('admin.audit.title', 'Audit Trail')}
          toolbar={
            <>
              <ListSearch
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={t('admin.audit.filters.searchPlaceholder', 'Search...')}
                clearLabel={t('admin.notifications.clearSearch', 'Clear search')}
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
              <IconButton label={t('common.refresh', 'Refresh')} onClick={refresh} disabled={loading}>
                <RefreshCw className={`h-[18px] w-[18px] ${loading ? 'animate-spin' : ''}`} aria-hidden />
              </IconButton>
            </>
          }
          pills={
            <>
              <QuickPills
                label={t('admin.audit.filters.category', 'Category')}
                value={filters.category ?? 'ALL'}
                onChange={(c) => setFilter('category', c === 'ALL' ? undefined : c)}
                options={CATEGORIES.map((c) => ({ value: c, label: categoryLabel(c) }))}
              />
              <span className="shrink-0">
                <ClearFilters show={filtersOn} label={t('admin.notifications.clearFilters', 'Clear filters')} onClear={clearAll} />
              </span>
            </>
          }
          columns={COLS}
          head={[
            t('admin.audit.table.action', 'Action'),
            t('admin.audit.table.user', 'User'),
            t('admin.audit.table.type', 'Type'),
            t('admin.audit.table.risk', 'Risk'),
            t('admin.audit.filters.status', 'Status'),
            t('admin.audit.table.time', 'Time'),
          ]}
          extra={
            moreOpen ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-muted-foreground">{t('admin.audit.filters.dateFrom', 'From')}</span>
                      <input
                        type="datetime-local"
                        value={filters.dateFrom || ''}
                        onChange={(e) => setFilter('dateFrom', e.target.value || undefined)}
                        className="h-11 w-full rounded-lg border border-border bg-card px-3 text-foreground outline-none focus:border-primary dark:[color-scheme:dark]"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-muted-foreground">{t('admin.audit.filters.dateTo', 'To')}</span>
                      <input
                        type="datetime-local"
                        value={filters.dateTo || ''}
                        onChange={(e) => setFilter('dateTo', e.target.value || undefined)}
                        className="h-11 w-full rounded-lg border border-border bg-card px-3 text-foreground outline-none focus:border-primary dark:[color-scheme:dark]"
                      />
                    </label>
                  </div>
                  <ChipGroup label={t('admin.audit.filters.eventTypes', 'Types')}>
                    {EVENT_TYPES.map((type) => {
                      const on = !!filters.eventTypes?.includes(type);
                      return (
                        <button key={type} type="button" aria-pressed={on} onClick={() => toggleIn('eventTypes', type)} className={chip(on)}>
                          {t(`admin.audit.filters.eventType.${type.toLowerCase()}`, typeLabel(type))}
                        </button>
                      );
                    })}
                  </ChipGroup>
                  <ChipGroup label={t('admin.audit.filters.riskLevels', 'Risk')}>
                    {RISK_LEVELS.map((r) => {
                      const on = !!filters.riskLevels?.includes(r);
                      return (
                        <button key={r} type="button" aria-pressed={on} onClick={() => toggleIn('riskLevels', r)} className={chip(on)}>
                          <span className={`h-2 w-2 rounded-full ${RISK_TONE[r].dot}`} aria-hidden />
                          {riskLabel(r)}
                        </button>
                      );
                    })}
                  </ChipGroup>
                  <ChipGroup label={t('admin.audit.filters.status', 'Status')}>
                    {STATUSES.map((s) => {
                      const on = !!filters.status?.includes(s);
                      return (
                        <button key={s} type="button" aria-pressed={on} onClick={() => toggleIn('status', s)} className={chip(on)}>
                          <span className={`h-2 w-2 rounded-full ${STATUS_TONE[s].dot}`} aria-hidden />
                          {statusLabel(s)}
                        </button>
                      );
                    })}
                  </ChipGroup>
                </div>
            ) : undefined
          }
          state={state}
          footer={
            loaded && events.length > 0 ? (
              <ListFooter
                showingText={t('admin.notifications.showingRange', 'Showing {from}–{to} of {total}')
                  .replace('{from}', num((page - 1) * PAGE_SIZE + 1))
                  .replace('{to}', num((page - 1) * PAGE_SIZE + events.length))
                  .replace('{total}', num(totalCount))}
                pageText={t('admin.notifications.pageOf', 'Page {page} of {pages}').replace('{page}', String(page)).replace('{pages}', String(totalPages))}
                page={page}
                totalPages={totalPages}
                onPage={setPage}
                prevLabel={t('admin.notifications.prevPage', 'Previous page')}
                nextLabel={t('admin.notifications.nextPage', 'Next page')}
                rtl={rtl}
              />
            ) : undefined
          }
        >
                  {events.map((ev) => {
                    const look = TYPE_LOOK[ev.event_type] ?? DEFAULT_LOOK;
                    const Icon = look.icon;
                    const risk = RISK_TONE[ev.risk_level] ?? RISK_TONE.low;
                    const status = STATUS_TONE[ev.status] ?? STATUS_TONE.partial;
                    const name = resourceName(ev);
                    return (
                      <ListRow key={ev.id} columns={COLS} onOpen={() => setOpen(ev)} label={formatActionName(ev.action, ev)} selected={open?.id === ev.id} rtl={rtl}>
                        <ListRowMain
                          lead={
                            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${look.tile}`}>
                              <Icon className="h-[18px] w-[18px]" aria-hidden />
                            </span>
                          }
                          title={<bdi className="font-semibold">{formatActionName(ev.action, ev)}</bdi>}
                          sub={
                            <span className="line-clamp-1" dir="auto">
                              {formatResource(ev.resource_type)}
                              {name ? ` · ${name}` : ''}
                            </span>
                          }
                        />
                        <ListCell label={t('admin.audit.table.user', 'User')}>
                          <span className="block truncate" dir="ltr">
                            {ev.user_email || t('admin.audit.table.system', 'System')}
                          </span>
                          {ev.user_role && <span className="block text-[13px] text-muted-foreground">{ev.user_role}</span>}
                        </ListCell>
                        <ListCell label={t('admin.audit.table.type', 'Type')}>{typeLabel(ev.event_type)}</ListCell>
                        <ListCell label={t('admin.audit.table.risk', 'Risk')}>
                          <span className={`inline-flex items-center gap-2 font-semibold ${risk.text}`}>
                            <span className={`h-2 w-2 shrink-0 rounded-full ${risk.dot}`} aria-hidden />
                            {riskLabel(ev.risk_level)}
                          </span>
                        </ListCell>
                        <ListCell label={t('admin.audit.filters.status', 'Status')}>
                          <span className={`inline-flex items-center gap-2 ${status.text}`}>
                            <span className={`h-2 w-2 shrink-0 rounded-full ${status.dot}`} aria-hidden />
                            {statusLabel(ev.status)}
                          </span>
                        </ListCell>
                        <ListCell label={t('admin.audit.table.time', 'Time')}>{timeText(ev.event_timestamp)}</ListCell>
                      </ListRow>
                    );
                  })}
        </ListPanel>

        {error && events.length > 0 && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* One event: who did what, to what, and what changed */}
      <Sheet open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent
          side={rtl ? 'left' : 'right'}
          dir={direction}
          className="flex w-full flex-col gap-0 border-0 p-0 shadow-2xl outline-none focus:outline-none focus-visible:outline-none dark:[color-scheme:dark] sm:max-w-[520px] [&>button.absolute]:hidden"
        >
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label={t('common.close', 'Close')}
            className="absolute end-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>

          {open && (
            <>
              <header className="shrink-0 border-b border-border bg-primary/[0.04] px-6 pb-5 pt-6">
                <p className={`inline-flex items-center gap-2 pe-10 text-[13.5px] font-semibold ${(RISK_TONE[open.risk_level] ?? RISK_TONE.low).text}`}>
                  <span className={`h-2 w-2 rounded-full ${(RISK_TONE[open.risk_level] ?? RISK_TONE.low).dot}`} aria-hidden />
                  {typeLabel(open.event_type)} · {riskLabel(open.risk_level)}
                </p>
                <SheetTitle className="mt-1.5 pe-10 text-[23px] font-extrabold leading-tight tracking-tight [font-family:inherit] [overflow-wrap:anywhere]" dir="auto">
                  {formatActionName(open.action, open)}
                </SheetTitle>
                <SheetDescription className="mt-1.5 text-sm text-muted-foreground">{fullDate(open.event_timestamp)}</SheetDescription>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <HeaderStat label={t('admin.audit.table.type', 'Type')} value={typeLabel(open.event_type)} />
                  <HeaderStat label={t('admin.audit.table.risk', 'Risk')} value={riskLabel(open.risk_level)} className={(RISK_TONE[open.risk_level] ?? RISK_TONE.low).text} />
                  <HeaderStat label={t('admin.audit.filters.status', 'Status')} value={statusLabel(open.status)} className={(STATUS_TONE[open.status] ?? STATUS_TONE.partial).text} />
                </div>
              </header>

              <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-6 py-5">
                <Section title={t('admin.audit.drawer.who', 'Who')}>
                  <dl className="m-0 divide-y divide-border px-3.5 text-sm">
                    <Row label={t('admin.audit.table.user', 'User')}>
                      <span dir="ltr">{open.user_email || t('admin.audit.table.system', 'System')}</span>
                    </Row>
                    {open.user_role && <Row label={t('admin.audit.drawer.role', 'Role')}>{open.user_role}</Row>}
                  </dl>
                </Section>
                <Section title={t('admin.audit.drawer.what', 'What it was about')}>
                  <dl className="m-0 divide-y divide-border px-3.5 text-sm">
                    <Row label={t('admin.audit.table.resource', 'Resource')}>{formatResource(open.resource_type)}</Row>
                    {resourceName(open) && (
                      <Row label={t('admin.audit.drawer.name', 'Name')}>
                        <bdi>{resourceName(open)}</bdi>
                      </Row>
                    )}
                  </dl>
                </Section>
                <Section title={t('admin.audit.drawer.changes', 'What changed')}>
                  <div className="p-3.5">
                    <AuditEventDetails event={open} />
                  </div>
                </Section>
              </div>

              <footer className="shrink-0 border-t border-border bg-card px-6 py-4">
                <button type="button" onClick={() => setOpen(null)} className={`${kitButton.secondary} w-full`}>
                  {t('common.close', 'Close')}
                </button>
              </footer>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}

function ChipGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label}>
      <div className="mb-1.5 text-sm font-medium text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function HeaderStat({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card px-3 py-2.5">
      <div className="text-[12.5px] text-muted-foreground">{label}</div>
      <div className={`truncate text-base font-extrabold ${className}`}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[14px] border border-border">
      <h3 className="bg-primary/[0.06] px-3.5 py-2.5 text-sm font-bold text-primary [font-family:inherit]">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="m-0 min-w-0 font-medium [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}
