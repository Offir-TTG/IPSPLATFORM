'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Bell, CalendarDays, ExternalLink, Info, MailOpen, RefreshCw, Search, Send, Trash2, WifiOff, X } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import type {
  NotificationCategory,
  NotificationDisplayStyle,
  NotificationPriority,
  NotificationScope,
} from '@/types/notifications';
import {
  CATEGORIES,
  CATEGORY_ICON,
  FallbackIcon,
  PRIORITIES,
  PRIORITY_TONE,
  SCOPES,
  SCOPE_ICON,
} from '@/components/admin/notifications/notificationStyle';
import { PortalPreview } from '@/components/admin/notifications/PortalPreview';
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
  kitButton,
  usePagedList,
} from '@/components/admin/notifications/kit';

/** How many sent notifications the list loads, as before. */
const HISTORY_LIMIT = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

/** One sent notification, as GET /api/admin/notifications returns it. */
type SentNotification = {
  id: string;
  scope: NotificationScope;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  action_url?: string | null;
  action_label?: string | null;
  expires_at?: string | null;
  /** Missing on older rows and before the database update: 'list'. */
  display_style?: NotificationDisplayStyle | null;
  created_at: string;
  read_count?: number;
  total_recipients?: number;
  recipient_details?: string;
  /** How many rows the send saved: several students, courses or programs chosen at once. */
  group_size?: number;
  /** When group_size > 1: each person / course / program and its own read numbers. */
  recipients?: Array<{ id: string; name: string; read_count: number; total: number }>;
};

/** Which number in the strip is filtering the list. */
type KpiFilter = 'all' | 'today' | 'unread';

/** The priority word's colour in the list (the dot comes from notificationStyle). */
const PRIORITY_TEXT: Record<NotificationPriority, string> = {
  urgent: 'text-red-700 dark:text-red-300',
  high: 'text-amber-800 dark:text-amber-300',
  medium: 'text-violet-700 dark:text-violet-300',
  low: 'text-muted-foreground',
};

const hasUnread = (n: SentNotification) => (n.total_recipients ?? 0) > (n.read_count ?? 0);
const sentToday = (n: SentNotification) => Date.now() - new Date(n.created_at).getTime() < DAY_MS;

/**
 * Notifications sent to students and parents, in the admin list template:
 * the numbers strip (each number filters the list), then one card with
 * search, filters, priority pills, rows and paging. Same data, live read
 * updates, filters and drawer as before. Sending is its own wizard page.
 */
