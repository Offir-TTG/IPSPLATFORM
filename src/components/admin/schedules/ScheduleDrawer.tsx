'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowUpDown, Calendar, Check, CheckCircle2, Clock, Copy, CreditCard, DollarSign, Loader2, RotateCcw, Undo2, X, XCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useAdminLanguage } from '@/context/AppContext';
import { SCHEDULE_TONE, type PaymentSchedule } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;
const button =
  'inline-flex min-h-[44px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-3 text-sm font-semibold transition-colors';

/**
 * One payment, in the admin template's drawer: who and what, three numbers
 * (amount, due date, status), why it failed (when it did), its details,
 * every payment of the same enrollment, and the actions its status allows.
 * The actions open the same dialogs as before; the page owns them.
 */
export function ScheduleDrawer({
  schedule,
  refreshKey,
  onClose,
  onChargeNow,
  onRetry,
  onChangeCard,
  onAdjust,
  onRestructure,
  onRecordManual,
  onRefund,
}: {
  schedule: PaymentSchedule | null;
  /** Changes after an action, so the enrollment's payments reload. */
  refreshKey: number;
  onClose: () => void;
  onChargeNow: (s: PaymentSchedule) => void;
  onRetry: (s: PaymentSchedule) => void;
  onChangeCard: (s: PaymentSchedule) => void;
  onAdjust: (s: PaymentSchedule) => void;
  /** Gets every payment of the enrollment, so the plan is worked out from all of them. */
  onRestructure: (enrollmentId: string, all: PaymentSchedule[]) => void;
  onRecordManual: (s: PaymentSchedule) => void;
  /** A paid payment can be refunded straight from here. */
  onRefund: (s: PaymentSchedule) => void;
}) {
  const { t, direction, language } = useAdminLanguage();
  const rtl = direction === 'rtl';
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  const s = schedule;
  const [siblings, setSiblings] = useState<PaymentSchedule[] | null>(null);

  // Every payment of the same enrollment.
  useEffect(() => {
    if (!s?.enrollment_id) return;
    let alive = true;
    setSiblings(null);
    void (async () => {
      try {
        const res = await fetch(`/api/admin/payments/schedules?enrollment_id=${encodeURIComponent(s.enrollment_id)}&limit=200&_t=${Date.now()}`, {
          cache: 'no-store',
        });
        const data = res.ok ? await res.json() : null;
        if (alive) setSiblings(((data?.schedules ?? []) as PaymentSchedule[]).sort((a, b) => (a.payment_number ?? 0) - (b.payment_number ?? 0)));
      } catch {
        if (alive) setSiblings([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [s?.enrollment_id, refreshKey]);

  if (!s) return null;

  const money = (amount: number) => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: s.currency || 'USD' }).format(amount || 0);
    } catch {
      return `${amount}`;
    }
  };
  const date = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';
  const dayOnly = (iso?: string | null) => (iso ? iso.split('T')[0] : '');
  const statusLabel = (st: string) => t(`common.${st}`, st);
  const typeLabel = (type: string) => t(`admin.payments.schedules.paymentType.${type}`, type);
  const tone = SCHEDULE_TONE[s.status] ?? SCHEDULE_TONE.pending;
  const moved = dayOnly(s.original_due_date) && dayOnly(s.original_due_date) !== dayOnly(s.scheduled_date);
  const paidDiff = s.paid_date ? Math.round((new Date(dayOnly(s.paid_date)).getTime() - new Date(dayOnly(s.scheduled_date)).getTime()) / DAY_MS) : null;
  const overdueDays = s.status === 'overdue' ? Math.max(1, Math.floor((Date.now() - new Date(s.scheduled_date).getTime()) / DAY_MS)) : 0;

  const chargeable = s.status === 'pending' || s.status === 'overdue' || s.status === 'adjusted';
  const failed = s.status === 'failed';
  const paid = s.status === 'paid';

  let next: { tone: 'red' | 'amber' | 'blue'; title: string; text: string } | null = null;
  if (failed)
    next = {
      tone: 'red',
      title: s.last_error || t('admin.payments.schedules.drawer.failedTitle', 'The charge did not go through'),
      text: [
        s.retry_count ? t('admin.payments.schedules.drawer.attempts', 'Attempts so far: {n}.').replace('{n}', String(s.retry_count)) : '',
        s.next_retry_date ? t('admin.payments.schedules.drawer.nextRetry', 'Next automatic try: {date}.').replace('{date}', date(s.next_retry_date)) : '',
        t('admin.payments.schedules.drawer.failedText', 'You can try again now, change the card, or record a payment made another way.'),
      ]
        .filter(Boolean)
        .join(' '),
    };
  else if (s.status === 'overdue')
    next = {
      tone: 'red',
      title: t('admin.payments.schedules.drawer.overdueTitle', '{n} days late').replace('{n}', String(overdueDays)),
      text: t('admin.payments.schedules.drawer.overdueText', 'Charge now, move the date, or record a payment made by transfer or cash.'),
    };
  else if (s.status === 'processing')
    next = { tone: 'blue', title: t('admin.payments.schedules.processingPayment', 'Payment is being processed...'), text: t('admin.payments.schedules.drawer.processingText', 'This updates by itself in a few seconds.') };

  const nextBox = {
    red: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100',
    amber: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
    blue: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100',
  };

  return (
    <Sheet open={!!s} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side={rtl ? 'left' : 'right'}
        dir={direction}
        className="flex w-full flex-col gap-0 border-0 p-0 shadow-2xl outline-none focus:outline-none focus-visible:outline-none dark:[color-scheme:dark] sm:max-w-[540px] [&>[data-default-close]]:hidden"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close', 'Close')}
          className="absolute end-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>

        <header className="shrink-0 border-b border-border bg-primary/[0.04] px-6 pb-5 pt-6">
          <p className={`inline-flex items-center gap-2 pe-10 text-[13.5px] font-semibold ${tone.text}`}>
            <span className={`h-2 w-2 rounded-full ${tone.dot}`} aria-hidden />
            {statusLabel(s.status)} · {typeLabel(s.payment_type)}
          </p>
          <SheetTitle className="mt-1.5 pe-10 text-[23px] font-extrabold leading-tight tracking-tight [font-family:inherit] [overflow-wrap:anywhere]">
            <bdi>{s.user_name}</bdi> · {t('admin.payments.schedules.drawer.paymentN', 'Payment {n}').replace('{n}', String(s.payment_number))}
          </SheetTitle>
          <SheetDescription asChild>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <bdi>{s.product_name}</bdi>
              {s.user_email && (
                <a href={`mailto:${s.user_email}`} dir="ltr" className="hover:text-primary hover:underline">
                  {s.user_email}
                </a>
              )}
            </div>
          </SheetDescription>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label={t('common.amount', 'Amount')} value={money(Number(s.amount))} />
            <Stat label={t('admin.payments.schedules.drawer.due', 'Due')} value={date(s.scheduled_date)} small />
            <Stat label={t('common.status', 'Status')} value={statusLabel(s.status)} small className={tone.text} warn={failed || s.status === 'overdue'} />
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-6 py-5">
          {next && (
            <div className={`flex items-start gap-3 rounded-[14px] border px-3.5 py-3 ${nextBox[next.tone]}`}>
              {next.tone === 'blue' ? <Loader2 className="mt-0.5 h-[18px] w-[18px] shrink-0 animate-spin" aria-hidden /> : <AlertCircle className="mt-0.5 h-[18px] w-[18px] shrink-0" aria-hidden />}
              <div className="min-w-0">
                <p className="m-0 font-bold [overflow-wrap:anywhere]">{next.title}</p>
                <p className="m-0 mt-0.5 text-sm opacity-90">{next.text}</p>
              </div>
            </div>
          )}

          {paid && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-primary/30 bg-primary/5 px-3.5 py-3 text-sm">
              <span>
                {t('admin.payments.schedules.drawer.paidOn', 'Paid on {date}').replace('{date}', date(s.paid_date))}
              </span>
              <Link href={`/admin/payments/transactions?payment=${encodeURIComponent(s.id)}`} className="font-bold text-primary hover:underline">
                {t('admin.payments.schedules.drawer.toTransaction', 'Open the payment in Done')}
              </Link>
            </div>
          )}

          <Section title={t('admin.payments.schedules.drawer.details', 'Payment details')}>
            <dl className="m-0 divide-y divide-border px-3.5 text-sm">
              <Row label={t('admin.payments.schedules.type', 'Type')}>{typeLabel(s.payment_type)}</Row>
              {moved && <Row label={t('admin.payments.schedules.drawer.originalDate', 'Original date')}>{date(s.original_due_date)}</Row>}
              <Row label={t('admin.payments.schedules.drawer.paid', 'Paid')}>
                {s.paid_date ? (
                  <span>
                    {date(s.paid_date)}
                    {paidDiff !== null && paidDiff !== 0 && (
                      <span className={`ms-1.5 text-[13px] ${paidDiff > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-400'}`}>
                        (
                        {paidDiff > 0
                          ? t('admin.payments.schedules.drawer.paidLate', '{n} days late').replace('{n}', String(paidDiff))
                          : t('admin.payments.schedules.drawer.paidEarly', '{n} days early').replace('{n}', String(-paidDiff))}
                        )
                      </span>
                    )}
                  </span>
                ) : (
                  t('admin.payments.schedules.drawer.notYet', 'Not yet')
                )}
              </Row>
              {s.stripe_payment_intent_id && (
                <Row label={t('admin.payments.schedules.drawer.stripePayment', 'Stripe payment ID')}>
                  <StripeId value={s.stripe_payment_intent_id} />
                </Row>
              )}
              {s.stripe_invoice_id && (
                <Row label={t('admin.payments.schedules.drawer.stripeInvoice', 'Stripe invoice ID')}>
                  <StripeId value={s.stripe_invoice_id} />
                </Row>
              )}
            </dl>
          </Section>

          <Section title={t('admin.payments.schedules.drawer.allPayments', 'All payments of this enrollment')}>
            {siblings === null ? (
              <div className="space-y-2 p-3.5" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-5 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : (
              <ul className="m-0 list-none px-3.5 text-sm">
                {siblings.map((p) => {
                  const ptone = SCHEDULE_TONE[p.status] ?? SCHEDULE_TONE.pending;
                  const Icon = p.status === 'paid' ? CheckCircle2 : p.status === 'failed' || p.status === 'overdue' ? XCircle : Clock;
                  return (
                    <li
                      key={p.id}
                      className={`grid grid-cols-[22px_minmax(0,1fr)_auto_auto] items-center gap-2.5 border-b border-border/70 py-2.5 last:border-b-0 ${
                        p.id === s.id ? '-mx-3.5 bg-primary/10 px-3.5' : ''
                      }`}
                    >
                      <Icon className={`h-[18px] w-[18px] ${ptone.text}`} aria-hidden />
                      <span className="min-w-0 truncate">
                        {t('admin.payments.schedules.drawer.paymentN', 'Payment {n}').replace('{n}', String(p.payment_number))} · {date(p.scheduled_date)}
                      </span>
                      <b className="tabular-nums">{money(Number(p.amount))}</b>
                      <span className={`text-[13px] font-semibold ${ptone.text}`}>{statusLabel(p.status)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        </div>

        {paid && (
          <footer className="shrink-0 border-t border-border bg-card px-6 py-4">
            <button
              type="button"
              onClick={() => onRefund(s)}
              className={`${button} border-red-200 bg-card text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40`}
            >
              <Undo2 className="h-4 w-4" aria-hidden />
              {t('admin.payments.schedules.drawer.refund', 'Refund this payment')}
            </button>
          </footer>
        )}
        {(chargeable || failed) && (
          <footer className="grid shrink-0 grid-cols-2 gap-2 border-t border-border bg-card px-6 py-4">
            {chargeable && (
              <button type="button" onClick={() => onChargeNow(s)} className={`${button} border-primary bg-primary text-primary-foreground hover:bg-primary/90`}>
                <DollarSign className="h-4 w-4" aria-hidden />
                {t('admin.payments.schedules.chargeNow', 'Charge Now')}
              </button>
            )}
            {failed && (
              <button type="button" onClick={() => onRetry(s)} className={`${button} border-primary bg-primary text-primary-foreground hover:bg-primary/90`}>
                <RotateCcw className="h-4 w-4" aria-hidden />
                {t('admin.payments.schedules.retryPayment', 'Retry Payment')}
              </button>
            )}
            <button type="button" onClick={() => onChangeCard(s)} className={`${button} border-border bg-card text-primary hover:bg-muted`}>
              <CreditCard className="h-4 w-4" aria-hidden />
              {t('admin.payments.schedules.changeCard', 'Change Card')}
            </button>
            {chargeable && (
              <button type="button" onClick={() => onAdjust(s)} className={`${button} border-border bg-card text-primary hover:bg-muted`}>
                <Calendar className="h-4 w-4" aria-hidden />
                {t('admin.payments.schedules.adjustDate', 'Adjust Date')}
              </button>
            )}
            <button
              type="button"
              onClick={() => onRecordManual(s)}
              className={`${button} border-border bg-card text-primary hover:bg-muted ${failed ? 'col-span-2' : ''}`}
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {t('admin.payments.schedules.recordManual', 'Record manual payment')}
            </button>
            {chargeable && siblings && siblings.length > 0 && (
              <button
                type="button"
                onClick={() => onRestructure(s.enrollment_id, siblings)}
                className={`${button} col-span-2 border-border bg-card text-primary hover:bg-muted`}
              >
                <ArrowUpDown className="h-4 w-4" aria-hidden />
                {t('admin.payments.schedules.restructurePlan', 'Restructure Plan')}
              </button>
            )}
          </footer>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value, small, warn, className = '' }: { label: string; value: string; small?: boolean; warn?: boolean; className?: string }) {
  return (
    <div className={`min-w-0 rounded-xl border bg-card px-3 py-2.5 ${warn ? 'border-red-200 dark:border-red-900' : 'border-border'}`}>
      <div className="truncate text-[12.5px] text-muted-foreground">{label}</div>
      <div className={`truncate font-extrabold tabular-nums ${small ? 'text-base' : 'text-lg'} ${className}`} title={value}>
        {value}
      </div>
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

/** A Stripe id, left to right, with a button that copies it (to search in Stripe). */
function StripeId({ value }: { value: string }) {
  const { t } = useAdminLanguage();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: the id is still on screen to select */
    }
  };
  const label = copied ? t('admin.payments.schedules.drawer.copied', 'Copied') : t('admin.payments.schedules.drawer.copy', 'Copy');
  return (
    <span className="inline-flex max-w-full items-center gap-1.5">
      <bdi dir="ltr" className="select-all font-mono text-[13px] [overflow-wrap:anywhere]">{value}</bdi>
      <button
        type="button"
        onClick={copy}
        title={label}
        aria-label={label}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-600" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      </button>
    </span>
  );
}
