'use client';

import { useAdminLanguage } from '@/context/AppContext';

export interface PaymentPlan {
  id: string;
  plan_name: string;
  plan_description: string;
  plan_type: 'one_time' | 'deposit' | 'installments' | 'subscription' | 'per_session';
  deposit_type?: 'percentage' | 'fixed';
  deposit_percentage?: number;
  deposit_amount?: number;
  installment_count?: number;
  installment_frequency?: string;
  subscription_frequency?: string;
  /** Membership plans: price per period; empty = the product price. */
  subscription_amount?: number | null;
  /** Per-session plans: price per session; empty = the product price. */
  session_amount?: number | null;
  auto_detect_enabled: boolean;
  priority: number;
  is_active: boolean;
  is_default: boolean;
  usage_count?: number;
}

export const PLAN_TYPES = ['one_time', 'deposit', 'installments', 'subscription', 'per_session'] as const;
export type PlanType = (typeof PLAN_TYPES)[number];

/** Each plan type's colour (dot, word, tile). */
export const PLAN_TONE: Record<string, { dot: string; text: string; tile: string }> = {
  one_time: { dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300', tile: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' },
  deposit: { dot: 'bg-green-600', text: 'text-green-700 dark:text-green-400', tile: 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300' },
  installments: { dot: 'bg-violet-500', text: 'text-violet-700 dark:text-violet-300', tile: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300' },
  subscription: { dot: 'bg-amber-500', text: 'text-amber-800 dark:text-amber-300', tile: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' },
  per_session: { dot: 'bg-teal-600', text: 'text-teal-700 dark:text-teal-300', tile: 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300' },
};

/** How plans are worded, as on the old page. */
export function usePlanFormat() {
  const { t } = useAdminLanguage();

  const typeLabel = (type: string) =>
    ({
      one_time: t('admin.payments.plans.types.oneTime', 'One-Time'),
      deposit: t('admin.payments.plans.types.deposit', 'Deposit'),
      installments: t('admin.payments.plans.types.installments', 'Installments'),
      subscription: t('admin.payments.plans.types.subscription', 'Subscription'),
      per_session: t('admin.payments.plans.types.perSession', 'Per session'),
    })[type] ?? type;

  const frequency = (freq?: string) => (freq ? t(`admin.payments.plans.frequency.${freq.toLowerCase()}`, freq) : '');

  /** One line saying how the plan charges (same wording as before). */
  const details = (plan: Partial<PaymentPlan>) => {
    switch (plan.plan_type) {
      case 'deposit': {
        const depositText = (
          plan.deposit_type === 'fixed'
            ? t('admin.payments.plans.details.fixedDeposit', `$${plan.deposit_amount} deposit`)
            : t('admin.payments.plans.details.percentDeposit', `${plan.deposit_percentage}% deposit`)
        )
          .replace('{amount}', String(plan.deposit_amount ?? ''))
          .replace('{percentage}', String(plan.deposit_percentage ?? ''));
        const paymentsText = t('admin.payments.plans.details.payments', `${plan.installment_count} ${plan.installment_frequency} payments`)
          .replace('{count}', String(plan.installment_count ?? ''))
          .replace('{frequency}', frequency(plan.installment_frequency));
        return `${depositText}, ${paymentsText}`;
      }
      case 'installments':
        return t('admin.payments.plans.details.installments', `${plan.installment_count} ${plan.installment_frequency} payments`)
          .replace('{count}', String(plan.installment_count ?? ''))
          .replace('{frequency}', frequency(plan.installment_frequency));
      case 'subscription': {
        const subscriptionText = t('admin.payments.plans.details.subscription', `${plan.subscription_frequency} recurring billing`).replace(
          '{frequency}',
          frequency(plan.subscription_frequency),
        );
        // Show the plan's own price; without one the product price is charged.
        return plan.subscription_amount
          ? `${subscriptionText} · ${Number(plan.subscription_amount).toLocaleString()}`
          : `${subscriptionText} · ${t('admin.payments.plans.details.productPrice', 'product price')}`;
      }
      case 'per_session': {
        const each = t('admin.payments.plans.details.perSession', 'Charged after each session held');
        return plan.session_amount
          ? `${each} · ${Number(plan.session_amount).toLocaleString()}`
          : `${each} · ${t('admin.payments.plans.details.productPrice', 'product price')}`;
      }
      default:
        return t('admin.payments.plans.details.fullPayment', 'Pay full amount upfront');
    }
  };

  return { typeLabel, frequency, details };
}
