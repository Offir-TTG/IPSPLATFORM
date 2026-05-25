'use client';

import { Clock, TrendingUp, Calendar, UserCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { DashboardStats } from '@/hooks/useDashboard';
import { useUserLanguage } from '@/context/AppContext';

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const { t, direction, language } = useUserLanguage();

  // Get locale for date formatting
  const locale = language === 'he' ? 'he-IL' : 'en-US';

  // Format hours for display — keep a space between the number and the unit
  // letter so Hebrew renders as "3 ש" instead of running together as "3ש".
  const formatHours = (hours: number) => {
    const hoursUnit = t('user.dashboard.stats.hours', 'h');
    const minutesUnit = t('user.dashboard.stats.minutes', 'm');

    if (hours === 0) return `0 ${hoursUnit}`;

    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    if (h === 0) {
      return `${m} ${minutesUnit}`;
    } else if (m === 0) {
      return `${h} ${hoursUnit}`;
    } else {
      return `${h} ${hoursUnit} ${m} ${minutesUnit}`;
    }
  };

  // Calculate completion rate based on completed lessons
  const totalLessons = stats.total_lessons || (stats.completed_lessons + stats.in_progress_lessons);
  const completionRate = totalLessons > 0 ? (stats.completed_lessons / totalLessons) * 100 : 0;

  // Format next session time
  const formatNextSession = () => {
    if (!stats.next_session_time) {
      return t('user.dashboard.stats.noUpcoming', 'No upcoming sessions');
    }

    const date = new Date(stats.next_session_time);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if it's today
    if (date.toDateString() === now.toDateString()) {
      return t('user.dashboard.stats.today', 'Today') + ` ${date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Check if it's tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return t('user.dashboard.stats.tomorrow', 'Tomorrow') + ` ${date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Otherwise show full date
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const cards = [
    {
      title: t('user.dashboard.stats.studyHours', 'Study Hours'),
      value: formatHours(stats.total_hours_spent || 0),
      subtitle: t('user.dashboard.stats.allTime', 'All time learning'),
      icon: Clock,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
      borderColor: 'hover:border-blue-200 dark:hover:border-blue-800',
    },
    {
      title: t('user.dashboard.stats.completionRate', 'Completion Rate'),
      value: `${Math.round(completionRate)}%`,
      subtitle: `${stats.completed_lessons || 0} / ${totalLessons || 0} ${t('user.dashboard.stats.lessons', 'lessons')}`,
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-500/10',
      borderColor: 'hover:border-green-200 dark:hover:border-green-800',
    },
    {
      title: t('user.dashboard.stats.upcomingSessions', 'Upcoming Sessions'),
      value: stats.upcoming_sessions_count || 0,
      subtitle: formatNextSession(),
      icon: Calendar,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      borderColor: 'hover:border-amber-200 dark:hover:border-amber-800',
    },
    {
      title: t('user.dashboard.stats.attendance', 'Attendance'),
      value: `${Math.round(stats.attendance_rate || 0)}%`,
      subtitle: `${stats.attendance_present || 0} / ${stats.total_attendance || 0}`,
      icon: UserCheck,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-500/10',
      borderColor: 'hover:border-purple-200 dark:hover:border-purple-800',
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.title}
            className={`p-5 sm:p-5 lg:p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group border-2 ${card.borderColor} animate-fade-up overflow-hidden`}
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            {/* Mobile: icon + content side-by-side so the card fills horizontally
                instead of clumping to the start edge. md+: original stacked layout. */}
            <div className="flex md:block items-center gap-4 md:gap-0 mb-3 sm:mb-4">
              <div className={`inline-flex shrink-0 rounded-xl ${card.bg} p-3 group-hover:scale-110 transition-transform duration-300 md:mb-3 lg:mb-4`}>
                <Icon className={`h-6 w-6 ${card.color}`} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-2xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1 group-hover:scale-105 transition-transform break-words">
                  {card.value}
                </p>
                {card.subtitle && (
                  <p className="text-xs text-muted-foreground mb-1 break-words">
                    {card.subtitle}
                  </p>
                )}
                <p className="text-sm text-muted-foreground font-medium break-words">
                  {card.title}
                </p>
              </div>
            </div>

            {/* Mini sparkline visualization */}
            <div className="mt-4 flex items-end gap-1 h-8 opacity-50 group-hover:opacity-100 transition-opacity">
              {[40, 55, 45, 70, 60, 85, 75].map((height, i) => (
                <div
                  key={i}
                  className={`flex-1 ${card.bg} rounded-t transition-all duration-300`}
                  style={{
                    height: `${height}%`,
                    transitionDelay: `${i * 50}ms`,
                  }}
                />
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
