'use client';

export const dynamic = 'force-dynamic';

/**
 * Communications · Send log: everything that went out, from everywhere
 * (reminders, messages, scheduled and system emails), and how it arrived.
 * Replaces the email queue and the reminders' log: the same search and
 * filters, a preview of each email as it was sent, and cancelling emails
 * that are still waiting, one or several at once.
 */

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Inbox, List, Loader2, RefreshCw, WifiOff, X } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { FilterSelect, IconButton, ListFooter, ListPanel, ListSearch, ListSkeleton, ListState, QuickPills, joinedBar, joinedSegment } from '@/components/admin/notifications/kit';
import { DrawerSection, DrawerShell, drawerButton } from '@/components/admin/drawer-kit';
import { CommsPage } from '@/components/admin/comms/CommsPage';
import { OutcomePill, categoryLabel, dateTime, useBi, useOutcomeWords, useReasonWords } from '@/components/admin/reminders/shared';
import type { LogRow } from '@/lib/messaging/comms';

type Outcome = '' | 'sent' | 'bell_only' | 'waiting' | 'in_digest' | 'stopped' | 'cancelled' | 'failed';
const COLUMNS = '28px 120px minmax(0,1fr) minmax(0,1.4fr) 110px minmax(0,1.3fr)';

function LogPage() {
  const { t } = useAdminLanguage();
  const { lang, rtl } = useBi();
  const { toast } = useToast();
  const params = useSearchParams();
  const outcomes = useOutcomeWords();
  const reasons = useReasonWords();

  const [rows, setRows] = useState<LogRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [outcome, setOutcome] = useState<Outcome>((params.get('outcome') as Outcome) || '');
  const [source, setSource] = useState('all');
  const [priority, setPriority] = useState('all');
  const [today, setToday] = useState(false);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<LogRow | null>(null);
  const pageSize = 25;

  useEffect(() => {
    const h = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(h);
  }, [query]);

  const load = useCallback(async () => {
    setRows(null);
    try {
      const p = new URLSearchParams({ page: String(page) });
      if (outcome) p.set('outcome', outcome);
      if (source !== 'all') p.set('source', source);
      if (priority !== 'all') p.set('priority', priority);
      if (today) p.set('today', '1');
      if (debounced.trim()) p.set('q', debounced.trim());
      const res = await fetch(`/api/admin/communications/log?${p}`, { cache: 'no-store' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setRows(body.rows);
      setTotal(body.total);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      setRows([]);
    }
  }, [page, outcome, source, priority, today, debounced]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [outcome, source, priority, today, debounced]);

  const cancel = async (ids: string[]) => {
    if (!ids.length || !confirm(t('admin.comms.log.confirmCancel', 'Cancel {n} emails that are still waiting? They will not be sent.').replace('{n}', String(ids.length)))) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/communications/log/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      toast({ title: t('admin.comms.log.cancelled', '{n} emails cancelled').replace('{n}', String(body.cancelled)) });
      setSelected(new Set());
      setOpen(null);
      load();
    } catch (e) {
      toast({ title: t('common.error', 'Error'), description: (e as Error).message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const sourceWord = (r: LogRow) =>
    r.reminder ??
    ({
      reminder: t('admin.reminders.log.source.reminder', 'Reminder'),
      manual: t('admin.reminders.log.source.manual', 'Sent by the team'),
      scheduled: t('admin.comms.source.scheduled', 'Scheduled emails'),
      system: t('admin.reminders.log.source.system', 'System message'),
      trigger: t('admin.reminders.log.source.trigger', 'Email trigger'),
      coaching: t('admin.reminders.log.source.coaching', 'Coaching'),
      team_alert: t('admin.reminders.log.source.team', 'Team alert'),
      price_change: t('admin.reminders.log.source.price', 'Price change'),
      digest: t('admin.reminders.log.source.digest', 'Daily summary'),
      contact: t('admin.comms.source.contact', 'Website contact form'),
    } as Record<string, string>)[r.source] ??
    r.source;

  const outcomeOf = (r: LogRow) =>
    r.outcome === 'cancelled'
      ? { label: t('admin.comms.log.cancelledWord', 'Cancelled'), tone: 'grey' as const }
      : (outcomes as Record<string, { label: string; tone: 'green' | 'grey' | 'blue' | 'red' }>)[r.outcome] ?? { label: r.outcome, tone: 'grey' as const };

  const detail = (r: LogRow) => {
    if (r.outcome === 'waiting' && r.sendAt) return t('admin.comms.log.at', 'Goes out {time}').replace('{time}', dateTime(r.sendAt, lang));
    if (r.bounce === 'hard') return t('admin.comms.log.hardBounce', "The address doesn't exist · blocked from sending");
    if (r.bounce === 'soft') return t('admin.comms.log.softBounce', 'Temporarily refused by the mailbox');
    if (r.source === 'contact') return t('admin.comms.log.contact', 'Sent to the school');
    if (r.source === 'system' || r.source === 'team_alert') return t('admin.reminders.log.always', 'System message, always sent');
    if (r.reason === 'cancelled' || r.outcome === 'cancelled') return r.reason && r.reason !== 'cancelled' ? r.reason : t('admin.comms.log.byAdmin', 'Cancelled by the team');
    return reasons(r.reason, r.category, lang);
  };

  const pending = (rows ?? []).filter((r) => r.cancellable && r.queueId);
  const allChecked = pending.length > 0 && pending.every((r) => selected.has(r.queueId!));
  const start = (page - 1) * pageSize;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const state = error ? (
    <ListState icon={WifiOff} tone="red" title={t('admin.reminders.log.loadError', "Couldn't load the send log")} text={error} />
  ) : !rows ? (
    <ListSkeleton rows={8} />
  ) : !rows.length ? (
    <ListState icon={Inbox} tone="grey" title={t('admin.reminders.log.empty', 'Nothing here yet')} text={t('admin.reminders.log.emptyText', 'Every message the system sends will show up here.')} />
  ) : undefined;

  return (
    <CommsPage
      icon={List}
      title={t('admin.comms.log.title', 'Send log')}
      badge={total ? total.toLocaleString() : undefined}
      description={t(
        'admin.comms.log.subtitle',
        'Everything that went out, from everywhere: reminders, messages, scheduled and system emails. And how it arrived: email, bell, daily summary, or why not.',
      )}
      actions={
        <IconButton label={t('admin.comms.refresh', 'Refresh')} onClick={load}>
          <RefreshCw className="h-4 w-4" />
        </IconButton>
      }
    >
      <ListPanel
        label={t('admin.comms.log.title', 'Send log')}
        toolbar={
          <>
            <ListSearch value={query} onChange={setQuery} placeholder={t('admin.comms.log.search', 'Search client, email or subject')} clearLabel={t('admin.reminders.clearSearch', 'Clear search')} />
            <FilterSelect
              label={t('admin.comms.log.from', 'From')}
              value={source}
              onChange={setSource}
              dir={rtl ? 'rtl' : 'ltr'}
              options={[
                { value: 'all', label: t('admin.reminders.all', 'All') },
                { value: 'reminder', label: t('admin.comms.source.reminder', 'Automatic reminders') },
                { value: 'manual', label: t('admin.comms.source.manual', 'Messages from the team') },
                { value: 'scheduled', label: t('admin.comms.source.scheduled', 'Scheduled emails') },
                { value: 'coaching', label: t('admin.comms.source.coaching', 'Coaching') },
                { value: 'price_change', label: t('admin.comms.source.price', 'Price changes') },
                { value: 'team_alert', label: t('admin.comms.source.team', 'Team alerts') },
                { value: 'trigger', label: t('admin.comms.source.trigger', 'Email triggers') },
                { value: 'digest', label: t('admin.comms.source.digest', 'Daily summary') },
                { value: 'system', label: t('admin.comms.source.system', 'System messages') },
                { value: 'contact', label: t('admin.comms.source.contact', 'Website contact form') },
              ]}
            />
            <FilterSelect
              label={t('admin.comms.log.priority', 'Importance')}
              value={priority}
              onChange={setPriority}
              dir={rtl ? 'rtl' : 'ltr'}
              options={[
                { value: 'all', label: t('admin.reminders.all', 'All') },
                { value: 'urgent', label: t('admin.comms.priority.urgent', 'Urgent') },
                { value: 'high', label: t('admin.comms.priority.high', 'High') },
                { value: 'normal', label: t('admin.comms.priority.normal', 'Normal') },
                { value: 'low', label: t('admin.comms.priority.low', 'Low') },
              ]}
            />
          </>
        }
        pills={
          <>
            <QuickPills
              label={t('admin.reminders.log.filter', 'How it arrived')}
              value={outcome}
              onChange={setOutcome}
              options={[
                { value: '' as const, label: t('admin.reminders.all', 'All') },
                { value: 'sent' as const, label: t('admin.reminders.log.sent', 'Sent') },
                { value: 'bell_only' as const, label: outcomes.bell_only.label },
                { value: 'waiting' as const, label: outcomes.waiting.label },
                { value: 'in_digest' as const, label: outcomes.in_digest.label },
                { value: 'stopped' as const, label: t('admin.reminders.log.stopped', 'Stopped') },
                { value: 'cancelled' as const, label: t('admin.comms.log.cancelledWord', 'Cancelled') },
                { value: 'failed' as const, label: t('admin.reminders.log.failed', "Didn't arrive") },
              ]}
            />
            <div className={joinedBar}>
              <button type="button" aria-pressed={today} onClick={() => setToday((v) => !v)} className={joinedSegment(today)}>
                {t('admin.reminders.log.today', 'Today')}
              </button>
            </div>
          </>
        }
        extra={
          selected.size > 0 ? (
            <div className="flex flex-wrap items-center gap-3 rounded-lg bg-foreground px-4 py-2.5 text-sm text-background">
              <span>{t('admin.comms.log.selected', '{n} waiting emails chosen').replace('{n}', String(selected.size))}</span>
              <button type="button" onClick={() => setSelected(new Set())} className="ms-auto rounded-full px-3 py-1.5 hover:bg-background/10">
                {t('admin.comms.log.clear', 'Clear')}
              </button>
              <button type="button" disabled={busy} onClick={() => cancel([...selected])} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white hover:bg-red-700">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('admin.comms.log.cancelChosen', 'Cancel sending')}
              </button>
            </div>
          ) : undefined
        }
        columns={COLUMNS}
        head={[
          pending.length ? (
            <input
              key="all"
              type="checkbox"
              aria-label={t('admin.comms.log.chooseAll', 'Choose every waiting email on this page')}
              className="h-4 w-4 accent-[hsl(var(--primary))]"
              checked={allChecked}
              onChange={() => setSelected(allChecked ? new Set() : new Set(pending.map((r) => r.queueId!)))}
            />
          ) : (
            ''
          ),
          t('admin.reminders.log.col.when', 'When'),
          t('admin.comms.log.col.to', 'To'),
          t('admin.comms.log.col.what', 'What'),
          t('admin.comms.log.col.from', 'From'),
          t('admin.reminders.log.col.how', 'How it arrived'),
        ]}
        state={state}
        footer={
          rows && rows.length > 0 ? (
            <ListFooter
              showingText={t('admin.reminders.log.showing', 'Showing {from}–{to} of {total}')
                .replace('{from}', String(start + 1))
                .replace('{to}', String(start + rows.length))
                .replace('{total}', total.toLocaleString())}
              pageText={t('admin.reminders.log.page', 'Page {n} of {total}').replace('{n}', String(page)).replace('{total}', String(totalPages))}
              page={page}
              totalPages={totalPages}
              onPage={setPage}
              prevLabel={t('common.previous', 'Previous')}
              nextLabel={t('common.next', 'Next')}
              rtl={rtl}
            />
          ) : undefined
        }
      >
        {(rows ?? []).map((r) => {
          const o = outcomeOf(r);
          return (
            <div
              key={r.key}
              style={{ ['--list-cols' as string]: `${COLUMNS} 20px` }}
              className={`relative grid gap-1.5 border-b border-border/70 px-5 py-3 text-sm last:border-b-0 md:grid-cols-[var(--list-cols)] md:items-center md:gap-4 ${open?.key === r.key ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
            >
              <button type="button" aria-label={r.title} onClick={() => setOpen(r)} className="absolute inset-0 z-[1]" />
              <span className="relative z-[2]">
                {r.cancellable && r.queueId && (
                  <input
                    type="checkbox"
                    aria-label={t('admin.comms.log.choose', 'Choose')}
                    className="h-4 w-4 accent-[hsl(var(--primary))]"
                    checked={selected.has(r.queueId)}
                    onChange={() =>
                      setSelected((s) => {
                        const n = new Set(s);
                        if (n.has(r.queueId!)) n.delete(r.queueId!);
                        else n.add(r.queueId!);
                        return n;
                      })
                    }
                  />
                )}
              </span>
              <span className="text-muted-foreground">{dateTime(r.at, lang)}</span>
              <span className="min-w-0 [overflow-wrap:anywhere]">
                <span className="font-semibold">{r.client}</span>
                {r.email && r.email !== r.client && <span className="block text-[13px] text-muted-foreground">{r.email}</span>}
              </span>
              <span className="min-w-0 [overflow-wrap:anywhere]">
                {r.title}
                {r.step ? <span className="text-muted-foreground"> · {t('admin.reminders.drawer.stepN', 'step {n}').replace('{n}', String(r.step))}</span> : null}
              </span>
              <span className="text-[13px] text-muted-foreground">{sourceWord(r)}</span>
              <span className="min-w-0">
                <OutcomePill tone={o.tone}>{o.label}</OutcomePill>
                <span className="mt-0.5 block text-[13px] text-muted-foreground [overflow-wrap:anywhere]">{detail(r)}</span>
              </span>
              <span />
            </div>
          );
        })}
      </ListPanel>

      <SendDrawer
        row={open}
        sourceWord={open ? sourceWord(open) : ''}
        outcome={open ? outcomeOf(open) : null}
        detail={open ? detail(open) : ''}
        busy={busy}
        onCancel={(id) => cancel([id])}
        onClose={() => setOpen(null)}
      />
    </CommsPage>
  );
}

function SendDrawer({
  row,
  sourceWord,
  outcome,
  detail,
  busy,
  onCancel,
  onClose,
}: {
  row: LogRow | null;
  sourceWord: string;
  outcome: { label: string; tone: 'green' | 'grey' | 'blue' | 'red' } | null;
  detail: string;
  busy: boolean;
  onCancel: (queueId: string) => void;
  onClose: () => void;
}) {
  const { t } = useAdminLanguage();
  const { lang } = useBi();
  const [preview, setPreview] = useState<{ subject: string; bodyHtml: string; bodyText: string; variables: Record<string, unknown>; error: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showVars, setShowVars] = useState(false);

  useEffect(() => {
    setPreview(null);
    setShowVars(false);
    if (!row?.queueId) return;
    setLoading(true);
    fetch(`/api/admin/emails/queue/${row.queueId}/preview`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then(setPreview)
      .catch(() => setPreview(null))
      .finally(() => setLoading(false));
  }, [row]);

  const tone = { green: 'bg-green-500', grey: 'bg-muted-foreground/40', blue: 'bg-blue-500', red: 'bg-red-500' } as const;
  return (
    <DrawerShell
      open={!!row}
      onClose={onClose}
      status={outcome ? `${outcome.label}${detail ? ` · ${detail}` : ''}` : ''}
      statusDot={outcome ? tone[outcome.tone] : 'bg-muted'}
      lead={
        <span className="grid h-11 w-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary" aria-hidden>
          <List className="h-5 w-5" />
        </span>
      }
      title={row?.title ?? ''}
      subtitle={row ? `${row.client}${row.email && row.email !== row.client ? ` · ${row.email}` : ''} · ${dateTime(row.at, lang)}` : undefined}
      description={t('admin.comms.log.drawerDescription', 'One message as it was sent, and how it arrived.')}
      wide
      stats={
        <>
          <div className="col-span-3 grid gap-1 rounded-xl border border-border bg-card px-3 py-2.5 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">{t('admin.comms.log.from', 'From')}</span>
              <b className="text-end">{sourceWord}</b>
            </div>
            {row?.category && row.category !== 'system' && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t('admin.comms.log.kind', "Client's setting")}</span>
                <b>{categoryLabel(row.category, lang)}</b>
              </div>
            )}
            {row?.priority && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t('admin.comms.log.priority', 'Importance')}</span>
                <b>{t(`admin.comms.priority.${row.priority}`, row.priority)}</b>
              </div>
            )}
          </div>
        </>
      }
      footer={
        row && (
          <div className="grid grid-cols-2 gap-2">
            {row.cancellable && row.queueId ? (
              <button type="button" disabled={busy} onClick={() => onCancel(row.queueId!)} className={`${drawerButton} text-red-700 dark:text-red-400`}>
                <X className="h-4 w-4" aria-hidden />
                {t('admin.comms.log.cancelOne', 'Cancel sending')}
              </button>
            ) : (
              <span />
            )}
            {row.userId ? (
              <Link href={`/admin/users/${row.userId}`} className={drawerButton}>
                {t('admin.comms.log.toClient', "Client's page")}
              </Link>
            ) : (
              <span />
            )}
          </div>
        )
      }
    >
      {!row?.queueId ? (
        <DrawerSection title={t('admin.comms.log.bellOnlyTitle', 'In the portal bell')}>
          <p className="px-3.5 py-3 text-sm text-muted-foreground">{t('admin.comms.log.noEmail', 'No email was sent for this message. The client got it in the portal bell.')}</p>
        </DrawerSection>
      ) : loading ? (
        <div className="grid min-h-[200px] place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : preview ? (
        <>
          {preview.error && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">{preview.error}</p>}
          <DrawerSection title={t('admin.comms.log.asSent', 'The email as it was sent')}>
            <div className="px-3.5 pt-2.5 text-sm font-semibold [overflow-wrap:anywhere]">{preview.subject}</div>
            {preview.bodyHtml ? (
              <iframe title={t('admin.comms.templates.preview', 'Email preview')} srcDoc={preview.bodyHtml} sandbox="" className="h-[520px] w-full border-0 bg-white" />
            ) : (
              <pre className="whitespace-pre-wrap px-3.5 py-2.5 text-[13px] [font-family:inherit]">{preview.bodyText}</pre>
            )}
          </DrawerSection>
          {preview.variables && Object.keys(preview.variables).length > 0 && (
            <DrawerSection
              title={t('admin.comms.log.variables', 'Details used to fill it in')}
              action={
                <button type="button" onClick={() => setShowVars((v) => !v)} className="text-sm font-semibold text-primary hover:underline">
                  {showVars ? t('admin.comms.log.hide', 'Hide') : t('admin.comms.log.show', 'Show')}
                </button>
              }
            >
              {showVars && (
                <dl className="m-0 divide-y divide-border px-3.5 text-[13px]">
                  {Object.entries(preview.variables).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3 py-1.5">
                      <dt dir="ltr" className="text-muted-foreground">
                        {k}
                      </dt>
                      <dd className="m-0 min-w-0 text-end [overflow-wrap:anywhere]">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </DrawerSection>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{t('admin.comms.log.noPreview', "Couldn't load the email.")}</p>
      )}
    </DrawerShell>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LogPage />
    </Suspense>
  );
}
