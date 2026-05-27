'use client';
export const dynamic = 'force-dynamic';

import { useDashboard } from '@/hooks/useDashboard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Tabs,
  TabsContent,
  UnderlineTabsList,
  UnderlineTabsTrigger,
  TabCountBadge,
} from '@/components/ui/tabs';
import {
  Video,
  Calendar,
  Clock,
  User,
  ExternalLink,
  Bell,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sun,
} from 'lucide-react';
import { formatDistanceToNow, differenceInMinutes, differenceInHours } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { useUserLanguage } from '@/context/AppContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { formatInTimezone, resolveDisplayTimezone } from '@/lib/datetime/timezone';
import { useState, useEffect } from 'react';
import Link from 'next/link';

type CalendarFilter = 'all' | 'today' | 'upcoming';
const PAGE_SIZE = 10;

export default function CalendarPage() {
  const { t, language, direction } = useUserLanguage();
  const { data: userProfile } = useUserProfile();
  const { data, isLoading, error, refetch } = useDashboard();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filter, setFilter] = useState<CalendarFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const isRtl = language === 'he';
  const locale = language === 'he' ? he : enUS;

  // Update current time every minute for live countdowns + 24h window.
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Reset to page 1 when filter changes the visible set.
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const getSessionDuration = (startTime: Date, endTime: Date) => {
    const minutes = differenceInMinutes(endTime, startTime);
    if (minutes < 60) return `${minutes} ${t('common.time.min', 'min')}`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0
      ? `${hours}${t('common.time.hourShort', 'h')} ${rem}${t('common.time.minuteShort', 'm')}`
      : `${hours}${t('common.time.hourShort', 'h')}`;
  };

  // Normalize once: parse dates on every session so the filter +
  // counts share the same shape.
  const allSessions = (data?.upcoming_sessions ?? []).map((s) => ({
    ...s,
    startTime: new Date(s.start_time),
    endTime: new Date(s.end_time),
  }));

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const counts = {
    all: allSessions.length,
    today: allSessions.filter((s) => s.startTime >= todayStart && s.startTime < tomorrowStart).length,
    upcoming: allSessions.filter((s) => differenceInHours(s.startTime, currentTime) < 24 && s.startTime >= currentTime).length,
  };

  const filteredSessions =
    filter === 'today'
      ? allSessions.filter((s) => s.startTime >= todayStart && s.startTime < tomorrowStart)
      : filter === 'upcoming'
        ? allSessions.filter((s) => differenceInHours(s.startTime, currentTime) < 24 && s.startTime >= currentTime)
        : allSessions;

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedSessions = filteredSessions.slice(startIndex, startIndex + PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="min-h-screen pb-12 p-4 md:p-0" dir={direction}>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" dir={direction}>
        <Alert variant="destructive" className="max-w-2xl">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">
            {t('user.calendar.errorTitle', 'Error loading calendar')}
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">
              {t('user.calendar.errorMessage', 'Failed to load your calendar data. Please try again.')}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
              {t('user.calendar.retry', 'Retry')}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 p-4 md:p-0" dir={direction}>
      {/* Header — plain h1 + subtitle, matches notifications / billing
          / attendance pattern. */}
      <div className="mb-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1
              style={{
                fontSize: 'var(--font-size-3xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))',
                marginBottom: '0.5rem',
              }}
              suppressHydrationWarning
            >
              {t('user.calendar.title', 'My Calendar')}
            </h1>
            <p
              style={{
                color: 'hsl(var(--text-muted))',
                fontSize: 'var(--font-size-base)',
                fontFamily: 'var(--font-family-primary)',
              }}
              suppressHydrationWarning
            >
              {t('user.calendar.subtitle', 'View all your upcoming sessions and meetings')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards — Total / Today / Next 24h. Same icon-circle
          layout as the notifications + attendance stats. */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-muted))',
                  marginBottom: '0.25rem',
                }}
                suppressHydrationWarning
              >
                {t('user.calendar.stats.total', 'Total')}
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-3xl)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'hsl(var(--text-heading))',
                }}
              >
                {counts.all}
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'hsl(var(--accent))' }}
            >
              <Calendar className="h-6 w-6" style={{ color: 'hsl(var(--accent-foreground))' }} />
            </div>
          </div>
        </Card>

        <Card
          className="p-4 ltr:border-l-4 rtl:border-r-4"
          style={{ borderColor: 'hsl(var(--primary))' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-muted))',
                  marginBottom: '0.25rem',
                }}
                suppressHydrationWarning
              >
                {t('user.calendar.filter.today', 'Today')}
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-3xl)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'hsl(var(--primary))',
                }}
              >
                {counts.today}
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}
            >
              <Sun className="h-6 w-6" style={{ color: 'hsl(var(--primary))' }} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-muted))',
                  marginBottom: '0.25rem',
                }}
                suppressHydrationWarning
              >
                {t('user.calendar.filter.next24h', 'Next 24h')}
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-3xl)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'hsl(var(--text-heading))',
                }}
              >
                {counts.upcoming}
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'hsl(var(--success) / 0.1)' }}
            >
              <Bell className="h-6 w-6" style={{ color: 'hsl(var(--success))' }} />
            </div>
          </div>
        </Card>
      </div>

      {/* Sessions list — underline tabs + content in a single Card.
          Bleed `-mx-6 px-6` so the rail reaches the card edges;
          overflow-x-auto handles narrow phones gracefully. */}
      <Card>
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as CalendarFilter)}
          className="w-full"
          dir={direction}
        >
          <div className="px-6 pt-6">
            <div className="-mx-6 px-6 overflow-x-auto">
              <UnderlineTabsList className="gap-6">
                <UnderlineTabsTrigger value="all">
                  <span>{t('user.calendar.filter.all', 'All Sessions')}</span>
                  <TabCountBadge n={counts.all} />
                </UnderlineTabsTrigger>
                <UnderlineTabsTrigger value="today">
                  <span>{t('user.calendar.filter.today', 'Today')}</span>
                  <TabCountBadge n={counts.today} />
                </UnderlineTabsTrigger>
                <UnderlineTabsTrigger value="upcoming">
                  <span>{t('user.calendar.filter.next24h', 'Next 24h')}</span>
                  <TabCountBadge n={counts.upcoming} />
                </UnderlineTabsTrigger>
              </UnderlineTabsList>
            </div>
          </div>

          <TabsContent value={filter} className="p-6 space-y-4">
            {paginatedSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6 mb-4">
                  <Calendar className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">
                  {t('user.calendar.noSessions', 'No sessions found')}
                </h3>
              </div>
            ) : (
              <div className="grid gap-4">
                {paginatedSessions.map((session, index) => {
                  const duration = getSessionDuration(session.startTime, session.endTime);
                  return (
                    <Card
                      key={session.id}
                      className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex flex-col sm:flex-row gap-4 p-6">
                        {/* Date badge */}
                        <div className="flex-shrink-0">
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex flex-col items-center justify-center border-2 border-primary/10 group-hover:scale-105 transition-transform">
                            <span className="text-2xl font-bold text-primary">
                              {formatInTimezone(
                                session.startTime.toISOString(),
                                resolveDisplayTimezone({
                                  recipientTz: userProfile?.preferences?.regional?.timezone,
                                  tenantTz: userProfile?.preferences?.regional?.tenantTimezone,
                                }),
                                { day: 'numeric' },
                                language === 'he' ? 'he-IL' : 'en-US',
                              )}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground uppercase">
                              {formatInTimezone(
                                session.startTime.toISOString(),
                                resolveDisplayTimezone({
                                  recipientTz: userProfile?.preferences?.regional?.timezone,
                                  tenantTz: userProfile?.preferences?.regional?.tenantTimezone,
                                }),
                                { month: 'short' },
                                language === 'he' ? 'he-IL' : 'en-US',
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 space-y-3">
                          <div>
                            <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                              {session.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {session.course_name}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <div className="font-medium text-foreground">
                                  {formatInTimezone(
                                    session.startTime.toISOString(),
                                    resolveDisplayTimezone({
                                      recipientTz: userProfile?.preferences?.regional?.timezone,
                                      tenantTz: userProfile?.preferences?.regional?.tenantTimezone,
                                    }),
                                    { hour: 'numeric', minute: '2-digit', hour12: true },
                                    language === 'he' ? 'he-IL' : 'en-US',
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">{duration}</div>
                              </div>
                            </div>

                            {session.instructor_name && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                  <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                  <div className="font-medium text-foreground line-clamp-1">
                                    {session.instructor_name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {t('user.calendar.instructor', 'Instructor')}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Bell className="h-3 w-3" />
                            <span>
                              {t('user.calendar.starts', 'Starts')}{' '}
                              {formatDistanceToNow(session.startTime, { addSuffix: true, locale })}
                            </span>
                          </div>
                        </div>

                        {/* Join button */}
                        <div className="flex-shrink-0 flex items-center">
                          {session.meeting_platform && (
                            <a
                              href={
                                session.meeting_platform === 'zoom'
                                  ? `https://zoom.us/j/${session.zoom_meeting_id}`
                                  : session.daily_room_url || '#'
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full sm:w-auto"
                            >
                              <Button className="w-full sm:w-auto gap-2">
                                <Video className="h-4 w-4" />
                                {t('user.calendar.joinSession', 'Join Session')}
                                <ExternalLink className="h-3 w-3 opacity-60" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Pagination — only when more than one page in this filter. */}
            {filteredSessions.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {t('common.page', 'Page')} {currentPage} {t('common.of', 'of')} {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
