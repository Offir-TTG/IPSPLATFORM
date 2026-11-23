'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Clock, ExternalLink, Loader2, RefreshCw, Search, ShieldAlert, Upload, WifiOff, X, XCircle } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  usePagedList,
} from '@/components/admin/notifications/kit';

/** One dispute, as GET /api/admin/payments/disputes returns it (its field names). */
interface Dispute {
  id: string;
  disputeId: string;
  chargeId: string | null;
  amount: number;
  currency: string;
  reason: string;
  status: 'needs_response' | 'under_review' | 'won' | 'lost' | 'closed';
  created: string;
  evidenceDue: string | null;
  evidenceSubmitted: boolean;
  user: { id: string; name: string; email: string } | null;
  product: { id: string; name: string } | null;
  transactionId: string | null;
}

const STATUSES = ['needs_response', 'under_review', 'won', 'lost', 'closed'] as const;
type StatusFilter = 'all' | (typeof STATUSES)[number];
const TONE: Record<string, { dot: string; text: string }> = {
  needs_response: { dot: 'bg-red-600', text: 'text-red-700 dark:text-red-300' },
  under_review: { dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300' },
  won: { dot: 'bg-green-600', text: 'text-green-700 dark:text-green-400' },
  lost: { dot: 'bg-slate-500', text: 'text-muted-foreground' },
  closed: { dot: 'bg-slate-400', text: 'text-muted-foreground' },
};
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Payment disputes (chargebacks), in the admin list template: the numbers
 * (each filters), a warning when an evidence deadline has passed, one card
 * with search, status pills, the disputes and paging. Pressing a dispute
 * opens its drawer with the details, the time left to respond, Open in
 * Stripe, and Submit evidence (sent to Stripe). Disputes arrive from
 * Stripe's webhook.
 */
export default function DisputesPage() {
  const { t, direction, language } = useAdminLanguage();
  const { toast } = useToast();
  const rtl = direction === 'rtl';
  const locale = language === 'he' ? 'he-IL' : 'en-US';

  const [items, setItems] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [evidenceFor, setEvidenceFor] = useState<Dispute | null>(null);

  const ui = useRef({ t, toast });
  ui.current = { t, toast };

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Search runs on the server (name, email or dispute id); statuses are filtered here.
  const load = async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      const response = await fetch(`/api/admin/payments/disputes?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch disputes');
      const data = await response.json();
      setItems(data.disputes || []);
      setLoadError(false);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      setLoadError(true);
      ui.current.toast({
        title: ui.current.t('common.error', 'Error'),
        description: ui.current.t('admin.payments.disputes.loadError', 'Failed to load disputes'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };
  useEffect(() => {
    void load(debounced);
  }, [debounced]);

  const money = (amount: number, currency?: string) => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: currency || 'USD' }).format(amount || 0);
    } catch {
      return `${amount}`;
    }
  };
  const date = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
  const statusLabel = (s: string) =>
    ({
      needs_response: t('admin.payments.disputes.status.needsResponse', 'Needs Response'),
      under_review: t('admin.payments.disputes.status.underReview', 'Under Review'),
      won: t('admin.payments.disputes.status.won', 'Won'),
      lost: t('admin.payments.disputes.status.lost', 'Lost'),
      closed: t('admin.payments.disputes.status.closed', 'Closed'),
    })[s] ?? s;
  const reasonLabel = (r: string) => t(`admin.payments.disputes.reason.${r}`, (r || '').replace(/_/g, ' '));
  const isOverdue = (d: Dispute) => !!d.evidenceDue && new Date(d.evidenceDue).getTime() < Date.now();
  const daysLeft = (d: Dispute) => (d.evidenceDue ? Math.ceil((new Date(d.evidenceDue).getTime() - Date.now()) / DAY_MS) : null);
  const canSubmit = (d: Dispute) => d.status === 'needs_response' && !d.evidenceSubmitted && !isOverdue(d);

  const counts = useMemo(
    () => ({
      all: items.length,
      needs: items.filter((d) => d.status === 'needs_response').length,
      review: items.filter((d) => d.status === 'under_review').length,
      won: items.filter((d) => d.status === 'won').length,
      lost: items.filter((d) => d.status === 'lost').length,
      late: items.filter((d) => d.status === 'needs_response' && isOverdue(d)).length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items],
  );
  const shown = useMemo(() => (status === 'all' ? items : items.filter((d) => d.status === status)), [items, status]);
  const paged = usePagedList(shown, `${debounced}|${status}`);
  const filtersOn = !!search || status !== 'all';
  const clearFilters = () => {
    setSearch('');
    setStatus('all');
  };
  const toggleStatus = (s: StatusFilter) => setStatus((cur) => (cur === s ? 'all' : s));
  const filteredNow = t('admin.list.filteredNow', 'Filtered now');
  const num = (n: number) => n.toLocaleString();
  const open = items.find((d) => d.id === openId) ?? null;
  const COLS = '110px minmax(0,1.1fr) minmax(0,1fr) 110px 150px 150px';
  const initials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?';

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
          <button type="button" onClick={() => void load(debounced)} className={kitButton.primary}>
            {t('admin.list.retry', 'Try again')}
          </button>
        }
      />
    );
  else if (shown.length === 0)
    state = filtersOn ? (
      <ListState
        icon={Search}
        tone="grey"
        title={t('admin.payments.disputes.noMatch', 'No disputes match')}
        text={t('admin.list.noMatchText', 'Clear the search and filters to see the whole list.')}
        action={
          <button type="button" onClick={clearFilters} className={kitButton.secondary}>
            {t('admin.payments.disputes.clearFilters', 'Clear filters')}
          </button>
        }
      />
    ) : (
      <ListState
        icon={CheckCircle2}
        title={t('admin.payments.disputes.noDisputes', 'No Disputes')}
        text={t('admin.payments.disputes.noDisputesDescription', 'There are no payment disputes at this time')}
      />
    );

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-5 p-4 md:p-6" dir={direction}>
        <PageTitle
          icon={ShieldAlert}
          title={t('admin.payments.disputes.title', 'Payment Disputes')}
          badge={loaded ? num(counts.all) : undefined}
          description={t('admin.payments.disputes.description', 'Manage chargebacks and payment disputes')}
        />

        <KpiStrip label={t('admin.list.numbers', 'Numbers')}>
          <KpiItem icon={<ShieldAlert />} label={t('admin.payments.disputes.totalDisputes', 'Total Disputes')} value={loaded ? num(counts.all) : '—'} onClick={clearFilters} />
          <KpiItem
            icon={<AlertTriangle />}
            tone={counts.needs > 0 ? 'amber' : 'grey'}
            label={t('admin.payments.disputes.needsResponse', 'Needs Response')}
            value={loaded ? num(counts.needs) : '—'}
            subtitle={counts.late > 0 ? t('admin.payments.disputes.lateCount', '{n} past the deadline').replace('{n}', String(counts.late)) : undefined}
            onClick={() => toggleStatus('needs_response')}
            active={status === 'needs_response'}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<Clock />}
            tone="blue"
            label={t('admin.payments.disputes.status.underReview', 'Under Review')}
            value={loaded ? num(counts.review) : '—'}
            onClick={() => toggleStatus('under_review')}
            active={status === 'under_review'}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<CheckCircle2 />}
            tone="green"
            label={t('admin.payments.disputes.won', 'Won')}
            value={loaded ? num(counts.won) : '—'}
            onClick={() => toggleStatus('won')}
            active={status === 'won'}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<XCircle />}
            tone="grey"
            label={t('admin.payments.disputes.lost', 'Lost')}
            value={loaded ? num(counts.lost) : '—'}
            onClick={() => toggleStatus('lost')}
            active={status === 'lost'}
            activeNote={filteredNow}
          />
        </KpiStrip>

        {counts.late > 0 && (
          <p role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              <b>{t('admin.payments.disputes.urgent', 'Urgent')}: </b>
              {t('admin.payments.disputes.urgentMessage', '{count} dispute(s) have passed their evidence deadline!').replace('{count}', String(counts.late))}
            </span>
          </p>
        )}

        <ListPanel
          label={t('admin.payments.disputes.title', 'Payment Disputes')}
          toolbar={
            <>
              <ListSearch
                value={search}
                onChange={setSearch}
                placeholder={t('admin.payments.disputes.searchPlaceholder', 'User name, email, or dispute ID')}
                clearLabel={t('admin.users.list.clearSearch', 'Clear search')}
              />
              <IconButton label={t('common.refresh', 'Refresh')} onClick={() => void load(debounced)} disabled={loading}>
                <RefreshCw className={`h-[18px] w-[18px] ${loading ? 'animate-spin' : ''}`} aria-hidden />
              </IconButton>
            </>
          }
          pills={
            <>
              <QuickPills<StatusFilter>
                label={t('admin.payments.disputes.table.status', 'Status')}
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'all', label: t('admin.payments.disputes.allStatuses', 'All'), count: counts.all },
                  ...STATUSES.map((s) => ({
                    value: s,
                    label: (
                      <span className="inline-flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${TONE[s].dot}`} aria-hidden />
                        {statusLabel(s)}
                      </span>
                    ),
                    count: items.filter((d) => d.status === s).length,
                  })),
                ]}
              />
              <span className="shrink-0">
                <ClearFilters show={filtersOn} label={t('admin.payments.disputes.clearFilters', 'Clear filters')} onClear={clearFilters} />
              </span>
            </>
          }
          columns={COLS}
          head={[
            t('admin.payments.disputes.table.created', 'Created'),
            t('admin.payments.disputes.table.user', 'User'),
            t('admin.payments.disputes.table.product', 'Product'),
            t('admin.payments.disputes.table.amount', 'Amount'),
            t('admin.payments.disputes.table.status', 'Status'),
            t('admin.payments.disputes.table.evidenceDue', 'Evidence Due'),
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
          {paged.pageItems.map((d) => {
            const tone = TONE[d.status] ?? TONE.closed;
            const late = d.status === 'needs_response' && isOverdue(d);
            const left = daysLeft(d);
            const name = d.user?.name?.trim() || t('common.unknown', 'Unknown');
            return (
              <ListRow key={d.id} columns={COLS} onOpen={() => setOpenId(d.id)} label={`${name} · ${money(d.amount, d.currency)}`} selected={openId === d.id} rtl={rtl}>
                <ListCell label={t('admin.payments.disputes.table.created', 'Created')}>{date(d.created)}</ListCell>
                <ListRowMain
                  lead={
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary" aria-hidden>
                      {initials(name)}
                    </span>
                  }
                  title={<bdi className="font-semibold">{name}</bdi>}
                  sub={d.user?.email ? <span dir="ltr">{d.user.email}</span> : undefined}
                />
                <ListCell label={t('admin.payments.disputes.table.product', 'Product')}>
                  <bdi className="block truncate font-medium">{d.product?.name ?? '—'}</bdi>
                  <span className="block truncate text-[13px] text-muted-foreground">{reasonLabel(d.reason)}</span>
                </ListCell>
                <ListCell label={t('admin.payments.disputes.table.amount', 'Amount')}>
                  <span className="font-bold tabular-nums text-red-700 dark:text-red-300">{money(d.amount, d.currency)}</span>
                </ListCell>
                <ListCell label={t('admin.payments.disputes.table.status', 'Status')}>
                  <span className={`inline-flex items-center gap-2 font-semibold ${tone.text}`}>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} aria-hidden />
                    {statusLabel(d.status)}
                  </span>
                  {d.evidenceSubmitted && (
                    <span className="block text-[12.5px] text-muted-foreground">{t('admin.payments.disputes.evidenceSent', 'Evidence sent')}</span>
                  )}
                </ListCell>
                <ListCell label={t('admin.payments.disputes.table.evidenceDue', 'Evidence Due')}>
                  {d.evidenceDue ? (
                    <span className={late ? 'font-semibold text-red-700 dark:text-red-300' : ''}>
                      <span className="block">{date(d.evidenceDue)}</span>
                      {d.status === 'needs_response' && left !== null && (
                        <span className="block text-[12.5px]">
                          {late
                            ? t('admin.payments.disputes.deadlinePassed', 'Deadline passed')
                            : t('admin.payments.disputes.daysLeft', '{n} days left').replace('{n}', String(left))}
                        </span>
                      )}
                    </span>
                  ) : (
                    '—'
                  )}
                </ListCell>
              </ListRow>
            );
          })}
        </ListPanel>
      </div>

      {open && (
        <DisputeDrawer
          dispute={open}
          onClose={() => setOpenId(null)}
          onEvidence={() => setEvidenceFor(open)}
          canSubmit={canSubmit(open)}
          late={isOverdue(open)}
          left={daysLeft(open)}
          money={money}
          date={date}
          statusLabel={statusLabel}
          reasonLabel={reasonLabel}
        />
      )}
      <EvidenceDialog
        dispute={evidenceFor}
        onClose={() => setEvidenceFor(null)}
        onSent={() => {
          setEvidenceFor(null);
          void load(debounced);
        }}
        date={date}
      />
    </AdminLayout>
  );
}

