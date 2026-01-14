'use client';

export const dynamic = 'force-dynamic';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Mail, TrendingUp, XCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface EmailAnalyticsSummary {
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  total_pending: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  delivery_rate: number;
}

interface TemplateAnalytics {
  template_id: string;
  template_name: string;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  open_rate: number;
  click_rate: number;
}

export default function EmailAnalyticsPage() {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const isMobile = windowWidth <= 640;

  const [summary, setSummary] = useState<EmailAnalyticsSummary | null>(null);
  const [templates, setTemplates] = useState<TemplateAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/emails/analytics?days=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
        setTemplates(data.templates || []);
      } else {
        console.error('Failed to fetch email analytics');
      }
    } catch (error) {
      console.error('Error fetching email analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl p-6 space-y-6" dir={direction}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 suppressHydrationWarning style={{
              fontSize: isMobile ? 'var(--font-size-2xl)' : 'var(--font-size-3xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))'
            }}>
              {t('emails.analytics.title', 'Email Analytics')}
            </h1>
            <p suppressHydrationWarning style={{
              marginTop: '0.5rem',
              color: 'hsl(var(--muted-foreground))'
            }}>
              {t('emails.analytics.description', 'Track email performance and engagement metrics')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{t('analytics.last_7_days', 'Last 7 days')}</SelectItem>
                <SelectItem value="30">{t('analytics.last_30_days', 'Last 30 days')}</SelectItem>
                <SelectItem value="90">{t('analytics.last_90_days', 'Last 90 days')}</SelectItem>
                <SelectItem value="365">{t('analytics.last_year', 'Last year')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div style={{
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))'
            }} dir={direction}>
              {/* Total Sent */}
              <Card>
                <CardHeader className={`flex ${isRtl ? 'flex-row-reverse' : 'flex-row'} items-center justify-between space-y-0 pb-2`}>
                  <CardTitle className="text-sm font-medium">
                    {t('analytics.total_sent', 'Total Sent')}
                  </CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.total_sent || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {t('analytics.emails', 'Emails')}
                  </p>
                </CardContent>
              </Card>

              {/* Delivery Rate */}
              <Card>
                <CardHeader className={`flex ${isRtl ? 'flex-row-reverse' : 'flex-row'} items-center justify-between space-y-0 pb-2`}>
                  <CardTitle className="text-sm font-medium">
                    {t('analytics.delivery_rate', 'Delivery Rate')}
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPercentage(summary?.delivery_rate || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    {summary?.total_delivered || 0} {t('analytics.delivered', 'delivered')}
                  </p>
                </CardContent>
              </Card>

              {/* Failed */}
              <Card>
                <CardHeader className={`flex ${isRtl ? 'flex-row-reverse' : 'flex-row'} items-center justify-between space-y-0 pb-2`}>
                  <CardTitle className="text-sm font-medium">
                    {t('analytics.failed', 'Failed')}
                  </CardTitle>
                  <XCircle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{summary?.total_failed || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {t('analytics.emails', 'Emails')}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Template Performance */}
            <Card>
              <CardHeader>
                <CardTitle>{t('analytics.template_performance', 'Template Performance')}</CardTitle>
                <CardDescription>
                  {t('analytics.template_performance_desc', 'Engagement metrics by email template')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {templates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('analytics.no_data', 'No template data available for the selected period')}
                  </div>
                ) : (
                  <div className="overflow-x-auto" dir={direction}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                            {t('analytics.template_name', 'Template Name')}
                          </TableHead>
                          <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                            {t('analytics.total_sent', 'Total Sent')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {templates.map((template) => (
                          <TableRow key={template.template_id}>
                            <TableCell className={`font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                              {t(`email.template.${template.template_name.toLowerCase().replace(/\s+/g, '_')}`, template.template_name)}
                            </TableCell>
                            <TableCell className={isRtl ? 'text-right' : 'text-left'}>
                              {template.total_sent}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
