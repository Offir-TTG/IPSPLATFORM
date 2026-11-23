'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Info, Loader2, Star } from 'lucide-react';
import { TypePicture } from '@/components/admin/plans/TypePicture';
import { PLAN_TONE, usePlanFormat, type PaymentPlan, type PlanType } from '@/components/admin/plans/planFormat';
import { joinedBar, joinedSegment } from '@/components/admin/notifications/kit';

interface PaymentPlanSelectorProps {
  /** The main plan: shown first to the client. Always one of the chosen plans. */
  defaultPlanId?: string;
  onDefaultPlanIdChange: (planId: string | undefined) => void;
  /** Every plan the client can choose from, the main plan first. */
  alternativePlanIds?: string[];
  onAlternativePlanIdsChange: (planIds: string[]) => void;
  /** The product price, to show what the client pays in each plan. */
  productPrice?: number;
  currency: string;
  /** Shown under the list when no plan is chosen and Continue was pressed. */
  error?: string;
  t: (key: string, fallback: string) => string;
}

/** Type filters, shown only when there are more than this many plans. */
const FILTER_FROM = 5;
type Filter = 'all' | 'payments' | 'subscription' | 'per_session';
const inFilter = (type: string, f: Filter) =>
  f === 'all' || (f === 'payments' ? ['one_time', 'deposit', 'installments'].includes(type) : type === f);

/**
 * The product's existing payment plans as cards. Each card shows the plan's
 * kind and what the client pays at this product's price. Several can be
 * ticked (the client picks one at checkout); one of them is the main plan,
 * shown first.
 */
