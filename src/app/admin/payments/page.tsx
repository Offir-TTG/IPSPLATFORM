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
  const { t } = useAdminLanguage();
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
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
        <div className="space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading payment statistics...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('admin.payments.title')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('admin.payments.description')}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/payments/reports">
              <Button variant="outline">
                <FileText className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {t('admin.payments.reports')}
              </Button>
            </Link>
            <Link href="/admin/payments/plans">
              <Button>
                <Settings className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {t('admin.payments.paymentPlans')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('admin.payments.totalRevenue')}
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
                    <ArrowUpRight className="h-3 w-3 text-green-600 ltr:mr-1 rtl:ml-1" />
                    <span className="text-green-600">+{stats.revenueGrowth}%</span>
                  </>
                ) : stats.revenueGrowth < 0 ? (
                  <>
                    <ArrowDownRight className="h-3 w-3 text-red-600 ltr:mr-1 rtl:ml-1" />
                    <span className="text-red-600">{stats.revenueGrowth}%</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">0%</span>
                )}
                <span className="ltr:ml-1 rtl:mr-1">{t('admin.payments.fromLastMonth')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Active Enrollments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('admin.payments.activeEnrollments')}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeEnrollments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('admin.payments.withActivePayments')}
              </p>
            </CardContent>
          </Card>

          {/* Pending Payments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('admin.payments.pendingPayments')}
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPayments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('admin.payments.scheduledUpcoming')}
              </p>
            </CardContent>
          </Card>

          {/* Overdue Payments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('admin.payments.overduePayments')}
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {stats.overduePayments}
              </div>
              <Link href="/admin/payments/schedules?status=overdue">
                <Button variant="link" className="h-auto p-0 text-xs mt-1">
                  {t('admin.payments.viewOverdue')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Pending Amount Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.payments.pendingAmount')}</CardTitle>
            <CardDescription>
              {t('admin.payments.pendingAmount.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              ${stats.pendingAmount.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {t('admin.payments.pendingAmount.fromPayments', `From ${stats.pendingPayments} scheduled payments`).replace('{count}', stats.pendingPayments.toString())}
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/payments/plans">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{t('admin.payments.cards.paymentPlans.title', 'Payment Plans')}</CardTitle>
                  </div>
                </div>
                <CardDescription className="mt-2">
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
                    <CardTitle className="text-base">{t('admin.payments.cards.schedules.title', 'Schedules')}</CardTitle>
                  </div>
                </div>
                <CardDescription className="mt-2">
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
                    <CardTitle className="text-base">{t('admin.payments.cards.transactions.title', 'Transactions')}</CardTitle>
                  </div>
                </div>
                <CardDescription className="mt-2">
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
                    <CardTitle className="text-base">{t('admin.payments.cards.disputes.title', 'Disputes')}</CardTitle>
                  </div>
                </div>
                <CardDescription className="mt-2">
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
                    <CardTitle className="text-base">{t('admin.payments.cards.enrollments.title', 'Enrollments')}</CardTitle>
                  </div>
                </div>
                <CardDescription className="mt-2">
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
                    <CardTitle className="text-base">{t('admin.payments.cards.reports.title', 'Reports')}</CardTitle>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {t('admin.payments.cards.reports.description', 'View payment reports and analytics')}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.payments.recentActivity')}</CardTitle>
            <CardDescription>
              {t('admin.payments.recentActivityDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">{t('admin.payments.noRecentActivity')}</p>
              <p className="text-xs mt-1">{t('admin.payments.transactionsWillAppear')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Notice */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">
              {t('admin.payments.comingSoon.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 dark:text-blue-200">
            <p className="mb-4">
              {t('admin.payments.comingSoon.description')}
            </p>
            <ul className="list-disc ltr:ml-6 rtl:mr-6 space-y-2 text-sm">
              <li>{t('admin.payments.comingSoon.feature1')}</li>
              <li>{t('admin.payments.comingSoon.feature2')}</li>
              <li>{t('admin.payments.comingSoon.feature3')}</li>
              <li>{t('admin.payments.comingSoon.feature4')}</li>
              <li>{t('admin.payments.comingSoon.feature5')}</li>
            </ul>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">{t('admin.payments.comingSoon.docsTitle')}</p>
              <ul className="list-disc ltr:ml-6 rtl:mr-6 space-y-1 text-xs">
                <li>
                  <a href="/docs/PAYMENT_SYSTEM.md" className="underline hover:text-blue-600" target="_blank">
                    {t('admin.payments.comingSoon.doc1')}
                  </a>
                </li>
                <li>
                  <a href="/docs/PAYMENT_SYSTEM_API.md" className="underline hover:text-blue-600" target="_blank">
                    {t('admin.payments.comingSoon.doc2')}
                  </a>
                </li>
                <li>
                  <a href="/docs/PAYMENT_SYSTEM_ADMIN_GUIDE.md" className="underline hover:text-blue-600" target="_blank">
                    {t('admin.payments.comingSoon.doc3')}
                  </a>
                </li>
                <li>
                  <a href="/docs/PAYMENT_INTEGRATION_GUIDE.md" className="underline hover:text-blue-600" target="_blank">
                    {t('admin.payments.comingSoon.doc4')}
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
