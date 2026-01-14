'use client';

export const dynamic = 'force-dynamic';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { LoadingState } from '@/components/admin/LoadingState';
import { useAdminLanguage } from '@/context/AppContext';
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Calendar,
  Package,
  CreditCard,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  GraduationCap,
  ShoppingCart,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DashboardStats {
  financial: {
    totalRevenue: number;
    thisMonthRevenue: number;
    lastMonthRevenue: number;
    revenueGrowth: number;
    pendingAmount: number;
    overdueCount: number;
    overdueAmount: number;
  };
  enrollments: {
    total: number;
    active: number;
    pending: number;
    draft: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  users: {
    total: number;
    students: number;
    instructors: number;
    admins: number;
    thisMonth: number;
  };
  lms: {
    programs: { total: number; active: number };
    courses: { total: number; active: number };
    upcomingSessions: number;
  };
  products: {
    total: number;
    active: number;
    paid: number;
    free: number;
  };
  paymentPlans: {
    total: number;
    active: number;
  };
  recentActivity: {
    enrollments: any[];
    payments: any[];
  };
}

export default function AdminDashboardPage() {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard/stats');
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return <LoadingState variant="page" withLayout={true} />;
  }

  if (!stats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-muted-foreground">
            {t('admin.dashboard.error', 'Failed to load dashboard data')}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2" suppressHydrationWarning>
            {t('admin.dashboard.title', 'Dashboard')}
          </h1>
          <p className="text-muted-foreground" suppressHydrationWarning>
            {t('admin.dashboard.subtitle', 'Your platform overview at a glance')}
          </p>
        </div>

        {/* Financial Overview */}
        <div>
          <h2 className="text-xl font-semibold mb-4" suppressHydrationWarning>
            {t('admin.dashboard.financial', 'Financial Overview')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                  {t('admin.dashboard.totalRevenue', 'Total Revenue')}
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.financial.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                  {t('admin.dashboard.allTime', 'All time')}
                </p>
              </CardContent>
            </Card>

            {/* This Month Revenue */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                  {t('admin.dashboard.monthRevenue', 'This Month')}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.financial.thisMonthRevenue)}</div>
                <div className="flex items-center text-xs mt-1">
                  {stats.financial.revenueGrowth >= 0 ? (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-green-600 ltr:mr-1 rtl:ml-1" />
                      <span className="text-green-600">+{stats.financial.revenueGrowth}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-red-600 ltr:mr-1 rtl:ml-1" />
                      <span className="text-red-600">{stats.financial.revenueGrowth}%</span>
                    </>
                  )}
                  <span className="text-muted-foreground ltr:ml-1 rtl:mr-1" suppressHydrationWarning>
                    {t('admin.dashboard.fromLastMonth', 'from last month')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Pending Payments */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                  {t('admin.dashboard.pendingPayments', 'Pending Payments')}
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.financial.pendingAmount)}</div>
                <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                  {t('admin.dashboard.expected', 'Expected revenue')}
                </p>
              </CardContent>
            </Card>

            {/* Overdue Payments */}
            <Card className={stats.financial.overdueCount > 0 ? 'border-amber-500' : ''}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                  {t('admin.dashboard.overduePayments', 'Overdue')}
                </CardTitle>
                <AlertCircle className={`h-4 w-4 ${stats.financial.overdueCount > 0 ? 'text-amber-600' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.financial.overdueAmount)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span suppressHydrationWarning>{stats.financial.overdueCount} {t('admin.dashboard.payments', 'payments')}</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enrollments & Users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enrollments */}
          <div>
            <h2 className="text-xl font-semibold mb-4" suppressHydrationWarning>
              {t('admin.dashboard.enrollments', 'Enrollments')}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                    {t('admin.dashboard.totalEnrollments', 'Total')}
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.enrollments.total}</div>
                  <div className="flex items-center text-xs mt-1">
                    {stats.enrollments.growth >= 0 ? (
                      <>
                        <ArrowUpRight className="h-3 w-3 text-green-600 ltr:mr-1 rtl:ml-1" />
                        <span className="text-green-600">+{stats.enrollments.growth}%</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="h-3 w-3 text-red-600 ltr:mr-1 rtl:ml-1" />
                        <span className="text-red-600">{stats.enrollments.growth}%</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                    {t('admin.dashboard.activeEnrollments', 'Active')}
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.enrollments.active}</div>
                  <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                    {t('admin.dashboard.activeNow', 'Active now')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                    {t('admin.dashboard.pendingEnrollments', 'Pending')}
                  </CardTitle>
                  <Clock className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">{stats.enrollments.pending}</div>
                  <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                    {t('admin.dashboard.awaitingAction', 'Awaiting action')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                    {t('admin.dashboard.draftEnrollments', 'Drafts')}
                  </CardTitle>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.enrollments.draft}</div>
                  <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                    {t('admin.dashboard.invitationsPending', 'Invitations sent')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Users */}
          <div>
            <h2 className="text-xl font-semibold mb-4" suppressHydrationWarning>
              {t('admin.dashboard.users', 'Users')}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                    {t('admin.dashboard.totalUsers', 'Total Users')}
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.users.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span suppressHydrationWarning>+{stats.users.thisMonth} {t('admin.dashboard.thisMonth', 'this month')}</span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                    {t('admin.dashboard.students', 'Students')}
                  </CardTitle>
                  <UserCheck className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.users.students}</div>
                  <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                    {t('admin.dashboard.regularUsers', 'Regular users')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                    {t('admin.dashboard.instructors', 'Instructors')}
                  </CardTitle>
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{stats.users.instructors}</div>
                  <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                    {t('admin.dashboard.teachers', 'Teachers')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                    {t('admin.dashboard.admins', 'Admins')}
                  </CardTitle>
                  <Users className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">{stats.users.admins}</div>
                  <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                    {t('admin.dashboard.platformAdmins', 'Platform admins')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* LMS & Products */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('admin.dashboard.programs', 'Programs')}
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lms.programs.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span suppressHydrationWarning>{stats.lms.programs.active} {t('admin.dashboard.active', 'active')}</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('admin.dashboard.courses', 'Courses')}
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lms.courses.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span suppressHydrationWarning>{stats.lms.courses.active} {t('admin.dashboard.active', 'active')}</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('admin.dashboard.upcomingSessions', 'Upcoming Sessions')}
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lms.upcomingSessions}</div>
              <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                {t('admin.dashboard.nextWeek', 'Next 7 days')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('admin.dashboard.products', 'Products')}
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.products.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span suppressHydrationWarning>{stats.products.paid} {t('admin.dashboard.paid', 'paid')}, {stats.products.free} {t('admin.dashboard.free', 'free')}</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('admin.dashboard.paymentPlans', 'Payment Plans')}
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.paymentPlans.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span suppressHydrationWarning>{stats.paymentPlans.active} {t('admin.dashboard.active', 'active')}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Enrollments */}
          <Card>
            <CardHeader>
              <CardTitle suppressHydrationWarning>
                {t('admin.dashboard.recentEnrollments', 'Recent Enrollments')}
              </CardTitle>
              <CardDescription suppressHydrationWarning>
                {t('admin.dashboard.latest5Enrollments', 'Latest 5 enrollments')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentActivity.enrollments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4" suppressHydrationWarning>
                    {t('admin.dashboard.noRecentEnrollments', 'No recent enrollments')}
                  </p>
                ) : (
                  stats.recentActivity.enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {enrollment.users?.first_name} {enrollment.users?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{enrollment.products?.title}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          enrollment.status === 'active' ? 'default' :
                          enrollment.status === 'pending' ? 'secondary' :
                          'outline'
                        }>
                          {t(`enrollments.status.${enrollment.status}`, enrollment.status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(enrollment.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {stats.recentActivity.enrollments.length > 0 && (
                <Link
                  href="/admin/enrollments"
                  className="block text-sm text-primary hover:underline mt-4 text-center"
                  suppressHydrationWarning
                >
                  {t('admin.dashboard.viewAllEnrollments', 'View all enrollments →')}
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle suppressHydrationWarning>
                {t('admin.dashboard.recentPayments', 'Recent Payments')}
              </CardTitle>
              <CardDescription suppressHydrationWarning>
                {t('admin.dashboard.latest5Payments', 'Latest 5 payments received')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentActivity.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4" suppressHydrationWarning>
                    {t('admin.dashboard.noRecentPayments', 'No recent payments')}
                  </p>
                ) : (
                  stats.recentActivity.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {payment.user?.first_name} {payment.user?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{payment.user?.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-600">
                          {formatCurrency(parseFloat(payment.amount))}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(payment.paid_date)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {stats.recentActivity.payments.length > 0 && (
                <Link
                  href="/admin/payments/transactions"
                  className="block text-sm text-primary hover:underline mt-4 text-center"
                  suppressHydrationWarning
                >
                  {t('admin.dashboard.viewAllPayments', 'View all payments →')}
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle suppressHydrationWarning>
              {t('admin.dashboard.quickActions', 'Quick Actions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/admin/enrollments"
                className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-muted transition-colors group"
              >
                <ShoppingCart className="h-8 w-8 mb-2 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-center" suppressHydrationWarning>
                  {t('admin.dashboard.manageEnrollments', 'Manage Enrollments')}
                </span>
              </Link>
              <Link
                href="/admin/payments/products"
                className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-muted transition-colors group"
              >
                <Package className="h-8 w-8 mb-2 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-center" suppressHydrationWarning>
                  {t('admin.dashboard.manageProducts', 'Manage Products')}
                </span>
              </Link>
              <Link
                href="/admin/payments/transactions"
                className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-muted transition-colors group"
              >
                <CreditCard className="h-8 w-8 mb-2 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-center" suppressHydrationWarning>
                  {t('admin.dashboard.viewTransactions', 'View Transactions')}
                </span>
              </Link>
              <Link
                href="/admin/users"
                className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-muted transition-colors group"
              >
                <Users className="h-8 w-8 mb-2 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-center" suppressHydrationWarning>
                  {t('admin.dashboard.manageUsers', 'Manage Users')}
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
