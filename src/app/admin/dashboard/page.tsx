'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { LoadingState } from '@/components/admin/LoadingState';
import { useAdminLanguage } from '@/context/AppContext';
import { useHelp } from '@/hooks/useHelp';
import { formatCurrency as formatCurrencyRaw } from '@/lib/currency/format';

/**
 * Admin home. Built around one question: what needs me today?
 * Top to bottom: greeting and quick actions, the cards that need action
 * (each disappears when its count is 0), four key numbers, today's
 * lessons and coaching, money by month, enrollment steps, program
 * fill, recent activity, and whether the connected services look fine.
 * All numbers come from /api/admin/dashboard/stats.
 */

type Tone = 'danger' | 'warning' | 'info' | 'neutral';

interface Stats {
  firstName: string;
  currency: { code: string };
  attention: {
    disputes: { count: number; amount: number; dueDate: string | null };
    late: { count: number; amount: number };
    unfinished: { count: number; signature: number; payment: number; details: number };
    coachingRequests: { count: number };
    intake: { count: number; childId: string | null };
    emails: { count: number };
  };
  kpis: {
    collectedThisMonth: number;
    collectedLastMonth: number;
    expected30: number;
    expected30Count: number;
    activeStudents: number;
    activePrograms: number;
    newThisMonth: number;
    newLastMonth: number;
  };
  today: Array<{
    kind: 'lesson' | 'coaching';
    id: string;
    startsAt: string;
    title: string;
    host: string;
    students?: number;
    paid?: boolean;
    zoomUrl: string | null;
    href: string;
  }>;
  money: {
    months: Array<{ month: string; amount: number; expected?: boolean }>;
    refundedThisMonth: number;
    stillOwed: number;
  };
  enrollments: {
    steps: { sent: number; details: number; signed: number; active: number };
    stuck: Array<{ id: string; name: string; product: string; reason: 'signature' | 'payment' | 'details'; days: number }>;
  };
  programs: Array<{ id: string; name: string; max: number | null; students: number }>;
  activity: Array<{ kind: 'paid' | 'enrolled' | 'request' | 'failed'; at: string; who: string; amount: number; what: string }>;
  health: { stripe: string; email: string; docusign: string; video: string; jobsFailed: number };
}

const TONE: Record<Tone, { box: string; pill: string }> = {
  danger: {
    box: 'border-red-200 bg-red-50/70 dark:border-red-900/60 dark:bg-red-950/20',
    pill: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  },
  warning: {
    box: 'border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/20',
    pill: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200',
  },
  info: {
    box: 'border-border bg-muted/30',
    pill: 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200',
  },
  neutral: {
    box: 'border-border bg-muted/30',
    pill: 'bg-muted text-foreground',
  },
};

const btn =
  'inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-lg border border-border bg-card px-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted';
const btnPrimary =
  'inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90';
const card = 'min-w-0 rounded-2xl border border-border bg-card p-5';
const linkCls = 'text-sm font-semibold text-primary hover:underline';

