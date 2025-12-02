'use client';

export const dynamic = 'force-dynamic';

import { Card } from '@/components/ui/card';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Award,
  Calendar,
  Download,
  Filter,
  Activity,
  BookOpen,
  Video,
  Target,
} from 'lucide-react';
import { useUserLanguage } from '@/context/AppContext';

export default function ReportsPage() {
  const { t } = useUserLanguage();
  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('user.reports.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('user.reports.subtitle')}
          </p>
        </div>
        <button
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            paddingInlineStart: '1rem',
            paddingInlineEnd: '1rem',
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem',
            backgroundColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            borderRadius: 'calc(var(--radius) * 1.5)',
            border: 'none',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
            fontFamily: 'var(--font-family-primary)',
            fontWeight: 'var(--font-weight-medium)',
            transition: 'opacity 0.2s',
          }}
          className="hover:opacity-90"
        >
          <Download className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
          {t('user.reports.exportReport')}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('user.reports.stats.totalLearningTime')}</p>
              <p className="text-2xl font-bold">24.5 {t('user.reports.stats.hrs')}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
              <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('user.reports.stats.lessonsCompleted')}</p>
              <p className="text-2xl font-bold">42</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
              <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('user.reports.stats.certificatesEarned')}</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
              <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('user.reports.stats.averageScore')}</p>
              <p className="text-2xl font-bold">92%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Learning Activity Chart */}
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{t('user.reports.charts.learningActivity')}</h3>
              <p className="text-sm text-muted-foreground">{t('user.reports.charts.last7Days')}</p>
            </div>
            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                paddingInlineStart: '0.75rem',
                paddingInlineEnd: '0.75rem',
                paddingTop: '0.375rem',
                paddingBottom: '0.375rem',
                backgroundColor: 'transparent',
                color: 'hsl(var(--foreground))',
                borderRadius: 'calc(var(--radius) * 1.5)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                fontWeight: 'var(--font-weight-medium)',
                transition: 'background-color 0.2s',
              }}
              className="hover:bg-accent"
            >
              <Filter className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
              {t('user.reports.filter')}
            </button>
          </div>
          <div className="flex h-64 items-end justify-between gap-2">
            {[60, 80, 45, 90, 70, 85, 75].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/50 transition-all hover:opacity-80"
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs text-muted-foreground">
                  {[
                    t('user.reports.days.mon'),
                    t('user.reports.days.tue'),
                    t('user.reports.days.wed'),
                    t('user.reports.days.thu'),
                    t('user.reports.days.fri'),
                    t('user.reports.days.sat'),
                    t('user.reports.days.sun')
                  ][i]}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Course Progress */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">{t('user.reports.charts.courseProgress')}</h3>
            <p className="text-sm text-muted-foreground">{t('user.reports.charts.yourActiveCourses')}</p>
          </div>
          <div className="space-y-4">
            {[
              { name: t('user.reports.courses.advancedReactPatterns'), progress: 85, color: 'bg-blue-500' },
              { name: t('user.reports.courses.typescriptMastery'), progress: 60, color: 'bg-purple-500' },
              { name: t('user.reports.courses.nodejsBackend'), progress: 40, color: 'bg-green-500' },
              { name: t('user.reports.courses.uiuxDesign'), progress: 25, color: 'bg-amber-500' },
            ].map((course, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{course.name}</span>
                  <span className="text-muted-foreground">{course.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${course.color} transition-all ltr:rounded-l-full rtl:rounded-r-full`}
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">{t('user.reports.activity.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('user.reports.activity.subtitle')}</p>
        </div>
        <div className="space-y-4">
          {[
            {
              icon: Award,
              title: t('user.reports.activity.certificateEarned'),
              description: t('user.reports.activity.reactCertification'),
              time: t('user.reports.activity.hoursAgo', '2 hours ago'),
              color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            },
            {
              icon: Video,
              title: t('user.reports.activity.lessonCompleted'),
              description: t('user.reports.activity.typescriptGenerics'),
              time: t('user.reports.activity.hoursAgo', '5 hours ago'),
              color: 'bg-green-500/10 text-green-600 dark:text-green-400',
            },
            {
              icon: Target,
              title: t('user.reports.activity.milestoneReached'),
              description: t('user.reports.activity.nodejsMilestone'),
              time: t('user.reports.activity.daysAgo', '1 day ago'),
              color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
            },
            {
              icon: Activity,
              title: t('user.reports.activity.quizPassed'),
              description: t('user.reports.activity.uiuxQuiz'),
              time: t('user.reports.activity.daysAgo', '2 days ago'),
              color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
            },
          ].map((activity, i) => {
            const Icon = activity.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-accent"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${activity.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>
                <span className="text-xs text-muted-foreground ltr:text-right rtl:text-left">{activity.time}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
