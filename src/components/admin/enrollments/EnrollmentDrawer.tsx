'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AlertCircle, Ban, Check, CheckCircle2, Clock, Copy, Mail, Pencil, RotateCcw, X, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useAdminLanguage } from '@/context/AppContext';
import { productTypeLook } from '@/components/admin/products/ProductDrawer';
import type { ProductType } from '@/types/product';
import { PAYMENT_TONE, STATUS_TONE, type Enrollment, type ScheduleItem } from './types';
import { useEnrollmentFormat } from './useEnrollmentFormat';

const DAY_MS = 24 * 60 * 60 * 1000;
const FIRST_PAYMENTS = 6;

const button =
  'inline-flex min-h-[44px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-3 text-sm font-semibold transition-colors';

/**
 * One enrollment, in the admin template's drawer: who and what, three
 * numbers (paid, payment status, next payment), what to do next, the
 * payment schedule (with "Record payment" by an unpaid payment), the
 * details, and the actions this status allows. The actions open the same
 * dialogs as before; the page owns them.
 */
export function EnrollmentDrawer({
  enrollment,
  refreshKey,
  onClose,
  onSendLink,
  onReset,
  onEdit,
  onCancel,
  onPlanDetails,
  onRecordPayment,
}: {
  enrollment: Enrollment | null;
  /** Changes after an action, so the schedule reloads. */
  refreshKey: number;
  onClose: () => void;
  onSendLink: (e: Enrollment) => void;
  onReset: (e: Enrollment) => void;
  onEdit: (e: Enrollment) => void;
  onCancel: (e: Enrollment) => void;
  onPlanDetails: (e: Enrollment) => void;
  onRecordPayment: (e: Enrollment, schedule: ScheduleItem, label: string) => void;
}) {
  const { t, direction } = useAdminLanguage();
  const f = useEnrollmentFormat();
  const rtl = direction === 'rtl';
  const e = enrollment;

  const [schedule, setSchedule] = useState<ScheduleItem[] | null>(null);
  const [allPayments, setAllPayments] = useState(false);
  const [copied, setCopied] = useState(false);
  // For a membership: the member's price and a scheduled change that will reach them.
  const [membership, setMembership] = useState<{
    amount: number;
    currency: string;
    interval: string;
    upcoming: { amount: number; effective_date: string } | null;
    next_charge_date?: string | null;
    next_charge_amount?: number | null;
    ends_at?: string | null;
  } | null>(null);
  useEffect(() => {
    setMembership(null);
    // Asked for every enrollment: the server answers null when it isn't a membership.
    if (!e?.id) return;
    let alive = true;
    void fetch(`/api/admin/enrollments/${e.id}/subscription-price`)
      .then((r) => r.json())
      .then((j) => alive && setMembership(j.success ? j.data : null))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [e?.id]);

  useEffect(() => {
    if (!e?.id) return;
    let alive = true;
    setSchedule(null);
    setAllPayments(false);
    void (async () => {
      try {
        const res = await fetch(`/api/enrollments/${e.id}/payment`);
        const data = res.ok ? await res.json() : null;
        if (!alive) return;
        const rows: ScheduleItem[] = (data?.schedules ?? []).map((s: any, i: number) => ({
          id: s.id,
          amount: Number(s.amount || 0),
          scheduled_date: s.scheduled_date,
          status: s.payment_status === 'partially_refunded' ? 'partially_refunded' : s.status,
          paid_date: s.paid_date,
          payment_number: s.payment_number ?? i + 1,
          refunded_amount: s.refunded_amount,
        }));
        setSchedule(rows);
      } catch {
        if (alive) setSchedule([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [e?.id, refreshKey]);

  if (!e) return null;

  const tone = STATUS_TONE[e.status] ?? STATUS_TONE.draft;
  const payTone = PAYMENT_TONE[e.payment_status] ?? PAYMENT_TONE.pending;
  const look = productTypeLook((e.product_type || '').toLowerCase() as ProductType);
  const TypeIcon = look.icon;
  const unpaid = (s: ScheduleItem) => s.status === 'pending' || s.status === 'overdue';
  const firstOverdue = schedule?.find((s) => s.status === 'overdue');
  const nextDue = schedule?.find(unpaid);
  const paymentLabel = (s: ScheduleItem) => t('admin.enrollments.drawer.paymentN', 'Payment {n}').replace('{n}', String(s.payment_number ?? ''));
  const overdueDays = firstOverdue ? Math.max(1, Math.floor((Date.now() - new Date(firstOverdue.scheduled_date).getTime()) / DAY_MS)) : 0;

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(e.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success(t('admin.enrollments.idCopied', 'ID copied'));
    } catch {
      // Copying was refused; the ID is still shown.
    }
  };

  // What to do next, in plain words.
  let next: { tone: 'amber' | 'red' | 'violet' | 'grey'; title: string; text: string } | null = null;
  if (e.status === 'draft')
    next = {
      tone: 'amber',
      title: t('admin.enrollments.drawer.nextDraftTitle', 'The enrollment link hasn\'t been sent yet'),
      text: t('admin.enrollments.drawer.nextDraftText', 'Send the link so the parent can complete enrollment and payment.'),
    };
  else if (e.status !== 'cancelled' && (e.payment_status === 'overdue' || firstOverdue))
    next = {
      tone: 'red',
      title: firstOverdue
        ? t('admin.enrollments.drawer.nextOverdueTitle', '{payment} is {n} days late')
            .replace('{payment}', paymentLabel(firstOverdue))
            .replace('{n}', String(overdueDays))
        : t('admin.enrollments.next.overdue', 'Payment overdue'),
      text: t('admin.enrollments.drawer.nextOverdueText', 'If it was paid by transfer or cash, record it next to the payment below.'),
    };
  else if (e.status === 'pending')
    next = {
      tone: 'amber',
      title: t('admin.enrollments.next.waiting', 'Waiting for the parent'),
      text: e.invitation_sent_at
        ? t('admin.enrollments.drawer.nextPendingSent', 'The link was sent {when}. You can send it again if it was missed.').replace('{when}', f.daysAgo(e.invitation_sent_at))
        : t('admin.enrollments.drawer.nextPendingText', 'The parent hasn\'t completed the enrollment yet.'),
    };
  else if (e.status === 'suspended')
    next = { tone: 'violet', title: t('admin.enrollments.next.suspended', 'Enrollment paused'), text: t('admin.enrollments.drawer.nextSuspendedText', 'Access is paused until the payments are settled.') };

  const nextBox = {
    amber: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
    red: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100',
    violet: 'border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-100',
    grey: 'border-border bg-muted text-foreground',
  };

  const shownPayments = schedule ? (allPayments ? schedule : schedule.slice(0, FIRST_PAYMENTS)) : [];

  // A membership (subscription): its kind, and the next charge when it isn't a row yet.
  const yearly = membership?.interval === 'annually';
  const membershipKind = yearly
    ? t('admin.enrollments.drawer.membershipYearly', 'Yearly membership')
    : t('admin.enrollments.drawer.membershipMonthly', 'Monthly membership');
  const perPeriod = yearly ? t('admin.priceChange.perYear', 'per year') : t('admin.priceChange.perMonth', 'per month');
  const upcomingCharge =
    membership?.next_charge_date && schedule && !schedule.some(unpaid) && e.status !== 'cancelled'
      ? {
          date: membership.next_charge_date,
          amount: Number(membership.next_charge_amount ?? membership.amount),
          number: Math.max(0, ...schedule.map((s) => Number(s.payment_number) || 0)) + 1,
        }
      : null;
  const canSend = e.status !== 'cancelled';
  const canReset = e.status === 'pending' || e.status === 'active';
  const canEdit = e.status === 'draft';
  const canCancel = e.status !== 'cancelled';

  return (
    <Sheet open={!!e} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side={rtl ? 'left' : 'right'}
        dir={direction}
        className="flex w-full flex-col gap-0 border-0 p-0 shadow-2xl outline-none focus:outline-none focus-visible:outline-none dark:[color-scheme:dark] sm:max-w-[540px] [&>button.absolute]:hidden"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close', 'Close')}
          className="absolute end-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Pinned top: who, what, and the three numbers that matter */}
        <header className="shrink-0 border-b border-border bg-primary/[0.04] px-6 pb-5 pt-6">
          <p className={`inline-flex items-center gap-2 pe-10 text-[13.5px] font-semibold ${tone.text}`}>
            <span className={`h-2 w-2 rounded-full ${tone.dot}`} aria-hidden />
            {f.statusLabel(e.status)} ·{' '}
            {e.enrollment_type === 'admin_assigned'
              ? t('admin.enrollments.type.adminAssigned', 'Assigned by an admin')
              : t('admin.enrollments.type.selfEnrolled', 'Self-enrolled')}
            {membership && <> · {membershipKind}</>}
          </p>
          <SheetTitle className="mt-1.5 pe-10 text-[23px] font-extrabold leading-tight tracking-tight [font-family:inherit] [overflow-wrap:anywhere]">
            <bdi>{e.user_name}</bdi>
          </SheetTitle>
          <SheetDescription asChild>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className={`grid h-5 w-5 place-items-center rounded ${look.tile}`} aria-hidden>
                  <TypeIcon className="h-3 w-3" />
                </span>
                <bdi>{e.product_name}</bdi>
              </span>
              <a href={`mailto:${e.user_email}`} dir="ltr" className="hover:text-primary hover:underline">
                {e.user_email}
              </a>
              <button
                type="button"
                onClick={copyId}
                title={t('admin.enrollments.copyId', 'Copy ID')}
                className="inline-flex items-center gap-1 rounded-md px-1 font-mono text-xs hover:bg-muted"
              >
                #{e.id.substring(0, 8)}
                {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5 text-primary" />}
              </button>
            </div>
          </SheetDescription>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat
              label={t('admin.enrollments.drawer.paid', 'Paid')}
              value={f.money(e.paid_amount, e.currency)}
              sub={membership ? `${f.money(membership.amount, membership.currency)} ${perPeriod}` : `/ ${f.money(e.total_amount, e.currency)}`}
            />
            <Stat
              label={t('admin.enrollments.paymentStatus', 'Payment status')}
              value={f.paymentLabel(e.payment_status)}
              className={payTone.text}
              warn={e.payment_status === 'overdue'}
            />
            <Stat
              label={t('admin.enrollments.drawer.nextPayment', 'Next payment')}
              value={
                e.status === 'cancelled' || e.status === 'completed'
                  ? '—'
                  : membership
                    ? membership.next_charge_date
                      ? f.date(membership.next_charge_date)
                      : membership.ends_at
                        ? t('admin.enrollments.drawer.endsOn', 'Ends {date}').replace('{date}', f.date(membership.ends_at))
                        : '—'
                  : nextDue
                    ? f.date(nextDue.scheduled_date)
                    : e.next_payment_date
                      ? f.date(e.next_payment_date)
                      : '—'
              }
              small
            />
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-6 py-5">
          {next && (
            <div className={`flex items-start gap-3 rounded-[14px] border px-3.5 py-3 ${nextBox[next.tone]}`}>
              <AlertCircle className="mt-0.5 h-[18px] w-[18px] shrink-0" aria-hidden />
              <div className="min-w-0">
                <p className="m-0 font-bold">{next.title}</p>
                <p className="m-0 mt-0.5 text-sm opacity-90">{next.text}</p>
              </div>
            </div>
          )}

          {/* Payments */}
          <Section
            title={t('admin.enrollments.drawer.payments', 'Payments')}
            aside={
              <button type="button" onClick={() => onPlanDetails(e)} className="text-[13px] font-semibold text-primary hover:underline">
                {t('admin.enrollments.drawer.planDetails', 'All plan details')}
              </button>
            }
          >
            <dl className="m-0 border-b border-border px-3.5 text-sm">
              <Row label={t('admin.enrollments.table.paymentPlan', 'Payment plan')}>{f.planName(e)}</Row>
              {membership && (
                <Row label={t('admin.enrollments.drawer.memberPrice', 'Membership price')}>
                  <span>
                    {f.money(membership.amount, membership.currency)}{' '}
                    <span className="text-muted-foreground">
                      {membership.interval === 'annually' ? t('admin.priceChange.perYear', 'per year') : t('admin.priceChange.perMonth', 'per month')}
                    </span>
                    {membership.upcoming && (
                      <span className="mt-1 block rounded-md bg-amber-50 px-2 py-1 text-[12.5px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                        {t('admin.enrollments.drawer.upcomingPrice', 'From the charge on or after {date}: {price}')
                          .replace('{date}', f.date(membership.upcoming.effective_date))
                          .replace('{price}', f.money(membership.upcoming.amount, membership.currency))}
                      </span>
                    )}
                  </span>
                </Row>
              )}
            </dl>
            {schedule === null ? (
              <div className="space-y-2 p-3.5" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-5 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : schedule.length === 0 ? (
              <p className="m-0 p-3.5 text-sm text-muted-foreground">{t('admin.enrollments.drawer.noSchedule', 'No payment schedule for this enrollment.')}</p>
            ) : (
              <ul className="m-0 list-none px-3.5 text-sm">
                {shownPayments.map((s) => {
                  const paid = s.status === 'paid';
                  const late = s.status === 'overdue';
                  const Icon = paid ? CheckCircle2 : late ? XCircle : Clock;
                  return (
                    <li key={s.id} className="grid grid-cols-[22px_minmax(0,1fr)_auto_auto] items-center gap-2.5 border-b border-border/70 py-2.5 last:border-b-0">
                      <Icon
                        className={`h-[18px] w-[18px] ${paid ? 'text-green-600' : late ? 'text-red-600' : 'text-muted-foreground'}`}
                        aria-hidden
                      />
                      <span className="min-w-0 truncate">
                        {paymentLabel(s)} · {f.date(s.scheduled_date)}
                      </span>
                      <b className="tabular-nums">{f.money(s.amount, e.currency)}</b>
                      {unpaid(s) && e.status !== 'cancelled' ? (
                        <button
                          type="button"
                          onClick={() => onRecordPayment(e, s, `${paymentLabel(s)} · ${f.money(s.amount, e.currency)}`)}
                          className="text-[13px] font-semibold text-primary hover:underline"
                        >
                          {t('admin.enrollments.drawer.recordPayment', 'Record payment')}
                        </button>
                      ) : (
                        <span
                          className={`text-[13px] font-semibold ${
                            paid ? 'text-green-700 dark:text-green-400' : s.status.includes('refund') ? 'text-violet-700 dark:text-violet-300' : 'text-muted-foreground'
                          }`}
                        >
                          {t(`admin.enrollments.paymentPlanDetails.status.${s.status}`, s.status)}
                        </span>
                      )}
                    </li>
                  );
                })}
                {/* A membership's next period isn't a row yet: show when it will be charged. */}
                {upcomingCharge && (
                  <li className="grid grid-cols-[22px_minmax(0,1fr)_auto_auto] items-center gap-2.5 border-b border-border/70 py-2.5 text-muted-foreground last:border-b-0">
                    <Clock className="h-[18px] w-[18px]" aria-hidden />
                    <span className="min-w-0 truncate">
                      {t('admin.enrollments.drawer.paymentN', 'Payment {n}').replace('{n}', String(upcomingCharge.number))} · {f.date(upcomingCharge.date)}
                    </span>
                    <b className="tabular-nums text-foreground">{f.money(upcomingCharge.amount, membership!.currency)}</b>
                    <span className="text-[13px] font-semibold">{t('admin.enrollments.drawer.scheduled', 'Scheduled')}</span>
                  </li>
                )}
                {schedule.length > FIRST_PAYMENTS && (
                  <li className="py-1.5">
                    <button type="button" onClick={() => setAllPayments((v) => !v)} className="min-h-9 text-sm font-semibold text-primary hover:underline">
                      {allPayments
                        ? t('admin.notifications.drawer.showFewer', 'Show fewer')
                        : t('admin.enrollments.drawer.morePayments', '{n} more payments').replace('{n}', String(schedule.length - FIRST_PAYMENTS))}
                    </button>
                  </li>
                )}
              </ul>
            )}
          </Section>

          {/* Details */}
          <Section title={t('admin.notifications.drawer.details', 'Details')}>
            <dl className="m-0 divide-y divide-border px-3.5 text-sm">
              <Row label={t('admin.enrollments.table.product', 'Product')}>
                {e.product_name} · {f.productType(e.product_type)}
              </Row>
              <Row label={e.enrolled_at ? t('admin.enrollments.table.enrolledAt', 'Enrolled') : t('admin.enrollments.table.draftCreated', 'Draft created')}>
                {f.date(e.enrolled_at || e.created_at)}
              </Row>
              {e.payment_start_date && <Row label={t('admin.enrollments.drawer.paymentStart', 'Payments start')}>{f.date(e.payment_start_date)}</Row>}
              <Row label={t('admin.enrollments.drawer.link', 'Enrollment link')}>
                {e.invitation_sent_at ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden />
                    {t('admin.enrollments.drawer.sentOn', 'Sent {date}').replace('{date}', f.date(e.invitation_sent_at))}
                  </span>
                ) : (
                  t('admin.enrollments.drawer.notSent', 'Not sent yet')
                )}
              </Row>
              {e.expires_at && <Row label={t('admin.enrollments.drawer.expires', 'Link valid until')}>{f.date(e.expires_at)}</Row>}
            </dl>
          </Section>
        </div>

        {/* Pinned bottom: what this status allows */}
        {(canSend || canReset || canEdit || canCancel) && (
          <footer className="grid shrink-0 gap-2 border-t border-border bg-card px-6 py-4">
            <div className="grid grid-cols-2 gap-2">
              {canSend && (
                <button
                  type="button"
                  onClick={() => onSendLink(e)}
                  className={`${button} ${
                    e.status === 'draft' || e.status === 'pending'
                      ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border-border bg-card text-primary hover:bg-muted'
                  } ${!canReset && !canEdit ? 'col-span-2' : ''}`}
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  {e.invitation_sent_at ? t('admin.enrollments.drawer.sendAgain', 'Send link again') : t('admin.enrollments.sendLink', 'Send link')}
                </button>
              )}
              {canEdit && (
                <button type="button" onClick={() => onEdit(e)} className={`${button} border-border bg-card text-primary hover:bg-muted`}>
                  <Pencil className="h-4 w-4" aria-hidden />
                  {t('admin.enrollments.edit', 'Edit')}
                </button>
              )}
              {canReset && (
                <button type="button" onClick={() => onReset(e)} className={`${button} border-border bg-card text-primary hover:bg-muted`}>
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  {t('admin.enrollments.reset', 'Reset enrollment wizard')}
                </button>
              )}
            </div>
            {canCancel && (
              <button
                type="button"
                onClick={() => onCancel(e)}
                className={`${button} border-red-200 bg-card text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40`}
              >
                <Ban className="h-4 w-4" aria-hidden />
                {t('admin.enrollments.drawer.cancel', 'Cancel enrollment')}
              </button>
            )}
          </footer>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value, sub, small, warn, className = '' }: { label: string; value: string; sub?: string; small?: boolean; warn?: boolean; className?: string }) {
  return (
    <div className={`min-w-0 rounded-xl border bg-card px-3 py-2.5 ${warn ? 'border-red-200 dark:border-red-900' : 'border-border'}`}>
      <div className="truncate text-[12.5px] text-muted-foreground">{label}</div>
      <div className={`truncate font-extrabold tabular-nums ${small ? 'text-base' : 'text-lg'} ${className}`} title={value}>
        {value}
      </div>
      {sub && <div className="truncate text-xs font-semibold text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[14px] border border-border">
      <h3 className="flex items-center justify-between gap-3 bg-primary/[0.06] px-3.5 py-2.5 text-sm font-bold text-primary [font-family:inherit]">
        {title}
        {aside}
      </h3>
      {children}
    </section>
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
