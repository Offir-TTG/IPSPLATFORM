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
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

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
      <div className="space-y-6" dir={direction}>
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold" suppressHydrationWarning>{t('admin.payments.reports.title', 'Payment Reports')}</h1>
            <p className="text-muted-foreground mt-1" suppressHydrationWarning>
              {t('admin.payments.reports.description', 'Comprehensive payment analytics and insights')}
            </p>
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
          <TabsList className="grid w-full grid-cols-7">
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
            <RevenueReport t={t} isRtl={isRtl} />
          </TabsContent>

          {/* Payment Status Report */}
          <TabsContent value="status" className="space-y-6">
            <PaymentStatusReport t={t} isRtl={isRtl} />
          </TabsContent>

          {/* Cash Flow Report */}
          <TabsContent value="cashflow" className="space-y-6">
            <CashFlowReport t={t} isRtl={isRtl} />
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
function RevenueReport({ t, isRtl }: { t: TranslationFunction; isRtl: boolean }) {
  const revenueData = [
    { date: 'Jan 1', revenue: 4200, transactions: 12 },
    { date: 'Jan 8', revenue: 5100, transactions: 15 },
    { date: 'Jan 15', revenue: 4800, transactions: 14 },
    { date: 'Jan 22', revenue: 6200, transactions: 18 },
    { date: 'Jan 29', revenue: 5900, transactions: 17 },
  ];

  const revenueByType = [
    { name: t('admin.payments.plans.types.oneTime', 'One-Time Payment'), value: 18500, percentage: 45 },
    { name: t('admin.payments.plans.types.deposit', 'Deposit Payment'), value: 12300, percentage: 30 },
    { name: t('admin.payments.plans.types.installments', 'Installments'), value: 8200, percentage: 20 },
    { name: t('admin.payments.plans.types.subscription', 'Subscription'), value: 2050, percentage: 5 },
  ];

  const mrrData = [
    { month: t('common.months.aug', 'Aug'), mrr: 7200, new: 1200, expansion: 300, churn: -200 },
    { month: t('common.months.sep', 'Sep'), mrr: 7800, new: 1500, expansion: 400, churn: -300 },
    { month: t('common.months.oct', 'Oct'), mrr: 8100, new: 1000, expansion: 500, churn: -200 },
    { month: t('common.months.nov', 'Nov'), mrr: 8500, new: 1300, expansion: 300, churn: -200 },
    { month: t('common.months.dec', 'Dec'), mrr: 8900, new: 1600, expansion: 400, churn: -600 },
  ];

  return (
    <>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground" suppressHydrationWarning>
              {t('admin.payments.totalRevenue', 'Total Revenue')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$41,050</div>
            <div className="flex items-center text-sm text-green-600 mt-2">
              <ArrowUpRight className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
              <span>+12.5%</span>
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
            <div className="text-3xl font-bold">$538</div>
            <div className="flex items-center text-sm text-green-600 mt-2">
              <ArrowUpRight className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
              <span>+5.2%</span>
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
            <div className="text-3xl font-bold">$8,900</div>
            <div className="flex items-center text-sm text-green-600 mt-2">
              <ArrowUpRight className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
              <span>+4.7%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground" suppressHydrationWarning>
              {t('admin.payments.arr', 'ARR')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$106,800</div>
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
          <CardDescription suppressHydrationWarning>{t('admin.payments.reports.revenueTrendDescription', 'Revenue performance over time')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                name={t('admin.payments.reports.charts.revenue', 'Revenue')}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue by Type */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle suppressHydrationWarning>{t('admin.payments.reports.revenueByType', 'Revenue by Type')}</CardTitle>
            <CardDescription suppressHydrationWarning>{t('admin.payments.reports.revenueByTypeDescription', 'Revenue breakdown by payment type')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name}: ${((entry.percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle suppressHydrationWarning>{t('admin.payments.reports.revenueDistribution', 'Revenue Distribution')}</CardTitle>
            <CardDescription suppressHydrationWarning>{t('admin.payments.reports.revenueDistributionDescription', 'Detailed revenue distribution breakdown')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueByType.map((item, index) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index] }}
                      />
                      <span className="font-medium" suppressHydrationWarning>{item.name}</span>
                    </div>
                    <span className="font-bold">${item.value.toLocaleString()}</span>
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

      {/* MRR Growth */}
      <Card>
        <CardHeader>
          <CardTitle suppressHydrationWarning>{t('admin.payments.reports.mrrGrowth', 'MRR Growth')}</CardTitle>
          <CardDescription suppressHydrationWarning>{t('admin.payments.reports.mrrGrowthDescription', 'Monthly recurring revenue growth analysis')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mrrData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="new" stackId="a" fill="#10b981" name={t('admin.payments.reports.charts.newMrr', 'New MRR')} />
              <Bar dataKey="expansion" stackId="a" fill="#3b82f6" name={t('admin.payments.reports.charts.expansion', 'Expansion')} />
              <Bar dataKey="churn" stackId="a" fill="#ef4444" name={t('admin.payments.reports.charts.churn', 'Churn')} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}

// Payment Status Report Component
function PaymentStatusReport({ t, isRtl }: { t: TranslationFunction; isRtl: boolean }) {
  const statusData = [
    { status: t('admin.payments.schedules.statuses.paid', 'Paid'), count: 152, amount: 45280, percentage: 65 },
    { status: t('admin.payments.schedules.statuses.partial', 'Partial'), count: 28, amount: 8950, percentage: 15 },
    { status: t('admin.payments.schedules.statuses.pending', 'Pending'), count: 42, amount: 12600, percentage: 18 },
    { status: t('admin.payments.schedules.statuses.overdue', 'Overdue'), count: 5, amount: 1450, percentage: 2 },
  ];

  const overdueAging = [
    { bucket: t('common.dayRanges.0-7', '0-7 days'), count: 2, amount: 580 },
    { bucket: t('common.dayRanges.8-30', '8-30 days'), count: 2, amount: 670 },
    { bucket: t('common.dayRanges.31-60', '31-60 days'), count: 1, amount: 200 },
    { bucket: t('common.dayRanges.60plus', '60+ days'), count: 0, amount: 0 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return '#10b981';
      case 'Partial': return '#3b82f6';
      case 'Pending': return '#f59e0b';
      case 'Overdue': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'Partial': return <Clock className="h-5 w-5 text-blue-600" />;
      case 'Pending': return <Clock className="h-5 w-5 text-amber-600" />;
      case 'Overdue': return <AlertCircle className="h-5 w-5 text-red-600" />;
      default: return <XCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <>
      {/* Status Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        {statusData.map((item) => (
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
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.status}: ${(entry.percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
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
                <span className="text-2xl font-bold text-green-600">87.5%</span>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-600" style={{ width: '87.5%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" suppressHydrationWarning>{t('admin.payments.reports.late', 'Late')}</span>
                <span className="text-2xl font-bold text-amber-600">10.2%</span>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-600" style={{ width: '10.2%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" suppressHydrationWarning>{t('admin.payments.reports.default', 'Default')}</span>
                <span className="text-2xl font-bold text-red-600">2.3%</span>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-600" style={{ width: '2.3%' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Aging */}
      <Card>
        <CardHeader>
          <CardTitle suppressHydrationWarning>{t('admin.payments.reports.overdueAging', 'Overdue Aging')}</CardTitle>
          <CardDescription suppressHydrationWarning>{t('admin.payments.reports.overdueAgingDescription', 'Age analysis of overdue payments')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={overdueAging}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bucket" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#ef4444" name={t('admin.payments.reports.charts.payments', 'Payments')} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Overdue Details Table */}
      <Card>
        <CardHeader>
          <CardTitle suppressHydrationWarning>{t('admin.payments.reports.overduePayments', 'Overdue Payments')}</CardTitle>
          <CardDescription suppressHydrationWarning>{t('admin.payments.reports.overduePaymentsDescription', 'List of overdue payment details')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { user: 'John Doe', product: 'Advanced React', amount: 299, days: 15 },
              { user: 'Jane Smith', product: 'Full Stack Program', amount: 450, days: 8 },
              { user: 'Bob Johnson', product: 'Python Masterclass', amount: 199, days: 22 },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{item.user}</p>
                  <p className="text-sm text-muted-foreground">{item.product}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${item.amount}</p>
                  <p className="text-sm text-red-600">{item.days} <span suppressHydrationWarning>{t('admin.payments.reports.daysOverdue', 'days overdue')}</span></p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// Cash Flow Report Component
function CashFlowReport({ t, isRtl }: { t: TranslationFunction; isRtl: boolean }) {
  const forecastData = [
    { month: t('common.months.jan', 'Jan'), expected: 45000, scheduled: 38000, subscription: 8900 },
    { month: t('common.months.feb', 'Feb'), expected: 48000, scheduled: 40000, subscription: 8900 },
    { month: t('common.months.mar', 'Mar'), expected: 52000, scheduled: 43000, subscription: 8900 },
    { month: t('common.months.apr', 'Apr'), expected: 49000, scheduled: 41000, subscription: 8900 },
    { month: t('common.months.may', 'May'), expected: 55000, scheduled: 46000, subscription: 8900 },
    { month: t('common.months.jun', 'Jun'), expected: 58000, scheduled: 49000, subscription: 8900 },
  ];

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
            <div className="text-3xl font-bold">$45,000</div>
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
            <div className="text-3xl font-bold text-green-600">$32,400</div>
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
            <div className="text-3xl font-bold text-amber-600">$12,600</div>
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
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              <Legend />
              <Area
                type="monotone"
                dataKey="expected"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorExpected)"
                name={t('admin.payments.reports.charts.expectedRevenue', 'Expected Revenue')}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Sources */}
      <Card>
        <CardHeader>
          <CardTitle suppressHydrationWarning>{t('admin.payments.reports.revenueSourcesBreakdown', 'Revenue Sources Breakdown')}</CardTitle>
          <CardDescription suppressHydrationWarning>{t('admin.payments.reports.revenueSourcesDescription', 'Revenue by source type')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="scheduled" fill="#3b82f6" name={t('admin.payments.reports.charts.scheduledPayments', 'Scheduled Payments')} />
              <Bar dataKey="subscription" fill="#10b981" name={t('admin.payments.reports.charts.subscriptionRevenue', 'Subscription Revenue')} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}

// Product Performance Report
function ProductPerformanceReport({ t, isRtl }: { t: TranslationFunction; isRtl: boolean }) {
  const productData = [
    { name: 'Advanced React', revenue: 18500, enrollments: 62, completion: 94, plan: 'One-Time' },
    { name: 'Full Stack Program', revenue: 24800, enrollments: 28, completion: 89, plan: 'Deposit' },
    { name: 'Python Masterclass', revenue: 12300, enrollments: 45, completion: 92, plan: 'One-Time' },
    { name: 'DevOps Bootcamp', revenue: 15600, enrollments: 18, completion: 85, plan: 'Installments' },
  ];

  return (
    <>
      {/* Top Products by Revenue */}
      <Card>
        <CardHeader>
          <CardTitle suppressHydrationWarning>{t('admin.payments.reports.revenueByProduct', 'Revenue by Product')}</CardTitle>
          <CardDescription suppressHydrationWarning>{t('admin.payments.reports.revenueByProductDescription', 'Top products by revenue generation')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              <Bar dataKey="revenue" fill="#3b82f6" name={t('admin.payments.reports.charts.revenue', 'Revenue')} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Product Details Table */}
      <Card>
        <CardHeader>
          <CardTitle suppressHydrationWarning>{t('admin.payments.reports.productPerformanceDetails', 'Product Performance Details')}</CardTitle>
          <CardDescription suppressHydrationWarning>{t('admin.payments.reports.productPerformanceDescription', 'Detailed product performance metrics')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {productData.map((product, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      <span suppressHydrationWarning>{t('admin.payments.reports.preferredPlan', 'Preferred plan')}</span>: {product.plan}
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
    </>
  );
}

// User Analysis Report
function UserAnalysisReport({ t, isRtl }: { t: TranslationFunction; isRtl: boolean }) {
  const userSegments = [
    { segment: t('admin.payments.reports.segments.students', 'Students'), users: 85, revenue: 28500, avg: 335 },
    { segment: t('admin.payments.reports.segments.parents', 'Parents'), users: 42, revenue: 18900, avg: 450 },
    { segment: t('admin.payments.reports.segments.professionals', 'Professionals'), users: 25, revenue: 22650, avg: 906 },
  ];

  return (
    <>
      {/* User Segments */}
      <div className="grid gap-4 md:grid-cols-3">
        {userSegments.map((segment) => (
          <Card key={segment.segment}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground" suppressHydrationWarning>
                {segment.segment}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{segment.users}</div>
              <p className="text-sm text-muted-foreground mt-1">
                ${segment.revenue.toLocaleString()} <span suppressHydrationWarning>{t('common.total', 'total')}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <span suppressHydrationWarning>{t('admin.payments.reports.avg', 'Avg')}</span>: ${segment.avg}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Segment Revenue Distribution */}
      <Card>
        <CardHeader>
          <CardTitle suppressHydrationWarning>{t('admin.payments.reports.revenueByUserSegment', 'Revenue by User Segment')}</CardTitle>
          <CardDescription suppressHydrationWarning>{t('admin.payments.reports.revenueByUserSegmentDescription', 'Revenue distribution across user segments')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userSegments}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.segment}: $${entry.revenue.toLocaleString()}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="revenue"
              >
                {userSegments.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}

// Payment Plans Report (NEW - Per Your Request)
function PaymentPlansReport({ t, isRtl }: { t: TranslationFunction; isRtl: boolean }) {
  const planPerformance = [
    { plan: t('admin.payments.reports.planNames.fullPayment', 'Full Payment'), enrollments: 85, revenue: 28500, avg: 335, completion: 98 },
    { plan: t('admin.payments.reports.planNames.depositSixMonths', 'Deposit + 6 Months'), enrollments: 45, revenue: 22650, avg: 503, completion: 92 },
    { plan: t('admin.payments.reports.planNames.twelveMonthly', '12 Monthly Payments'), enrollments: 28, revenue: 18900, avg: 675, completion: 87 },
    { plan: t('admin.payments.reports.planNames.monthlySubscription', 'Monthly Subscription'), enrollments: 14, revenue: 1890, avg: 135, completion: 95 },
  ];

  const planTrend = [
    { month: t('common.months.aug', 'Aug'), oneTime: 18, deposit: 12, installments: 8, subscription: 3 },
    { month: t('common.months.sep', 'Sep'), oneTime: 22, deposit: 15, installments: 10, subscription: 4 },
    { month: t('common.months.oct', 'Oct'), oneTime: 20, deposit: 18, installments: 12, subscription: 5 },
    { month: t('common.months.nov', 'Nov'), oneTime: 25, deposit: 20, installments: 14, subscription: 6 },
    { month: t('common.months.dec', 'Dec'), oneTime: 28, deposit: 22, installments: 16, subscription: 8 },
  ];

  return (
    <>
      {/* Plan Performance Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        {planPerformance.map((plan, index) => (
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
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={planTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="oneTime" stackId="1" stroke="#3b82f6" fill="#3b82f6" name={t('admin.payments.plans.types.oneTime', 'One-Time Payment')} />
              <Area type="monotone" dataKey="deposit" stackId="1" stroke="#10b981" fill="#10b981" name={t('admin.payments.plans.types.deposit', 'Deposit Payment')} />
              <Area type="monotone" dataKey="installments" stackId="1" stroke="#f59e0b" fill="#f59e0b" name={t('admin.payments.plans.types.installments', 'Installments')} />
              <Area type="monotone" dataKey="subscription" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" name={t('admin.payments.plans.types.subscription', 'Subscription')} />
            </AreaChart>
          </ResponsiveContainer>
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
            {planPerformance.map((plan, index) => (
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
            <div className="text-3xl font-bold text-red-600">5</div>
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
            <div className="text-3xl font-bold text-amber-600">3</div>
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
            <div className="text-3xl font-bold">2</div>
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
            <div className="text-3xl font-bold">7</div>
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
            ].map((item, index) => (
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