export function PaymentPlanSelector({
  defaultPlanId,
  onDefaultPlanIdChange,
  alternativePlanIds = [],
  onAlternativePlanIdsChange,
  productPrice,
  currency,
  error: chooseError,
  t,
}: PaymentPlanSelectorProps) {
  const { typeLabel, frequency, details } = usePlanFormat();
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const res = await fetch('/api/admin/payments/plans');
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (live) setPlans(Array.isArray(data) ? data : []);
      } catch {
        if (live) setLoadFailed(true);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const active = useMemo(() => plans.filter((p) => p.is_active || alternativePlanIds.includes(p.id)), [plans, alternativePlanIds]);
  const shown = active.filter((p) => inFilter(p.plan_type, filter));
  const main = defaultPlanId && alternativePlanIds.includes(defaultPlanId) ? defaultPlanId : alternativePlanIds[0];

  const money = (n: number) => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
    } catch {
      return n.toLocaleString();
    }
  };

  /** "every month": clearer than the adjective, which in Hebrew can read as "two months". */
  const every = (freq?: string) => {
    const f = (freq || '').toLowerCase();
    const known: Record<string, string> = {
      daily: t('products.planCards.every.daily', 'every day'),
      weekly: t('products.planCards.every.weekly', 'every week'),
      biweekly: t('products.planCards.every.biweekly', 'every two weeks'),
      monthly: t('products.planCards.every.monthly', 'every month'),
      quarterly: t('products.planCards.every.quarterly', 'every three months'),
      yearly: t('products.planCards.every.yearly', 'every year'),
      annually: t('products.planCards.every.yearly', 'every year'),
    };
    return known[f] ?? frequency(freq);
  };

  /** What the client pays in this plan, at the product price: [main part, quieter part]. */
  const pays = (p: PaymentPlan): [string, string] => {
    const price = Number(productPrice) || 0;
    const freq = every(p.installment_frequency);
    switch (p.plan_type) {
      case 'subscription': {
        const each = Number(p.subscription_amount) || price;
        if (!each) return [details(p), ''];
        return [money(each), t('products.planCards.untilCancel', '{frequency}, until cancelled').replace('{frequency}', every(p.subscription_frequency))];
      }
      case 'per_session': {
        const each = Number(p.session_amount) || price;
        if (!each) return [details(p), ''];
        return [money(each), t('products.planCards.afterSession', 'after each session held')];
      }
      case 'deposit': {
        const count = Number(p.installment_count) || 0;
        if (!price || !count) return [details(p), ''];
        const dep = p.deposit_type === 'fixed' ? Number(p.deposit_amount) || 0 : (price * (Number(p.deposit_percentage) || 0)) / 100;
        const each = Math.max(0, price - dep) / count;
        const rest = `${count} × ${money(Math.round(each * 100) / 100)}`;
        return dep > 0
          ? [t('products.planCards.depositThen', '{deposit} now + {rest}').replace('{deposit}', money(dep)).replace('{rest}', rest), freq]
          : [t('products.planCards.noDeposit', 'No deposit · {rest}').replace('{rest}', rest), freq];
      }
      case 'installments': {
        const count = Number(p.installment_count) || 0;
        if (!price || !count) return [details(p), ''];
        return [`${count} × ${money(Math.round((price / count) * 100) / 100)}`, freq];
      }
      default:
        return price ? [money(price), t('products.planCards.once', 'once')] : [details(p), ''];
    }
  };

  const toggle = (id: string) => {
    if (alternativePlanIds.includes(id)) {
      const rest = alternativePlanIds.filter((x) => x !== id);
      onAlternativePlanIdsChange(rest);
      if (main === id) onDefaultPlanIdChange(rest[0]);
    } else {
      const next = [...alternativePlanIds, id];
      onAlternativePlanIdsChange(next);
      if (!main) onDefaultPlanIdChange(id);
    }
  };
  // The main plan goes first in the list, which is the order clients see.
  const makeMain = (id: string) => {
    onDefaultPlanIdChange(id);
    onAlternativePlanIdsChange([id, ...alternativePlanIds.filter((x) => x !== id)]);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
      </div>
    );
  }
  if (loadFailed || active.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span>
          {loadFailed
            ? t('products.planCards.loadFailed', 'The payment plans could not be loaded. Refresh the page.')
            : t('products.payment_plans.no_plans_available', 'No payment plans available. Create plans first.')}{' '}
          {!loadFailed && (
            <Link href="/admin/payments/plans" className="font-semibold text-primary hover:underline">
              {t('products.planCards.managePlans', 'Payment plans')}
            </Link>
          )}
        </span>
      </div>
    );
  }

  const counts: Record<Filter, number> = {
    all: active.length,
    payments: active.filter((p) => inFilter(p.plan_type, 'payments')).length,
    subscription: active.filter((p) => p.plan_type === 'subscription').length,
    per_session: active.filter((p) => p.plan_type === 'per_session').length,
  };
  const filters: [Filter, string][] = (
    [
      ['all', t('products.planCards.filterAll', 'All')],
      ['payments', t('products.planCards.filterPayments', 'Payments')],
      ['subscription', t('admin.payments.plans.types.subscription', 'Subscription')],
      ['per_session', t('admin.payments.plans.types.perSession', 'Per session')],
    ] as [Filter, string][]
  ).filter(([f]) => f === 'all' || counts[f] > 0);
  const mainPlan = active.find((p) => p.id === main);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[15px] font-bold" suppressHydrationWarning>
            {t('products.planCards.title', 'Which plans can the client choose?')} *
          </div>
          <p className="text-[13px] text-muted-foreground" suppressHydrationWarning>
            {t('products.planCards.subtitle', 'Tick one or more. The client picks one when paying.')}
          </p>
        </div>
        {active.length > FILTER_FROM && (
          <div className={joinedBar} role="group" aria-label={t('products.planCards.filterLabel', 'Plan type')}>
            {filters.map(([f, label]) => (
              <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={`${joinedSegment(filter === f)} !text-[13px]`}>
                {label}
                <span className="opacity-70">{counts[f]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {shown.map((p) => {
          const on = alternativePlanIds.includes(p.id);
          const isMain = on && p.id === main;
          const tone = PLAN_TONE[p.plan_type];
          const [big, quiet] = pays(p);
          return (
            <div
              key={p.id}
              className={`relative rounded-[14px] border p-4 transition-colors ${
                on ? 'border-primary bg-primary/5 shadow-[inset_0_0_0_1px_hsl(var(--primary))]' : 'border-border hover:border-primary/40'
              }`}
            >
              <button type="button" role="checkbox" aria-checked={on} onClick={() => toggle(p.id)} className="flex w-full items-center gap-4 text-start">
                <span className={`grid h-14 w-[76px] shrink-0 place-items-center rounded-xl ${tone?.tile ?? 'bg-muted text-muted-foreground'}`}>
                  <TypePicture type={p.plan_type as PlanType} />
                </span>
                <span className="min-w-0 flex-1 space-y-1 pe-8">
                  <span className="block font-bold [overflow-wrap:anywhere]">{p.plan_name}</span>
                  <span className={`flex items-center gap-1.5 text-xs font-bold ${tone?.text ?? ''}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${tone?.dot ?? 'bg-muted-foreground'}`} aria-hidden />
                    {typeLabel(p.plan_type)}
                    {!p.is_active && <span className="font-medium text-muted-foreground">· {t('admin.payments.plans.inactive', 'Inactive')}</span>}
                  </span>
                  <span className="block text-[13px] tabular-nums">
                    {big} {quiet && <span className="text-muted-foreground">{quiet}</span>}
                  </span>
                </span>
                <span
                  className={`absolute end-4 top-4 grid h-[22px] w-[22px] place-items-center rounded-md border-2 ${
                    on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'
                  }`}
                  aria-hidden
                >
                  {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
              </button>
              {on && alternativePlanIds.length > 1 && (
                <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-dashed border-border pt-3 text-[12.5px]">
                  <span className="text-muted-foreground">
                    {isMain ? t('products.planCards.shownFirst', 'Shown first to the client') : t('products.planCards.shownAfter', 'Shown after the main plan')}
                  </span>
                  {isMain ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 font-bold text-primary-foreground">
                      <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
                      {t('products.planCards.mainPlan', 'Main plan')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => makeMain(p.id)}
                      className="inline-flex min-h-[30px] items-center gap-1 rounded-full border border-primary bg-card px-2.5 font-bold text-primary hover:bg-primary/10"
                    >
                      <Star className="h-3.5 w-3.5" aria-hidden />
                      {t('products.planCards.makeMain', 'Make main')}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {chooseError && alternativePlanIds.length === 0 && <p className="text-[13px] font-medium text-red-600 dark:text-red-400">{chooseError}</p>}

      {alternativePlanIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-primary/5 px-3.5 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground" aria-hidden>
            <Check className="h-5 w-5" strokeWidth={3} />
          </span>
          <span className="min-w-0">
            <span className="block font-bold">
              {alternativePlanIds.length === 1
                ? t('products.planCards.summaryOneNamed', 'The client pays with "{name}"').replace('{name}', mainPlan?.plan_name ?? '')
                : t('products.planCards.summaryManyChosen', '{n} plans chosen · the client picks one when paying').replace('{n}', String(alternativePlanIds.length))}
            </span>
            <span className="block text-[13px] text-muted-foreground">
              {alternativePlanIds.length > 1 && mainPlan ? `${t('products.planCards.firstIs', '{name} is shown first').replace('{name}', mainPlan.plan_name)} · ` : ''}
              <Link href="/admin/payments/plans" className="font-semibold text-primary hover:underline">
                {t('products.planCards.managePlans', 'Payment plans')}
              </Link>
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
