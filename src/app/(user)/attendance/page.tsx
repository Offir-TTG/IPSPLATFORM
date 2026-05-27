'use client';
export const dynamic = 'force-dynamic';

import { useDashboard } from '@/hooks/useDashboard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Tabs,
  TabsContent,
  UnderlineTabsList,
  UnderlineTabsTrigger,
  TabCountBadge,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { useUserLanguage } from '@/context/AppContext';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type AttendanceFilter = 'all' | 'present' | 'absent' | 'late' | 'excused';

const PAGE_SIZE = 10;

export default function AttendancePage() {
  const { t, language, direction } = useUserLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isLoading, error, refetch } = useDashboard();
  const [filter, setFilter] = useState<AttendanceFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  // Course filter — `'all'` shows every course. The per-course
  // /courses/[id]/attendance route redirects here with ?course=<id>
  // so old bookmarks land pre-filtered.
  const [courseFilter, setCourseFilter] = useState<string>(
    searchParams.get('course') ?? 'all',
  );
  const isRtl = language === 'he';
  const locale = language === 'he' ? he : enUS;

  const allRecords = data?.recent_attendance ?? [];

  // Unique courses for the filter dropdown.
  const courseOptions = useMemo(() => {
    const seen = new Map<string, string>();
    allRecords.forEach((r) => {
      if (r.course_id && !seen.has(r.course_id)) {
        seen.set(r.course_id, r.course_name || r.course_id);
      }
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [allRecords]);

  // Apply course filter BEFORE counting so stats + tab badges stay
  // consistent with what's on screen.
  const records = useMemo(
    () =>
      courseFilter === 'all'
        ? allRecords
        : allRecords.filter((r) => r.course_id === courseFilter),
    [allRecords, courseFilter],
  );

  const counts = {
    all: records.length,
    present: records.filter((r) => r.status === 'present').length,
    absent: records.filter((r) => r.status === 'absent').length,
    late: records.filter((r) => r.status === 'late').length,
    excused: records.filter((r) => r.status === 'excused').length,
  };

  // Map a status string to icon + label + color classes for the row badge.
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return {
          icon: CheckCircle,
          label: t('user.dashboard.attendance.present', 'Present'),
          color:
            'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
        };
      case 'absent':
        return {
          icon: XCircle,
          label: t('user.dashboard.attendance.absent', 'Absent'),
          color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        };
      case 'late':
        return {
          icon: Clock,
          label: t('user.dashboard.attendance.late', 'Late'),
          color:
            'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        };
      case 'excused':
        return {
          icon: AlertCircle,
          label: t('user.dashboard.attendance.excused', 'Excused'),
          color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        };
      default:
        return {
          icon: AlertCircle,
          label: status,
          color: 'bg-muted text-muted-foreground border-muted',
        };
    }
  };

  const filteredAttendance =
    filter === 'all' ? records : records.filter((r) => r.status === filter);
  const totalPages = Math.max(1, Math.ceil(filteredAttendance.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedAttendance = filteredAttendance.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  // Reset to page 1 when either filter changes the visible set.
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, courseFilter]);

  // Sync course filter to the URL so it survives a refresh and is
  // deep-linkable. `scroll: false` prevents the page from jumping.
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (courseFilter === 'all') params.delete('course');
    else params.set('course', courseFilter);
    const qs = params.toString();
    router.replace(qs ? `/attendance?${qs}` : '/attendance', { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseFilter]);

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
            {t('user.attendance.errorTitle', 'Error loading attendance')}
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">
              {t(
                'user.attendance.errorMessage',
                'Failed to load your attendance data. Please try again.',
              )}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
              {t('user.attendance.retry', 'Retry')}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 p-4 md:p-0" dir={direction}>
      {/* Header — plain h1 + subtitle, matches notifications / billing. */}
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
              {t('user.attendance.title', 'My Attendance')}
            </h1>
            <p
              style={{
                color: 'hsl(var(--text-muted))',
                fontSize: 'var(--font-size-base)',
                fontFamily: 'var(--font-family-primary)',
              }}
              suppressHydrationWarning
            >
              {t('user.attendance.subtitle', 'View all your attendance records')}
            </p>
          </div>
          {/* Course filter — always rendered when there's at least one
              course, so the filter UI is discoverable for any student
              regardless of how many courses they're enrolled in. URL
              stays in sync via the useEffect above. */}
          {courseOptions.length > 0 && (
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-full sm:w-[260px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('user.attendance.filter.allCourses', 'All courses')}
                </SelectItem>
                {courseOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Stats Cards — Total / Present / Absent. Same icon-circle layout
          as the notifications stats row. */}
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
                {t('user.attendance.stats.total', 'Total')}
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
              <Calendar
                className="h-6 w-6"
                style={{ color: 'hsl(var(--accent-foreground))' }}
              />
            </div>
          </div>
        </Card>

        <Card
          className="p-4 ltr:border-l-4 rtl:border-r-4"
          style={{ borderColor: 'hsl(var(--success))' }}
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
                {t('user.dashboard.attendance.present', 'Present')}
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-3xl)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'hsl(var(--success))',
                }}
              >
                {counts.present}
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'hsl(var(--success) / 0.1)' }}
            >
              <CheckCircle className="h-6 w-6" style={{ color: 'hsl(var(--success))' }} />
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
                {t('user.dashboard.attendance.absent', 'Absent')}
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-3xl)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'hsl(var(--destructive))',
                }}
              >
                {counts.absent}
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'hsl(var(--destructive) / 0.1)' }}
            >
              <XCircle className="h-6 w-6" style={{ color: 'hsl(var(--destructive))' }} />
            </div>
          </div>
        </Card>
      </div>

      {/* Attendance List — wrapped in a Card with underline tabs at the
          top. Bleed `-mx-6 px-6` so the rail reaches the card edges;
          overflow-x-auto handles 5 tabs gracefully on narrow phones. */}
      <Card>
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as AttendanceFilter)}
          className="w-full"
          dir={direction}
        >
          <div className="px-6 pt-6">
            <div className="-mx-6 px-6 overflow-x-auto">
              <UnderlineTabsList className="gap-6">
                <UnderlineTabsTrigger value="all">
                  <span>{t('user.attendance.filter.all', 'All Records')}</span>
                  <TabCountBadge n={counts.all} />
                </UnderlineTabsTrigger>
                <UnderlineTabsTrigger value="present">
                  <span>{t('user.dashboard.attendance.present', 'Present')}</span>
                  <TabCountBadge n={counts.present} />
                </UnderlineTabsTrigger>
                <UnderlineTabsTrigger value="absent">
                  <span>{t('user.dashboard.attendance.absent', 'Absent')}</span>
                  <TabCountBadge n={counts.absent} tone="alert" />
                </UnderlineTabsTrigger>
                <UnderlineTabsTrigger value="late">
                  <span>{t('user.dashboard.attendance.late', 'Late')}</span>
                  <TabCountBadge n={counts.late} />
                </UnderlineTabsTrigger>
                <UnderlineTabsTrigger value="excused">
                  <span>{t('user.dashboard.attendance.excused', 'Excused')}</span>
                  <TabCountBadge n={counts.excused} />
                </UnderlineTabsTrigger>
              </UnderlineTabsList>
            </div>
          </div>

          <TabsContent value={filter} className="p-6 space-y-3">
            {paginatedAttendance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6 mb-4">
                  <Calendar className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">
                  {t('user.attendance.noRecords', 'No attendance records')}
                </h3>
              </div>
            ) : (
              <div className="grid gap-4">
                {paginatedAttendance.map((record, index) => {
                  const statusInfo = getStatusBadge(record.status);
                  const StatusIcon = statusInfo.icon;
                  const date = parseISO(record.attendance_date);

                  return (
                    <Card
                      key={record.id}
                      className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <Link href={`/courses/${record.course_id}`}>
                        <div className="flex flex-col sm:flex-row gap-4 p-6 cursor-pointer">
                          {/* Date badge */}
                          <div className="flex-shrink-0">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex flex-col items-center justify-center border-2 border-primary/10 group-hover:scale-105 transition-transform">
                              <span className="text-2xl font-bold text-primary">
                                {format(date, 'd', { locale })}
                              </span>
                              <span className="text-xs font-medium text-muted-foreground uppercase">
                                {format(date, 'MMM', { locale })}
                              </span>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0 space-y-3">
                            <div>
                              <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                {record.lesson_title || record.course_name}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {record.course_name}
                              </p>
                            </div>
                            {record.notes && (
                              <div className="flex items-start gap-2 text-sm">
                                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                  <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="flex-1 text-xs text-muted-foreground italic line-clamp-2">
                                  {record.notes}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Status badge */}
                          <div className="flex-shrink-0 flex items-center">
                            <Badge
                              className={`flex items-center gap-2 ${statusInfo.color} border px-4 py-2`}
                            >
                              <StatusIcon className="h-4 w-4" />
                              {statusInfo.label}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Pagination — same prev/next pattern as the previous
                attendance page; show only when there's more than one
                page in the filtered set. */}
            {filteredAttendance.length > 0 && totalPages > 1 && (
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
