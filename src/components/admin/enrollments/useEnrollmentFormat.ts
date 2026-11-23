'use client';

import { useAdminLanguage } from '@/context/AppContext';
import type { Enrollment } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

export type NextStep =
  | { kind: 'send' }
  | { kind: 'chip'; tone: 'red' | 'amber' | 'violet'; text: string }
  | { kind: 'quiet'; text: string };

/**
 * How enrollments are worded on the list and in the drawer: the payment
 * plan's name (same rules as before), product type, money, dates, and the
 * "next step" for each enrollment.
 */
export function useEnrollmentFormat() {
  const { t, language } = useAdminLanguage();
  const locale = language === 'he' ? 'he-IL' : 'en-US';

  const planName = (enrollment: Enrollment): string => {
    const key = enrollment.payment_plan_key;
    const data = enrollment.payment_plan_data || {};
    if (key === 'custom' && data.name) return data.name;
    if (key === 'admin.enrollments.paymentPlan.multiplePlans') return t('admin.enrollments.paymentPlan.multiplePlans', 'Multiple plans available');
    if (key === 'admin.enrollments.paymentPlan.defaultPlan') return t('admin.enrollments.paymentPlan.defaultPlan', 'Default plan');
    if (key === 'admin.enrollments.paymentPlan.oneTime') return t('admin.enrollments.paymentPlan.oneTime', 'One-Time Payment');
    if (key === 'admin.enrollments.paymentPlan.deposit') {
      const count = data.count || 'N';
      const frequency = data.frequency || 'monthly';
      const frequencyText = t(`admin.enrollments.paymentPlan.frequency.${frequency}`, frequency);
      let depositInfo: string;
      if (data.deposit_type === 'percentage' && data.deposit_percentage) {
        depositInfo = `${data.deposit_percentage}% ${t('admin.enrollments.paymentPlan.depositLabel', 'deposit')}`;
      } else if (data.deposit_type === 'fixed' && data.deposit_amount) {
        depositInfo = `${enrollment.currency || 'USD'} ${data.deposit_amount} ${t('admin.enrollments.paymentPlan.depositLabel', 'deposit')}`;
      } else {
        depositInfo = t('admin.enrollments.paymentPlan.depositLabel', 'Deposit');
      }
      return `${depositInfo} + ${String(count)} ${frequencyText}`;
    }
    if (key === 'admin.enrollments.paymentPlan.installments') {
      const count = data.count || 'N';
      const frequency = data.frequency || 'monthly';
      const frequencyText = t(`admin.enrollments.paymentPlan.frequency.${frequency}`, frequency);
      return `${t('admin.enrollments.paymentPlan.installments', '{count} Installments').replace('{count}', String(count))} - ${frequencyText}`;
    }
    if (key === 'admin.enrollments.paymentPlan.subscription') {
      const interval = data.interval || 'monthly';
      return `${t(`admin.enrollments.paymentPlan.interval.${interval}`, interval)} ${t('admin.enrollments.paymentPlan.subscriptionLabel', 'Subscription')}`;
    }
    if (key === 'admin.enrollments.paymentPlan.free') return t('admin.enrollments.paymentPlan.free', 'Free');
    return t('admin.enrollments.paymentPlan.notAvailable', 'N/A');
  };

  const productType = (type: string) => (!type || type === 'N/A' ? type : t(`admin.enrollments.productType.${type.toLowerCase()}`, type));
  const money = (amount: number, currency?: string) => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 2 }).format(amount || 0);
    } catch {
      return `${amount ?? 0} ${currency ?? ''}`.trim();
    }
  };
  const date = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const statusLabel = (s: string) => (s ? t(`admin.enrollments.status.${s}`, s.replace(/_/g, ' ')) : 'N/A');
  const paymentLabel = (s: string) =>
    t(
      `admin.enrollments.paymentStatus.${s}`,
      ({ paid: 'Paid', partial: 'Partial', overdue: 'Overdue', pending: 'Pending' } as Record<string, string>)[s] ?? s,
    );
  const daysAgo = (iso: string) => {
    const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS));
    return days === 0
      ? t('admin.enrollments.next.today', 'today')
      : days === 1
        ? t('admin.enrollments.next.yesterday', 'yesterday')
        : t('admin.enrollments.next.daysAgo', '{n} days ago').replace('{n}', String(days));
  };

  /** What needs doing with this enrollment now. */
  const nextStep = (e: Enrollment): NextStep => {
    if (e.status === 'cancelled') return { kind: 'quiet', text: '—' };
    if (e.status === 'draft') return { kind: 'send' };
    if (e.payment_status === 'overdue') return { kind: 'chip', tone: 'red', text: t('admin.enrollments.next.overdue', 'Payment overdue') };
    if (e.status === 'pending')
      return {
        kind: 'chip',
        tone: 'amber',
        text: e.invitation_sent_at
          ? t('admin.enrollments.next.linkSent', 'Link sent {when}').replace('{when}', daysAgo(e.invitation_sent_at))
          : t('admin.enrollments.next.waiting', 'Waiting for the parent'),
      };
    if (e.status === 'suspended') return { kind: 'chip', tone: 'violet', text: t('admin.enrollments.next.suspended', 'Enrollment paused') };
    if (e.payment_status === 'paid' || e.status === 'completed') return { kind: 'quiet', text: t('admin.enrollments.next.allGood', 'All good') };
    if (e.next_payment_date)
      return { kind: 'quiet', text: t('admin.enrollments.next.nextPayment', 'Next payment {date}').replace('{date}', date(e.next_payment_date)) };
    return { kind: 'quiet', text: '—' };
  };

  return { planName, productType, money, date, statusLabel, paymentLabel, nextStep, daysAgo };
}
