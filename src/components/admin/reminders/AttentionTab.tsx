'use client';

/**
 * Needs attention: clients stuck in the middle (a payment that failed, an
 * enrollment or contract not finished, an email that doesn't arrive). The
 * reminders already go to them by themselves; once it's sorted, they leave
 * the list. Pressing a name opens the existing enrollment drawer.
 */

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, WifiOff } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { ListPanel, ListSearch, ListSkeleton, ListState, QuickPills, kitButton } from '@/components/admin/notifications/kit';
import type { AttentionItem } from '@/lib/messaging/admin';
import { money, shortDate, useBi } from './shared';

type Filter = 'all' | 'payment' | 'enrollment' | 'email';

const BADGE = {
  late: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
  bounced: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
  waiting: 'bg-muted text-foreground/75',
} as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('');
}

export function AttentionTab({ onChanged }: { onChanged: () => void }) {
  const { t } = useAdminLanguage();
  const { lang, bi } = useBi();
  const { toast } = useToast();
  const [items, setItems] = useState<AttentionItem[] | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/reminders/attention', { cache: 'no-store' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setItems(body.items);
      setCurrency(body.currency);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (key: string, url: string, body: unknown, done: string) => {
    setBusy(key);
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out.success === false) throw new Error(out.error || out.message || `HTTP ${res.status}`);
      toast({ title: done });
      await load();
      onChanged();
    } catch (e) {
      toast({ title: t('common.error', 'Error'), description: (e as Error).message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const counts = useMemo(() => {
    const c = { all: 0, payment: 0, enrollment: 0, email: 0 };
    for (const i of items ?? []) {
      c.all++;
      if (i.kind === 'payment') c.payment++;
      if (i.kind === 'enrollment' || i.kind === 'email') c.enrollment++;
      if (i.bounced) c.email++;
    }
    return c;
  }, [items]);

  const shown = (items ?? []).filter((i) => {
    if (filter === 'payment' && i.kind !== 'payment') return false;
    if (filter === 'enrollment' && i.kind === 'payment') return false;
    if (filter === 'email' && !i.bounced) return false;
    const q = query.trim().toLowerCase();
    return !q || `${i.client} ${i.product}`.toLowerCase().includes(q);
  });
  const payments = shown.filter((i) => i.kind === 'payment');
  const others = shown.filter((i) => i.kind !== 'payment');
  const openTotal = payments.reduce((s, i) => s + (i.amount ?? 0), 0);

  const badgeText = (i: AttentionItem) =>
    i.badge === 'suspended'
      ? t('admin.reminders.attention.suspended', 'Suspended')
      : i.badge === 'bounced'
        ? t('admin.reminders.attention.bounced', "Email doesn't arrive")
        : i.badge === 'late'
          ? i.daysLate === 1
            ? t('admin.reminders.attention.lateOne', '1 day late')
            : t('admin.reminders.attention.late', '{n} days late').replace('{n}', String(i.daysLate ?? 0))
          : t('admin.reminders.attention.days', '{n} days').replace('{n}', String(i.daysLate ?? 0));

  const row = (i: AttentionItem) => (
    <div key={i.key} className="grid gap-3 border-b border-border/70 px-5 py-4 last:border-b-0 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.6fr)_auto] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-[13px] font-extrabold text-primary" aria-hidden>
          {initials(i.client)}
        </span>
        <div className="min-w-0">
          {i.enrollmentId ? (
            <Link href={`/admin/enrollments?enrollment=${i.enrollmentId}`} className="font-bold text-foreground hover:text-primary hover:underline">
              {i.client}
            </Link>
          ) : (
            <span className="font-bold">{i.client}</span>
          )}
          <div className="text-[13px] text-muted-foreground [overflow-wrap:anywhere]">
            {i.product}
            {i.amount != null && ` · ${money(i.amount, i.currency || currency, lang)}`}
          </div>
        </div>
      </div>
      <div className="min-w-0 text-sm">
        <div className="font-semibold [overflow-wrap:anywhere]">{bi(i.what)}</div>
        <div className="mt-0.5 flex flex-wrap gap-x-2 text-[13px] text-muted-foreground">
          <span>
            {i.sent
              ? t('admin.reminders.attention.remindersSent', '{n} reminders sent').replace('{n}', String(i.sent))
              : t('admin.reminders.attention.noReminders', 'No reminder sent yet')}
          </span>
          {i.nextAt && <span>· {t('admin.reminders.attention.nextOn', 'next: {date}').replace('{date}', shortDate(i.nextAt, lang))}</span>}
          {i.emailOff && <span>· {t('admin.reminders.attention.emailOff', 'email off · bell only')}</span>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <span className={`rounded-full px-2.5 py-0.5 text-[12.5px] font-bold ${BADGE[i.badge]}`}>{badgeText(i)}</span>
        {i.scheduleId && (
          <button
            type="button"
            className={kitButton.secondary}
            disabled={!!busy}
            onClick={() => act(`charge:${i.key}`, `/api/admin/payments/schedules/${i.scheduleId}/retry`, {}, t('admin.reminders.attention.charged', 'Charge sent. The list updates when it goes through.'))}
          >
            {busy === `charge:${i.key}` && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('admin.reminders.attention.chargeNow', 'Charge now')}
          </button>
        )}
        {i.kind === 'payment' && (
          <button
            type="button"
            className={kitButton.secondary}
            disabled={!!busy}
            onClick={() => act(`card:${i.key}`, '/api/admin/reminders/attention/card-link', { userId: i.userId, enrollmentId: i.enrollmentId }, t('admin.reminders.attention.cardSent', 'The link to update the card was sent'))}
          >
            {busy === `card:${i.key}` && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('admin.reminders.attention.sendCard', 'Send a link to update the card')}
          </button>
        )}
        {i.bounced && (
          <Link href={`/admin/users/${i.userId}`} className={kitButton.secondary}>
            {t('admin.reminders.attention.fixEmail', 'Fix the address')}
          </Link>
        )}
        {i.kind !== 'payment' && i.enrollmentId && (
          <button
            type="button"
            className={kitButton.secondary}
            disabled={!!busy}
            onClick={() => act(`link:${i.key}`, `/api/admin/enrollments/${i.enrollmentId}/resend-invitation`, {}, t('admin.reminders.attention.linkSent', 'The enrollment link was sent again'))}
          >
            {busy === `link:${i.key}` && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('admin.reminders.attention.resend', 'Send the link again')}
          </button>
        )}
      </div>
    </div>
  );

  const state = error ? (
    <ListState icon={WifiOff} tone="red" title={t('admin.reminders.attention.loadError', "Couldn't load the list")} text={error} />
  ) : !items ? (
    <ListSkeleton rows={4} />
  ) : !shown.length ? (
    <ListState icon={CheckCircle2} title={t('admin.reminders.attention.empty', 'Nobody needs attention right now')} text={t('admin.reminders.attention.emptyText', 'When a payment fails or an enrollment gets stuck, the client shows up here.')} />
  ) : undefined;

  return (
    <>
      <p className="max-w-3xl text-muted-foreground">
        {t(
          'admin.reminders.attention.intro',
          "Clients stuck in the middle: a payment that didn't go through, an enrollment or contract not finished, or an email that doesn't arrive. The reminders already go to them by themselves. Once it's sorted, they leave the list.",
        )}
      </p>
      <ListPanel
        label={t('admin.reminders.tab.attention', 'Needs attention')}
        toolbar={<ListSearch value={query} onChange={setQuery} placeholder={t('admin.reminders.attention.search', 'Search client or product')} clearLabel={t('admin.reminders.clearSearch', 'Clear search')} />}
        pills={
          <QuickPills
            label={t('admin.reminders.attention.filter', 'Show')}
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all' as const, label: t('admin.reminders.all', 'All'), count: counts.all },
              { value: 'payment' as const, label: t('admin.reminders.attention.payments', 'Payments'), count: counts.payment },
              { value: 'enrollment' as const, label: t('admin.reminders.attention.enrollment', 'Enrollment'), count: counts.enrollment },
              { value: 'email' as const, label: t('admin.reminders.attention.email', "Email doesn't arrive"), count: counts.email },
            ]}
          />
        }
        columns="1fr"
        head={[]}
        state={state}
        footer={
          items && (
            <span className="text-[13.5px] text-muted-foreground">
              {t('admin.reminders.attention.showing', 'Showing {n} of {total} · pressing a name opens the enrollment').replace('{n}', String(shown.length)).replace('{total}', String(items.length))}
            </span>
          )
        }
      >
        {payments.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/30 px-5 py-3 text-[15px] font-extrabold">
            <span>
              {t('admin.reminders.attention.payments', 'Payments')} · {payments.length}
            </span>
            <span className="text-[13px] font-semibold text-muted-foreground">
              {t('admin.reminders.attention.openTotal', 'Open in total: {sum}').replace('{sum}', money(openTotal, currency, lang))}
            </span>
          </div>
        )}
        {payments.map(row)}
        {others.length > 0 && (
          <div className="border-b border-border/70 bg-muted/30 px-5 py-3 text-[15px] font-extrabold">
            {t('admin.reminders.attention.enrollment', 'Enrollment')} · {others.length}
          </div>
        )}
        {others.map(row)}
      </ListPanel>
    </>
  );
}
