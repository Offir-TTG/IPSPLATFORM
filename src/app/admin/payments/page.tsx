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
  ArrowDownRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  FileText,
  Package,
  TrendingUp,
  UserCheck,
  Wallet,
} from 'lucide-react';
import { KpiItem, KpiStrip, PageTitle } from '@/components/admin/notifications/kit';

interface PaymentStats {
  totalRevenue: number;
  netRevenue: number;
  totalRefunds: number;
  activeEnrollments: number;
  pendingPayments: number;
  pendingAmount: number;
  overduePayments: number;
  thisMonthRevenue: number;
  revenueGrowth: number;
  recentPayments: any[];
}

/** The payment areas, in the order they appeared as cards. */
const SECTIONS = [
  { href: '/admin/payments/products', icon: Package, tone: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', titleKey: 'admin.payments.cards.products.title', title: 'Products', descKey: 'admin.payments.cards.products.description', desc: 'Manage billable products and pricing' },
  { href: '/admin/enrollments', icon: UserCheck, tone: 'bg-purple-500/10 text-purple-600 dark:text-purple-400', titleKey: 'admin.payments.cards.enrollments.title', title: 'Enrollments', descKey: 'admin.payments.cards.enrollments.description', desc: 'Manage user enrollments and payments' },
  { href: '/admin/payments/pdf-template', icon: FileText, tone: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', titleKey: 'admin.payments.cards.pdfTemplate.title', title: 'PDF Template', descKey: 'admin.payments.cards.pdfTemplate.description', desc: 'Configure PDF branding for payment receipts' },
  { href: '/admin/payments/plans', icon: CreditCard, tone: 'bg-primary/10 text-primary', titleKey: 'admin.payments.cards.paymentPlans.title', title: 'Payment Plans', descKey: 'admin.payments.cards.paymentPlans.description', desc: 'Configure and manage payment plans' },
  { href: '/admin/payments/schedules', icon: Wallet, tone: 'bg-green-500/10 text-green-600 dark:text-green-400', titleKey: 'admin.payments.combined.title', title: 'Payments', descKey: 'admin.payments.combined.cardDesc', desc: 'What is planned, what was paid, and refunds' },
  { href: '/admin/payments/disputes', icon: AlertTriangle, tone: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', titleKey: 'admin.payments.cards.disputes.title', title: 'Disputes', descKey: 'admin.payments.cards.disputes.description', desc: 'Handle payment disputes and chargebacks' },
  { href: '/admin/payments/reports', icon: FileText, tone: 'bg-slate-500/10 text-slate-600 dark:text-slate-300', titleKey: 'admin.payments.cards.reports.title', title: 'Reports', descKey: 'admin.payments.cards.reports.description', desc: 'View payment reports and analytics' },
];

/**
 * Payments home, in the admin list template: the title, the money numbers
 * as one strip (Overdue opens the overdue schedules, as its link did), and
 * the payment areas as one list. The layout shows at once; the numbers fill
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

  const usd = (n: number) => `$${n.toLocaleString()}`;
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
            value={stats ? usd(stats.totalRevenue) : '—'}
            subtitle={t('admin.payments.grossRevenue', 'Gross revenue')}
          />
          <KpiItem
            icon={<TrendingUp />}
            tone="green"
            label={t('admin.payments.netRevenue', 'Net Revenue')}
            value={stats ? usd(stats.netRevenue) : '—'}
            subtitle={stats ? growthText : undefined}
          />
          <KpiItem
            icon={<ArrowDownRight />}
            tone="grey"
            label={t('admin.payments.refunds', 'Refunds')}
            value={stats ? `-${usd(stats.totalRefunds)}` : '—'}
            subtitle={t('admin.payments.totalRefunded', 'Total refunded')}
          />
          <KpiItem
            icon={<Calendar />}
            tone="blue"
            label={t('admin.payments.pendingPayments', 'Pending Payments')}
            value={stats ? usd(stats.pendingAmount) : '—'}
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
            subtitle={t('admin.payments.viewOverdue', 'View Overdue')}
            onClick={() => router.push('/admin/payments/schedules?status=overdue')}
          />
        </KpiStrip>

        {/* The payment areas, as one list */}
        <nav aria-label={t('admin.payments.title', 'Payments')} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <ul className="divide-y divide-border/70">
            {SECTIONS.map(({ href, icon: Icon, tone, titleKey, title, descKey, desc }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group flex min-h-[68px] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                >
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}>
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{t(titleKey, title)}</span>
                    <span className="block text-sm text-muted-foreground">{t(descKey, desc)}</span>
                  </span>
                  <Chevron className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </AdminLayout>
  );
}
