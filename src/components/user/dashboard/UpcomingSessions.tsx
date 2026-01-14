'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar, Clock, User, MapPin, Bell, List, CalendarDays } from 'lucide-react';
import type { UpcomingSession } from '@/hooks/useDashboard';
import { format, formatDistanceToNow, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { useUserLanguage } from '@/context/AppContext';
import { SessionsCalendar } from './SessionsCalendar';

interface UpcomingSessionsProps {
  sessions: UpcomingSession[];
}

export function UpcomingSessions({ sessions }: UpcomingSessionsProps) {
  const { t, direction, language } = useUserLanguage();
  const isRtl = direction === 'rtl';
  const locale = language === 'he' ? he : undefined;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewMode, setViewMode] = useState<'list' | 'week' | 'month'>('list');

  // Update current time every minute for live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const getSessionStatus = (startTime: Date) => {
    const minutesUntil = differenceInMinutes(startTime, currentTime);

    if (minutesUntil < 0) {
      return { label: t('user.dashboard.sessions.status.liveNow', 'Live Now'), color: 'bg-red-500 text-white', pulse: true };
    } else if (minutesUntil < 15) {
      return { label: t('user.dashboard.sessions.status.startingSoon', 'Starting Soon'), color: 'bg-amber-500 text-white', pulse: true };
    } else if (minutesUntil < 60) {
      return { label: `${minutesUntil} ${t('user.dashboard.sessions.duration.minutesShort', 'm')}`, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', pulse: false };
    } else if (differenceInHours(startTime, currentTime) < 24) {
      return { label: `${differenceInHours(startTime, currentTime)} ${t('user.dashboard.sessions.duration.hoursShort', 'h')}`, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400', pulse: false };
    } else {
      return { label: `${differenceInDays(startTime, currentTime)} ${t('user.dashboard.sessions.duration.daysShort', 'd')}`, color: 'bg-muted text-muted-foreground', pulse: false };
    }
  };

  const getSessionDuration = (startTime: Date, endTime: Date) => {
    const minutes = differenceInMinutes(endTime, startTime);
    if (minutes < 60) {
      return `${minutes} ${t('user.dashboard.sessions.duration.minutes', 'min')}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}${t('user.dashboard.sessions.duration.hours', 'h')} ${remainingMinutes}${t('user.dashboard.sessions.duration.minutesShort', 'm')}`
      : `${hours}${t('user.dashboard.sessions.duration.hours', 'h')}`;
  };

  if (sessions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t('user.dashboard.sessions.title', 'Upcoming Sessions')}</h2>
          <Link href="/calendar">
            <Button variant="ghost" size="sm" className="gap-2">
              {t('user.dashboard.sessions.viewCalendar', 'View Calendar')}
              <span className="text-lg">→</span>
            </Button>
          </Link>
        </div>
        <Card className="p-12 text-center border-2 border-dashed">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6">
              <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('user.dashboard.sessions.noSessions', 'No upcoming sessions')}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('user.dashboard.sessions.checkLater', 'Check back later for scheduled live sessions')}
          </p>
          <Button variant="outline" asChild>
            <Link href="/calendar">
              <Calendar className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
              {t('user.dashboard.sessions.viewCalendar', 'View Calendar')}
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('user.dashboard.sessions.title', 'Upcoming Sessions')}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {sessions.length} {sessions.length === 1 ? t('user.dashboard.sessions.sessionScheduled', 'session') : t('user.dashboard.sessions.sessionsScheduled', 'sessions')} {t('user.dashboard.sessions.scheduled', 'scheduled')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              {t('user.dashboard.sessions.viewList', 'List')}
            </Button>
            <Button
              variant={viewMode === 'week' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              {t('user.dashboard.sessions.viewWeek', 'Week')}
            </Button>
            <Button
              variant={viewMode === 'month' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="gap-2"
            >
              <CalendarDays className="h-4 w-4" />
              {t('user.dashboard.sessions.viewMonth', 'Month')}
            </Button>
          </div>
          <Link href="/calendar">
            <Button variant="ghost" size="sm" className="gap-2">
              {t('user.dashboard.sessions.viewCalendar', 'View Calendar')}
              <span className="text-lg">→</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Calendar View */}
      {(viewMode === 'week' || viewMode === 'month') && (
        <Card className="p-6">
          <SessionsCalendar sessions={sessions} viewMode={viewMode as 'week' | 'month'} />
        </Card>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="grid gap-3">
          {sessions.slice(0, 3).map((session, index) => {
          const startTime = new Date(session.start_time);
          const endTime = new Date(session.end_time);
          const status = getSessionStatus(startTime);
          const duration = getSessionDuration(startTime, endTime);

          return (
            <Card
              key={session.id}
              className="group overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-primary/20 animate-fade-up"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <div className="flex flex-col sm:flex-row gap-3 p-4">
                {/* Left: Date Badge */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex flex-col items-center justify-center border border-primary/10 group-hover:scale-105 transition-transform">
                    <span className="text-xl font-bold text-primary">
                      {format(startTime, 'd', { locale })}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">
                      {format(startTime, 'MMM', { locale })}
                    </span>
                  </div>
                </div>

                {/* Middle: Session Details */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {session.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {session.course_name}
                      </p>
                    </div>
                    {status.pulse && (
                      <Badge className={`${status.color} animate-pulse px-2 py-0.5 text-xs flex-shrink-0`}>
                        {status.label}
                      </Badge>
                    )}
                    {!status.pulse && (
                      <Badge className={`${status.color} text-xs flex-shrink-0`}>
                        {status.label}
                      </Badge>
                    )}
                  </div>

                  {/* Session Info - Inline */}
                  <div className="flex items-center gap-4 text-xs flex-wrap">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-foreground">
                        {format(startTime, 'h:mm a', { locale })}
                      </span>
                      <span className="text-muted-foreground">• {duration}</span>
                    </div>

                    {session.instructor_name && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        <span className="font-medium text-foreground line-clamp-1">
                          {session.instructor_name}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Bell className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(startTime, { addSuffix: true, locale })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Action Button */}
                <div className="flex-shrink-0 flex items-center">
                  <Link
                    href={`/courses/${session.course_id}`}
                    className="w-full sm:w-auto"
                  >
                    <Button className="w-full gap-2 group/btn" size="sm">
                      <Video className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                      {t('user.dashboard.sessions.joinSession', 'Join Session')}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
        </div>
      )}
    </div>
  );
}
