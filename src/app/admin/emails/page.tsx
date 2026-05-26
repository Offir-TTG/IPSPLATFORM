'use client';

export const dynamic = 'force-dynamic';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, FileText, Send, BarChart3, Zap, Calendar, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
// Use ECharts (not Recharts) to match the proven RTL pattern from
// /admin/payments/reports — ECharts has first-class `inverse: isRtl`
// and `position: 'right'` axis options that Recharts lacks, so the
// labels-overlapping-bars problem we hit with Recharts disappears.
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface EmailStats {
  emailsSent: number;
  openRate: number;
  pending: number;
  templates: number;
  sentDaily?: Array<{ date: string; sent: number; failed: number }>;
  statusBreakdown?: Record<string, number>;
}

export default function EmailDashboardPage() {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const isMobile = windowWidth <= 640;
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      // no-store: the browser was caching the response, so the
      // dashboard kept showing 0 even after the server-side fix
      // started returning the real count.
      const response = await fetch('/api/admin/emails/stats', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch email stats');
      }
    } catch (error) {
      console.error('Error fetching email stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const sections = [
    {
      title: t('emails.templates.title', 'Email Templates'),
      description: t('emails.templates.description', 'Manage email templates and customize messages'),
      icon: FileText,
      href: '/admin/emails/templates',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: t('emails.queue.title', 'Email Queue'),
      description: t('emails.queue.view', 'View pending and sent emails'),
      icon: Send,
      href: '/admin/emails/queue',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      title: t('emails.analytics.title', 'Email Analytics'),
      description: t('emails.analytics.performance', 'Track email performance and engagement'),
      icon: BarChart3,
      href: '/admin/emails/analytics',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: t('emails.triggers.title', 'Email Triggers'),
      description: t('emails.triggers.create', 'Automated email triggers for events'),
      icon: Zap,
      href: '/admin/emails/triggers',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    },
    {
      title: t('emails.schedules.title', 'Email Schedules'),
      description: t('emails.schedules.create', 'Schedule email campaigns'),
      icon: Calendar,
      href: '/admin/emails/schedules',
      color: 'text-pink-500',
      bgColor: 'bg-pink-50 dark:bg-pink-950',
    },
    {
      title: t('emails.settings.title', 'Email Settings'),
      description: t('emails.settings.smtp', 'Configure SMTP and email settings'),
      icon: Mail,
      href: '/admin/emails/settings',
      color: 'text-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-950',
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-6xl p-6 space-y-6" dir={direction}>
        {/* Header */}
        <div>
          <h1 suppressHydrationWarning style={{
            fontSize: isMobile ? 'var(--font-size-2xl)' : 'var(--font-size-3xl)',
            fontFamily: 'var(--font-family-heading)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'hsl(var(--text-heading))'
          }}>
            {t('emails.dashboard.title', 'Email Dashboard')}
          </h1>
          <p suppressHydrationWarning style={{
            marginTop: '0.5rem',
            color: 'hsl(var(--muted-foreground))'
          }}>
            {t('emails.dashboard.overview', 'Manage email templates, view analytics, and configure automated sending')}
          </p>
        </div>

        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))'
        }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('emails.dashboard.stats.sent', 'Emails Sent')}
              </CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.emailsSent || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {t('emails.dashboard.stats.pending', 'Last 30 days')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('emails.dashboard.stats.pending', 'Pending')}
              </CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.pending || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {t('emails.queue.title', 'In queue')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('emails.templates.title', 'Templates')}
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.templates || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {t('emails.templates.is_system', 'Active templates')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Two charts side-by-side on desktop, stacked on mobile.
            Both render the chart bodies in their natural left-to-
            right Cartesian space (Recharts can't truly flip its
            internals), but the X-axis is *visually* reversed when
            the admin is in Hebrew via XAxis.reversed — so newer
            dates appear on the right, matching reading direction. */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Daily sent + failed — last 30 days */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {t('emails.dashboard.sentDaily.title', 'Sent vs failed — last 30 days')}
              </CardTitle>
              <CardDescription>
                {t('emails.dashboard.sentDaily.description', 'Daily count of sent and failed emails.')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="h-[220px] flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ReactECharts
                  option={{
                    grid: {
                      left: isRtl ? 30 : 50,
                      right: isRtl ? 50 : 30,
                      top: 20,
                      bottom: 50,
                    },
                    xAxis: {
                      type: 'category',
                      data: (stats?.sentDaily ?? []).map((d) => d.date),
                      inverse: isRtl,
                      axisLabel: {
                        color: '#6b7280',
                        fontSize: 11,
                        formatter: (v: string) => {
                          const d = new Date(v);
                          return d.toLocaleDateString(isRtl ? 'he-IL' : undefined, {
                            month: 'short',
                            day: 'numeric',
                          });
                        },
                      },
                    },
                    yAxis: {
                      type: 'value',
                      position: isRtl ? 'right' : 'left',
                      minInterval: 1,
                      axisLabel: { color: '#6b7280', fontSize: 11 },
                    },
                    tooltip: {
                      trigger: 'axis',
                      axisPointer: { type: 'cross' },
                      formatter: (params: any) => {
                        const date = new Date(params[0].axisValue).toLocaleDateString(
                          isRtl ? 'he-IL' : undefined,
                        );
                        let out = `<strong>${date}</strong><br/>`;
                        for (const p of params) {
                          out += `${p.marker} ${p.seriesName}: ${p.value}<br/>`;
                        }
                        return out;
                      },
                      textStyle: { fontSize: 12 },
                    },
                    legend: {
                      data: [
                        t('emails.dashboard.stats.sent', 'Sent'),
                        t('emails.status.failed', 'Failed'),
                      ],
                      bottom: 0,
                      orient: 'horizontal',
                      left: 'center',
                      textStyle: { color: '#374151', fontSize: 12 },
                    },
                    series: [
                      {
                        name: t('emails.dashboard.stats.sent', 'Sent'),
                        type: 'line',
                        smooth: true,
                        areaStyle: { opacity: 0.35 },
                        data: (stats?.sentDaily ?? []).map((d) => d.sent),
                        itemStyle: { color: '#4f46e5' },
                        lineStyle: { width: 2 },
                      },
                      {
                        name: t('emails.status.failed', 'Failed'),
                        type: 'line',
                        smooth: true,
                        areaStyle: { opacity: 0.35 },
                        data: (stats?.sentDaily ?? []).map((d) => d.failed),
                        itemStyle: { color: '#ef4444' },
                        lineStyle: { width: 2 },
                      },
                    ],
                  } as EChartsOption}
                  style={{ height: '220px' }}
                />
              )}
            </CardContent>
          </Card>

          {/* Status breakdown — current totals across the same
              window. Rendered as plain styled divs (not Recharts)
              because Recharts' horizontal bar chart with right-side
              category labels collides with the bars in RTL no matter
              what padding/width/orientation you set. Divs give us
              full control over direction without fighting a library. */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {t('emails.dashboard.statusBreakdown.title', 'Status breakdown — last 30 days')}
              </CardTitle>
              <CardDescription>
                {t('emails.dashboard.statusBreakdown.description', 'Count of queue rows by current status.')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="h-[220px] flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (() => {
                const order: Array<{ key: string; color: string }> = [
                  { key: 'sent',       color: '#4f46e5' },
                  { key: 'pending',    color: '#0ea5e9' },
                  { key: 'processing', color: '#f59e0b' },
                  { key: 'cancelled',  color: '#94a3b8' },
                  { key: 'expired',    color: '#a78bfa' },
                  { key: 'failed',     color: '#ef4444' },
                ];
                const labels = order.map(({ key }) => t(`emails.status.${key}`, key));
                const values = order.map(({ key, color }) => ({
                  value: stats?.statusBreakdown?.[key] ?? 0,
                  itemStyle: { color },
                }));
                return (
                  <ReactECharts
                    option={{
                      grid: {
                        // Categories live on the left in LTR and on the
                        // right in RTL — `position: 'right'` on yAxis +
                        // a wider grid right margin in RTL gives the
                        // Hebrew labels their own column, no overlap.
                        left: isRtl ? 20 : 110,
                        right: isRtl ? 110 : 20,
                        top: 10,
                        bottom: 30,
                      },
                      xAxis: {
                        type: 'value',
                        inverse: isRtl,
                        minInterval: 1,
                        axisLabel: { color: '#6b7280', fontSize: 11 },
                      },
                      yAxis: {
                        type: 'category',
                        data: labels,
                        position: isRtl ? 'right' : 'left',
                        // `inverse: !isRtl` keeps the row order
                        // consistent with the `order` array regardless
                        // of direction (echarts otherwise flips it).
                        inverse: !isRtl,
                        axisLine: { show: false },
                        axisTick: { show: false },
                        axisLabel: {
                          color: '#374151',
                          fontSize: 12,
                          margin: 12,
                        },
                      },
                      tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'shadow' },
                        formatter: (params: any) => {
                          const p = params[0];
                          return `${p.name}: <strong>${p.value}</strong>`;
                        },
                        textStyle: { fontSize: 12 },
                      },
                      series: [
                        {
                          type: 'bar',
                          data: values,
                          barWidth: 18,
                          itemStyle: { borderRadius: 4 },
                        },
                      ],
                    } as EChartsOption}
                    style={{ height: '220px' }}
                  />
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Main Sections — compact card style, matching the payments
            dashboard (icon + title on one row, description beneath). */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href}>
                <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg ${section.bgColor} flex items-center justify-center shrink-0`}>
                        <Icon className={`h-5 w-5 ${section.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base">{section.title}</CardTitle>
                      </div>
                    </div>
                    <CardDescription className="mt-2">{section.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