function DisputeDrawer({
  dispute: d,
  onClose,
  onEvidence,
  canSubmit,
  late,
  left,
  money,
  date,
  statusLabel,
  reasonLabel,
}: {
  dispute: Dispute;
  onClose: () => void;
  onEvidence: () => void;
  canSubmit: boolean;
  late: boolean;
  left: number | null;
  money: (n: number, c?: string) => string;
  date: (iso?: string | null) => string;
  statusLabel: (s: string) => string;
  reasonLabel: (r: string) => string;
}) {
  const { t, direction } = useAdminLanguage();
  const rtl = direction === 'rtl';
  const tone = TONE[d.status] ?? TONE.closed;
  const name = d.user?.name?.trim() || t('common.unknown', 'Unknown');

  let next: { tone: 'red' | 'amber' | 'blue' | 'grey'; title: string; text: string } | null = null;
  if (d.status === 'needs_response' && late)
    next = { tone: 'red', title: t('admin.payments.disputes.drawer.lateTitle', 'The deadline to respond has passed'), text: t('admin.payments.disputes.drawer.lateText', 'Evidence can no longer be sent from here. Check the dispute in Stripe.') };
  else if (d.status === 'needs_response' && !d.evidenceSubmitted)
    next = {
      tone: 'amber',
      title:
        left !== null
          ? t('admin.payments.disputes.drawer.respondIn', 'Respond within {n} days').replace('{n}', String(left))
          : t('admin.payments.disputes.status.needsResponse', 'Needs Response'),
      text: t('admin.payments.disputes.drawer.respondText', 'Send evidence that the customer bought and received the program: their details, a receipt, and your communication with them.'),
    };
  else if (d.evidenceSubmitted && (d.status === 'needs_response' || d.status === 'under_review'))
    next = { tone: 'blue', title: t('admin.payments.disputes.drawer.sentTitle', 'Evidence sent'), text: t('admin.payments.disputes.drawer.sentText', 'The bank is reviewing it. Stripe updates the result here when it is decided.') };

  const box = {
    red: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100',
    amber: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
    blue: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100',
    grey: 'border-border bg-muted text-foreground',
  };

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side={rtl ? 'left' : 'right'}
        dir={direction}
        className="flex w-full flex-col gap-0 border-0 p-0 shadow-2xl outline-none focus:outline-none focus-visible:outline-none dark:[color-scheme:dark] sm:max-w-[520px] [&>button.absolute]:hidden"
      >
        <button type="button" onClick={onClose} aria-label={t('common.close', 'Close')} className="absolute end-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-muted">
          <X className="h-5 w-5" />
        </button>
        <header className="shrink-0 border-b border-border bg-primary/[0.04] px-6 pb-5 pt-6">
          <p className={`inline-flex items-center gap-2 pe-10 text-[13.5px] font-semibold ${tone.text}`}>
            <span className={`h-2 w-2 rounded-full ${tone.dot}`} aria-hidden />
            {statusLabel(d.status)} · {reasonLabel(d.reason)}
          </p>
          <SheetTitle className="mt-1.5 pe-10 text-[23px] font-extrabold leading-tight tracking-tight [font-family:inherit] [overflow-wrap:anywhere]">
            <bdi>{name}</bdi> · {money(d.amount, d.currency)}
          </SheetTitle>
          <SheetDescription asChild>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {d.product?.name && <bdi>{d.product.name}</bdi>}
              {d.user?.email && (
                <a href={`mailto:${d.user.email}`} dir="ltr" className="hover:text-primary hover:underline">
                  {d.user.email}
                </a>
              )}
            </div>
          </SheetDescription>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label={t('admin.payments.disputes.details.amount', 'Amount')} value={money(d.amount, d.currency)} className="text-red-700 dark:text-red-300" />
            <Stat label={t('admin.payments.disputes.details.evidenceDue', 'Evidence Due')} value={date(d.evidenceDue)} small className={late && d.status === 'needs_response' ? 'text-red-700 dark:text-red-300' : ''} />
            <Stat
              label={t('admin.payments.disputes.details.evidenceSubmitted', 'Evidence Submitted')}
              value={d.evidenceSubmitted ? t('admin.payments.disputes.details.yes', 'Yes') : t('admin.payments.disputes.details.no', 'No')}
              small
            />
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-6 py-5">
          {next && (
            <div className={`flex items-start gap-3 rounded-[14px] border px-3.5 py-3 ${box[next.tone]}`}>
              <AlertTriangle className="mt-0.5 h-[18px] w-[18px] shrink-0" aria-hidden />
              <div className="min-w-0">
                <p className="m-0 font-bold">{next.title}</p>
                <p className="m-0 mt-0.5 text-sm opacity-90">{next.text}</p>
              </div>
            </div>
          )}
          <section className="overflow-hidden rounded-[14px] border border-border">
            <h3 className="bg-primary/[0.06] px-3.5 py-2.5 text-sm font-bold text-primary [font-family:inherit]">{t('admin.payments.disputes.details.title', 'Dispute Details')}</h3>
            <dl className="m-0 divide-y divide-border px-3.5 text-sm">
              <Row label={t('admin.payments.disputes.details.reason', 'Reason')}>{reasonLabel(d.reason)}</Row>
              <Row label={t('admin.payments.disputes.details.created', 'Created')}>{date(d.created)}</Row>
              <Row label={t('admin.payments.disputes.details.disputeId', 'Dispute ID')}>
                <span dir="ltr" className="font-mono text-[13px]">
                  {d.disputeId}
                </span>
              </Row>
              {d.transactionId && (
                <Row label={t('admin.payments.disputes.details.transactionId', 'Transaction ID')}>
                  <span dir="ltr" className="font-mono text-[13px]">
                    {d.transactionId}
                  </span>
                </Row>
              )}
              {d.chargeId && (
                <Row label={t('admin.payments.disputes.details.chargeId', 'Charge ID')}>
                  <span dir="ltr" className="font-mono text-[13px]">
                    {d.chargeId}
                  </span>
                </Row>
              )}
            </dl>
          </section>
          <p className="text-[13px] text-muted-foreground">{t('admin.payments.disputes.details.stripeAlert', 'View full dispute details and submit evidence in the Stripe Dashboard.')}</p>
        </div>

        <footer className="grid shrink-0 gap-2 border-t border-border bg-card px-6 py-4">
          {canSubmit && (
            <button type="button" onClick={onEvidence} className={`${kitButton.primary} w-full`}>
              <Upload className="h-4 w-4" aria-hidden />
              {t('admin.payments.disputes.evidence.title', 'Submit Dispute Evidence')}
            </button>
          )}
          <a
            href={`https://dashboard.stripe.com/disputes/${encodeURIComponent(d.disputeId)}`}
            target="_blank"
            rel="noreferrer noopener"
            className={`${kitButton.secondary} w-full`}
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            {t('admin.payments.disputes.details.openInStripe', 'Open in Stripe')}
          </a>
        </footer>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Evidence for a dispute, sent to Stripe (same fields as before). The names
 * now match what the server reads, so the evidence actually arrives.
 */
function EvidenceDialog({ dispute, onClose, onSent, date }: { dispute: Dispute | null; onClose: () => void; onSent: () => void; date: (iso?: string | null) => string }) {
  const { t, direction } = useAdminLanguage();
  const { toast } = useToast();
  const [form, setForm] = useState({ customerName: '', customerEmail: '', customerPurchaseIp: '', receiptUrl: '', productDescription: '', customerCommunication: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!dispute) return;
    setForm({
      customerName: dispute.user?.name?.trim() || '',
      customerEmail: dispute.user?.email || '',
      customerPurchaseIp: '',
      receiptUrl: '',
      productDescription: dispute.product?.name || '',
      customerCommunication: '',
    });
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispute?.id]);

  if (!dispute) return null;
  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const submit = async () => {
    const e: Record<string, string> = {};
    const required = t('admin.payments.plans.wizard.required', 'This field is required.');
    if (!form.customerName.trim()) e.customerName = required;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail.trim())) e.customerEmail = t('admin.enrollments.wizard.errEmailFormat', "This email address isn't valid.");
    if (!form.productDescription.trim()) e.productDescription = required;
    if (form.receiptUrl && !/^https?:\/\//i.test(form.receiptUrl.trim())) e.receiptUrl = t('admin.payments.disputes.evidence.errUrl', 'A link starts with https://');
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    setSending(true);
    try {
      const response = await fetch(`/api/admin/payments/disputes/${dispute.id}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          customerEmail: form.customerEmail.trim(),
          customerPurchaseIp: form.customerPurchaseIp.trim() || undefined,
          receiptUrl: form.receiptUrl.trim() || undefined,
          productDescription: form.productDescription.trim(),
          customerCommunication: form.customerCommunication.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to submit evidence');
      }
      toast({ title: t('common.success', 'Success'), description: t('admin.payments.disputes.evidenceSuccess', 'Evidence submitted successfully') });
      onSent();
    } catch (error: any) {
      toast({ title: t('common.error', 'Error'), description: error.message || t('admin.payments.disputes.evidenceError', 'Failed to submit evidence'), variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const field = (k: string) => `h-11 w-full rounded-lg border bg-card px-3 text-foreground outline-none focus:border-primary ${errors[k] ? 'border-red-500' : 'border-border'}`;
  const area = (k: string) => `w-full rounded-lg border bg-card px-3 py-2 text-foreground outline-none focus:border-primary ${errors[k] ? 'border-red-500' : 'border-border'}`;
  const err = (k: string) => (errors[k] ? <span className="mt-1 block text-[13px] font-semibold text-red-700 dark:text-red-400">{errors[k]}</span> : null);

  return (
    <Dialog open={!!dispute} onOpenChange={(v) => !v && !sending && onClose()}>
      <DialogContent dir={direction} className="max-w-2xl">
        <DialogHeader className="text-start">
          <DialogTitle className="[font-family:inherit]">{t('admin.payments.disputes.evidence.title', 'Submit Dispute Evidence')}</DialogTitle>
          <DialogDescription>
            {t('admin.payments.disputes.evidence.description', 'Provide evidence to contest the dispute for {user}').replace('{user}', dispute.user?.name || '')}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto pe-1">
          <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[13.5px] text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {t('admin.payments.disputes.evidence.deadlineAlert', 'Evidence must be submitted by {date}. Submit comprehensive evidence to increase chances of winning.').replace('{date}', date(dispute.evidenceDue))}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">
                {t('admin.payments.disputes.evidence.customerName', 'Customer Name')} <span className="text-red-600">*</span>
              </span>
              <input value={form.customerName} onChange={(e) => set('customerName', e.target.value)} className={field('customerName')} />
              {err('customerName')}
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">
                {t('admin.payments.disputes.evidence.customerEmail', 'Customer Email')} <span className="text-red-600">*</span>
              </span>
              <input type="email" dir="ltr" value={form.customerEmail} onChange={(e) => set('customerEmail', e.target.value)} className={field('customerEmail')} />
              {err('customerEmail')}
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">{t('admin.payments.disputes.evidence.customerPurchaseIp', 'Customer Purchase IP')}</span>
              <input
                dir="ltr"
                value={form.customerPurchaseIp}
                onChange={(e) => set('customerPurchaseIp', e.target.value)}
                placeholder={t('admin.payments.disputes.evidence.customerPurchaseIpPlaceholder', 'e.g., 192.168.1.1')}
                className={field('customerPurchaseIp')}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">{t('admin.payments.disputes.evidence.receiptUrl', 'Receipt URL')}</span>
              <input
                type="url"
                dir="ltr"
                value={form.receiptUrl}
                onChange={(e) => set('receiptUrl', e.target.value)}
                placeholder={t('admin.payments.disputes.evidence.receiptUrlPlaceholder', 'https://...')}
                className={field('receiptUrl')}
              />
              {err('receiptUrl')}
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">
              {t('admin.payments.disputes.evidence.productDescription', 'Product Description')} <span className="text-red-600">*</span>
            </span>
            <textarea
              rows={3}
              value={form.productDescription}
              onChange={(e) => set('productDescription', e.target.value)}
              placeholder={t('admin.payments.disputes.evidence.productDescriptionPlaceholder', 'Detailed description of the product/service provided')}
              className={area('productDescription')}
            />
            {err('productDescription')}
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">{t('admin.payments.disputes.evidence.customerCommunication', 'Customer Communication')}</span>
            <textarea
              rows={4}
              value={form.customerCommunication}
              onChange={(e) => set('customerCommunication', e.target.value)}
              placeholder={t('admin.payments.disputes.evidence.customerCommunicationPlaceholder', 'Any email exchanges, support tickets, or other communications with the customer')}
              className={area('customerCommunication')}
            />
          </label>
          <p className="text-[13px] text-muted-foreground">{t('admin.payments.disputes.evidence.onceNote', 'Evidence is sent to Stripe and the bank. It can be sent once, so check it before sending.')}</p>
        </div>
        <DialogFooter className="gap-2">
          <button type="button" onClick={onClose} disabled={sending} className={kitButton.secondary}>
            {t('common.cancel', 'Cancel')}
          </button>
          <button type="button" onClick={() => void submit()} disabled={sending} className={kitButton.primary}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" aria-hidden />}
            {t('admin.payments.disputes.evidence.submit', 'Submit Evidence')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, small, className = '' }: { label: string; value: string; small?: boolean; className?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card px-3 py-2.5">
      <div className="truncate text-[12.5px] text-muted-foreground">{label}</div>
      <div className={`truncate font-extrabold tabular-nums ${small ? 'text-base' : 'text-lg'} ${className}`} title={value}>
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
