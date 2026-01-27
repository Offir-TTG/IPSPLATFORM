'use client';

export const dynamic = 'force-dynamic';

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
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {/* Total Revenue (Gross) */}
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
              <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                {t('admin.payments.grossRevenue', 'Gross revenue')}
              </p>
            </CardContent>
          </Card>

          {/* Net Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('admin.payments.netRevenue', 'Net Revenue')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${stats.netRevenue.toLocaleString()}
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

          {/* Refunds */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('admin.payments.refunds', 'Refunds')}
              </CardTitle>
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                -${stats.totalRefunds.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                {t('admin.payments.totalRefunded', 'Total refunded')}
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
              <div className="text-2xl font-bold">
                ${stats.pendingAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                {t('admin.payments.fromPayments', `From ${stats.pendingPayments} payments`).replace('{count}', stats.pendingPayments.toString())}
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

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Products */}
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

          {/* Enrollments */}
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

          {/* PDF Template */}
          <Link href="/admin/payments/pdf-template">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base" suppressHydrationWarning>{t('admin.payments.cards.pdfTemplate.title', 'PDF Template')}</CardTitle>
                  </div>
                </div>
                <CardDescription className="mt-2" suppressHydrationWarning>
                  {t('admin.payments.cards.pdfTemplate.description', 'Configure PDF branding for payment receipts')}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Payment Plans */}
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

          {/* Schedules */}
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

          {/* Transactions */}
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

          {/* Disputes */}
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

          {/* Reports */}
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
      </div>
    </AdminLayout>
  );
}
