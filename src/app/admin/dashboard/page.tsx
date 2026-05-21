'use client';

export const dynamic = 'force-dynamic';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { LoadingState } from '@/components/admin/LoadingState';
import { useAdminLanguage } from '@/context/AppContext';
import { useHelp } from '@/hooks/useHelp';
import { formatCurrency as formatCurrencyRaw } from '@/lib/currency/format';
import {
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Clock,
  FileText,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface MonthlyRevenue {
  month: string;
  amount: number;
}
interface MonthlyEnrollments {
  month: string;
  count: number;
}

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
  history: {
    revenue: MonthlyRevenue[];
    enrollments: MonthlyEnrollments[];
  };
  currency: {
    code: string;
  };
}

export default function AdminDashboardPage() {
  useHelp('admin-overview');
  const { t, language } = useAdminLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Money rendering uses the platform-wide default currency from
  // platform_settings (e.g. USD) — NOT the active language's currency
  // (which would be ILS for a Hebrew admin). The platform setting is
  // a business decision; language only controls the locale.
  const platformCurrencyCode = stats?.currency?.code ?? 'ILS';
  const formatCurrency = (amount: number) =>
    formatCurrencyRaw(amount, {
      code: platformCurrencyCode,
      locale: language === 'he' ? 'he-IL' : 'en-US',
    });

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

  /** Short, no-currency-symbol form for chart tick labels. e.g. 12,400 */
  const formatCompact = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
    return n.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /** Turn '2026-05' → 'May' (short month name in the active locale). */
  const monthLabel = (key: string) => {
    const [y, m] = key.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(
      language === 'he' ? 'he-IL' : 'en-US',
      { month: 'short' },
    );
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

  // Pre-shape chart data so recharts gets the right keys.
  const revenueChartData = stats.history.revenue.map((r) => ({
    month: monthLabel(r.month),
    amount: r.amount,
  }));
  const enrollmentChartData = stats.history.enrollments.map((r) => ({
    month: monthLabel(r.month),
    count: r.count,
  }));

  // Attention triage — overdue / pending / drafts.
  const attentionItems: Array<{
    icon: typeof AlertCircle;
    tone: 'danger' | 'warning' | 'info';
    text: string;
    href: string;
    cta: string;
  }> = [];
  if (stats.financial.overdueCount > 0) {
    attentionItems.push({
      icon: AlertCircle,
      tone: 'danger',
      text: `${stats.financial.overdueCount} ${t('admin.dashboard.attention.overdueLabel', 'overdue payments')} · ${formatCurrency(stats.financial.overdueAmount)}`,
      href: '/admin/payments/transactions?filter=overdue',
      cta: t('admin.dashboard.attention.resolve', 'Resolve'),
    });
  }
  if (stats.enrollments.pending > 0) {
    attentionItems.push({
      icon: Clock,
      tone: 'warning',
      text: `${stats.enrollments.pending} ${t('admin.dashboard.attention.pendingLabel', 'enrollments awaiting your action')}`,
      href: '/admin/enrollments?status=pending',
      cta: t('admin.dashboard.attention.review', 'Review'),
    });
  }
  if (stats.enrollments.draft > 0) {
    attentionItems.push({
      icon: FileText,
      tone: 'info',
      text: `${stats.enrollments.draft} ${t('admin.dashboard.attention.draftLabel', 'invitations still in draft')}`,
      href: '/admin/enrollments?status=draft',
      cta: t('admin.dashboard.attention.openList', 'Open'),
    });
  }
  const toneClass: Record<typeof attentionItems[number]['tone'], string> = {
    danger:
      'border-destructive/40 bg-destructive/5 text-destructive dark:bg-destructive/10',
    warning:
      'border-amber-500/40 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200',
    info: 'border-blue-500/40 bg-blue-50 text-blue-900 dark:bg-blue-950/30 dark:text-blue-200',
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl space-y-6">
        {/* ─── Header ──────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold mb-1" suppressHydrationWarning>
            {t('admin.dashboard.title', 'Dashboard')}
          </h1>
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            {attentionItems.length === 0
              ? t(
                  'admin.dashboard.allClearSubtitle',
                  'All clear — nothing needs your attention right now.',
                )
              : t('admin.dashboard.attentionSubtitle', {
                  defaultValue: 'You have {{count}} items to look at today.',
                  count: attentionItems.length,
                })}
          </p>
        </div>

        {/* ─── Attention banner ────────────────────────────────────── */}
        {attentionItems.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-50 dark:bg-green-950/20 px-4 py-3 text-sm text-green-800 dark:text-green-200">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span suppressHydrationWarning>
              {t(
                'admin.dashboard.allClearBanner',
                'No overdue payments, pending enrollments, or stale drafts. Nice work.',
              )}
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {attentionItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.text}
                  href={item.href}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm transition-colors hover:brightness-95 ${toneClass[item.tone]}`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.text}</span>
                  </span>
                  <span className="flex items-center gap-1 font-semibold whitespace-nowrap">
                    {item.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* ─── Two-chart hero ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-baseline justify-between">
                <CardTitle className="text-base font-semibold" suppressHydrationWarning>
                  {t('admin.dashboard.revenue6mo', 'Revenue — last 6 months')}
                </CardTitle>
                <span
                  className={`inline-flex items-center text-xs font-semibold ${stats.financial.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {stats.financial.revenueGrowth >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(Math.round(stats.financial.revenueGrowth))}% MoM
                </span>
              </div>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-3xl font-bold">
                  {formatCurrency(stats.financial.thisMonthRevenue)}
                </span>
                <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {t('admin.dashboard.thisMonth', 'this month')}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={revenueChartData}
                    margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(v) => formatCompact(v as number)}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => formatCurrency(v)}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#revGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Enrollments */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-baseline justify-between">
                <CardTitle className="text-base font-semibold" suppressHydrationWarning>
                  {t('admin.dashboard.enrollments6mo', 'Enrollments — last 6 months')}
                </CardTitle>
                <span
                  className={`inline-flex items-center text-xs font-semibold ${stats.enrollments.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {stats.enrollments.growth >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(Math.round(stats.enrollments.growth))}% MoM
                </span>
              </div>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-3xl font-bold">{stats.enrollments.active}</span>
                <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {t('admin.dashboard.activeNowShort', 'active now')} · +{stats.enrollments.thisMonth}{' '}
                  {t('admin.dashboard.thisMonth', 'this month')}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={enrollmentChartData}
                    margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      width={28}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── All numbers (cohort table) ───────────────────────────── */}
        {/* One card, four rows, four cells per row. All 17 KPIs from
            the old dashboard live here in a tight table-like grid. */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold" suppressHydrationWarning>
              {t('admin.dashboard.allNumbers', 'All numbers')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              <CohortRow
                label={t('admin.dashboard.financial', 'Financial')}
                cells={[
                  {
                    value: formatCurrency(stats.financial.totalRevenue),
                    label: t('admin.dashboard.totalRevenue', 'Total revenue'),
                  },
                  {
                    value: formatCurrency(stats.financial.thisMonthRevenue),
                    label: t('admin.dashboard.monthRevenue', 'This month'),
                  },
                  {
                    value: formatCurrency(stats.financial.pendingAmount),
                    label: t('admin.dashboard.pendingPayments', 'Pending'),
                  },
                  {
                    value: formatCurrency(stats.financial.overdueAmount),
                    label: `${stats.financial.overdueCount} ${t('admin.dashboard.overdue', 'overdue')}`,
                    danger: stats.financial.overdueCount > 0,
                  },
                ]}
              />
              <CohortRow
                label={t('admin.dashboard.enrollments', 'Enrollments')}
                cells={[
                  {
                    value: stats.enrollments.total.toString(),
                    label: t('admin.dashboard.totalEnrollments', 'Total'),
                  },
                  {
                    value: stats.enrollments.active.toString(),
                    label: t('admin.dashboard.activeEnrollments', 'Active'),
                    accent: 'text-green-600 dark:text-green-400',
                  },
                  {
                    value: stats.enrollments.pending.toString(),
                    label: t('admin.dashboard.pendingEnrollments', 'Pending'),
                    accent: 'text-amber-600 dark:text-amber-400',
                  },
                  {
                    value: stats.enrollments.draft.toString(),
                    label: t('admin.dashboard.draftEnrollments', 'Drafts'),
                  },
                ]}
              />
              <CohortRow
                label={t('admin.dashboard.users', 'Users')}
                cells={[
                  {
                    value: stats.users.total.toString(),
                    label: `${t('admin.dashboard.totalUsers', 'Total')} (+${stats.users.thisMonth} ${t('admin.dashboard.thisMonth', 'this month')})`,
                  },
                  {
                    value: stats.users.students.toString(),
                    label: t('admin.dashboard.students', 'Students'),
                    accent: 'text-blue-600 dark:text-blue-400',
                  },
                  {
                    value: stats.users.instructors.toString(),
                    label: t('admin.dashboard.instructors', 'Instructors'),
                    accent: 'text-purple-600 dark:text-purple-400',
                  },
                  {
                    value: stats.users.admins.toString(),
                    label: t('admin.dashboard.admins', 'Admins'),
                    accent: 'text-emerald-600 dark:text-emerald-400',
                  },
                ]}
              />
              <CohortRow
                label={t('admin.dashboard.content', 'Content')}
                cells={[
                  {
                    value: stats.lms.programs.total.toString(),
                    label: `${t('admin.dashboard.programs', 'Programs')} (${stats.lms.programs.active} ${t('admin.dashboard.active', 'active')})`,
                  },
                  {
                    value: stats.lms.courses.total.toString(),
                    label: `${t('admin.dashboard.courses', 'Courses')} (${stats.lms.courses.active} ${t('admin.dashboard.active', 'active')})`,
                  },
                  {
                    value: stats.lms.upcomingSessions.toString(),
                    label: t('admin.dashboard.next7d', 'Sessions next 7d'),
                  },
                  {
                    value: stats.products.total.toString(),
                    label: `${t('admin.dashboard.products', 'Products')} (${stats.products.paid}/${stats.products.free})`,
                  },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        {/* ─── Recent activity ─────────────────────────────────────── */}
        {/* Proper tables: one column-header row at the top + plain
            data rows below. Column labels are NOT repeated per row.
            Stacked vertically so each table gets full width. */}
        <div className="space-y-6">
          {/* Column layout for the enrollments table. Same shape used
              for the header AND each body row so they align. */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-baseline justify-between">
                <CardTitle className="text-base font-semibold" suppressHydrationWarning>
                  {t('admin.dashboard.recentEnrollments', 'Recent enrollments')}
                </CardTitle>
                <Link
                  href="/admin/enrollments"
                  className="text-xs text-primary hover:underline"
                  suppressHydrationWarning
                >
                  {t('admin.dashboard.viewAll', 'View all')}
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {stats.recentActivity.enrollments.length === 0 ? (
                <p
                  className="text-sm text-muted-foreground text-center py-8"
                  suppressHydrationWarning
                >
                  {t('admin.dashboard.noRecentEnrollments', 'No recent enrollments')}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                        <th className="text-start font-semibold px-6 py-2" suppressHydrationWarning>
                          {t('admin.dashboard.col.status', 'Status')}
                        </th>
                        <th className="text-start font-semibold px-6 py-2" suppressHydrationWarning>
                          {t('admin.dashboard.col.name', 'Name')}
                        </th>
                        <th className="text-start font-semibold px-6 py-2" suppressHydrationWarning>
                          {t('admin.dashboard.col.email', 'Email')}
                        </th>
                        <th className="text-start font-semibold px-6 py-2" suppressHydrationWarning>
                          {t('admin.dashboard.col.product', 'Product')}
                        </th>
                        <th className="text-end font-semibold px-6 py-2" suppressHydrationWarning>
                          {t('admin.dashboard.col.date', 'Date')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {stats.recentActivity.enrollments.map((enrollment) => {
                        const statusAccent =
                          enrollment.status === 'active'
                            ? 'text-green-600 dark:text-green-400'
                            : enrollment.status === 'pending'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-muted-foreground';
                        return (
                          <tr key={enrollment.id}>
                            <td className="px-6 py-3 align-top">
                              <span
                                className={`text-[11px] uppercase tracking-wider font-semibold ${statusAccent}`}
                              >
                                {t(
                                  `enrollments.status.${enrollment.status}`,
                                  enrollment.status,
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-3 align-top font-medium truncate">
                              {`${enrollment.users?.first_name ?? ''} ${enrollment.users?.last_name ?? ''}`.trim() || '—'}
                            </td>
                            <td className="px-6 py-3 align-top truncate text-muted-foreground">
                              {enrollment.users?.email ?? ''}
                            </td>
                            <td className="px-6 py-3 align-top truncate">
                              {enrollment.products?.title ?? '—'}
                            </td>
                            <td className="px-6 py-3 align-top text-end whitespace-nowrap text-muted-foreground">
                              {formatDate(enrollment.created_at)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-baseline justify-between">
                <CardTitle className="text-base font-semibold" suppressHydrationWarning>
                  {t('admin.dashboard.recentPayments', 'Recent payments')}
                </CardTitle>
                <Link
                  href="/admin/payments/transactions"
                  className="text-xs text-primary hover:underline"
                  suppressHydrationWarning
                >
                  {t('admin.dashboard.viewAll', 'View all')}
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {stats.recentActivity.payments.length === 0 ? (
                <p
                  className="text-sm text-muted-foreground text-center py-8"
                  suppressHydrationWarning
                >
                  {t('admin.dashboard.noRecentPayments', 'No recent payments')}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                        <th className="text-start font-semibold px-6 py-2" suppressHydrationWarning>
                          {t('admin.dashboard.col.amount', 'Amount')}
                        </th>
                        <th className="text-start font-semibold px-6 py-2" suppressHydrationWarning>
                          {t('admin.dashboard.col.name', 'Name')}
                        </th>
                        <th className="text-start font-semibold px-6 py-2" suppressHydrationWarning>
                          {t('admin.dashboard.col.email', 'Email')}
                        </th>
                        <th className="text-end font-semibold px-6 py-2" suppressHydrationWarning>
                          {t('admin.dashboard.col.date', 'Date')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {stats.recentActivity.payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-3 align-top font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                            {formatCurrency(parseFloat(payment.amount))}
                          </td>
                          <td className="px-6 py-3 align-top font-medium truncate">
                            {`${payment.user?.first_name ?? ''} ${payment.user?.last_name ?? ''}`.trim() || '—'}
                          </td>
                          <td className="px-6 py-3 align-top text-muted-foreground truncate">
                            {payment.user?.email ?? ''}
                          </td>
                          <td className="px-6 py-3 align-top text-end whitespace-nowrap text-muted-foreground">
                            {formatDate(payment.paid_date)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

// ─── Cohort row helper ─────────────────────────────────────────────
// Renders one labeled row of the "All numbers" table. Label sits on
// the left (eyebrow-style), four KPI cells fill the rest of the row.

function CohortRow({
  label,
  cells,
}: {
  label: string;
  cells: Array<{
    value: string;
    label: string;
    accent?: string;
    danger?: boolean;
  }>;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-3 md:gap-6 px-6 py-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold pt-1">
        {label}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
        {cells.map((cell, i) => (
          <div key={i}>
            <p
              className={`text-xl font-bold leading-tight ${cell.accent ?? ''} ${cell.danger ? 'text-amber-600 dark:text-amber-400' : ''}`}
            >
              {cell.value}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
              {cell.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
