'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useAdminLanguage } from '@/context/AppContext';
import { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
  CreditCard,
  Calendar,
  FileText,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  AlertTriangle,
  UserCheck,
  Package,
} from 'lucide-react';

interface PaymentStats {
  totalRevenue: number;
  activeEnrollments: number;
  pendingPayments: number;
  pendingAmount: number;
  overduePayments: number;
  thisMonthRevenue: number;
  revenueGrowth: number;
  recentPayments: any[];
}

export default function PaymentsPage() {
  const { t, direction, language } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const isMobile = windowWidth <= 640;

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/payments/reports/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl p-6 space-y-6" dir={direction}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 suppressHydrationWarning style={{
              fontSize: 'var(--font-size-3xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))'
            }}>
              <span suppressHydrationWarning>{t('admin.payments.title', 'Payments')}</span>
            </h1>
            <p suppressHydrationWarning style={{
              color: 'hsl(var(--muted-foreground))',
              fontSize: 'var(--font-size-sm)',
              marginTop: '0.25rem'
            }}>
              {t('admin.payments.description', 'Manage payment plans, transactions, and financial reports')}
            </p>
          </div>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            width: isMobile ? '100%' : 'auto',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <Link href="/admin/payments/reports" style={{ width: isMobile ? '100%' : 'auto' }}>
              <Button variant="outline" style={{ width: '100%' }}>
                <FileText className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                <span suppressHydrationWarning>{t('admin.payments.reports', 'Reports')}</span>
              </Button>
            </Link>
            <Link href="/admin/payments/plans" style={{ width: isMobile ? '100%' : 'auto' }}>
              <Button style={{ width: '100%' }}>
                <Settings className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                <span suppressHydrationWarning>{t('admin.payments.paymentPlans', 'Payment Plans')}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('admin.payments.totalRevenue', 'Total Revenue')}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalRevenue.toLocaleString()}
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {stats.revenueGrowth > 0 ? (
                  <>
                    <ArrowUpRight className={`h-3 w-3 text-green-600 ${isRtl ? 'ml-1' : 'mr-1'}`} />
                    <span className="text-green-600">+{stats.revenueGrowth}%</span>
                  </>
                ) : stats.revenueGrowth < 0 ? (
                  <>
                    <ArrowDownRight className={`h-3 w-3 text-red-600 ${isRtl ? 'ml-1' : 'mr-1'}`} />
                    <span className="text-red-600">{stats.revenueGrowth}%</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">0%</span>
                )}
                <span className={isRtl ? 'mr-1' : 'ml-1'} suppressHydrationWarning>{t('admin.payments.fromLastMonth', 'from last month')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Active Enrollments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('admin.payments.activeEnrollments', 'Active Enrollments')}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeEnrollments}</div>
              <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                {t('admin.payments.withActivePayments', 'With active payments')}
              </p>
            </CardContent>
          </Card>

          {/* Pending Payments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('admin.payments.pendingPayments', 'Pending Payments')}
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPayments}</div>
              <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                {t('admin.payments.scheduledUpcoming', 'Scheduled upcoming')}
              </p>
            </CardContent>
          </Card>

          {/* Overdue Payments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('admin.payments.overduePayments', 'Overdue Payments')}
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {stats.overduePayments}
              </div>
              <Link href="/admin/payments/schedules?status=overdue">
                <Button variant="link" className="h-auto p-0 text-xs mt-1">
                  <span suppressHydrationWarning>{t('admin.payments.viewOverdue', 'View Overdue')}</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Pending Amount Card */}
        <Card>
          <CardHeader>
            <CardTitle suppressHydrationWarning>{t('admin.payments.pendingAmount', 'Pending Amount')}</CardTitle>
            <CardDescription suppressHydrationWarning>
              {t('admin.payments.pendingAmount.description', 'Total amount from pending and scheduled payments')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              ${stats.pendingAmount.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-2" suppressHydrationWarning>
              {t('admin.payments.pendingAmount.fromPayments', `From ${stats.pendingPayments} scheduled payments`).replace('{count}', stats.pendingPayments.toString())}
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/payments/products">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base" suppressHydrationWarning>{t('admin.payments.cards.products.title', 'Products')}</CardTitle>
                  </div>
                </div>
                <CardDescription className="mt-2" suppressHydrationWarning>
                  {t('admin.payments.cards.products.description', 'Manage billable products and pricing')}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/payments/plans">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base" suppressHydrationWarning>{t('admin.payments.cards.paymentPlans.title', 'Payment Plans')}</CardTitle>
                  </div>
                </div>
                <CardDescription className="mt-2" suppressHydrationWarning>
                  {t('admin.payments.cards.paymentPlans.description', 'Configure and manage payment plans')}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/payments/schedules">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base" suppressHydrationWarning>{t('admin.payments.cards.schedules.title', 'Schedules')}</CardTitle>
                  </div>
                </div>
                <CardDescription className="mt-2" suppressHydrationWarning>
                  {t('admin.payments.cards.schedules.description', 'View and manage payment schedules')}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/payments/transactions">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base" suppressHydrationWarning>{t('admin.payments.cards.transactions.title', 'Transactions')}</CardTitle>
                  </div>
                </div>
                <CardDescription className="mt-2" suppressHydrationWarning>
                  {t('admin.payments.cards.transactions.description', 'View transaction history and refunds')}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/payments/disputes">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base" suppressHydrationWarning>{t('admin.payments.cards.disputes.title', 'Disputes')}</CardTitle>
                  </div>
                </div>
                <CardDescription className="mt-2" suppressHydrationWarning>
                  {t('admin.payments.cards.disputes.description', 'Handle payment disputes and chargebacks')}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/enrollments">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base" suppressHydrationWarning>{t('admin.payments.cards.enrollments.title', 'Enrollments')}</CardTitle>
                  </div>
                </div>
                <CardDescription className="mt-2" suppressHydrationWarning>
                  {t('admin.payments.cards.enrollments.description', 'Manage user enrollments and payments')}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/payments/reports">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-500/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base" suppressHydrationWarning>{t('admin.payments.cards.reports.title', 'Reports')}</CardTitle>
                  </div>
                </div>
                <CardDescription className="mt-2" suppressHydrationWarning>
                  {t('admin.payments.cards.reports.description', 'View payment reports and analytics')}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle suppressHydrationWarning>{t('admin.payments.recentActivity', 'Recent Activity')}</CardTitle>
            <CardDescription suppressHydrationWarning>
              {t('admin.payments.recentActivityDesc', 'Latest payment transactions and updates')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm" suppressHydrationWarning>{t('admin.payments.noRecentActivity', 'No recent activity')}</p>
              <p className="text-xs mt-1" suppressHydrationWarning>{t('admin.payments.transactionsWillAppear', 'Payment transactions will appear here')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Notice */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100" suppressHydrationWarning>
              {t('admin.payments.comingSoon.title', 'Coming Soon')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 dark:text-blue-200">
            <p className="mb-4" suppressHydrationWarning>
              {t('admin.payments.comingSoon.description', 'The following features are currently in development:')}
            </p>
            <ul className={`list-disc space-y-2 text-sm ${isRtl ? 'mr-6' : 'ml-6'}`}>
              <li suppressHydrationWarning>{t('admin.payments.comingSoon.feature1', 'Automated payment reminders and notifications')}</li>
              <li suppressHydrationWarning>{t('admin.payments.comingSoon.feature2', 'Advanced payment analytics and forecasting')}</li>
              <li suppressHydrationWarning>{t('admin.payments.comingSoon.feature3', 'Multi-currency support')}</li>
              <li suppressHydrationWarning>{t('admin.payments.comingSoon.feature4', 'Payment gateway integrations (PayPal, etc.)')}</li>
              <li suppressHydrationWarning>{t('admin.payments.comingSoon.feature5', 'Subscription management and recurring billing')}</li>
            </ul>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium" suppressHydrationWarning>{t('admin.payments.comingSoon.docsTitle', 'Documentation:')}</p>
              <ul className={`list-disc space-y-1 text-xs ${isRtl ? 'mr-6' : 'ml-6'}`}>
                <li>
                  <a href="/docs/PAYMENT_SYSTEM.md" className="underline hover:text-blue-600" target="_blank" suppressHydrationWarning>
                    {t('admin.payments.comingSoon.doc1', 'Payment System Overview')}
                  </a>
                </li>
                <li>
                  <a href="/docs/PAYMENT_SYSTEM_API.md" className="underline hover:text-blue-600" target="_blank" suppressHydrationWarning>
                    {t('admin.payments.comingSoon.doc2', 'API Documentation')}
                  </a>
                </li>
                <li>
                  <a href="/docs/PAYMENT_SYSTEM_ADMIN_GUIDE.md" className="underline hover:text-blue-600" target="_blank" suppressHydrationWarning>
                    {t('admin.payments.comingSoon.doc3', 'Admin Guide')}
                  </a>
                </li>
                <li>
                  <a href="/docs/PAYMENT_INTEGRATION_GUIDE.md" className="underline hover:text-blue-600" target="_blank" suppressHydrationWarning>
                    {t('admin.payments.comingSoon.doc4', 'Integration Guide')}
                  </a>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