export default function AdminDashboardPage() {
  useHelp('admin-overview');
  const { t, language } = useAdminLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const locale = language === 'he' ? 'he-IL' : 'en-US';

  useEffect(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const qs = new URLSearchParams({ from: start.toISOString(), to: end.toISOString() });
    fetch(`/api/admin/dashboard/stats?${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState variant="page" withLayout={true} />;
  if (!stats) {
    return (
      <AdminLayout>
        <div className="max-w-6xl p-4 md:p-6 text-muted-foreground">
          {t('admin.dashboard.error', 'Failed to load dashboard data')}
        </div>
      </AdminLayout>
    );
  }

  const money = (n: number) => formatCurrencyRaw(n, { code: stats.currency.code, locale });
  const fill = (text: string, values: Record<string, string | number>) =>
    Object.entries(values).reduce((s, [k, v]) => s.split(`{${k}}`).join(String(v)), text);
  const day = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  const time = (iso: string) => new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const ago = (iso: string) => {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 60) return fill(t('admin.dashboard.ago.minutes', '{n} min ago'), { n: Math.max(1, mins) });
    const hours = Math.round(mins / 60);
    if (hours < 24) return fill(t('admin.dashboard.ago.hours', '{n} hours ago'), { n: hours });
    if (hours < 48) return t('admin.dashboard.ago.yesterday', 'Yesterday');
    return day(iso);
  };
  const change = (now: number, before: number, kind: 'percent' | 'count') => {
    if (kind === 'count') {
      const diff = now - before;
      if (diff === 0) return null;
      return { up: diff > 0, text: fill(t('admin.dashboard.kpi.changeCount', '{n} from last month'), { n: Math.abs(diff) }) };
    }
    if (before <= 0) return null;
    const pct = Math.round(((now - before) / before) * 100);
    if (pct === 0) return null;
    return { up: pct > 0, text: fill(t('admin.dashboard.kpi.changePercent', '{n}% from last month'), { n: Math.abs(pct) }) };
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t('admin.dashboard.greeting.morning', 'Good morning')
      : hour < 18
        ? t('admin.dashboard.greeting.afternoon', 'Good afternoon')
        : t('admin.dashboard.greeting.evening', 'Good evening');

  // ── Attention cards (only the ones with something to do) ───────────
  const a = stats.attention;
  const attention: Array<{ key: string; tone: Tone; pill: string; count: number; label: string; text: string; href: string; cta: string }> = [];
  if (a.disputes.count > 0) {
    attention.push({
      key: 'disputes',
      tone: 'danger',
      pill: a.disputes.dueDate
        ? fill(t('admin.dashboard.todo.disputes.due', 'Reply by {date}'), { date: day(a.disputes.dueDate) })
        : t('admin.dashboard.todo.disputes.pill', 'Needs a reply'),
      count: a.disputes.count,
      label: t('admin.dashboard.todo.disputes.label', 'payment disputes'),
      text: fill(
        t('admin.dashboard.todo.disputes.text', 'A customer asked their bank for {amount} back. Send Stripe your answer before the deadline.'),
        { amount: money(a.disputes.amount) },
      ),
      href: '/admin/payments/disputes',
      cta: t('admin.dashboard.todo.disputes.cta', 'Answer the dispute'),
    });
  }
  if (a.late.count > 0) {
    attention.push({
      key: 'late',
      tone: 'warning',
      pill: fill(t('admin.dashboard.todo.late.pill', '{amount} late'), { amount: money(a.late.amount) }),
      count: a.late.count,
      label: t('admin.dashboard.todo.late.label', 'late payments'),
      text: t('admin.dashboard.todo.late.text', 'Charges that failed or are past their date. Retry, or send the parent a payment link.'),
      href: '/admin/payments/schedules?status=overdue',
      cta: t('admin.dashboard.todo.late.cta', 'See late payments'),
    });
  }
  if (a.unfinished.count > 0) {
    const parts = [
      a.unfinished.signature && fill(t('admin.dashboard.todo.unfinished.signature', "{n} haven't signed"), { n: a.unfinished.signature }),
      a.unfinished.payment && fill(t('admin.dashboard.todo.unfinished.payment', "{n} haven't paid"), { n: a.unfinished.payment }),
      a.unfinished.details && fill(t('admin.dashboard.todo.unfinished.details', "{n} haven't filled in their details"), { n: a.unfinished.details }),
    ].filter(Boolean);
    attention.push({
      key: 'unfinished',
      tone: 'info',
      pill: t('admin.dashboard.todo.unfinished.pill', 'Waiting 3+ days'),
      count: a.unfinished.count,
      label: t('admin.dashboard.todo.unfinished.label', 'enrollments not finished'),
      text: parts.join(' · '),
      href: '/admin/enrollments',
      cta: t('admin.dashboard.todo.unfinished.cta', 'See who'),
    });
  }
  if (a.coachingRequests.count > 0) {
    attention.push({
      key: 'requests',
      tone: 'info',
      pill: t('admin.dashboard.todo.new', 'New'),
      count: a.coachingRequests.count,
      label: t('admin.dashboard.todo.requests.label', 'coaching requests'),
      text: t('admin.dashboard.todo.requests.text', 'Parents asked for a coaching session from the portal. Pick a coach and a time.'),
      href: '/admin/coaching',
      cta: t('admin.dashboard.todo.requests.cta', 'Handle requests'),
    });
  }
  if (a.intake.count > 0) {
    attention.push({
      key: 'intake',
      tone: 'info',
      pill: t('admin.dashboard.todo.thisWeek', 'This week'),
      count: a.intake.count,
      label: t('admin.dashboard.todo.intake.label', 'new intake forms'),
      text: t('admin.dashboard.todo.intake.text', 'Parents filled in the coaching intake form for their child.'),
      href: a.intake.childId ? `/admin/coaching/children/${a.intake.childId}` : '/admin/coaching/children',
      cta: t('admin.dashboard.todo.intake.cta', 'Read the form'),
    });
  }
  if (a.emails.count > 0) {
    attention.push({
      key: 'emails',
      tone: 'neutral',
      pill: t('admin.dashboard.todo.emails.pill', 'Last 7 days'),
      count: a.emails.count,
      label: t('admin.dashboard.todo.emails.label', "emails didn't arrive"),
      text: t('admin.dashboard.todo.emails.text', "The address is wrong or the inbox refused them. Fix the address on the person's page."),
      href: '/admin/emails/queue',
      cta: t('admin.dashboard.todo.emails.cta', 'See who'),
    });
  }

  const k = stats.kpis;
  const moneyChange = change(k.collectedThisMonth, k.collectedLastMonth, 'percent');
  const enrollChange = change(k.newThisMonth, k.newLastMonth, 'count');

  const maxMonth = Math.max(1, ...stats.money.months.map((m) => m.amount));
  const monthName = (key: string) => {
    const [y, m] = key.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(locale, { month: 'short' });
  };
  const compact = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n)));
  const currentMonthIndex = stats.money.months.length - 2;

  const reasonText = (r: 'signature' | 'payment' | 'details', days: number) =>
    fill(
      r === 'signature'
        ? t('admin.dashboard.stuck.signature', 'waiting for signature, {n} days')
        : r === 'payment'
          ? t('admin.dashboard.stuck.payment', 'signed, not paid, {n} days')
          : t('admin.dashboard.stuck.details', "details not filled in, {n} days"),
      { n: days },
    );

  const activityText = (x: Stats['activity'][number]) => {
    const who = x.who || t('admin.dashboard.activity.someone', 'Someone');
    switch (x.kind) {
      case 'paid':
        return fill(
          x.what ? t('admin.dashboard.activity.paidFor', '{who} paid {amount} for {what}') : t('admin.dashboard.activity.paid', '{who} paid {amount}'),
          { who, amount: money(x.amount), what: x.what },
        );
      case 'enrolled':
        return fill(t('admin.dashboard.activity.enrolled', '{who} finished enrolling in {what}'), { who, what: x.what });
      case 'request':
        return fill(t('admin.dashboard.activity.request', '{who} asked for a coaching session'), { who });
      case 'failed':
        return fill(t('admin.dashboard.activity.failed', 'A payment of {amount} from {who} failed'), { who, amount: money(x.amount) });
    }
  };
  const activityDot: Record<Stats['activity'][number]['kind'], string> = {
    paid: 'bg-green-600',
    enrolled: 'bg-blue-600',
    request: 'bg-blue-600',
    failed: 'bg-red-600',
  };

  const health: Array<{ key: string; label: string; state: string }> = [
    { key: 'stripe', label: t('admin.dashboard.health.stripe', 'Payments (Stripe)'), state: stats.health.stripe },
    { key: 'email', label: t('admin.dashboard.health.email', 'Emails (Resend)'), state: stats.health.email },
    { key: 'docusign', label: t('admin.dashboard.health.docusign', 'Signatures (DocuSign)'), state: stats.health.docusign },
    { key: 'video', label: t('admin.dashboard.health.video', 'Video meetings'), state: stats.health.video },
  ];
  const healthWord = (s: string) =>
    s === 'ok'
      ? t('admin.dashboard.health.ok', 'Working')
      : s === 'problem'
        ? t('admin.dashboard.health.problem', 'Some emails failed')
        : t('admin.dashboard.health.off', 'Not set up');
  const healthDot = (s: string) => (s === 'ok' ? 'bg-green-600' : s === 'problem' ? 'bg-amber-600' : 'bg-muted-foreground/50');
  const healthText = (s: string) =>
    s === 'ok' ? 'text-green-700 dark:text-green-400' : s === 'problem' ? 'text-amber-800 dark:text-amber-300' : 'text-muted-foreground';

  const steps = stats.enrollments.steps;

  return (
    <AdminLayout>
      <div className="max-w-6xl p-4 md:p-6 space-y-6">
        {/* 1. Greeting and quick actions */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold">
              {stats.firstName ? `${greeting}, ${stats.firstName}` : greeting}
            </h1>
            <p className="mt-1.5 text-muted-foreground">
              {attention.length === 0
                ? t('admin.dashboard.summary.clear', 'Nothing needs you right now. Everything is running normally.')
                : fill(
                    attention.length === 1
                      ? t('admin.dashboard.summary.one', '1 thing needs you today.')
                      : t('admin.dashboard.summary.many', '{n} things need you today.'),
                    { n: attention.length },
                  )}
            </p>
          </div>
          <nav aria-label={t('admin.dashboard.quickActions', 'Quick actions')} className="flex flex-wrap gap-2">
            <Link href="/admin/enrollments/new" className={btnPrimary}>
              + {t('admin.dashboard.action.newEnrollment', 'New enrollment')}
            </Link>
            <Link href="/admin/coaching/new" className={btn}>
              {t('admin.dashboard.action.bookCoaching', 'Book coaching')}
            </Link>
            <Link href="/admin/notifications/new" className={btn}>
              {t('admin.dashboard.action.sendMessage', 'Send a message')}
            </Link>
          </nav>
        </header>

        {/* 2. Needs your attention */}
        <section className={`${card} md:p-6`} aria-labelledby="todo-h">
          <h2 id="todo-h" className="text-lg font-semibold">
            {t('admin.dashboard.todo.title', 'Needs your attention')}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t('admin.dashboard.todo.subtitle', "Most urgent first. A card disappears when it's done.")}
          </p>
          {attention.length === 0 ? (
            <p className="mt-4 rounded-xl border border-green-200 bg-green-50/70 px-4 py-3 text-sm text-green-800 dark:border-green-900/60 dark:bg-green-950/20 dark:text-green-200">
              {t('admin.dashboard.todo.empty', 'All clear. No disputes, late payments or open requests.')}
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {attention.map((item) => (
                <div key={item.key} className={`flex flex-col gap-2.5 rounded-xl border p-4 ${TONE[item.tone].box}`}>
                  <span className={`self-start rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[item.tone].pill}`}>
                    {item.pill}
                  </span>
                  <div>
                    <strong className="text-2xl">{item.count}</strong>{' '}
                    <span className="font-semibold">{item.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                  <Link href={item.href} className={`${btn} mt-auto self-start`}>
                    {item.cta}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. Key numbers */}
        <section aria-label={t('admin.dashboard.kpi.label', 'Key numbers')} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi
            label={t('admin.dashboard.kpi.collected', 'Collected this month')}
            value={money(k.collectedThisMonth)}
            note={moneyChange}
          />
          <Kpi
            label={t('admin.dashboard.kpi.expected', 'Expected in the next 30 days')}
            value={money(k.expected30)}
            plain={fill(t('admin.dashboard.kpi.expectedSub', '{n} scheduled payments'), { n: k.expected30Count })}
          />
          <Kpi
            label={t('admin.dashboard.kpi.students', 'Active clients')}
            value={String(k.activeStudents)}
            plain={fill(t('admin.dashboard.kpi.studentsSub', 'in {n} programs'), { n: k.activePrograms })}
          />
          <Kpi
            label={t('admin.dashboard.kpi.newEnrollments', 'New enrollments this month')}
            value={String(k.newThisMonth)}
            note={enrollChange}
          />
        </section>

        {/* 4. Today + money */}
        <div className="grid gap-4 lg:grid-cols-2">
          <section className={card} aria-labelledby="today-h">
            <h2 id="today-h" className="text-lg font-semibold">{t('admin.dashboard.today.title', 'Today')}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t('admin.dashboard.today.subtitle', 'Lessons and coaching sessions')}
            </p>
            {stats.today.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">
                {t('admin.dashboard.today.empty', 'No lessons or coaching sessions today.')}
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {stats.today.map((item) => (
                  <li key={`${item.kind}-${item.id}`} className="flex items-center gap-3 py-3">
                    <span className="w-14 shrink-0 text-sm font-semibold tabular-nums">{time(item.startsAt)}</span>
                    <div className="min-w-0 flex-1">
                      <Link href={item.href} className="block truncate text-sm font-semibold hover:underline">
                        {item.kind === 'coaching'
                          ? fill(t('admin.dashboard.today.coaching', 'Coaching · {name}'), { name: item.title })
                          : item.title}
                      </Link>
                      <p className="truncate text-sm text-muted-foreground">
                        {item.kind === 'lesson'
                          ? [
                              fill(t('admin.dashboard.today.students', '{n} clients'), { n: item.students ?? 0 }),
                              item.host,
                            ].filter(Boolean).join(' · ')
                          : fill(t('admin.dashboard.today.coach', 'coach {name}'), { name: item.host })}
                      </p>
                    </div>
                    {item.kind === 'coaching' && (
                      <span
                        className={`hidden sm:inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.paid ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' : TONE.warning.pill}`}
                      >
                        {item.paid ? t('admin.dashboard.today.paid', 'Paid') : t('admin.dashboard.today.notPaid', 'Not paid yet')}
                      </span>
                    )}
                    {item.zoomUrl && (
                      <a href={item.zoomUrl} target="_blank" rel="noopener noreferrer" className={btn}>
                        {t('admin.dashboard.today.openMeeting', 'Open meeting')}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={card} aria-labelledby="money-h">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="money-h" className="text-lg font-semibold">{t('admin.dashboard.money.title', 'Money, last 6 months')}</h2>
              <Link href="/admin/payments/reports" className={linkCls}>{t('admin.dashboard.money.reports', 'Reports')}</Link>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t('admin.dashboard.money.subtitle', "Collected each month. The last bar is what's still expected next month.")}
            </p>
            <div
              role="img"
              aria-label={stats.money.months.map((m) => `${monthName(m.month)} ${money(m.amount)}`).join(', ')}
              className="mt-5 flex h-48 items-end gap-2 border-b border-border pb-1 sm:gap-3"
            >
              {stats.money.months.map((m, i) => (
                <div key={m.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <span className={`text-xs ${i === currentMonthIndex ? 'font-semibold' : 'text-muted-foreground'}`}>
                    {compact(m.amount)}
                  </span>
                  <div
                    className={`w-full rounded-t-md ${m.expected ? 'border border-dashed border-primary/60 bg-primary/10' : i === currentMonthIndex ? 'bg-primary' : 'bg-primary/40'}`}
                    style={{ height: `${Math.max(2, (m.amount / maxMonth) * 100)}%`, maxHeight: 'calc(100% - 1.25rem)' }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2 text-xs text-muted-foreground sm:gap-3">
              {stats.money.months.map((m, i) => (
                <span key={m.month} className={`flex-1 text-center ${i === currentMonthIndex ? 'font-semibold text-foreground' : ''}`}>
                  {monthName(m.month)}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-3.5 text-sm">
              <span>
                <span className="text-muted-foreground">{t('admin.dashboard.money.refunded', 'Refunded this month')}</span>{' '}
                <strong>{money(stats.money.refundedThisMonth)}</strong>
              </span>
              <span>
                <span className="text-muted-foreground">{t('admin.dashboard.money.owed', 'Still owed on payment plans')}</span>{' '}
                <strong>{money(stats.money.stillOwed)}</strong>
              </span>
            </div>
          </section>
        </div>

        {/* 5. Enrollments + programs */}
        <div className="grid gap-4 lg:grid-cols-2">
          <section className={card} aria-labelledby="enr-h">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="enr-h" className="text-lg font-semibold">{t('admin.dashboard.enrollments.title', 'Enrollments in progress')}</h2>
              <Link href="/admin/enrollments" className={linkCls}>{t('admin.dashboard.enrollments.all', 'All enrollments')}</Link>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t('admin.dashboard.enrollments.subtitle', "Where this month's new families are in the sign-up steps")}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { n: steps.sent, label: t('admin.dashboard.enrollments.sent', 'Link sent') },
                { n: steps.details, label: t('admin.dashboard.enrollments.details', 'Details filled') },
                { n: steps.signed, label: t('admin.dashboard.enrollments.signed', 'Signed') },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-primary/5 px-3 py-3.5">
                  <div className="text-2xl font-bold">{s.n}</div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </div>
              ))}
              <div className="rounded-xl bg-green-50 px-3 py-3.5 text-green-800 dark:bg-green-950/30 dark:text-green-200">
                <div className="text-2xl font-bold">{steps.active}</div>
                <div className="text-sm">{t('admin.dashboard.enrollments.active', 'Paid and active')}</div>
              </div>
            </div>
            {stats.enrollments.stuck.length > 0 && (
              <ul className="mt-3 divide-y divide-border">
                {stats.enrollments.stuck.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{s.name || '—'}</div>
                      <div className="truncate text-sm text-muted-foreground">
                        {[s.product, reasonText(s.reason, s.days)].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <Link href={`/admin/enrollments?enrollment=${s.id}`} className={btn}>
                      {t('admin.dashboard.enrollments.open', 'Open')}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={card} aria-labelledby="prog-h">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="prog-h" className="text-lg font-semibold">{t('admin.dashboard.programs.title', 'Programs')}</h2>
              <Link href="/admin/lms/programs" className={linkCls}>{t('admin.dashboard.programs.all', 'All programs')}</Link>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{t('admin.dashboard.programs.subtitle', 'How full each program is')}</p>
            {stats.programs.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">{t('admin.dashboard.programs.empty', 'No active programs yet.')}</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {stats.programs.map((p) => {
                  const pct = p.max ? Math.min(100, Math.round((p.students / p.max) * 100)) : null;
                  const almostFull = pct !== null && pct >= 90;
                  return (
                    <li key={p.id}>
                      <div className="flex justify-between gap-3 text-sm">
                        <Link href={`/admin/lms/programs/${p.id}`} className="truncate font-semibold hover:underline">{p.name}</Link>
                        <span className="shrink-0 text-muted-foreground">
                          {p.max
                            ? fill(t('admin.dashboard.programs.ofMax', '{n} of {max}'), { n: p.students, max: p.max })
                            : fill(t('admin.dashboard.programs.noLimit', '{n} clients · no limit'), { n: p.students })}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${pct === null ? 'bg-primary/25' : almostFull ? 'bg-amber-600' : 'bg-primary'}`}
                          style={{ width: `${pct ?? 100}%` }}
                        />
                      </div>
                      {almostFull && (
                        <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                          {pct === 100 ? t('admin.dashboard.programs.full', 'Full') : t('admin.dashboard.programs.almostFull', 'Almost full')}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* 6. Activity + health */}
        <div className="grid gap-4 lg:grid-cols-3">
          <section className={`${card} lg:col-span-2`} aria-labelledby="act-h">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="act-h" className="text-lg font-semibold">{t('admin.dashboard.activity.title', 'What happened lately')}</h2>
              <Link href="/admin/audit" className={linkCls}>{t('admin.dashboard.activity.log', 'Activity log')}</Link>
            </div>
            {stats.activity.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">{t('admin.dashboard.activity.empty', 'Nothing new this week.')}</p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {stats.activity.map((x, i) => (
                  <li key={i} className="flex items-center gap-3 py-3">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${activityDot[x.kind]}`} aria-hidden />
                    <span className="min-w-0 flex-1 text-sm">{activityText(x)}</span>
                    <span className="shrink-0 text-sm text-muted-foreground">{ago(x.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={card} aria-labelledby="health-h">
            <h2 id="health-h" className="text-lg font-semibold">{t('admin.dashboard.health.title', 'Is everything working?')}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{t('admin.dashboard.health.subtitle', 'Based on the last day')}</p>
            <ul className="mt-2 divide-y divide-border">
              {health.map((h) => (
                <li key={h.key} className="flex items-center gap-3 py-3">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${healthDot(h.state)}`} aria-hidden />
                  <span className="flex-1 text-sm">{h.label}</span>
                  {h.state === 'off' ? (
                    <Link href="/admin/config/integrations" className="text-sm font-semibold text-muted-foreground hover:underline">
                      {healthWord(h.state)}
                    </Link>
                  ) : (
                    <span className={`text-sm font-semibold ${healthText(h.state)}`}>{healthWord(h.state)}</span>
                  )}
                </li>
              ))}
              <li className="flex items-center gap-3 py-3">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${stats.health.jobsFailed ? 'bg-amber-600' : 'bg-green-600'}`}
                  aria-hidden
                />
                <span className="flex-1 text-sm">{t('admin.dashboard.health.jobs', 'Automatic jobs')}</span>
                {stats.health.jobsFailed ? (
                  <Link href="/admin/crons" className="text-sm font-semibold text-amber-800 hover:underline dark:text-amber-300">
                    {fill(t('admin.dashboard.health.jobsFailed', '{n} failed · see'), { n: stats.health.jobsFailed })}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">{t('admin.dashboard.health.ok', 'Working')}</span>
                )}
              </li>
            </ul>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}

function Kpi({
  label,
  value,
  note,
  plain,
}: {
  label: string;
  value: string;
  note?: { up: boolean; text: string } | null;
  plain?: string;
}) {
  return (
    <div className={card}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl md:text-[1.75rem] font-bold leading-tight [overflow-wrap:anywhere]">{value}</p>
      {note ? (
        <p className={`mt-1 text-sm font-semibold ${note.up ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
          {note.up ? '↑' : '↓'} {note.text}
        </p>
      ) : plain ? (
        <p className="mt-1 text-sm text-muted-foreground">{plain}</p>
      ) : null}
    </div>
  );
}