export default function AdminNotificationsPage() {
  const { t, direction } = useAdminLanguage();
  const rtl = direction === 'rtl';
  const locale = rtl ? 'he-IL' : 'en-GB';

  const [stats, setStats] = useState({ totalSent: 0, todaySent: 0, unreadTotal: 0, totalDeleted: 0 });
  const [sent, setSent] = useState<SentNotification[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [query, setQuery] = useState('');
  const [filterScope, setFilterScope] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>('all');
  const [open, setOpen] = useState<SentNotification | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const fetchSentNotifications = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch(`/api/admin/notifications?limit=${HISTORY_LIMIT}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setSent(data.notifications || []);
      setLoadError(false);
    } catch (error) {
      console.error('Error fetching sent notifications:', error);
      setLoadError(true);
    } finally {
      setLoadingHistory(false);
      setLoaded(true);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/notifications/stats');
      if (response.ok) setStats(await response.json());
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  }, []);

  // Load, then keep up to date: every 30 seconds, and straight away when
  // someone reads a notification (as before).
  useEffect(() => {
    void fetchStats();
    void fetchSentNotifications();
    const pollInterval = setInterval(() => void fetchSentNotifications(), 30000);

    let unsubscribe: (() => void) | undefined;
    let alive = true;
    void (async () => {
      const { supabase } = await import('@/lib/supabase/client');
      if (!alive) return;
      const channel = supabase
        .channel('admin-notification-reads')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notification_reads' }, () => {
          void fetchSentNotifications();
        })
        .subscribe();
      unsubscribe = () => void channel.unsubscribe();
    })();

    return () => {
      alive = false;
      clearInterval(pollInterval);
      unsubscribe?.();
    };
  }, [fetchSentNotifications, fetchStats]);

  const refresh = () => {
    void fetchSentNotifications();
    void fetchStats();
  };

  const scopeLabel = (s: NotificationScope) =>
    s === 'individual'
      ? t('admin.notifications.entityType.student', 'Client')
      : s === 'course'
        ? t('admin.notifications.entityType.course', 'Course')
        : s === 'program'
          ? t('admin.notifications.entityType.program', 'Program')
          : t('admin.notifications.entityType.allUsers', 'All Users');
  const categoryLabel = (c: NotificationCategory) => t(`admin.notifications.categories.${c}`, c);
  const priorityLabel = (p: NotificationPriority) => t(`admin.notifications.priority.${p}`, p);
  const styleName = (s: NotificationDisplayStyle) =>
    ({
      list: t('admin.notifications.wizard.styleList', 'Only in the list'),
      toast: t('admin.notifications.wizard.styleToast', 'Pop-up in the corner'),
      top_bar: t('admin.notifications.wizard.styleTopBar', 'Bar at the top'),
      home_card: t('admin.notifications.wizard.styleHomeCard', 'Card on the home page'),
      modal: t('admin.notifications.wizard.styleModal', 'Pop-up window'),
    })[s] ?? s;
  const recipientText = (n: SentNotification) => {
    const many = n.group_size ?? 1;
    if (many > 1) {
      const key = n.scope === 'course' ? 'nCourses' : n.scope === 'program' ? 'nPrograms' : 'nStudents';
      const fallback = n.scope === 'course' ? '{n} courses' : n.scope === 'program' ? '{n} programs' : '{n} students';
      return t(`admin.notifications.${key}`, fallback).replace('{n}', num(many));
    }
    return n.scope === 'tenant' ? scopeLabel(n.scope) : n.recipient_details || scopeLabel(n.scope);
  };

  // Everything but the priority filter, so the priority pills can count.
  const beforePriority = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sent.filter((n) => {
      if (kpiFilter === 'today' && !sentToday(n)) return false;
      if (kpiFilter === 'unread' && !hasUnread(n)) return false;
      if (filterScope !== 'all' && n.scope !== filterScope) return false;
      if (filterCategory !== 'all' && n.category !== filterCategory) return false;
      if (q && !`${n.title} ${n.message} ${n.recipient_details ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [sent, query, filterScope, filterCategory, kpiFilter]);
  const shown = filterPriority === 'all' ? beforePriority : beforePriority.filter((n) => n.priority === filterPriority);
  const countOf = (p: NotificationPriority) => beforePriority.filter((n) => n.priority === p).length;
  const filtersOn = !!query.trim() || filterScope !== 'all' || filterCategory !== 'all' || filterPriority !== 'all' || kpiFilter !== 'all';
  const clearFilters = () => {
    setQuery('');
    setFilterScope('all');
    setFilterCategory('all');
    setFilterPriority('all');
    setKpiFilter('all');
  };
  const toggleKpi = (k: KpiFilter) => setKpiFilter((cur) => (cur === k ? 'all' : k));

  const dateText = (iso: string) => {
    const d = new Date(iso);
    const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    return d.toDateString() === new Date().toDateString()
      ? t('admin.notifications.todayAt', 'Today, {time}').replace('{time}', time)
      : d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const fullDate = (iso: string) => new Date(iso).toLocaleString(locale, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const readsText = (n: SentNotification) =>
    n.read_count !== undefined && n.total_recipients !== undefined ? `${n.read_count}/${n.total_recipients}` : '—';

  // Ten to a page; back to page 1 when filters change.
  const paged = usePagedList(shown, `${query}|${filterScope}|${filterCategory}|${filterPriority}|${kpiFilter}`);
  const COLS = 'minmax(0,1fr) 180px 110px 110px 130px 130px';
  const num = (n: number) => n.toLocaleString();
  const filteredNow = t('admin.list.filteredNow', 'Filtered now');

  // Loading, nothing yet, no results, or could not load: shown in place of the rows.
  let state: ReactNode = undefined;
  if (!loaded) state = <ListSkeleton />;
  else if (loadError && sent.length === 0)
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
  else if (sent.length === 0)
    state = (
      <ListState
        icon={Bell}
        title={t('admin.notifications.noHistory', 'No notifications sent yet')}
        text={t('admin.notifications.emptyText', 'A notification shows to clients and parents in their portal, and can also go by email.')}
        action={<NewButton href="/admin/notifications/new">{t('admin.notifications.wizard.newTitle', 'New notification')}</NewButton>}
      />
    );
  else if (shown.length === 0)
    state = (
      <ListState
        icon={Search}
        tone="grey"
        title={t('admin.notifications.noMatchingFilters', 'No notifications match your filters')}
        text={t('admin.list.noMatchText', 'Clear the search and filters to see the whole list.')}
        action={
          <button type="button" onClick={clearFilters} className={kitButton.secondary}>
            {t('admin.notifications.clearFilters', 'Clear filters')}
          </button>
        }
      />
    );

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-5 p-4 md:p-6" dir={direction}>
        <PageTitle
          icon={Bell}
          title={t('admin.notifications.pageTitle', 'Notifications')}
          badge={loaded ? num(stats.totalSent) : undefined}
          description={t('admin.notifications.listDescription', 'What clients and parents see in their portal, and by email when you choose.')}
          actions={
            <>
              <button type="button" onClick={() => setShowHelp((v) => !v)} aria-expanded={showHelp} className={kitButton.secondary}>
                <Info className="h-4 w-4" aria-hidden />
                {t('admin.notifications.helpTitle', 'How notifications work')}
              </button>
              <NewButton href="/admin/notifications/new">{t('admin.notifications.wizard.newTitle', 'New notification')}</NewButton>
            </>
          }
        />

        {showHelp && (
          <div className="rounded-xl border border-border bg-primary/10 p-4 text-sm">
            <ul className="space-y-1">
              <li>• {t('admin.notifications.help1', 'Individual: Send to a specific user')}</li>
              <li>• {t('admin.notifications.help2', 'Course: Send to all clients enrolled in a course')}</li>
              <li>• {t('admin.notifications.help3', 'Program: Send to all clients enrolled in a program')}</li>
              <li>• {t('admin.notifications.help4', 'Tenant: Send to all users in your organization')}</li>
              <li>• {t('admin.notifications.help5', 'Urgent/High priority notifications show toast alerts')}</li>
              <li>• {t('admin.notifications.help6', 'Users can configure their notification preferences')}</li>
            </ul>
          </div>
        )}

        <KpiStrip label={t('admin.list.numbers', 'Numbers')}>
          <KpiItem
            icon={<Send />}
            label={t('admin.notifications.totalSent', 'Total Sent')}
            value={num(stats.totalSent)}
            subtitle={t('admin.notifications.allTime', 'All time')}
            onClick={() => setKpiFilter('all')}
          />
          <KpiItem
            icon={<CalendarDays />}
            tone="blue"
            label={t('admin.notifications.todaySent', 'Sent Today')}
            value={num(stats.todaySent)}
            subtitle={t('admin.notifications.last24Hours', 'Last 24 hours')}
            onClick={() => toggleKpi('today')}
            active={kpiFilter === 'today'}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<MailOpen />}
            tone={stats.unreadTotal > 0 ? 'amber' : 'grey'}
            label={t('admin.notifications.unreadTotal', 'Total Unread')}
            value={num(stats.unreadTotal)}
            subtitle={t('admin.notifications.acrossAllUsers', 'Across all users')}
            onClick={() => toggleKpi('unread')}
            active={kpiFilter === 'unread'}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<Trash2 />}
            tone="grey"
            label={t('admin.notifications.totalDeleted', 'Total Deleted')}
            value={num(stats.totalDeleted)}
            subtitle={t('admin.notifications.deletedByUsers', 'Deleted by users')}
          />
        </KpiStrip>

        <ListPanel
          label={t('admin.notifications.pageTitle', 'Notifications')}
          toolbar={
            <>
              <ListSearch
                value={query}
                onChange={setQuery}
                placeholder={t('admin.notifications.searchPlaceholder', 'Search by title, words or recipient…')}
                clearLabel={t('admin.notifications.clearSearch', 'Clear search')}
              />
              <FilterSelect
                label={t('admin.notifications.table.recipient', 'Sent To')}
                value={filterScope}
                onChange={setFilterScope}
                dir={direction}
                options={[{ value: 'all', label: t('admin.notifications.anyRecipient', 'Anyone') }, ...SCOPES.map((s) => ({ value: s, label: scopeLabel(s) }))]}
              />
              <FilterSelect
                label={t('admin.notifications.table.category', 'Category')}
                value={filterCategory}
                onChange={setFilterCategory}
                dir={direction}
                options={[{ value: 'all', label: t('admin.notifications.anyCategory', 'Any kind') }, ...CATEGORIES.map((c) => ({ value: c, label: categoryLabel(c) }))]}
              />
              <IconButton label={t('common.refresh', 'Refresh')} onClick={refresh} disabled={loadingHistory}>
                <RefreshCw className={`h-[18px] w-[18px] ${loadingHistory ? 'animate-spin' : ''}`} aria-hidden />
              </IconButton>
            </>
          }
          pills={
            <>
              <QuickPills
                joined
                label={t('admin.notifications.filterPriority', 'Filter by Priority')}
                value={filterPriority}
                onChange={setFilterPriority}
                options={[
                  { value: 'all', label: t('common.all', 'All'), count: beforePriority.length },
                  ...PRIORITIES.slice()
                    .reverse()
                    .map((p) => ({
                      value: p,
                      label: (
                        <span className="inline-flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${PRIORITY_TONE[p].dot}`} aria-hidden />
                          {priorityLabel(p)}
                        </span>
                      ),
                      count: countOf(p),
                    })),
                ]}
              />
              <span className="shrink-0">
                <ClearFilters show={filtersOn} label={t('admin.notifications.clearFilters', 'Clear filters')} onClear={clearFilters} />
              </span>
            </>
          }
          columns={COLS}
          head={[
            t('admin.notifications.table.title', 'Title'),
            t('admin.notifications.table.recipient', 'Sent To'),
            t('admin.notifications.table.priority', 'Priority'),
            t('admin.notifications.table.category', 'Category'),
            t('admin.notifications.table.date', 'Date'),
            t('admin.notifications.table.reads', 'Reads'),
          ]}
          state={state}
          footer={
            loaded && shown.length > 0 ? (
              <ListFooter
                showingText={t('admin.notifications.showingRange', 'Showing {from}–{to} of {total}')
                  .replace('{from}', num(paged.start + 1))
                  .replace('{to}', num(paged.start + paged.pageItems.length))
                  .replace('{total}', num(shown.length))}
                pageText={t('admin.notifications.pageOf', 'Page {page} of {pages}').replace('{page}', String(paged.page)).replace('{pages}', String(paged.totalPages))}
                page={paged.page}
                totalPages={paged.totalPages}
                onPage={paged.setPage}
                prevLabel={t('admin.notifications.prevPage', 'Previous page')}
                nextLabel={t('admin.notifications.nextPage', 'Next page')}
                rtl={rtl}
              />
            ) : undefined
          }
        >
          {paged.pageItems.map((n) => {
            const tone = PRIORITY_TONE[n.priority] ?? PRIORITY_TONE.medium;
            const Icon = CATEGORY_ICON[n.category] ?? FallbackIcon;
            const ScopeIcon = SCOPE_ICON[n.scope] ?? FallbackIcon;
            return (
              <ListRow key={n.id} columns={COLS} onOpen={() => setOpen(n)} label={n.title} selected={open?.id === n.id} rtl={rtl}>
                <ListRowMain
                  lead={
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone.tile}`}>
                      <Icon className="h-[18px] w-[18px]" aria-hidden />
                    </span>
                  }
                  title={<bdi className="font-semibold">{n.title}</bdi>}
                  sub={<span className="line-clamp-1" dir="auto">{n.message}</span>}
                />
                <ListCell label={t('admin.notifications.table.recipient', 'Sent To')}>
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-muted text-foreground/70" aria-hidden>
                      <ScopeIcon className="h-3.5 w-3.5" />
                    </span>
                    <bdi className="truncate">{recipientText(n)}</bdi>
                  </span>
                </ListCell>
                <ListCell label={t('admin.notifications.table.priority', 'Priority')}>
                  <span className={`inline-flex items-center gap-2 font-semibold ${PRIORITY_TEXT[n.priority] ?? ''}`}>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} aria-hidden />
                    {priorityLabel(n.priority)}
                  </span>
                </ListCell>
                <ListCell label={t('admin.notifications.table.category', 'Category')}>{categoryLabel(n.category)}</ListCell>
                <ListCell label={t('admin.notifications.table.date', 'Date')}>{dateText(n.created_at)}</ListCell>
                <ListCell label={t('admin.notifications.table.reads', 'Reads')}>
                  <ReadMeter read={n.read_count} total={n.total_recipients} text={readsText(n)} />
                </ListCell>
              </ListRow>
            );
          })}
        </ListPanel>

        {/* Only when the list stops at its limit, so older ones may be missing. */}
        {loaded && sent.length >= HISTORY_LIMIT && (
          <p className="text-xs text-muted-foreground">
            {t('admin.notifications.showingNewest', 'Showing the newest {count}.').replace('{count}', String(sent.length))}
          </p>
        )}
      </div>

      {/* One notification: pinned top with the read numbers, sections below */}
      <Sheet open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent
          side={rtl ? 'left' : 'right'}
          dir={direction}
          className="flex w-full flex-col gap-0 border-0 p-0 shadow-2xl outline-none focus:outline-none focus-visible:outline-none dark:[color-scheme:dark] sm:max-w-[480px] [&>[data-default-close]]:hidden"
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
                <p className={`inline-flex items-center gap-2 pe-10 text-[13.5px] font-semibold ${PRIORITY_TEXT[open.priority] ?? ''}`}>
                  <span className={`h-2 w-2 rounded-full ${(PRIORITY_TONE[open.priority] ?? PRIORITY_TONE.medium).dot}`} aria-hidden />
                  {priorityLabel(open.priority)} · {categoryLabel(open.category)}
                </p>
                <SheetTitle className="mt-1.5 pe-10 [font-family:inherit] text-[23px] font-extrabold leading-tight tracking-tight [overflow-wrap:anywhere]" dir="auto">
                  {open.title}
                </SheetTitle>
                <SheetDescription className="mt-1.5 text-sm text-muted-foreground">
                  {fullDate(open.created_at)} · <bdi>{recipientText(open)}</bdi>
                </SheetDescription>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <DrawerStat label={t('admin.notifications.drawer.read', 'Read')} value={open.read_count !== undefined ? num(open.read_count) : '—'} />
                  <DrawerStat
                    label={t('admin.notifications.drawer.unread', 'Not read yet')}
                    value={open.read_count !== undefined && open.total_recipients !== undefined ? num(Math.max(0, open.total_recipients - open.read_count)) : '—'}
                    warn={hasUnread(open)}
                  />
                  <DrawerStat label={t('admin.notifications.drawer.sentTo', 'Sent to')} value={open.total_recipients !== undefined ? num(open.total_recipients) : '—'} />
                </div>
              </header>

              <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-6 py-5">
                <DrawerSection title={t('admin.notifications.messageLabel', 'Message')}>
                  <p className="whitespace-pre-line p-3.5 text-sm text-foreground/85 [overflow-wrap:anywhere]" dir="auto">
                    {open.message}
                  </p>
                  {open.action_url && (
                    <a
                      href={open.action_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mx-3.5 mb-3.5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden />
                      <bdi>{open.action_label || open.action_url}</bdi>
                    </a>
                  )}
                </DrawerSection>

                <DrawerSection title={t('admin.notifications.drawer.preview', 'How it looks in the portal')}>
                  <div className="p-3.5">
                    <PortalPreview
                      title={open.title}
                      message={open.message}
                      actionLabel={open.action_label ?? ''}
                      priority={open.priority}
                      category={open.category}
                      displayStyle={open.display_style ?? 'list'}
                    />
                  </div>
                </DrawerSection>

                <DrawerSection title={t('admin.notifications.drawer.details', 'Details')}>
                  <dl className="m-0 divide-y divide-border px-3.5 text-sm">
                    {(
                      [
                        [
                          t('admin.notifications.table.recipient', 'Sent To'),
                          (open.group_size ?? 1) > 1
                            ? recipientText(open)
                            : `${scopeLabel(open.scope)}${open.scope !== 'tenant' && open.recipient_details ? ` · ${open.recipient_details}` : ''}`,
                        ],
                        [t('admin.notifications.table.priority', 'Priority'), priorityLabel(open.priority)],
                        [t('admin.notifications.table.category', 'Category'), categoryLabel(open.category)],
                        [t('admin.notifications.wizard.stepAppearance', 'How it appears'), styleName(open.display_style ?? 'list')],
                        [t('admin.notifications.table.reads', 'Reads'), readsText(open)],
                        ...(open.expires_at ? [[t('admin.notifications.expiresAt', 'Expires At'), fullDate(open.expires_at)]] : []),
                      ] as Array<[string, string]>
                    ).map(([label, value]) => (
                      <div key={label} className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2.5">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="m-0 min-w-0 font-medium [overflow-wrap:anywhere]">
                          <bdi>{value}</bdi>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </DrawerSection>

                {open.recipients && open.recipients.length > 1 && (
                  <DrawerSection title={t('admin.notifications.drawer.recipients', 'Who got it')} aside={num(open.recipients.length)} highlight>
                    <RecipientList key={open.id} recipients={open.recipients} people={open.scope === 'individual'} t={t} num={num} />
                  </DrawerSection>
                )}
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

/** "18/24" with a small bar; green once everyone has read it. */
function ReadMeter({ read, total, text }: { read?: number; total?: number; text: string }) {
  const pct = read !== undefined && total ? Math.min(100, Math.round((read / total) * 100)) : 0;
  const done = total !== undefined && total > 0 && read !== undefined && read >= total;
  return (
    <span className="inline-flex w-full max-w-[9rem] items-center gap-2.5">
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
        <span className={`block h-full rounded-full ${done ? 'bg-green-600' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
      </span>
      <span dir="ltr" className="min-w-[2.5rem] text-end text-[13.5px] font-semibold tabular-nums">
        {text}
      </span>
    </span>
  );
}

function DrawerStat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5">
      <div className="text-[12.5px] text-muted-foreground">{label}</div>
      <div className={`text-xl font-extrabold tabular-nums ${warn ? 'text-amber-700 dark:text-amber-300' : ''}`}>{value}</div>
    </div>
  );
}

/**
 * Who a send to several students (or courses, programs) went to. People
 * who haven't read it come first; the first 8 show, the rest on request.
 */
function RecipientList({
  recipients,
  people,
  t,
  num,
}: {
  recipients: Array<{ id: string; name: string; read_count: number; total: number }>;
  /** Students (read / not read) rather than courses or programs (18/24). */
  people: boolean;
  t: (key: string, fallback: string) => string;
  num: (n: number) => string;
}) {
  const FIRST = 8;
  const [all, setAll] = useState(false);
  const done = (r: { read_count: number; total: number }) => r.total > 0 && r.read_count >= r.total;
  const sorted = [...recipients].sort((a, b) => Number(done(a)) - Number(done(b)) || a.name.localeCompare(b.name));
  const shown = all ? sorted : sorted.slice(0, FIRST);
  return (
    <ul className="m-0 list-none px-3.5 text-sm">
      {shown.map((r) => (
        <li key={r.id} className="flex items-center gap-2.5 border-b border-border/70 py-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary" aria-hidden>
            {r.name.trim().charAt(0) || '?'}
          </span>
          <bdi className="min-w-0 flex-1 truncate">{r.name || '—'}</bdi>
          {people ? (
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold ${
                done(r) ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-300'
              }`}
            >
              <span className={`h-[7px] w-[7px] rounded-full ${done(r) ? 'bg-green-600' : 'bg-amber-500'}`} aria-hidden />
              {done(r) ? t('admin.notifications.drawer.readIt', 'Read') : t('admin.notifications.drawer.notReadIt', 'Not read yet')}
            </span>
          ) : (
            <span dir="ltr" className={`shrink-0 text-[13px] font-semibold tabular-nums ${done(r) ? 'text-green-700 dark:text-green-400' : ''}`}>
              {num(r.read_count)}/{num(r.total)}
            </span>
          )}
        </li>
      ))}
      {sorted.length > FIRST && (
        <li className="py-1.5">
          <button type="button" onClick={() => setAll((v) => !v)} className="min-h-9 text-sm font-semibold text-primary hover:underline">
            {all
              ? t('admin.notifications.drawer.showFewer', 'Show fewer')
              : t('admin.notifications.drawer.showAll', 'Show all {n}').replace('{n}', num(sorted.length))}
          </button>
        </li>
      )}
    </ul>
  );
}

function DrawerSection({ title, aside, highlight, children }: { title: string; aside?: string; highlight?: boolean; children: ReactNode }) {
  return (
    <section className={`overflow-hidden rounded-[14px] border ${highlight ? 'border-primary/30' : 'border-border'}`}>
      <h3
        className={`flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm font-bold text-primary [font-family:inherit] ${
          highlight ? 'bg-primary/10' : 'bg-primary/[0.06]'
        }`}
      >
        {title}
        {aside && <span className="font-semibold tabular-nums text-muted-foreground">{aside}</span>}
      </h3>
      {children}
    </section>
  );
}
