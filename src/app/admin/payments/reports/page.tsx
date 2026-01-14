'use client';

export const dynamic = 'force-dynamic';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useAdminLanguage } from '@/context/AppContext';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Users,
  Settings,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

type TranslationFunction = (key: string, params?: Record<string, any> | string, context?: 'admin' | 'user') => string;

export default function ReportsPage() {
  const { t, direction, language } = useAdminLanguage();
  const [dateRange, setDateRange] = useState('last_30_days');
  const [reportType, setReportType] = useState('revenue');
  const isRtl = direction === 'rtl';
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const isMobile = windowWidth <= 640;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-6xl p-6 space-y-6" dir={direction}>
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Link href="/admin/payments">
              <Button variant="ghost" size="sm">
                <ArrowLeft className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                <span suppressHydrationWarning>{t('common.back', 'Back')}</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold" suppressHydrationWarning>{t('admin.payments.reports.title', 'Payment Reports')}</h1>
              <p className="text-muted-foreground mt-1" suppressHydrationWarning>
                {t('admin.payments.reports.description', 'Comprehensive payment analytics and insights')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir={direction}>
                <SelectItem value="today"><span suppressHydrationWarning>{t('admin.payments.reports.today', 'Today')}</span></SelectItem>
                <SelectItem value="last_7_days"><span suppressHydrationWarning>{t('admin.payments.reports.last7Days', 'Last 7 Days')}</span></SelectItem>
                <SelectItem value="last_30_days"><span suppressHydrationWarning>{t('admin.payments.reports.last30Days', 'Last 30 Days')}</span></SelectItem>
                <SelectItem value="last_90_days"><span suppressHydrationWarning>{t('admin.payments.reports.last90Days', 'Last 90 Days')}</span></SelectItem>
                <SelectItem value="this_year"><span suppressHydrationWarning>{t('admin.payments.reports.thisYear', 'This Year')}</span></SelectItem>
                <SelectItem value="custom"><span suppressHydrationWarning>{t('admin.payments.reports.customRange', 'Custom Range')}</span></SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              <span suppressHydrationWarning>{t('admin.payments.reports.export', 'Export')}</span>
            </Button>
          </div>
        </div>

        {/* Report Tabs */}
        <Tabs value={reportType} onValueChange={setReportType}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            <TabsTrigger value="revenue"><span suppressHydrationWarning>{t('admin.payments.reports.tabs.revenue', 'Revenue')}</span></TabsTrigger>
            <TabsTrigger value="status"><span suppressHydrationWarning>{t('admin.payments.reports.tabs.status', 'Status')}</span></TabsTrigger>
            <TabsTrigger value="cashflow"><span suppressHydrationWarning>{t('admin.payments.reports.tabs.cashflow', 'Cash Flow')}</span></TabsTrigger>
            <TabsTrigger value="products"><span suppressHydrationWarning>{t('admin.payments.reports.tabs.products', 'Products')}</span></TabsTrigger>
            <TabsTrigger value="users"><span suppressHydrationWarning>{t('admin.payments.reports.tabs.users', 'Users')}</span></TabsTrigger>
            <TabsTrigger value="plans"><span suppressHydrationWarning>{t('admin.payments.reports.tabs.plans', 'Plans')}</span></TabsTrigger>
            <TabsTrigger value="operational"><span suppressHydrationWarning>{t('admin.payments.reports.tabs.operational', 'Operational')}</span></TabsTrigger>
          </TabsList>

          {/* Revenue Dashboard */}
          <TabsContent value="revenue" className="space-y-6">
            <RevenueReport t={t} isRtl={isRtl} dateRange={dateRange} language={language} />
          </TabsContent>

          {/* Payment Status Report */}
          <TabsContent value="status" className="space-y-6">
            <PaymentStatusReport t={t} isRtl={isRtl} />
          </TabsContent>

          {/* Cash Flow Report */}
          <TabsContent value="cashflow" className="space-y-6">
            <CashFlowReport t={t} isRtl={isRtl} language={language} />
          </TabsContent>

          {/* Product Performance */}
          <TabsContent value="products" className="space-y-6">
            <ProductPerformanceReport t={t} isRtl={isRtl} />
          </TabsContent>

          {/* User Analysis */}
          <TabsContent value="users" className="space-y-6">
            <UserAnalysisReport t={t} isRtl={isRtl} />
          </TabsContent>

          {/* Payment Plans Analysis */}
          <TabsContent value="plans" className="space-y-6">
            <PaymentPlansReport t={t} isRtl={isRtl} />
          </TabsContent>

          {/* Operational Report */}
          <TabsContent value="operational" className="space-y-6">
            <OperationalReport t={t} isRtl={isRtl} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// Revenue Report Component
function RevenueReport({ t, isRtl, dateRange, language }: { t: TranslationFunction; isRtl: boolean; dateRange: string; language: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, [dateRange]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/payments/reports/revenue?range=${dateRange}`);
      if (!response.ok) throw new Error('Failed to fetch revenue data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', {
      style: 'currency',
      currency: data.currency || 'USD',
    }).format(amount);
  };

  const formatCurrencyCompact = (amount: number) => {
    return new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', {
      style: 'currency',
      currency: data.currency || 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const translatePaymentType = (type: string) => {
    const typeMap: Record<string, string> = {
      'full': t('admin.payments.paymentType.full', 'Full Payment'),
      'deposit': t('admin.payments.paymentType.deposit', 'Deposit'),
      'installment': t('admin.payments.paymentType.installment', 'Installment'),
      'subscription': t('admin.payments.paymentType.subscription', 'Subscription'),
      'unknown': t('admin.payments.paymentType.unknown', 'Unknown'),
    };
    return typeMap[type] || type;
  };

  const revenueByType = data.revenueByType.map((item: any) => ({
    ...item,
    name: translatePaymentType(item.name)
  }));

  return (
    <>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground" suppressHydrationWarning>
              {t('admin.payments.reports.totalExpectedIncome', 'Total Expected Income')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words" suppressHydrationWarning>{formatCurrencyCompact(data.summary.totalExpectedIncome)}</div>
            <p className="text-xs text-muted-foreground mt-2" suppressHydrationWarning>
              {t('admin.payments.reports.allSchedules', 'All Schedules')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground" suppressHydrationWarning>
              {t('admin.payments.totalRevenue', 'Total Revenue')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words" suppressHydrationWarning>{formatCurrencyCompact(data.summary.totalRevenue)}</div>
            <div className={`flex items-center text-sm mt-2 ${data.summary.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.summary.revenueGrowth >= 0 ? (
                <ArrowUpRight className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
              )}
              <span suppressHydrationWarning>{data.summary.revenueGrowth >= 0 ? '+' : ''}{data.summary.revenueGrowth}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground" suppressHydrationWarning>
              {t('admin.payments.reports.avgTransaction', 'Avg Transaction')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words" suppressHydrationWarning>{formatCurrencyCompact(data.summary.avgTransaction)}</div>
            <div className={`flex items-center text-sm mt-2 ${data.summary.avgGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.summary.avgGrowth >= 0 ? (
                <ArrowUpRight className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
              )}
              <span suppressHydrationWarning>{data.summary.avgGrowth >= 0 ? '+' : ''}{data.summary.avgGrowth}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground" suppressHydrationWarning>
              {t('admin.payments.mrr', 'MRR')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words" suppressHydrationWarning>{formatCurrencyCompact(data.summary.mrr)}</div>
            <p className="text-xs text-muted-foreground mt-2" suppressHydrationWarning>
              {t('admin.payments.reports.monthlyRecurring', 'Monthly Recurring')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground" suppressHydrationWarning>
              {t('admin.payments.arr', 'ARR')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words" suppressHydrationWarning>{formatCurrencyCompact(data.summary.arr)}</div>
            <p className="text-xs text-muted-foreground mt-2" suppressHydrationWarning>
              {t('admin.payments.reports.arrDescription', 'Annual Recurring Revenue')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Over Time */}
      <Card>
        <CardHeader>
          <CardTitle suppressHydrationWarning>{t('admin.payments.reports.revenueTrend', 'Revenue Trend')}</CardTitle>
          <CardDescription suppressHydrationWarning>
            {t('admin.payments.reports.revenueTrendDescription', 'Revenue performance over time')} • {data.summary.transactionCount} <span suppressHydrationWarning>{t('admin.payments.reports.transactions', 'transactions')}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.revenueOverTime.length > 0 ? (
            <ReactECharts
              option={{
                grid: { left: 90, right: 30, top: 40, bottom: 70 },
                xAxis: {
                  type: 'category',
                  data: data.revenueOverTime.map((item: any) => new Date(item.date).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', { month: 'short', day: 'numeric' })),
                  inverse: isRtl,
                  axisLabel: {
                    color: '#374151',
                    fontSize: 13,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  },
                },
                yAxis: {
                  type: 'value',
                  axisLabel: {
                    formatter: (value: number) => formatCurrencyCompact(value),
                    color: '#374151',
                    fontSize: 13,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  },
                },
                tooltip: {
                  trigger: 'axis',
                  formatter: (params: any) => {
                    const item = params[0];
                    return `${item.name}<br/>${t('admin.payments.reports.charts.revenue', 'Revenue')}: ${formatCurrency(item.value)}`;
                  },
                  textStyle: {
                    fontSize: 13,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  },
                },
                legend: {
                  data: [t('admin.payments.reports.charts.revenue', 'Revenue')],
                  bottom: 0,
                  textStyle: {
                    color: '#374151',
                    fontSize: 13,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  },
                },
                series: [
                  {
                    name: t('admin.payments.reports.charts.revenue', 'Revenue'),
                    type: 'line',
                    data: data.revenueOverTime.map((item: any) => item.revenue),
                    smooth: true,
                    lineStyle: { width: 2 },
                    itemStyle: { color: '#3b82f6' },
                  },
                ],
              } as EChartsOption}
              style={{ height: '300px' }}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground" suppressHydrationWarning>
              {t('admin.payments.reports.noData', 'No data available for this period')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue by Type */}
      {revenueByType.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle suppressHydrationWarning>{t('admin.payments.reports.revenueByType', 'Revenue by Type')}</CardTitle>
              <CardDescription suppressHydrationWarning>{t('admin.payments.reports.revenueByTypeDescription', 'Revenue breakdown by payment type')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ReactECharts
                option={{
                  tooltip: {
                    trigger: 'item',
                    formatter: (params: any) => `${params.name}: ${formatCurrency(params.value)} (${params.percent}%)`,
                    textStyle: {
                      fontSize: 13,
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    },
                  },
                  legend: {
                    bottom: 0,
                    left: 'center',
                    textStyle: {
                      fontSize: 13,
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      color: '#374151',
                    },
                  },
                  series: [
                    {
                      type: 'pie',
                      radius: '60%',
                      data: revenueByType.map((item: any, index: any) => ({
                        name: item.name,
                        value: item.value,
                        itemStyle: { color: COLORS[index % COLORS.length] },
                      })),
                      emphasis: {
                        itemStyle: {
                          shadowBlur: 10,
                          shadowOffsetX: 0,
                          shadowColor: 'rgba(0, 0, 0, 0.5)',
                        },
                      },
                      label: {
                        formatter: '{d}%',
                        fontSize: 14,
                        fontWeight: 'bold',
                        color: '#1f2937',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                      },
                    },
                  ],
                } as EChartsOption}
                style={{ height: '350px' }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle suppressHydrationWarning>{t('admin.payments.reports.revenueDistribution', 'Revenue Distribution')}</CardTitle>
              <CardDescription suppressHydrationWarning>{t('admin.payments.reports.revenueDistributionDescription', 'Detailed revenue distribution breakdown')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueByType.map((item: any, index: any) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: COLORS[index] }}
                        />
                        <span className="font-medium" suppressHydrationWarning>{item.name}</span>
                      </div>
                      <span className="font-bold" suppressHydrationWarning>{formatCurrency(item.value)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: COLORS[index],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

// Payment Status Report Component
function PaymentStatusReport({ t, isRtl }: { t: TranslationFunction; isRtl: boolean }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatusData();
  }, []);

  const fetchStatusData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/payments/reports/status');
      if (!response.ok) throw new Error('Failed to fetch status data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching status data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const translateStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'paid': t('admin.payments.schedules.statuses.paid', 'Paid'),
      'pending': t('admin.payments.schedules.statuses.pending', 'Pending'),
      'overdue': t('admin.payments.schedules.statuses.overdue', 'Overdue'),
      'failed': t('admin.payments.schedules.statuses.failed', 'Failed'),
    };
    return statusMap[status] || status;
  };

  // All status cards (show all even if 0)
  const allStatusData = data.statusBreakdown.map((item: any) => ({
    ...item,
    status: translateStatus(item.status)
  }));

  // Only non-zero statuses for pie chart
  const statusDataForChart = data.statusBreakdown
    .filter((item: any) => item.count > 0)
    .map((item: any) => ({
      ...item,
      status: translateStatus(item.status)
    }));

  const getStatusColor = (statusKey: string) => {
    const normalizedStatus = statusKey.toLowerCase();
    const translatedPaid = t('admin.payments.schedules.statuses.paid', 'Paid').toLowerCase();
    const translatedPending = t('admin.payments.schedules.statuses.pending', 'Pending').toLowerCase();
    const translatedOverdue = t('admin.payments.schedules.statuses.overdue', 'Overdue').toLowerCase();
    const translatedFailed = t('admin.payments.schedules.statuses.failed', 'Failed').toLowerCase();

    if (normalizedStatus === translatedPaid) return '#10b981';
    if (normalizedStatus === translatedPending) return '#f59e0b';
    if (normalizedStatus === translatedOverdue) return '#ef4444';
    if (normalizedStatus === translatedFailed) return '#dc2626';
    return '#6b7280';
  };

  const getStatusIcon = (statusKey: string) => {
    const normalizedStatus = statusKey.toLowerCase();
    const translatedPaid = t('admin.payments.schedules.statuses.paid', 'Paid').toLowerCase();
    const translatedPending = t('admin.payments.schedules.statuses.pending', 'Pending').toLowerCase();
    const translatedOverdue = t('admin.payments.schedules.statuses.overdue', 'Overdue').toLowerCase();
    const translatedFailed = t('admin.payments.schedules.statuses.failed', 'Failed').toLowerCase();

    if (normalizedStatus === translatedPaid) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (normalizedStatus === translatedPending) return <Clock className="h-5 w-5 text-amber-600" />;
    if (normalizedStatus === translatedOverdue) return <AlertCircle className="h-5 w-5 text-red-600" />;
    if (normalizedStatus === translatedFailed) return <XCircle className="h-5 w-5 text-red-600" />;
    return <XCircle className="h-5 w-5 text-gray-600" />;
  };

  // Calculate completion rates
  const paidCount = data.statusBreakdown.find((s: any) => s.status === 'paid')?.count || 0;
  const overdueCount = data.statusBreakdown.find((s: any) => s.status === 'overdue')?.count || 0;
  const failedCount = data.statusBreakdown.find((s: any) => s.status === 'failed')?.count || 0;
  const totalCompleted = paidCount + overdueCount + failedCount;

  const onTimeRate = totalCompleted > 0 ? (paidCount / data.totalSchedules) * 100 : 0;
  const lateRate = totalCompleted > 0 ? (overdueCount / data.totalSchedules) * 100 : 0;
  const defaultRate = totalCompleted > 0 ? (failedCount / data.totalSchedules) * 100 : 0;

  return (
    <>
      {/* Status Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        {allStatusData.map((item: any) => (
          <Card key={item.status}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground" suppressHydrationWarning>
                  {item.status}
                </CardTitle>
                {getStatusIcon(item.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.count}</div>
              <p className="text-sm text-muted-foreground mt-1">
                ${item.amount.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle suppressHydrationWarning>{t('admin.payments.reports.statusDistribution', 'Status Distribution')}</CardTitle>
            <CardDescription suppressHydrationWarning>{t('admin.payments.reports.statusDistributionDescription', 'Payment status breakdown')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'item',
                  formatter: (params: any) => `${params.name}: ${params.value} (${params.percent}%)`,
                  textStyle: {
                    fontSize: 13,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  },
                },
                legend: {
                  bottom: 0,
                  left: 'center',
                  textStyle: {
                    color: '#374151',
                    fontSize: 13,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  },
                },
                series: [
                  {
                    type: 'pie',
                    radius: '60%',
                    data: statusDataForChart.map((item: any) => ({
                      name: item.status,
                      value: item.count,
                      itemStyle: { color: getStatusColor(item.status) },
                    })),
                    emphasis: {
                      itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)',
                      },
                    },
                    label: {
                      formatter: '{d}%',
                      fontSize: 14,
                      fontWeight: 'bold',
                      color: '#1f2937',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    },
                  },
                ],
              } as EChartsOption}
              style={{ height: '350px' }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle suppressHydrationWarning>{t('admin.payments.reports.completionRate', 'Completion Rate')}</CardTitle>
            <CardDescription suppressHydrationWarning>{t('admin.payments.reports.completionRateDescription', 'Payment completion analysis')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" suppressHydrationWarning>{t('admin.payments.reports.onTime', 'On Time')}</span>
                <span className="text-2xl font-bold text-green-600" suppressHydrationWarning>{onTimeRate.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-600" style={{ width: `${onTimeRate}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" suppressHydrationWarning>{t('admin.payments.reports.late', 'Late')}</span>
                <span className="text-2xl font-bold text-amber-600" suppressHydrationWarning>{lateRate.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-600" style={{ width: `${lateRate}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" suppressHydrationWarning>{t('admin.payments.reports.default', 'Default')}</span>
                <span className="text-2xl font-bold text-red-600" suppressHydrationWarning>{defaultRate.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-600" style={{ width: `${defaultRate}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Trend Over Time */}
      {data.statusOverTime && data.statusOverTime.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle suppressHydrationWarning>{t('admin.payments.reports.statusTrend', 'Payment Status Trend')}</CardTitle>
            <CardDescription suppressHydrationWarning>{t('admin.payments.reports.statusTrendDescription', 'Payment status distribution over the last 6 months')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ReactECharts
              option={{
                grid: {
                  left: isRtl ? 30 : 60,
                  right: isRtl ? 60 : 30,
                  top: 40,
                  bottom: 90
                },
                xAxis: {
                  type: 'category',
                  data: data.statusOverTime.map((item: any) => item.month),
                  inverse: isRtl,
                  axisLabel: {
                    rotate: isRtl ? 0 : 0,
                    color: '#374151',
                    fontSize: 13,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  },
                },
                yAxis: {
                  type: 'value',
                  position: isRtl ? 'right' : 'left',
                  axisLabel: {
                    color: '#374151',
                    fontSize: 13,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  },
                },
                tooltip: {
                  trigger: 'axis',
                  axisPointer: { type: 'cross' },
                  formatter: (params: any) => {
                    let result = `<strong>${params[0].axisValue}</strong><br/>`;
                    params.forEach((item: any) => {
                      result += `${item.marker} ${item.seriesName}: ${item.value}<br/>`;
                    });
                    return result;
                  },
                  textStyle: {
                    fontSize: 13,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  },
                },
                legend: {
                  data: [translateStatus('paid'), translateStatus('pending'), translateStatus('overdue'), translateStatus('failed')],
                  bottom: 0,
                  orient: 'horizontal',
                  left: 'center',
                  itemGap: 20,
                  padding: [10, 0, 0, 0],
                  textStyle: {
                    color: '#374151',
                    fontSize: 13,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  },
                },
                series: [
                  {
                    name: translateStatus('paid'),
                    type: 'line',
                    stack: 'Total',
                    areaStyle: {
                      opacity: 0.7,
                    },
                    smooth: true,
                    data: data.statusOverTime.map((item: any) => item.paid),
                    itemStyle: { color: '#10b981' },
                    lineStyle: { width: 2 },
                  },
                  {
                    name: translateStatus('pending'),
                    type: 'line',
                    stack: 'Total',
                    areaStyle: {
                      opacity: 0.7,
                    },
                    smooth: true,
                    data: data.statusOverTime.map((item: any) => item.pending),
                    itemStyle: { color: '#f59e0b' },
                    lineStyle: { width: 2 },
                  },
                  {
                    name: translateStatus('overdue'),
                    type: 'line',
                    stack: 'Total',
                    areaStyle: {
                      opacity: 0.7,
                    },
                    smooth: true,
                    data: data.statusOverTime.map((item: any) => item.overdue),
                    itemStyle: { color: '#ef4444' },
                    lineStyle: { width: 2 },
                  },
                  {
                    name: translateStatus('failed'),
                    type: 'line',
                    stack: 'Total',
                    areaStyle: {
                      opacity: 0.7,
                    },
                    smooth: true,
                    data: data.statusOverTime.map((item: any) => item.failed),
                    itemStyle: { color: '#dc2626' },
                    lineStyle: { width: 2 },
                  },
                ],
              } as EChartsOption}
              style={{ height: '350px' }}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}

// Cash Flow Report Component
function CashFlowReport({ t, isRtl, language }: { t: TranslationFunction; isRtl: boolean; language: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCashFlowData();
  }, []);

  const fetchCashFlowData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/payments/reports/cashflow');
      if (!response.ok) throw new Error('Failed to fetch cash flow data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching cash flow data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatCurrencyCompact = (amount: number) => {
    return new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const translateMonth = (monthKey: string) => {
    return t(`common.months.${monthKey}`, monthKey);
  };

  // Translate months in forecast data and reverse for RTL
  const translatedForecast = data.forecast.map((item: any) => ({
    ...item,
    month: translateMonth(item.monthKey)
  }));

  // Reverse the array for RTL to show chronologically from right to left
  if (isRtl) {
    translatedForecast.reverse();
  }

  return (
    <>
      {/* Current Month Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground" suppressHydrationWarning>
              {t('admin.payments.reports.expectedThisMonth', 'Expected This Month')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words" suppressHydrationWarning>{formatCurrencyCompact(data.currentMonth.expected)}</div>
            <p className="text-sm text-muted-foreground mt-1" suppressHydrationWarning>{t('admin.payments.reports.fromAllSources', 'From all sources')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground" suppressHydrationWarning>
              {t('admin.payments.reports.received', 'Received')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 break-words" suppressHydrationWarning>{formatCurrencyCompact(data.currentMonth.received)}</div>
            <p className="text-sm text-muted-foreground mt-1" suppressHydrationWarning>{t('admin.payments.reports.ofExpected', 'Of expected')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground" suppressHydrationWarning>
              {t('common.pending', 'Pending')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 break-words" suppressHydrationWarning>{formatCurrencyCompact(data.currentMonth.pending)}</div>
            <p className="text-sm text-muted-foreground mt-1" suppressHydrationWarning>{t('admin.payments.reports.remaining', 'Remaining')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Forecast */}
      <Card>
        <CardHeader>
          <CardTitle suppressHydrationWarning>{t('admin.payments.reports.cashFlowForecast', 'Cash Flow Forecast')}</CardTitle>
          <CardDescription suppressHydrationWarning>{t('admin.payments.reports.cashFlowForecastDescription', 'Projected cash flow for upcoming months')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ReactECharts
            option={{
              grid: { left: 90, right: 30, top: 40, bottom: 70 },
              xAxis: {
                type: 'category',
                data: translatedForecast.map((item: any) => item.month),
                inverse: isRtl,
                axisLabel: {
                  color: '#374151',
                  fontSize: 13,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                },
              },
              yAxis: {
                type: 'value',
                axisLabel: {
                  formatter: (value: number) => formatCurrency(value),
                  color: '#374151',
                  fontSize: 13,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                },
              },
              tooltip: {
                trigger: 'axis',
                formatter: (params: any) => {
                  const item = params[0];
                  return `${item.name}<br/>${t('admin.payments.reports.charts.expectedRevenue', 'Expected Revenue')}: ${formatCurrency(item.value)}`;
                },
                textStyle: {
                  fontSize: 13,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                },
              },
              legend: {
                data: [t('admin.payments.reports.charts.expectedRevenue', 'Expected Revenue')],
                bottom: 0,
                textStyle: {
                  color: '#374151',
                  fontSize: 13,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                },
              },
              series: [
                {
                  name: t('admin.payments.reports.charts.expectedRevenue', 'Expected Revenue'),
                  type: 'line',
                  data: translatedForecast.map((item: any) => item.expected),
                  smooth: true,
                  areaStyle: {
                    color: {
                      type: 'linear',
                      x: 0,
                      y: 0,
                      x2: 0,
                      y2: 1,
                      colorStops: [
                        { offset: 0, color: 'rgba(59, 130, 246, 0.8)' },
                        { offset: 1, color: 'rgba(59, 130, 246, 0)' },
                      ],
                    },
                  },
                  itemStyle: { color: '#3b82f6' },
                },
              ],
            } as EChartsOption}
            style={{ height: '350px' }}
          />
        </CardContent>
      </Card>

      {/* Revenue Sources */}
      <Card>
        <CardHeader>
          <CardTitle suppressHydrationWarning>{t('admin.payments.reports.revenueSourcesBreakdown', 'Revenue Sources Breakdown')}</CardTitle>
          <CardDescription suppressHydrationWarning>{t('admin.payments.reports.revenueSourcesDescription', 'Revenue by source type')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ReactECharts
            option={{
              grid: { left: 90, right: 30, top: 40, bottom: 70 },
              xAxis: {
                type: 'category',
                data: translatedForecast.map((item: any) => item.month),
                inverse: isRtl,
                axisLabel: {
                  color: '#374151',
                  fontSize: 13,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                },
              },
              yAxis: {
                type: 'value',
                axisLabel: {
                  formatter: (value: number) => formatCurrency(value),
                  color: '#374151',
                  fontSize: 13,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                },
              },
              tooltip: {
                trigger: 'axis',
                formatter: (params: any) => {
                  let result = `${params[0].name}<br/>`;
                  params.forEach((item: any) => {
                    result += `${item.seriesName}: ${formatCurrency(item.value)}<br/>`;
                  });
                  return result;
                },
                textStyle: {
                  fontSize: 13,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                },
              },
              legend: {
                data: [
                  t('admin.payments.reports.charts.scheduledPayments', 'Scheduled Payments'),
                  t('admin.payments.reports.charts.subscriptionRevenue', 'Subscription Revenue'),
                ],
                bottom: 0,
                textStyle: {
                  color: '#374151',
                  fontSize: 13,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                },
              },
              series: [
                {
                  name: t('admin.payments.reports.charts.scheduledPayments', 'Scheduled Payments'),
                  type: 'bar',
                  data: translatedForecast.map((item: any) => item.scheduled),
                  itemStyle: { color: '#3b82f6' },
                },
                {
                  name: t('admin.payments.reports.charts.subscriptionRevenue', 'Subscription Revenue'),
                  type: 'bar',
                  data: translatedForecast.map((item: any) => item.subscription),
                  itemStyle: { color: '#10b981' },
                },
              ],
            } as EChartsOption}
            style={{ height: '300px' }}
          />
        </CardContent>
      </Card>
    </>
  );
}

// Product Performance Report
function ProductPerformanceReport({ t, isRtl }: { t: TranslationFunction; isRtl: boolean }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductData();
  }, []);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/payments/reports/products');
      if (!response.ok) throw new Error('Failed to fetch product data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching product data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const productData = data.products || [];

  const translatePlanType = (planType: string) => {
    const planMap: Record<string, string> = {
      'one_time': t('admin.payments.plans.types.oneTime', 'One-Time Payment'),
      'deposit': t('admin.payments.plans.types.deposit', 'Deposit Payment'),
      'installments': t('admin.payments.plans.types.installments', 'Installments'),
      'subscription': t('admin.payments.plans.types.subscription', 'Subscription'),
      'unknown': t('admin.payments.paymentType.unknown', 'Unknown'),
    };
    return planMap[planType] || planType;
  };

  return (
    <>
      {/* Top Products by Revenue */}
      {productData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle suppressHydrationWarning>{t('admin.payments.reports.revenueByProduct', 'Revenue by Product')}</CardTitle>
            <CardDescription suppressHydrationWarning>{t('admin.payments.reports.revenueByProductDescription', 'Top products by revenue generation')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ReactECharts
              option={{
                grid: { left: 160, right: 30, top: 20, bottom: 40 },
                xAxis: {
                  type: 'value',
                  axisLabel: {
                    fontSize: 13,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    color: '#374151',
                  },
                },
                yAxis: {
                  type: 'category',
                  data: productData.map((item: any) => item.name),
                  inverse: !isRtl,
                  axisLabel: {
                    fontSize: 13,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    color: '#374151',
                  },
                },
                tooltip: {
                  trigger: 'axis',
                  axisPointer: { type: 'shadow' },
                  formatter: (params: any) => {
                    const item = params[0];
                    return `${item.name}<br/>${t('admin.payments.reports.charts.revenue', 'Revenue')}: $${item.value.toLocaleString()}`;
                  },
                  textStyle: {
                    fontSize: 13,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  },
                },
                series: [
                  {
                    name: t('admin.payments.reports.charts.revenue', 'Revenue'),
                    type: 'bar',
                    data: productData.map((item: any) => item.revenue),
                    itemStyle: { color: '#3b82f6' },
                  },
                ],
              } as EChartsOption}
              style={{ height: '300px' }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground" suppressHydrationWarning>
              {t('admin.payments.reports.noData', 'No data available for this period')}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Details Table */}
      {productData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle suppressHydrationWarning>{t('admin.payments.reports.productPerformanceDetails', 'Product Performance Details')}</CardTitle>
            <CardDescription suppressHydrationWarning>{t('admin.payments.reports.productPerformanceDescription', 'Detailed product performance metrics')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productData.map((product: any, index: any) => (
                <div key={product.id || index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        <span suppressHydrationWarning>{t('admin.payments.reports.preferredPlan', 'Preferred plan')}</span>: {translatePlanType(product.plan)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">${product.revenue.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.enrollments} <span suppressHydrationWarning>{t('admin.payments.reports.enrollments', 'enrollments')}</span>
                      </p>
                    </div>
                  </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span suppressHydrationWarning>{t('admin.payments.reports.paymentCompletionRate', 'Payment completion rate')}</span>
                    <span className="font-semibold">{product.completion}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600"
                      style={{ width: `${product.completion}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// User Analysis Report
function UserAnalysisReport({ t, isRtl }: { t: TranslationFunction; isRtl: boolean }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/payments/reports/users');
      if (!response.ok) throw new Error('Failed to fetch user data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const userSegments = data.userSegments || [];
  const planTrends = data.planTrends || [];

  const translateSegment = (segment: string) => {
    const segmentMap: Record<string, string> = {
      'students': t('admin.payments.reports.segments.students', 'Students'),
      'instructors': t('admin.payments.reports.segments.instructors', 'Instructors'),
      'staff': t('admin.payments.reports.segments.staff', 'Staff'),
    };
    return segmentMap[segment] || segment;
  };

  // Ensure we always have all three segments
  const allSegments = ['students', 'instructors', 'staff'];
  const segmentData = allSegments.map(segment => {
    const existing = userSegments.find((s: any) => s.segment === segment);
    return existing || { segment, users: 0, revenue: 0, avg: 0 };
  });

  return (
    <>
      {/* User Segments - Always show */}
      <div className="grid gap-4 md:grid-cols-3">
        {segmentData.map((segment: any, index: number) => (
          <Card key={segment.segment}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground" suppressHydrationWarning>
                {translateSegment(segment.segment)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{segment.users}</div>
              <p className="text-sm text-muted-foreground mt-1">
                ${segment.revenue.toLocaleString()} <span suppressHydrationWarning>{t('common.total', 'total')}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <span suppressHydrationWarning>{t('admin.payments.reports.avg', 'Avg')}</span>: ${segment.avg.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Segment Revenue Distribution - Always show */}
      <Card>
        <CardHeader>
          <CardTitle suppressHydrationWarning>{t('admin.payments.reports.revenueByUserSegment', 'Revenue by User Segment')}</CardTitle>
          <CardDescription suppressHydrationWarning>{t('admin.payments.reports.revenueByUserSegmentDescription', 'Revenue distribution across user segments')}</CardDescription>
        </CardHeader>
        <CardContent>
          {userSegments.length > 0 ? (
            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'item',
                  formatter: (params: any) => `${translateSegment(params.name)}: $${params.value.toLocaleString()} (${params.percent}%)`,
                  textStyle: {
                    fontSize: 13,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  },
                },
                legend: {
                  bottom: 0,
                  left: 'center',
                  textStyle: {
                    fontSize: 13,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    color: '#374151',
                  },
                },
                series: [
                  {
                    type: 'pie',
                    radius: '60%',
                    data: userSegments.map((item: any, index: number) => ({
                      name: item.segment,
                      value: item.revenue,
                      itemStyle: { color: COLORS[index % COLORS.length] },
                    })),
                    label: {
                      formatter: '{d}%',
                      fontSize: 14,
                      fontWeight: 'bold',
                      color: '#1f2937',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    },
                    emphasis: {
                      itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)',
                      },
                    },
                  },
                ],
              } as EChartsOption}
              style={{ height: '350px' }}
            />
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground" suppressHydrationWarning>
              {t('admin.payments.reports.noData', 'No data available for this period')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Selection Trends - Always show */}
      <Card>
        <CardHeader>
          <CardTitle suppressHydrationWarning>{t('admin.payments.reports.planSelectionTrends', 'Plan Selection Trends')}</CardTitle>
          <CardDescription suppressHydrationWarning>{t('admin.payments.reports.planSelectionTrendsDescription', 'How users select payment plans over time')}</CardDescription>
        </CardHeader>
        <CardContent>
          {planTrends.length > 0 ? (
            <ReactECharts
              option={{
                grid: { left: 60, right: 30, top: 40, bottom: 90 },
                xAxis: {
                  type: 'category',
                  data: planTrends.map((item: any) => item.month),
                  inverse: isRtl,
                  axisLabel: {
                    fontSize: 13,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    color: '#374151',
                  },
                },
                yAxis: {
                  type: 'value',
                  axisLabel: {
                    fontSize: 13,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    color: '#374151',
                  },
                },
                tooltip: {
                  trigger: 'axis',
                  axisPointer: { type: 'cross' },
                  textStyle: {
                    fontSize: 13,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  },
                },
                legend: {
                  data: [
                    t('admin.payments.plans.types.oneTime', 'One-Time Payment'),
                    t('admin.payments.plans.types.deposit', 'Deposit Payment'),
                    t('admin.payments.plans.types.installments', 'Installments'),
                    t('admin.payments.plans.types.subscription', 'Subscription'),
                  ],
                  bottom: 0,
                  textStyle: {
                    fontSize: 13,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    color: '#374151',
                  },
                },
                series: [
                  {
                    name: t('admin.payments.plans.types.oneTime', 'One-Time Payment'),
                    type: 'line',
                    stack: 'Total',
                    areaStyle: {},
                    data: planTrends.map((item: any) => item.oneTime),
                    itemStyle: { color: '#3b82f6' },
                  },
                  {
                    name: t('admin.payments.plans.types.deposit', 'Deposit Payment'),
                    type: 'line',
                    stack: 'Total',
                    areaStyle: {},
                    data: planTrends.map((item: any) => item.deposit),
                    itemStyle: { color: '#8b5cf6' },
                  },
                  {
                    name: t('admin.payments.plans.types.installments', 'Installments'),
                    type: 'line',
                    stack: 'Total',
                    areaStyle: {},
                    data: planTrends.map((item: any) => item.installments),
                    itemStyle: { color: '#10b981' },
                  },
                  {
                    name: t('admin.payments.plans.types.subscription', 'Subscription'),
                    type: 'line',
                    stack: 'Total',
                    areaStyle: {},
                    data: planTrends.map((item: any) => item.subscription),
                    itemStyle: { color: '#f59e0b' },
                  },
                ],
              } as EChartsOption}
              style={{ height: '350px' }}
            />
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground" suppressHydrationWarning>
              {t('admin.payments.reports.noData', 'No data available for this period')}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// Payment Plans Report (NEW - Per Your Request)
function PaymentPlansReport({ t, isRtl }: { t: TranslationFunction; isRtl: boolean }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlansData();
  }, []);

  const fetchPlansData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/payments/reports/plans');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching plans data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const planPerformanceData = data?.planPerformance || [];
  const planTrendsData = data?.planTrends || [];

  // Helper function to get plan name
  const getPlanName = (type: string) => {
    switch (type) {
      case 'one_time':
        return t('admin.payments.plans.types.oneTime', 'One-Time Payment');
      case 'deposit':
        return t('admin.payments.plans.types.deposit', 'Deposit Payment');
      case 'installments':
        return t('admin.payments.plans.types.installments', 'Installments');
      case 'subscription':
        return t('admin.payments.plans.types.subscription', 'Subscription');
      default:
        return t('admin.payments.plans.types.unknown', 'Unknown');
    }
  };

  // Ensure we always have all plan types
  const allPlanTypes = ['one_time', 'deposit', 'installments', 'subscription'];
  const planPerformance = allPlanTypes.map(planType => {
    const existing = planPerformanceData.find((p: any) => p.type === planType);
    return existing ? {
      plan: getPlanName(planType),
      enrollments: existing.enrollments,
      revenue: existing.revenue,
      avg: existing.avg,
      completion: existing.completion
    } : {
      plan: getPlanName(planType),
      enrollments: 0,
      revenue: 0,
      avg: 0,
      completion: 0
    };
  });

  return (
    <>
      {/* Plan Performance Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        {planPerformance.map((plan, index: any) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground" suppressHydrationWarning>
                {plan.plan}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plan.enrollments}</div>
              <p className="text-sm text-green-600 mt-1">
                ${plan.revenue.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <span suppressHydrationWarning>{t('admin.payments.reports.avg', 'Avg')}</span>: ${plan.avg} • {plan.completion}% <span suppressHydrationWarning>{t('common.complete', 'complete')}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Usage Trend */}
      <Card>
        <CardHeader>
          <CardTitle suppressHydrationWarning>{t('admin.payments.reports.planSelectionTrends', 'Plan Selection Trends')}</CardTitle>
          <CardDescription suppressHydrationWarning>{t('admin.payments.reports.planSelectionTrendsDescription', 'How users select payment plans over time')}</CardDescription>
        </CardHeader>
        <CardContent>
          {planTrendsData.length > 0 ? (
            <ReactECharts
              option={{
                grid: { left: 60, right: 30, top: 40, bottom: 90 },
                xAxis: {
                  type: 'category',
                  data: planTrendsData.map((item: any) => item.month),
                  inverse: isRtl,
                  axisLabel: {
                    fontSize: 13,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    color: '#374151',
                  },
                },
                yAxis: {
                  type: 'value',
                  axisLabel: {
                    fontSize: 13,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    color: '#374151',
                  },
                },
                tooltip: {
                  trigger: 'axis',
                  axisPointer: { type: 'cross' },
                  textStyle: {
                    fontSize: 13,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  },
                },
                legend: {
                  data: [
                    t('admin.payments.plans.types.oneTime', 'One-Time Payment'),
                    t('admin.payments.plans.types.deposit', 'Deposit Payment'),
                    t('admin.payments.plans.types.installments', 'Installments'),
                    t('admin.payments.plans.types.subscription', 'Subscription'),
                  ],
                  bottom: 0,
                  textStyle: {
                    fontSize: 13,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    color: '#374151',
                  },
                },
                series: [
                  {
                    name: t('admin.payments.plans.types.oneTime', 'One-Time Payment'),
                    type: 'line',
                    stack: 'Total',
                    areaStyle: {},
                    data: planTrendsData.map((item: any) => item.oneTime),
                    itemStyle: { color: '#3b82f6' },
                  },
                  {
                    name: t('admin.payments.plans.types.deposit', 'Deposit Payment'),
                    type: 'line',
                    stack: 'Total',
                    areaStyle: {},
                    data: planTrendsData.map((item: any) => item.deposit),
                    itemStyle: { color: '#10b981' },
                  },
                  {
                    name: t('admin.payments.plans.types.installments', 'Installments'),
                    type: 'line',
                    stack: 'Total',
                    areaStyle: {},
                    data: planTrendsData.map((item: any) => item.installments),
                    itemStyle: { color: '#f59e0b' },
                  },
                  {
                    name: t('admin.payments.plans.types.subscription', 'Subscription'),
                    type: 'line',
                    stack: 'Total',
                    areaStyle: {},
                    data: planTrendsData.map((item: any) => item.subscription),
                    itemStyle: { color: '#8b5cf6' },
                  },
                ],
              } as EChartsOption}
              style={{ height: '350px' }}
            />
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              {t('admin.payments.reports.noData', 'No data available')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <Card>
        <CardHeader>
          <CardTitle suppressHydrationWarning>{t('admin.payments.reports.planComparison', 'Plan Comparison')}</CardTitle>
          <CardDescription suppressHydrationWarning>{t('admin.payments.reports.planComparisonDescription', 'Side-by-side payment plan comparison')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {planPerformance.map((plan, index: any) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold" suppressHydrationWarning>{plan.plan}</h4>
                    <p className="text-sm text-muted-foreground">
                      {plan.enrollments} <span suppressHydrationWarning>{t('admin.payments.reports.enrollments', 'enrollments')}</span> • <span suppressHydrationWarning>{t('admin.payments.reports.avg', 'Avg')}</span> ${plan.avg}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">${plan.revenue.toLocaleString()}</p>
                    <p className="text-sm text-green-600">{plan.completion}% <span suppressHydrationWarning>{t('common.paid', 'paid')}</span></p>
                  </div>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                    style={{ width: `${plan.completion}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// Operational Report
function OperationalReport({ t, isRtl }: { t: TranslationFunction; isRtl: boolean }) {
  return (
    <>
      {/* Pending Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground" suppressHydrationWarning>
              {t('admin.payments.reports.overduePayments', 'Overdue Payments')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">5</div>
            <p className="text-sm text-muted-foreground mt-1" suppressHydrationWarning>{t('admin.payments.reports.requiresAction', 'Requires action')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground" suppressHydrationWarning>
              {t('admin.payments.reports.failedPayments', 'Failed Payments')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">3</div>
            <p className="text-sm text-muted-foreground mt-1" suppressHydrationWarning>{t('admin.payments.reports.toRetry', 'To retry')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground" suppressHydrationWarning>
              {t('admin.payments.reports.pausedSchedules', 'Paused Schedules')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-sm text-muted-foreground mt-1" suppressHydrationWarning>{t('admin.payments.reports.temporarilyOnHold', 'Temporarily on hold')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground" suppressHydrationWarning>
              {t('admin.payments.reports.endingSoon', 'Ending Soon')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-sm text-muted-foreground mt-1" suppressHydrationWarning>{t('admin.payments.reports.subscriptionsThisMonth', 'Subscriptions this month')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle suppressHydrationWarning>{t('admin.payments.reports.recentAdminActions', 'Recent Admin Actions')}</CardTitle>
          <CardDescription suppressHydrationWarning>{t('admin.payments.reports.recentAdminActionsDescription', 'Recent administrative actions on payments')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: '2025-01-15 10:30', admin: 'Admin User', action: 'Adjusted payment date', user: 'John Doe', reason: 'User requested extension' },
              { date: '2025-01-14 14:20', admin: 'Finance Manager', action: 'Paused payments', user: 'Jane Smith', reason: 'Medical leave' },
              { date: '2025-01-13 09:15', admin: 'Admin User', action: 'Resumed payments', user: 'Bob Johnson', reason: 'Return from leave' },
            ].map((item: any, index: any) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{item.action}</p>
                  <p className="text-sm text-muted-foreground">
                    User: {item.user} • By: {item.admin}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{item.reason}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {item.date}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle suppressHydrationWarning>{t('admin.payments.reports.systemHealth', 'System Health')}</CardTitle>
          <CardDescription suppressHydrationWarning>{t('admin.payments.reports.systemHealthDescription', 'Payment system health metrics')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span suppressHydrationWarning>{t('admin.payments.reports.webhookSuccessRate', 'Webhook Success Rate')}</span>
              <span className="font-bold text-green-600">99.5%</span>
            </div>
            <div className="flex items-center justify-between">
              <span suppressHydrationWarning>{t('admin.payments.reports.avgProcessingTime', 'Avg Processing Time')}</span>
              <span className="font-bold">2.3s</span>
            </div>
            <div className="flex items-center justify-between">
              <span suppressHydrationWarning>{t('admin.payments.reports.failedWebhooks', 'Failed Webhooks')}</span>
              <span className="font-bold">2</span>
            </div>
            <div className="flex items-center justify-between">
              <span suppressHydrationWarning>{t('admin.payments.reports.lastReconciliation', 'Last Reconciliation')}</span>
              <span className="font-bold">2 <span suppressHydrationWarning>{t('admin.payments.reports.hoursAgo', 'hours ago')}</span></span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
