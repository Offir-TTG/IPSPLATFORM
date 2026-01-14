'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserLanguage } from '@/context/AppContext';
import { PieChart, CheckCircle, Clock, XCircle } from 'lucide-react';
import type { DashboardStats } from '@/hooks/useDashboard';

interface ProgressOverviewProps {
  stats: DashboardStats;
}

export function ProgressOverview({ stats }: ProgressOverviewProps) {
  const { t } = useUserLanguage();

  // Calculate lesson stats - use total_lessons if available, otherwise fall back to completed + in_progress
  const totalLessons = stats.total_lessons || (stats.completed_lessons + stats.in_progress_lessons);
  const completedPercent = totalLessons > 0 ? (stats.completed_lessons / totalLessons) * 100 : 0;
  const inProgressPercent = totalLessons > 0 ? (stats.in_progress_lessons / totalLessons) * 100 : 0;

  // Debug log
  console.log('ProgressOverview Debug:', {
    total_lessons: stats.total_lessons,
    completed_lessons: stats.completed_lessons,
    in_progress_lessons: stats.in_progress_lessons,
    totalLessons,
    completedPercent
  });

  // Calculate course stats
  const activeCourses = stats.total_courses - stats.completed_courses;

  const progressData = [
    {
      label: t('user.dashboard.progress.completed', 'Completed'),
      value: stats.completed_lessons,
      percent: completedPercent,
      color: 'text-green-500',
      bg: 'bg-green-500',
      icon: CheckCircle,
    },
    {
      label: t('user.dashboard.progress.inProgress', 'In Progress'),
      value: stats.in_progress_lessons,
      percent: inProgressPercent,
      color: 'text-amber-500',
      bg: 'bg-amber-500',
      icon: Clock,
    },
  ];

  // Simple donut chart using conic gradient
  const DonutChart = ({ completed, inProgress, total }: { completed: number; inProgress: number; total: number }) => {
    const completedPercent = total > 0 ? (completed / total) * 100 : 0;
    const inProgressPercent = total > 0 ? (inProgress / total) * 100 : 0;

    return (
      <div className="relative w-32 h-32">
        <svg className="transform -rotate-90 w-32 h-32">
          {/* Background circle */}
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            className="text-muted"
          />
          {/* Completed segment */}
          {completedPercent > 0 && (
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeDasharray={2 * Math.PI * 56}
              strokeDashoffset={2 * Math.PI * 56 - (completedPercent / 100) * 2 * Math.PI * 56}
              className="text-green-500 transition-all duration-1000"
              strokeLinecap="round"
            />
          )}
          {/* In Progress segment */}
          {inProgressPercent > 0 && (
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeDasharray={2 * Math.PI * 56}
              strokeDashoffset={2 * Math.PI * 56 - ((completedPercent + inProgressPercent) / 100) * 2 * Math.PI * 56}
              className="text-amber-500 transition-all duration-1000"
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{Math.round(completedPercent)}%</span>
          <span className="text-xs text-muted-foreground">{t('user.dashboard.progress.done', 'Done')}</span>
        </div>
      </div>
    );
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          {t('user.dashboard.progress.title', 'Progress Overview')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('user.dashboard.progress.subtitle', 'Your learning journey at a glance')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center mb-6">
          <DonutChart
            completed={stats.completed_lessons}
            inProgress={stats.in_progress_lessons}
            total={totalLessons}
          />
        </div>

        {/* Progress Breakdown */}
        <div className="space-y-3">
          {progressData.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg ${item.bg}/10 flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.value} {t('user.dashboard.progress.lessons', 'lessons')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${item.color}`}>
                    {Math.round(item.percent)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Course Summary */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-500">{stats.completed_courses}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('user.dashboard.progress.completedCourses', 'Completed')}
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-500">
                {activeCourses}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('user.dashboard.progress.activeCourses', 'Active')}
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-500">{stats.total_courses}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('user.dashboard.progress.totalCourses', 'Total')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
