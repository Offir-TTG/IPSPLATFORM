'use client';
export const dynamic = 'force-dynamic';

import { useDashboard } from '@/hooks/useDashboard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { useUserLanguage } from '@/context/AppContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AttendancePage() {
  const { t, language } = useUserLanguage();
  const { data, isLoading, error, refetch } = useDashboard();
  const [filter, setFilter] = useState<'all' | 'present' | 'absent' | 'late' | 'excused'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const isRtl = language === 'he';
  const locale = language === 'he' ? he : enUS;

  // Get status badge details
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return {
          icon: CheckCircle,
          label: t('user.dashboard.attendance.present', 'Present'),
          color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
        };
      case 'absent':
        return {
          icon: XCircle,
          label: t('user.dashboard.attendance.absent', 'Absent'),
          color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
        };
      case 'late':
        return {
          icon: Clock,
          label: t('user.dashboard.attendance.late', 'Late'),
          color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        };
      case 'excused':
        return {
          icon: AlertCircle,
          label: t('user.dashboard.attendance.excused', 'Excused'),
          color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
        };
      default:
        return {
          icon: AlertCircle,
          label: status,
          color: 'bg-muted text-muted-foreground border-muted'
        };
    }
  };

  const filterAttendance = () => {
    if (!data?.recent_attendance) return [];

    if (filter === 'all') {
      return data.recent_attendance;
    }

    return data.recent_attendance.filter(a => a.status === filter);
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
            {t('user.attendance.errorTitle', 'Error loading attendance')}
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">
              {t('user.attendance.errorMessage', 'Failed to load your attendance data. Please try again.')}
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

  const filteredAttendance = filterAttendance();
  const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAttendance = filteredAttendance.slice(startIndex, endIndex);

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
            {t('user.attendance.title', 'My Attendance')}
          </h1>
          <p className="text-muted-foreground" suppressHydrationWarning>
            {t('user.attendance.subtitle', 'View all your attendance records')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          {t('user.attendance.filter.all', 'All Records')}
        </Button>
        <Button
          variant={filter === 'present' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('present')}
        >
          {t('user.dashboard.attendance.present', 'Present')}
        </Button>
        <Button
          variant={filter === 'absent' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('absent')}
        >
          {t('user.dashboard.attendance.absent', 'Absent')}
        </Button>
        <Button
          variant={filter === 'late' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('late')}
        >
          {t('user.dashboard.attendance.late', 'Late')}
        </Button>
        <Button
          variant={filter === 'excused' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('excused')}
        >
          {t('user.dashboard.attendance.excused', 'Excused')}
        </Button>
      </div>

      {/* Attendance List */}
      {paginatedAttendance.length === 0 ? (
        <Card className="p-12 text-center border-2 border-dashed">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6">
              <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {t('user.attendance.noRecords', 'No attendance records')}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {filter === 'all'
              ? t('user.attendance.noRecordsAll', 'Your attendance will appear here once recorded')
              : t('user.attendance.noRecordsFiltered', 'No attendance records found for this filter')
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
          {paginatedAttendance.map((record, index) => {
            const statusInfo = getStatusBadge(record.status);
            const StatusIcon = statusInfo.icon;
            const date = parseISO(record.attendance_date);

            return (
              <Card
                key={record.id}
                className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 animate-fade-up"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <Link href={`/courses/${record.course_id}`}>
                  <div className="flex flex-col sm:flex-row gap-4 p-6 cursor-pointer">
                    {/* Left: Date Badge */}
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

                    {/* Middle: Attendance Details */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                              {record.lesson_title || record.course_name}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                            {record.course_name}
                          </p>
                        </div>
                      </div>

                      {/* Additional Info */}
                      {record.notes && (
                        <div className="flex items-start gap-2 text-sm">
                          <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-muted-foreground italic line-clamp-2">
                              {record.notes}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Status Badge */}
                    <div className="flex-shrink-0 flex items-center">
                      <Badge className={`flex items-center gap-2 ${statusInfo.color} border px-4 py-2`}>
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

      {/* Pagination */}
      {filteredAttendance.length > 0 && totalPages > 1 && (
        <Card className="p-4 bg-muted/50 mt-6">
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
