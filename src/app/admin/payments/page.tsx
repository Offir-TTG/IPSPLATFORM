'use client';

export const dynamic = 'force-dynamic';

import { AdminLayout } from '@/components/admin/AdminLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminLanguage } from '@/context/AppContext';
import { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  ArrowDownRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  FileText,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { KpiItem, KpiStrip, PageTitle } from '@/components/admin/notifications/kit';

interface PaymentStats {
  currency: string;
  totalRevenue: number;
  netRevenue: number;
  totalRefunds: number;
  lostDisputes: number;
  activeEnrollments: number;
  pendingPayments: number;
  pendingAmount: number;
  overduePayments: number;
  overdueAmount: number;
  thisMonthRevenue: number;
  revenueGrowth: number;
}

/** The payment areas. Products and Enrollments are under Learning in the menu. */
const SECTIONS = [
  { href: '/admin/payments/pdf-template', icon: FileText, tone: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', titleKey: 'admin.payments.cards.pdfTemplate.title', title: 'PDF Template', descKey: 'admin.payments.cards.pdfTemplate.description', desc: 'Configure PDF branding for payment receipts' },
  { href: '/admin/payments/plans', icon: CreditCard, tone: 'bg-primary/10 text-primary', titleKey: 'admin.payments.cards.paymentPlans.title', title: 'Payment Plans', descKey: 'admin.payments.cards.paymentPlans.description', desc: 'Configure and manage payment plans' },
  { href: '/admin/payments/schedules', icon: Wallet, tone: 'bg-green-500/10 text-green-600 dark:text-green-400', titleKey: 'admin.payments.combined.title', title: 'Payments', descKey: 'admin.payments.combined.cardDesc', desc: 'What is planned, what was paid, and refunds' },
  { href: '/admin/payments/disputes', icon: AlertTriangle, tone: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', titleKey: 'admin.payments.cards.disputes.title', title: 'Disputes', descKey: 'admin.payments.cards.disputes.description', desc: 'Handle payment disputes and chargebacks' },
  { href: '/admin/payments/keap-history', icon: Archive, tone: 'bg-violet-500/10 text-violet-600 dark:text-violet-400', titleKey: 'admin.keapHistory.title', title: 'Keap history', descKey: 'admin.keapHistory.cardDesc', desc: 'Past orders and payments from Keap, read-only and searchable' },
  { href: '/admin/payments/reports', icon: FileText, tone: 'bg-slate-500/10 text-slate-600 dark:text-slate-300', titleKey: 'admin.payments.cards.reports.title', title: 'Reports', descKey: 'admin.payments.cards.reports.description', desc: 'View payment reports and analytics' },
];

/** The cards in groups: everyday money work, then setup. */
const GROUPS: Array<{ key: string; fallback: string; hrefs: string[] }> = [
  { key: 'admin.payments.group.money', fallback: 'Payments and reports', hrefs: ['/admin/payments/schedules', '/admin/payments/disputes', '/admin/payments/reports', '/admin/payments/keap-history'] },
  { key: 'admin.payments.group.setup', fallback: 'Setup', hrefs: ['/admin/payments/plans', '/admin/payments/pdf-template'] },
];

/**
 * Payments home, in the admin list template: the title, the money numbers
 * as one strip (Overdue opens the overdue schedules, as its link did), and
 * the payment areas as cards in groups, like the Settings page. The layout shows at once; the numbers fill
 * in when they arrive.
 */
export default function PaymentsPage() {
  const { t, direction } = useAdminLanguage();
  const router = useRouter();
  const isRtl = direction === 'rtl';
  const Chevron = isRtl ? ChevronLeft : ChevronRight;
  const [stats, setStats] = useState<PaymentStats | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/admin/payments/reports/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        setStats(await response.json());
      } catch (error) {
        console.error('Error fetching payment stats:', error);
      }
    })();
  }, []);

  // Amounts in the business currency, with cents.
  const money = (n: number) =>
    new Intl.NumberFormat(isRtl ? 'he-IL' : 'en-US', { style: 'currency', currency: stats?.currency || 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
  const growth = stats?.revenueGrowth ?? 0;
  const growthText = `${growth > 0 ? '+' : ''}${growth}% ${t('admin.payments.fromLastMonth', 'from last month')}`;

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-5 p-4 md:p-6" dir={direction}>
        <PageTitle
          icon={Wallet}
          title={t('admin.payments.title', 'Payments')}
          description={t('admin.payments.description', 'Manage payment plans, transactions, and financial reports')}
        />

        <KpiStrip label={t('admin.list.numbers', 'Numbers')}>
          <KpiItem
            icon={<DollarSign />}
            label={t('admin.payments.totalRevenue', 'Total Revenue')}
            value={stats ? money(stats.totalRevenue) : '—'}
            subtitle={t('admin.payments.grossRevenue', 'Gross revenue')}
          />
          <KpiItem
            icon={<TrendingUp />}
            tone="green"
            label={t('admin.payments.netRevenue', 'Net Revenue')}
            value={stats ? money(stats.netRevenue) : '—'}
            subtitle={stats ? growthText : undefined}
          />
          <KpiItem
            icon={<ArrowDownRight />}
            tone="grey"
            label={t('admin.payments.refunds', 'Refunds')}
            value={stats ? (stats.totalRefunds > 0 ? `-${money(stats.totalRefunds)}` : money(0)) : '—'}
            subtitle={
              stats && stats.lostDisputes > 0
                ? t('admin.payments.refundsAndLostDisputes', 'Includes {amount} in lost disputes').replace('{amount}', money(stats.lostDisputes))
                : t('admin.payments.totalRefunded', 'Total refunded')
            }
          />
          <KpiItem
            icon={<Calendar />}
            tone="blue"
            label={t('admin.payments.pendingPayments', 'Pending Payments')}
            value={stats ? money(stats.pendingAmount) : '—'}
            subtitle={
              stats
                ? t('admin.payments.fromPayments', 'From {count} payments').replace('{count}', stats.pendingPayments.toString())
                : undefined
            }
          />
          <KpiItem
            icon={<AlertCircle />}
            tone={stats && stats.overduePayments > 0 ? 'amber' : 'grey'}
            label={t('admin.payments.overduePayments', 'Overdue Payments')}
            value={stats ? stats.overduePayments.toLocaleString() : '—'}
            subtitle={stats && stats.overduePayments > 0 ? `${money(stats.overdueAmount)} · ${t('admin.payments.viewOverdue', 'View Overdue')}` : t('admin.payments.viewOverdue', 'View Overdue')}
            onClick={() => router.push('/admin/payments/schedules?status=overdue')}
          />
        </KpiStrip>

        {/* The payment areas as cards in groups, like the Settings page */}
        {GROUPS.map((group) => (
          <section key={group.key} aria-label={t(group.key, group.fallback)}>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{t(group.key, group.fallback)}</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {SECTIONS.filter((x) => group.hrefs.includes(x.href)).map(({ href, icon: Icon, tone, titleKey, title, descKey, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:shadow-sm"
                >
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold">{t(titleKey, title)}</h3>
                    <span className="mt-0.5 block text-sm text-muted-foreground [overflow-wrap:anywhere]">{t(descKey, desc)}</span>
                  </span>
                  <Chevron className="h-4 w-4 shrink-0 self-center text-muted-foreground group-hover:text-foreground" aria-hidden />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AdminLayout>
  );
}
