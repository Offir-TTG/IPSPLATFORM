'use client';
export const dynamic = 'force-dynamic';

import { useDashboard } from '@/hooks/useDashboard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Video,
  Calendar,
  Clock,
  User,
  ExternalLink,
  Bell,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, formatDistanceToNow, differenceInMinutes, differenceInHours } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { useUserLanguage } from '@/context/AppContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CalendarPage() {
  const { t, language } = useUserLanguage();
  const { data, isLoading, error, refetch } = useDashboard();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'today'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const isRtl = language === 'he';
  const locale = language === 'he' ? he : enUS;

  // Update current time every minute for live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const getSessionDuration = (startTime: Date, endTime: Date) => {
    const minutes = differenceInMinutes(endTime, startTime);
    if (minutes < 60) {
      return `${minutes} ${t('common.time.min', 'min')}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}${t('common.time.hourShort', 'h')} ${remainingMinutes}${t('common.time.minuteShort', 'm')}` : `${hours}${t('common.time.hourShort', 'h')}`;
  };

  const filterSessions = () => {
    if (!data?.upcoming_sessions) return [];

    const sessions = data.upcoming_sessions.map(session => ({
      ...session,
      startTime: new Date(session.start_time),
      endTime: new Date(session.end_time)
    }));

    if (filter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return sessions.filter(s => s.startTime >= today && s.startTime < tomorrow);
    }

    if (filter === 'upcoming') {
      return sessions.filter(s => differenceInHours(s.startTime, currentTime) < 24);
    }

    return sessions;
  };

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
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

  const filteredSessions = filterSessions();
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
          {t('common.back', 'Back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold" suppressHydrationWarning>
            {t('user.calendar.title', 'My Calendar')}
          </h1>
          <p className="text-muted-foreground" suppressHydrationWarning>
            {t('user.calendar.subtitle', 'View all your upcoming sessions and meetings')}
          </p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            {t('user.calendar.filter.all', 'All Sessions')}
          </Button>
          <Button
            variant={filter === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('today')}
          >
            {t('user.calendar.filter.today', 'Today')}
          </Button>
          <Button
            variant={filter === 'upcoming' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('upcoming')}
          >
            {t('user.calendar.filter.next24h', 'Next 24h')}
          </Button>
        </div>
      </div>

      {/* Sessions List */}
      {paginatedSessions.length === 0 ? (
        <Card className="p-12 text-center border-2 border-dashed">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6">
              <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {t('user.calendar.noSessions', 'No sessions found')}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {filter === 'all'
              ? t('user.calendar.noSessionsAll', 'You have no upcoming sessions scheduled')
              : filter === 'today'
              ? t('user.calendar.noSessionsToday', 'You have no sessions scheduled for today')
              : t('user.calendar.noSessionsNext24h', 'You have no sessions in the next 24 hours')
            }
          </p>
          <Button variant="outline" asChild>
            <Link href="/courses">
              {t('user.calendar.browseCourses', 'Browse Courses')}
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {paginatedSessions.map((session, index) => {
            const duration = getSessionDuration(session.startTime, session.endTime);

            return (
              <Card
                key={session.id}
                className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 animate-fade-up"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="flex flex-col sm:flex-row gap-4 p-6">
                  {/* Left: Date Badge */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex flex-col items-center justify-center border-2 border-primary/10 group-hover:scale-105 transition-transform">
                      <span className="text-2xl font-bold text-primary">
                        {format(session.startTime, 'd', { locale })}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground uppercase">
                        {format(session.startTime, 'MMM', { locale })}
                      </span>
                    </div>
                  </div>

                  {/* Middle: Session Details */}
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {session.title}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                          {session.course_name}
                        </p>
                      </div>
                    </div>

                    {/* Session Info Grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {format(session.startTime, 'h:mm a', { locale })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {duration}
                          </div>
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

                    {/* Countdown */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Bell className="h-3 w-3" />
                      <span>
                        {t('user.calendar.starts', 'Starts')} {formatDistanceToNow(session.startTime, { addSuffix: true, locale })}
                      </span>
                    </div>
                  </div>

                  {/* Right: Action Button */}
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
                        <button
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            paddingInlineStart: '1.5rem',
                            paddingInlineEnd: '1.5rem',
                            paddingTop: '0.75rem',
                            paddingBottom: '0.75rem',
                            backgroundColor: 'hsl(var(--primary))',
                            color: 'hsl(var(--primary-foreground))',
                            borderRadius: 'calc(var(--radius) * 1.5)',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 'var(--font-size-md)',
                            fontFamily: 'var(--font-family-primary)',
                            fontWeight: 'var(--font-weight-medium)',
                            transition: 'opacity 0.2s',
                            width: '100%'
                          }}
                          className="sm:w-auto hover:opacity-90 group/btn"
                        >
                          <Video className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                          {t('user.calendar.joinSession', 'Join Session')}
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        </button>
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
          </div>
        )}

        {/* Pagination */}
        {filteredSessions.length > 0 && totalPages > 1 && (
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('common.page', 'Page')} {currentPage} {t('common.of', 'of')} {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </Card>
        )}
    </div>
  );
}
