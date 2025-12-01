'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, FileText, Send, BarChart3, Zap, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function EmailDashboardPage() {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const isMobile = windowWidth <= 640;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                {t('emails.dashboard.stats.pending', 'Last 30 days')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('emails.dashboard.open_rate', 'Open Rate')}
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">
                {t('emails.dashboard.stats.opened', 'Average')}
              </p>
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
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                {t('emails.queue.title', 'In queue')}
              </p>
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
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">
                {t('emails.templates.is_system', 'System templates')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Sections */}
        <div style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))'
        }}>
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${section.bgColor} flex items-center justify-center mb-4`}>
                      <Icon className={`h-6 w-6 ${section.color}`} />
                    </div>
                    <CardTitle>{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Getting Started Guide */}
        <Card>
          <CardHeader>
            <CardTitle>{t('emails.dashboard.overview', 'Getting Started')}</CardTitle>
            <CardDescription>
              {t('emails.dashboard.overview', 'Follow these steps to set up your email system')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              flexDirection: isRtl ? 'row-reverse' : 'row'
            }}>
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div style={{ flex: 1 }}>
                <h4 className="font-medium">
                  {t('emails.settings.configure', 'Configure SMTP Settings')}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t('emails.settings.configure_description', 'Set up your SMTP server in Email Settings to enable sending')}
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              flexDirection: isRtl ? 'row-reverse' : 'row'
            }}>
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div style={{ flex: 1 }}>
                <h4 className="font-medium">
                  {t('emails.templates.customize', 'Customize Templates')}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t('emails.templates.customize_description', 'Edit the 4 system templates or create your own custom templates')}
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              flexDirection: isRtl ? 'row-reverse' : 'row'
            }}>
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div style={{ flex: 1 }}>
                <h4 className="font-medium">
                  {t('emails.triggers.setup', 'Set Up Triggers')}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t('emails.triggers.setup_description', 'Create automated triggers for enrollment confirmations, payment receipts, and more')}
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              flexDirection: isRtl ? 'row-reverse' : 'row'
            }}>
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div style={{ flex: 1 }}>
                <h4 className="font-medium">
                  {t('emails.analytics.monitor', 'Monitor Performance')}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t('emails.analytics.monitor_description', 'Track open rates, click rates, and engagement in Email Analytics')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
