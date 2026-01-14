'use client';

import { Sparkles, GraduationCap, Video, Bell, TrendingUp, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import type { DashboardStats } from '@/hooks/useDashboard';
import { useUserLanguage } from '@/context/AppContext';
import { useUnreadCount } from '@/hooks/useUnreadCount';

interface WelcomeHeroProps {
  userName: string;
  stats: DashboardStats;
}

export function WelcomeHero({ userName, stats }: WelcomeHeroProps) {
  const { t } = useUserLanguage();
  const { unreadCount } = useUnreadCount();

  // Calculate completion rate based on completed lessons
  const totalLessons = stats.total_lessons || (stats.completed_lessons + stats.in_progress_lessons);
  const completionRate = totalLessons > 0 ? (stats.completed_lessons / totalLessons) * 100 : 0;

  // Format hours for display
  const formatHours = (hours: number) => {
    const hoursUnit = t('user.dashboard.stats.hours', 'h');
    const minutesUnit = t('user.dashboard.stats.minutes', 'm');

    if (hours === 0) return `0${hoursUnit}`;

    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    if (h === 0) {
      return `${m}${minutesUnit}`;
    } else if (m === 0) {
      return `${h}${hoursUnit}`;
    } else {
      return `${h}${hoursUnit} ${m}${minutesUnit}`;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('user.dashboard.hero.greeting.morning', 'Good morning');
    if (hour < 18) return t('user.dashboard.hero.greeting.afternoon', 'Good afternoon');
    return t('user.dashboard.hero.greeting.evening', 'Good evening');
  };

  const getGreetingEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️';
    if (hour < 18) return '👋';
    return '🌙';
  };

  const quickActions = [
    {
      icon: GraduationCap,
      label: t('user.dashboard.hero.actions.programs', 'My Programs'),
      href: '/programs',
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
    },
    {
      icon: Video,
      label: t('user.dashboard.hero.actions.courses', 'My Courses'),
      href: '/courses',
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30',
    },
    {
      icon: Bell,
      label: t('user.dashboard.hero.actions.notifications', 'Notifications'),
      href: '/notifications',
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
    },
    {
      icon: User,
      label: t('user.dashboard.hero.actions.profile', 'Profile'),
      href: '/profile',
      color: 'text-green-600 bg-green-50 dark:bg-green-950/30',
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-8 md:p-10 animate-fade-in">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl -z-10" />

      <div className="relative z-10">
        {/* Greeting Section */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <span className="text-sm font-semibold text-primary">{getGreeting()}</span>
          </div>
          <span className="text-2xl">{getGreetingEmoji()}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left: Welcome Message */}
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
              {t('user.dashboard.hero.welcome', 'Welcome back')},{' '}
              <span className="gradient-text inline-block animate-fade-in">
                {userName}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-6">
              {t('user.dashboard.hero.subtitle', "You're making great progress! Let's continue your learning journey today.")}
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">{formatHours(stats.total_hours_spent || 0)}</strong> {t('user.dashboard.hero.stats.studyTime', 'study time')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">{Math.round(completionRate)}%</strong> {t('user.dashboard.hero.stats.completed', 'completion rate')}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const isNotificationCard = action.icon === Bell;
              const hasUnread = isNotificationCard && unreadCount > 0;

              return (
                <Link key={action.href} href={action.href}>
                  <Card
                    className="p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group border-2 border-transparent hover:border-primary/20"
                    style={{
                      animationDelay: `${index * 100}ms`,
                    }}
                  >
                    <div className="relative">
                      <div className={`h-10 w-10 rounded-xl ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      {hasUnread && (
                        <div className="absolute -top-1 ltr:-right-1 rtl:-left-1 h-5 min-w-[20px] px-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center animate-pulse">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {action.label}
                    </h3>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
