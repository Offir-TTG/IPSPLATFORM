'use client';

/**
 * The send log: every message that went out, and how it arrived. When a
 * client asks "why didn't I get an email", the answer is here.
 */

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Inbox, WifiOff } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { ListFooter, ListPanel, ListSearch, ListSkeleton, ListState, QuickPills, joinedBar, joinedSegment } from '@/components/admin/notifications/kit';
import { OutcomePill, categoryLabel, dateTime, useBi, useOutcomeWords, useReasonWords } from './shared';

type Row = {
  id: string;
  userId: string | null;
  client: string;
  source: string;
  reminder: string | null;
  step: number | null;
  category: string | null;
  title: string;
  outcome: string;
  reason: string | null;
  sendAt: string | null;
  at: string;
};

type OutcomeFilter = '' | 'sent' | 'bell_only' | 'waiting' | 'in_digest' | 'stopped' | 'failed';

const COLUMNS = '130px minmax(0,0.9fr) minmax(0,1.4fr) minmax(0,1.3fr)';

export function LogTab() {
  const { t } = useAdminLanguage();
  const { lang, rtl } = useBi();
  const outcomes = useOutcomeWords();
  const reasons = useReasonWords();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [outcome, setOutcome] = useState<OutcomeFilter>('');
  const [today, setToday] = useState(false);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [error, setError] = useState<string | null>(null);
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
      if (today) p.set('today', '1');
      if (debounced.trim()) p.set('q', debounced.trim());
      const res = await fetch(`/api/admin/reminders/log?${p}`, { cache: 'no-store' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setRows(body.rows);
      setTotal(body.total);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      setRows([]);
    }
  }, [page, outcome, today, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => setPage(1), [outcome, today, debounced]);

  const sourceWord = (r: Row) =>
    r.reminder ??
    ({
      trigger: t('admin.reminders.log.source.trigger', 'Email trigger'),
      coaching: t('admin.reminders.log.source.coaching', 'Coaching'),
      team_alert: t('admin.reminders.log.source.team', 'Team alert'),
      system: t('admin.reminders.log.source.system', 'System message'),
      manual: t('admin.reminders.log.source.manual', 'Sent by the team'),
      price_change: t('admin.reminders.log.source.price', 'Price change'),
      digest: t('admin.reminders.log.source.digest', 'Daily summary'),
      reminder: t('admin.reminders.log.source.reminder', 'Reminder'),
    } as Record<string, string>)[r.source] ??
    r.source;

  const detail = (r: Row) => {
    if (r.outcome === 'waiting' && r.sendAt) {
      return t('admin.reminders.log.waitingUntil', 'In the bell already · email at {time}').replace('{time}', dateTime(r.sendAt, lang));
    }
    if (r.source === 'system' || r.source === 'team_alert') return t('admin.reminders.log.always', 'System message, always sent');
    if (r.source === 'digest') return t('admin.reminders.log.digestEmail', 'One email with the day’s updates');
    return reasons(r.reason, r.category, lang);
  };

  const start = (page - 1) * pageSize;
  const state = error ? (
    <ListState icon={WifiOff} tone="red" title={t('admin.reminders.log.loadError', "Couldn't load the send log")} text={error} />
  ) : !rows ? (
    <ListSkeleton rows={8} />
  ) : !rows.length ? (
    <ListState icon={Inbox} tone="grey" title={t('admin.reminders.log.empty', 'Nothing here yet')} text={t('admin.reminders.log.emptyText', 'Every message the system sends will show up here.')} />
  ) : undefined;

  return (
    <>
      <p className="max-w-3xl text-muted-foreground">
        {t('admin.reminders.log.intro', 'Every message that went out, and how it arrived. When a client asks "why didn\'t I get an email", the answer is here.')}
      </p>
      <ListPanel
        label={t('admin.reminders.tab.log', 'Send log')}
        toolbar={<ListSearch value={query} onChange={setQuery} placeholder={t('admin.reminders.log.search', 'Search client or reminder')} clearLabel={t('admin.reminders.clearSearch', 'Clear search')} />}
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
        columns={COLUMNS}
        head={[t('admin.reminders.log.col.when', 'When'), t('admin.reminders.log.col.client', 'Client'), t('admin.reminders.log.col.what', 'Reminder'), t('admin.reminders.log.col.how', 'How it arrived')]}
        state={state}
        footer={
          rows && rows.length > 0 ? (
            <ListFooter
              showingText={t('admin.reminders.log.showing', 'Showing {from}–{to} of {total}')
                .replace('{from}', String(start + 1))
                .replace('{to}', String(start + rows.length))
                .replace('{total}', total.toLocaleString())}
              pageText={t('admin.reminders.log.page', 'Page {n} of {total}').replace('{n}', String(page)).replace('{total}', String(Math.max(1, Math.ceil(total / pageSize))))}
              page={page}
              totalPages={Math.max(1, Math.ceil(total / pageSize))}
              onPage={setPage}
              prevLabel={t('common.previous', 'Previous')}
              nextLabel={t('common.next', 'Next')}
              rtl={rtl}
            />
          ) : undefined
        }
      >
        {(rows ?? []).map((r) => {
          const o = (outcomes as Record<string, { label: string; tone: 'green' | 'grey' | 'blue' | 'red' }>)[r.outcome] ?? { label: r.outcome, tone: 'grey' as const };
          const label =
            r.outcome === 'waiting' && r.sendAt
              ? t('admin.reminders.log.waitingFor', 'Waiting for {time}').replace('{time}', new Date(r.sendAt).toLocaleTimeString(lang === 'he' ? 'he-IL' : 'en-GB', { hour: '2-digit', minute: '2-digit' }))
              : o.label;
          return (
            <div key={r.id} style={{ ['--list-cols' as string]: `${COLUMNS} 20px` }} className="grid gap-1.5 border-b border-border/70 px-5 py-3 text-sm last:border-b-0 md:grid-cols-[var(--list-cols)] md:items-center md:gap-4">
              <span className="text-muted-foreground">{dateTime(r.at, lang)}</span>
              <span className="min-w-0 font-semibold [overflow-wrap:anywhere]">
                {r.userId ? (
                  <Link href={`/admin/users/${r.userId}`} className="hover:text-primary hover:underline">
                    {r.client}
                  </Link>
                ) : (
                  r.client
                )}
              </span>
              <span className="min-w-0 [overflow-wrap:anywhere]">
                {sourceWord(r)}
                {r.step ? ` · ${t('admin.reminders.drawer.stepN', 'step {n}').replace('{n}', String(r.step))}` : ''}
                {r.category && r.category !== 'system' && <span className="ms-2 rounded-full bg-muted px-2 py-0.5 text-[12px] text-foreground/70">{categoryLabel(r.category, lang)}</span>}
                <span className="block text-[13px] text-muted-foreground">{r.title}</span>
              </span>
              <span className="min-w-0">
                <OutcomePill tone={o.tone}>{label}</OutcomePill>
                <span className="mt-0.5 block text-[13px] text-muted-foreground [overflow-wrap:anywhere]">{detail(r)}</span>
              </span>
              <span />
            </div>
          );
        })}
      </ListPanel>
    </>
  );
}
