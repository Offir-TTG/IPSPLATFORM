'use client';

import { DollarSign, Minus, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { joinedBar, joinedSegment } from '@/components/admin/notifications/kit';
import {
  PaymentModel,
  PaymentPlanConfig as PaymentPlanConfigType,
  PaymentFrequency,
  DepositType,
  SubscriptionInterval,
} from '@/types/product';

interface PaymentPlanConfigProps {
  value: PaymentPlanConfigType;
  onChange: (config: PaymentPlanConfigType) => void;
  paymentModel: PaymentModel;
  productPrice: number;
  currency: string;
  /** The product's first payment date ("YYYY-MM-DD"); the preview dates follow it. */
  startDate?: string;
  /** The wizard's field errors (deposit_type, deposit_percentage, deposit_amount, installments, subscription_interval). */
  errors?: Record<string, string | undefined>;
  t: (key: string, fallback: string) => string;
}

const MAX_INSTALLMENTS = 36;
const MAX_TRIAL_DAYS = 365;

/** The day of payment `i` (0 = the first), the way the payment engine counts them. */
function dueDate(start: Date, i: number, frequency: PaymentFrequency, customDays?: number) {
  const d = new Date(start);
  if (frequency === 'monthly') d.setMonth(d.getMonth() + i);
  else d.setDate(d.getDate() + i * (frequency === 'weekly' ? 7 : frequency === 'biweekly' ? 14 : customDays || 30));
  return d;
}

/**
 * A product's own payment terms: deposit and payments, or a membership.
 * Connected switches instead of dropdowns, − / + for counts, and a preview
 * that draws what the client pays and when.
 */
export function PaymentPlanConfig({ value, onChange, paymentModel, productPrice, currency, startDate, errors = {}, t }: PaymentPlanConfigProps) {
  const config = value || {};
  const update = (patch: Partial<PaymentPlanConfigType>) => onChange({ ...config, ...patch });
  const price = Number(productPrice) || 0;

  const money = (n: number) => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: Math.round(n * 100) % 100 ? 2 : 0 }).format(n);
    } catch {
      return `${currency} ${n.toFixed(2)}`;
    }
  };

  const label = 'text-[15px] font-bold';
  const hint = 'text-[13px] text-muted-foreground';
  const segment = (on: boolean) => `${joinedSegment(on)} min-h-10 !px-4`;
  const errorOf = (...keys: string[]) => {
    const msg = keys.map((k) => errors[k]).find(Boolean);
    return msg ? <p className="text-[13px] font-medium text-red-600 dark:text-red-400">{msg}</p> : null;
  };

  const stepper = (id: string, value: number, min: number, max: number, set: (n: number) => void, aria: string) => (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => set(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={t('products.customPlan.fewer', 'Fewer')}
        className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card hover:bg-muted disabled:opacity-40"
      >
        <Minus className="h-4 w-4" aria-hidden />
      </button>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        aria-label={aria}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          set(Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min);
        }}
        className="h-10 w-16 text-center font-bold"
      />
      <button
        type="button"
        onClick={() => set(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={t('products.customPlan.more', 'More')}
        className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card hover:bg-muted disabled:opacity-40"
      >
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );

  const every = (f: string) =>
    ({
      weekly: t('products.planCards.every.weekly', 'every week'),
      biweekly: t('products.planCards.every.biweekly', 'every two weeks'),
      monthly: t('products.planCards.every.monthly', 'every month'),
      quarterly: t('products.planCards.every.quarterly', 'every three months'),
      annually: t('products.planCards.every.yearly', 'every year'),
      yearly: t('products.planCards.every.yearly', 'every year'),
    })[f] ?? f;

  // ─── Deposit and payments ─────────────────────────────────────────

  const renderDepositPlan = () => {
    // Percentage or a fixed amount: the payment engine has no "no deposit"
    // (it would charge an empty amount), so that choice isn't offered.
    const depositType: DepositType | undefined = config.deposit_type === 'percentage' || config.deposit_type === 'fixed' ? config.deposit_type : undefined;
    const deposit =
      depositType === 'fixed' ? Math.min(price, config.deposit_amount || 0) : depositType === 'percentage' ? (price * (config.deposit_percentage || 0)) / 100 : 0;
    const count = Math.max(1, config.installments || 1);
    const frequency: PaymentFrequency = config.frequency || 'monthly';
    const rest = Math.max(0, price - deposit);
    const each = Math.round((rest / count) * 100) / 100;
    const last = Math.round((rest - each * (count - 1)) * 100) / 100;
    const start = startDate ? new Date(`${startDate}T00:00:00`) : new Date();
    const everyText = frequency === 'custom' ? t('products.customPlan.everyDays', 'every {n} days').replace('{n}', String(config.custom_frequency_days || 30)) : every(frequency);
    const dateText = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'numeric' });
    const shownBars = Math.min(count, 12);

    return (
      <div className="space-y-5 rounded-2xl border border-border bg-card p-4 sm:p-5">
        {/* Deposit */}
        <section className="space-y-2.5">
          <div>
            <div className={label}>{t('products.customPlan.deposit', 'Deposit')}</div>
            <p className={hint}>{t('products.customPlan.depositHint', 'What the client pays when enrolling, before the payments')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className={joinedBar} role="radiogroup" aria-label={t('products.payment_plan.deposit_type', 'Deposit Type')}>
              {(
                [
                  ['percentage', t('products.payment_plan.percentage', 'Percentage')],
                  ['fixed', t('products.payment_plan.fixed_amount', 'Fixed Amount')],
                ] as [DepositType, string][]
              ).map(([type, text]) => (
                <button key={type} type="button" role="radio" aria-checked={depositType === type} onClick={() => update({ deposit_type: type })} className={segment(depositType === type)}>
                  {text}
                </button>
              ))}
            </div>
            {depositType && (
              <div className="flex h-10 items-stretch overflow-hidden rounded-md border border-input bg-card">
                <input
                  id="deposit_value"
                  type="number"
                  min={0}
                  max={depositType === 'percentage' ? 100 : price || undefined}
                  step={depositType === 'percentage' ? 1 : 0.01}
                  value={(depositType === 'percentage' ? config.deposit_percentage : config.deposit_amount) ?? ''}
                  onChange={(e) => {
                    const n = parseFloat(e.target.value) || 0;
                    update(depositType === 'percentage' ? { deposit_percentage: Math.min(100, n) } : { deposit_amount: n });
                  }}
                  aria-label={depositType === 'percentage' ? t('products.payment_plan.deposit_percentage', 'Deposit Percentage (%)') : t('products.payment_plan.deposit_amount', 'Deposit Amount')}
                  className="w-20 bg-transparent px-2 text-center font-bold outline-none"
                />
                <span className="grid place-items-center bg-muted px-2.5 text-sm font-bold text-muted-foreground" dir="ltr">
                  {depositType === 'percentage' ? '%' : currency}
                </span>
              </div>
            )}
            {depositType && price > 0 && (
              <span className={hint}>
                = <b className="text-foreground">{money(deposit)}</b> {t('products.customPlan.atEnroll', 'when enrolling')}
              </span>
            )}
          </div>
          {errorOf('deposit_type', 'deposit_percentage', 'deposit_amount')}
        </section>

        <hr className="border-border" />

        {/* Payments */}
        <section className="space-y-2.5">
          <div>
            <div className={label}>{t('products.customPlan.payments', 'Payments')}</div>
            <p className={hint}>
              {deposit > 0 && price > 0
                ? t('products.customPlan.paymentsHintRest', 'The rest, {amount}, is split into payments').replace('{amount}', money(rest))
                : t('products.customPlan.paymentsHint', 'The price is split into payments')}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
            <div className="space-y-1.5">
              <div className={hint}>{t('products.payment_plan.number_installments', 'Number of Installments')}</div>
              {stepper('installments', count, 1, MAX_INSTALLMENTS, (n) => update({ installments: n }), t('products.payment_plan.number_installments', 'Number of Installments'))}
            </div>
            <div className="space-y-1.5">
              <div className={hint}>{t('products.payment_plan.frequency', 'Payment Frequency')}</div>
              <div className="flex flex-wrap items-center gap-2">
                <div className={joinedBar} role="radiogroup" aria-label={t('products.payment_plan.frequency', 'Payment Frequency')}>
                  {(
                    [
                      ['weekly', t('products.customPlan.week', 'Week')],
                      ['biweekly', t('products.customPlan.twoWeeks', 'Two weeks')],
                      ['monthly', t('products.customPlan.month', 'Month')],
                      ['custom', t('products.payment_plan.custom', 'Custom')],
                    ] as [PaymentFrequency, string][]
                  ).map(([f, text]) => (
                    <button key={f} type="button" role="radio" aria-checked={frequency === f} onClick={() => update({ frequency: f })} className={segment(frequency === f)}>
                      {text}
                    </button>
                  ))}
                </div>
                {frequency === 'custom' && (
                  <label className="flex items-center gap-2 text-sm">
                    <span className={hint}>{t('products.customPlan.everyLabel', 'every')}</span>
                    <Input
                      id="custom_frequency_days"
                      type="number"
                      min={1}
                      value={config.custom_frequency_days || 30}
                      onChange={(e) => update({ custom_frequency_days: parseInt(e.target.value, 10) || 30 })}
                      className="h-10 w-20 text-center font-bold"
                    />
                    <span className={hint}>{t('products.payment_plan.days', 'days')}</span>
                  </label>
                )}
              </div>
            </div>
          </div>
          {errorOf('installments')}
        </section>

        {/* Preview: what the client pays and when */}
        {price > 0 && (
          <div className="space-y-3 rounded-xl bg-primary/5 p-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="text-lg font-extrabold tabular-nums">
                {deposit > 0
                  ? t('products.planCards.depositThen', '{deposit} now + {rest}').replace('{deposit}', money(deposit)).replace('{rest}', `${count} × ${money(each)}`)
                  : `${count} × ${money(each)}`}{' '}
                <span className="text-sm font-medium text-muted-foreground">{everyText}</span>
              </div>
              <span className={hint}>{t('products.customPlan.howClientPays', 'How the client pays')}</span>
            </div>
            <div className="flex items-end gap-1.5 overflow-x-auto pb-1" aria-hidden>
              {deposit > 0 && (
                <div className="flex min-w-[58px] flex-col items-center gap-1">
                  <b className="text-[12.5px] tabular-nums">{money(deposit)}</b>
                  <i className="block h-11 w-full rounded-md bg-green-600 dark:bg-green-500" />
                  <small className="whitespace-nowrap text-[11.5px] text-muted-foreground">{t('products.customPlan.atEnrollShort', 'Enrolling')}</small>
                </div>
              )}
              {Array.from({ length: shownBars }, (_, i) => (
                <div key={i} className="flex min-w-[58px] flex-col items-center gap-1">
                  <b className="text-[12.5px] tabular-nums">{money(i === count - 1 ? last : each)}</b>
                  <i className="block h-7 w-full rounded-md bg-primary/75" />
                  <small className="whitespace-nowrap text-[11.5px] tabular-nums text-muted-foreground">
                    {dateText(dueDate(start, i, frequency, config.custom_frequency_days))}
                  </small>
                </div>
              ))}
              {count > shownBars && <span className="self-center px-1 text-sm font-bold text-muted-foreground">+{count - shownBars}</span>}
            </div>
            <div className="flex justify-between border-t border-dashed border-border pt-2.5 font-bold">
              <span>{t('products.payment_plan.total_collected', 'Total to be Collected')}</span>
              <span className="tabular-nums">{money(price)}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── Membership ───────────────────────────────────────────────────

  const renderSubscription = () => {
    const interval: SubscriptionInterval = config.subscription_interval || 'monthly';
    const trial = config.trial_days || 0;
    return (
      <div className="space-y-5 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <section className="space-y-2.5">
          <div className={label}>{t('products.customPlan.chargeEvery', 'How often to charge')}</div>
          <div className={joinedBar} role="radiogroup" aria-label={t('products.payment_plan.billing_interval', 'Billing Interval')}>
            {(
              [
                ['weekly', t('products.customPlan.week', 'Week')],
                ['monthly', t('products.customPlan.month', 'Month')],
                ['quarterly', t('products.customPlan.quarter', 'Quarter')],
                ['annually', t('products.customPlan.year', 'Year')],
              ] as [SubscriptionInterval, string][]
            ).map(([f, text]) => (
              <button key={f} type="button" role="radio" aria-checked={interval === f} onClick={() => update({ subscription_interval: f })} className={segment(interval === f)}>
                {text}
              </button>
            ))}
          </div>
          {errorOf('subscription_interval')}
        </section>
        <section className="space-y-2.5">
          <div>
            <div className={label}>{t('products.customPlan.trial', 'Free trial')}</div>
            <p className={hint}>{t('products.customPlan.trialHint', 'Days before the first charge. 0 = no trial')}</p>
          </div>
          {stepper('trial_days', trial, 0, MAX_TRIAL_DAYS, (n) => update({ trial_days: n }), t('products.payment_plan.trial_days', 'Trial Period (days)'))}
        </section>
        {price > 0 && (
          <div className="space-y-1.5 rounded-xl bg-primary/5 p-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="text-lg font-extrabold tabular-nums">
                {money(price)}{' '}
                <span className="text-sm font-medium text-muted-foreground">
                  {t('products.planCards.untilCancel', '{frequency}, until cancelled').replace('{frequency}', every(interval))}
                </span>
              </div>
              <span className={hint}>{t('products.customPlan.howClientPays', 'How the client pays')}</span>
            </div>
            <p className="text-sm">
              {trial > 0
                ? t('products.customPlan.trialThen', '{n} days free, then a first charge of {amount}').replace('{n}', String(trial)).replace('{amount}', money(price))
                : t('products.customPlan.chargeNow', 'The first charge, {amount}, is on enrolling').replace('{amount}', money(price))}
            </p>
          </div>
        )}
      </div>
    );
  };

  switch (paymentModel) {
    case 'deposit_then_plan':
      return renderDepositPlan();
    case 'subscription':
      return renderSubscription();
    case 'one_time':
    case 'free':
      return (
        <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3 text-sm">
          <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          {paymentModel === 'free'
            ? t('products.payment_plan.free_desc', 'No payment required. This product is free for all users.')
            : t('products.payment_plan.one_time_desc', 'Customer pays the full amount upfront in a single payment.')}
        </div>
      );
    default:
      return null;
  }
}
