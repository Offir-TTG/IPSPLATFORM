'use client';

export const dynamic = 'force-dynamic';

/**
 * Communications · Overview: what went out to clients from every channel
 * (reminders, messages, scheduled and system emails), how it arrived, what
 * is coming up in the next day, and what was sent most. Replaces the email
 * dashboard and email analytics.
 */

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Clock, Mail, Plus, Send, WifiOff } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { KpiItem, KpiStrip, ListState, QuickPills, kitButton } from '@/components/admin/notifications/kit';
import { CommsPage, COMMS } from '@/components/admin/comms/CommsPage';
import { OutcomePill, useBi, useOutcomeWords, dateTime } from '@/components/admin/reminders/shared';

interface Overview {
  days: number;
  kpis: { sent: number; emailSent: number; emailTotal: number; deliveredRate: number | null; failed: number; blocked: number; waiting: number };
  daily: { day: string; sent: number; failed: number }[];
  sources: Record<string, number>;
  outcomes: Record<string, number>;
  most: { label: string; templateKey?: string; sent: number; delivered: number }[];
  upcoming: { at: string; label: string; count: number; kind: 'scheduled' | 'waiting' | 'digest' }[];
}

const card = 'rounded-2xl border border-border bg-card p-5 shadow-sm';

export default function CommsOverviewPage() {
  const { t } = useAdminLanguage();
  const { lang } = useBi();
  const outcomes = useOutcomeWords();
  const [days, setDays] = useState<'7' | '30' | '90' | '365'>('30');
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/communications/overview?days=${days}`, { cache: 'no-store' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setData(body);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [days]);

  useEffect(() => {
    load();
    const h = setInterval(load, 30_000);
    return () => clearInterval(h);
  }, [load]);

  const sourceWord: Record<string, string> = {
    reminder: t('admin.comms.source.reminder', 'Automatic reminders'),
    manual: t('admin.comms.source.manual', 'Messages from the team'),
    scheduled: t('admin.comms.source.scheduled', 'Scheduled emails'),
    system: t('admin.comms.source.system', 'System messages'),
    trigger: t('admin.comms.source.trigger', 'Email triggers'),
    coaching: t('admin.comms.source.coaching', 'Coaching'),
    team_alert: t('admin.comms.source.team', 'Team alerts'),
    price_change: t('admin.comms.source.price', 'Price changes'),
    digest: t('admin.comms.source.digest', 'Daily summary'),
    contact: t('admin.comms.source.contact', 'Website contact form'),
  };

  // Long periods are shown by week, so a year is ~52 bars, not 365.
  const bars = (() => {
    const daily = data?.daily ?? [];
    const size = daily.length > 60 ? 7 : 1;
    const out: { day: string; sent: number; failed: number }[] = [];
    for (let i = 0; i < daily.length; i += size) {
      const chunk = daily.slice(i, i + size);
      out.push({ day: chunk[0].day, sent: chunk.reduce((n, d) => n + d.sent, 0), failed: chunk.reduce((n, d) => n + d.failed, 0) });
    }
    return out;
  })();
  const byWeek = (data?.daily.length ?? 0) > 60;
  const max = Math.max(1, ...bars.map((d) => d.sent));
  const maxFail = Math.max(1, ...bars.map((d) => d.failed));

  const upcomingWhen = (u: Overview['upcoming'][number]) => (u.kind === 'digest' ? `${t('admin.comms.today', 'Today')} ${u.at}` : dateTime(u.at, lang));

  return (
    <CommsPage
      icon={Mail}
      title={t('admin.comms.title', 'Communications')}
      description={t(
        'admin.comms.subtitle',
        'Everything that goes out to clients, in one place: messages, automatic reminders, scheduled emails and system messages. Each one goes out by what the client chose in their update settings.',
      )}
      actions={
        <Link href={COMMS.newMessage} className={kitButton.primary}>
          <Plus className="h-4 w-4" aria-hidden />
          {t('admin.comms.newMessage', 'New message')}
        </Link>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <QuickPills
          label={t('admin.comms.range', 'Period')}
          value={days}
          onChange={setDays}
          options={[
            { value: '7' as const, label: t('admin.comms.days7', '7 days') },
            { value: '30' as const, label: t('admin.comms.days30', '30 days') },
            { value: '90' as const, label: t('admin.comms.days90', '90 days') },
            { value: '365' as const, label: t('admin.comms.year', 'A year') },
          ]}
        />
        <span className="text-[13px] text-muted-foreground">{t('admin.comms.autoRefresh', 'Updates every 30 seconds')}</span>
      </div>

      {error ? (
        <div className="rounded-2xl border border-border bg-card">
          <ListState icon={WifiOff} tone="red" title={t('admin.comms.loadError', "Couldn't load the numbers")} text={error} />
        </div>
      ) : (
        <>
          <KpiStrip label={t('admin.comms.numbers', 'Numbers')}>
            <KpiItem icon={<Send />} label={t('admin.comms.kpi.sent', 'Sent')} value={data ? data.kpis.sent.toLocaleString() : '–'} subtitle={t('admin.comms.kpi.sentSub', 'All channels')} />
            <KpiItem
              icon={<Mail />}
              tone="blue"
              label={t('admin.comms.kpi.delivered', 'Arrived by email')}
              value={data?.kpis.deliveredRate != null ? `${data.kpis.deliveredRate}%` : '–'}
              subtitle={data ? t('admin.comms.kpi.deliveredSub', '{n} of {total} emails').replace('{n}', data.kpis.emailSent.toLocaleString()).replace('{total}', data.kpis.emailTotal.toLocaleString()) : undefined}
            />
            <KpiItem
              icon={<AlertTriangle />}
              tone="amber"
              label={t('admin.comms.kpi.failed', "Didn't arrive")}
              value={data ? data.kpis.failed.toLocaleString() : '–'}
              subtitle={data ? t('admin.comms.kpi.blocked', '{n} addresses blocked from sending').replace('{n}', String(data.kpis.blocked)) : undefined}
              onClick={() => window.location.assign(`${COMMS.log}?outcome=failed`)}
            />
            <KpiItem
              icon={<Clock />}
              tone="grey"
              label={t('admin.comms.kpi.waiting', 'Waiting to go out')}
              value={data ? data.kpis.waiting.toLocaleString() : '–'}
              subtitle={t('admin.comms.kpi.waitingSub', 'Quiet hours, scheduled, daily summary')}
              onClick={() => window.location.assign(`${COMMS.log}?outcome=waiting`)}
            />
          </KpiStrip>

          {/* The chart takes the full width; the cards share the row under it. */}
          <section className={`${card} min-w-0`}>
            <h2 className="text-lg font-extrabold [font-family:inherit]">
              {byWeek ? t('admin.comms.chartTitleWeek', "Sent and didn't arrive, per week") : t('admin.comms.chartTitle', "Sent and didn't arrive, per day")}
            </h2>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">{t('admin.comms.chartHint', 'The chosen period')}</p>
            <div className="flex h-36 items-end gap-px overflow-hidden border-b border-border sm:gap-[2px]" aria-hidden>
              {bars.map((d) => (
                <span key={d.day} title={`${d.day}: ${d.sent}`} className="min-w-0 flex-1 rounded-t-sm bg-primary/80" style={{ height: `${Math.max(2, (100 * d.sent) / max)}%` }} />
              ))}
            </div>
            <div className="mt-1.5 flex h-10 items-end gap-px overflow-hidden sm:gap-[2px]" aria-hidden>
              {bars.map((d) => (
                <span key={d.day} title={`${d.day}: ${d.failed}`} className="min-w-0 flex-1 rounded-t-sm bg-red-500/80" style={{ height: d.failed ? `${Math.max(8, (100 * d.failed) / maxFail)}%` : '2px' }} />
              ))}
            </div>
            <div className="mt-3 flex gap-4 text-[13px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" /> {t('admin.comms.legendSent', 'Sent')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" /> {t('admin.comms.legendFailed', "Didn't arrive")}
              </span>
            </div>
          </section>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <section className={`${card} min-w-0`}>
              <h2 className="text-lg font-extrabold [font-family:inherit]">{t('admin.comms.sourcesTitle', 'Where it came from')}</h2>
              <p className="mb-3 mt-1 text-sm text-muted-foreground">{t('admin.comms.sourcesHint', 'And how it reached clients')}</p>
              <ul className="m-0 divide-y divide-border p-0">
                {Object.entries(data?.sources ?? {})
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, n]) => (
                    <li key={k} className="flex list-none justify-between py-2 text-sm">
                      <span>{sourceWord[k] ?? k}</span>
                      <b className="tabular-nums">{n.toLocaleString()}</b>
                    </li>
                  ))}
                {data && !Object.keys(data.sources).length && <li className="list-none py-2 text-sm text-muted-foreground">{t('admin.comms.nothingYet', 'Nothing was sent in this period.')}</li>}
              </ul>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {Object.entries(data?.outcomes ?? {}).map(([k, n]) => {
                  const o = (outcomes as Record<string, { label: string; tone: 'green' | 'grey' | 'blue' | 'red' }>)[k];
                  return o ? (
                    <OutcomePill key={k} tone={o.tone}>
                      {o.label} {n.toLocaleString()}
                    </OutcomePill>
                  ) : null;
                })}
              </div>
            </section>

            <section className={card}>
              <h2 className="text-lg font-extrabold [font-family:inherit]">{t('admin.comms.upcomingTitle', 'Coming up')}</h2>
              <p className="mb-3 mt-1 text-sm text-muted-foreground">{t('admin.comms.upcomingHint', 'Scheduled messages and waiting emails in the next 24 hours')}</p>
              <ul className="m-0 divide-y divide-border p-0">
                {(data?.upcoming ?? []).map((u, i) => (
                  <li key={i} className="grid list-none grid-cols-[110px_1fr_auto] items-center gap-3 py-2 text-sm">
                    <span className="text-muted-foreground">{upcomingWhen(u)}</span>
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      <b>{u.kind === 'digest' ? t('admin.comms.dailySummary', 'The daily summary') : u.label}</b> ·{' '}
                      {t('admin.comms.clients', '{n} clients').replace('{n}', String(u.count))}
                    </span>
                    <OutcomePill tone={u.kind === 'scheduled' ? 'green' : 'blue'}>
                      {u.kind === 'scheduled' ? t('admin.comms.kindScheduled', 'Scheduled') : u.kind === 'digest' ? t('admin.comms.kindDigest', 'Summary') : t('admin.comms.kindWaiting', 'Waiting')}
                    </OutcomePill>
                  </li>
                ))}
                {data && !data.upcoming.length && <li className="list-none py-2 text-sm text-muted-foreground">{t('admin.comms.noUpcoming', 'Nothing is waiting for the next 24 hours.')}</li>}
              </ul>
              <Link href={`${COMMS.messages}`} className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">
                {t('admin.comms.allMessages', 'All messages')}
              </Link>
            </section>

            <section className={card}>
              <h2 className="text-lg font-extrabold [font-family:inherit]">{t('admin.comms.mostTitle', 'Sent most')}</h2>
              <p className="mb-3 mt-1 text-sm text-muted-foreground">{t('admin.comms.mostHint', 'Templates and reminders, and how many arrived')}</p>
              <div className="grid grid-cols-[1fr_70px_70px] gap-2 border-b border-border pb-2 text-[13px] font-semibold text-muted-foreground">
                <span>{t('admin.comms.colWhat', 'What')}</span>
                <span>{t('admin.comms.colSent', 'Sent')}</span>
                <span>{t('admin.comms.colArrived', 'Arrived')}</span>
              </div>
              {(data?.most ?? []).map((m, i) => (
                <div key={i} className="grid grid-cols-[1fr_70px_70px] gap-2 border-b border-border/60 py-2 text-sm last:border-b-0">
                  <span className="min-w-0 [overflow-wrap:anywhere]">{m.templateKey ? t(`email_template.${m.templateKey.replace('.', '_')}.name`, m.label) : m.label}</span>
                  <b className="tabular-nums">{m.sent.toLocaleString()}</b>
                  <span className="tabular-nums">{m.sent ? `${Math.round((100 * m.delivered) / m.sent)}%` : '–'}</span>
                </div>
              ))}
              {data && !data.most.length && <p className="py-2 text-sm text-muted-foreground">{t('admin.comms.nothingYet', 'Nothing was sent in this period.')}</p>}
            </section>
          </div>
        </>
      )}
    </CommsPage>
  );
}

