'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import type { AttendanceRecord } from '@/hooks/useDashboard';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  parseISO
} from 'date-fns';
import { he } from 'date-fns/locale';
import { useUserLanguage } from '@/context/AppContext';

interface AttendanceCalendarProps {
  attendance: AttendanceRecord[];
  viewMode: 'week' | 'month';
}

export function AttendanceCalendar({ attendance, viewMode }: AttendanceCalendarProps) {
  const { t, direction, language } = useUserLanguage();
  const isRtl = direction === 'rtl';
  const locale = language === 'he' ? he : undefined;
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get the date range based on view mode
  const getDateRange = () => {
    if (viewMode === 'week') {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 0 }),
        end: endOfWeek(currentDate, { weekStartsOn: 0 })
      };
    } else {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
      };
    }
  };

  const { start, end } = getDateRange();
  const days = eachDayOfInterval({ start, end });

  // Get attendance for a specific day
  const getAttendanceForDay = (day: Date) => {
    return attendance.filter(record =>
      isSameDay(parseISO(record.attendance_date), day)
    );
  };

  // Get status badge details
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return {
          icon: CheckCircle,
          label: t('user.dashboard.attendance.present', 'Present'),
          color: 'bg-green-500/10 text-green-600 dark:text-green-400'
        };
      case 'absent':
        return {
          icon: XCircle,
          label: t('user.dashboard.attendance.absent', 'Absent'),
          color: 'bg-red-500/10 text-red-600 dark:text-red-400'
        };
      case 'late':
        return {
          icon: Clock,
          label: t('user.dashboard.attendance.late', 'Late'),
          color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
        };
      case 'excused':
        return {
          icon: AlertCircle,
          label: t('user.dashboard.attendance.excused', 'Excused'),
          color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
        };
      default:
        return {
          icon: AlertCircle,
          label: status,
          color: 'bg-muted text-muted-foreground'
        };
    }
  };

  // Navigate calendar
  const navigatePrevious = () => {
    if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {viewMode === 'week'
            ? `${format(start, 'MMM d', { locale })} - ${format(end, 'MMM d, yyyy', { locale })}`
            : format(currentDate, 'MMMM yyyy', { locale })
          }
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToday}
          >
            {t('user.dashboard.calendar.today', 'Today')}
          </Button>
          <div className="flex">
            <Button
              variant="outline"
              size="sm"
              onClick={navigatePrevious}
              className={isRtl ? 'rounded-r-none' : 'rounded-r-none'}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={navigateNext}
              className={isRtl ? 'rounded-l-none' : 'rounded-l-none'}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {viewMode === 'week' ? (
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const dayAttendance = getAttendanceForDay(day);
            const isCurrentDay = isToday(day);

            return (
              <div key={index} className="min-h-[120px]">
                <div className={`text-center mb-2 ${isCurrentDay ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                  <div className="text-xs uppercase">{format(day, 'EEE', { locale })}</div>
                  <div className={`text-lg ${isCurrentDay ? 'bg-primary text-primary-foreground rounded-full w-8 h-8 mx-auto flex items-center justify-center' : ''}`}>
                    {format(day, 'd', { locale })}
                  </div>
                </div>
                <div className="space-y-1">
                  {dayAttendance.map(record => {
                    const statusInfo = getStatusBadge(record.status);
                    const StatusIcon = statusInfo.icon;

                    return (
                      <Link
                        key={record.id}
                        href={`/courses/${record.course_id}`}
                        className="block"
                      >
                        <div className="bg-card hover:bg-accent rounded p-2 text-xs cursor-pointer transition-colors group border">
                          <div className="flex items-center gap-1 mb-1">
                            <StatusIcon className={`h-3 w-3 ${statusInfo.color.split(' ')[1]}`} />
                            <span className={`font-medium text-[10px] ${statusInfo.color.split(' ')[1]}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <div className="line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                            {record.lesson_title || record.course_name}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {[
            { key: 'sun', label: t('user.dashboard.calendar.sun', 'Sun') },
            { key: 'mon', label: t('user.dashboard.calendar.mon', 'Mon') },
            { key: 'tue', label: t('user.dashboard.calendar.tue', 'Tue') },
            { key: 'wed', label: t('user.dashboard.calendar.wed', 'Wed') },
            { key: 'thu', label: t('user.dashboard.calendar.thu', 'Thu') },
            { key: 'fri', label: t('user.dashboard.calendar.fri', 'Fri') },
            { key: 'sat', label: t('user.dashboard.calendar.sat', 'Sat') }
          ].map(day => (
            <div key={day.key} className="text-center text-xs font-medium text-muted-foreground p-2">
              {day.label}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day, index) => {
            const dayAttendance = getAttendanceForDay(day);
            const isCurrentDay = isToday(day);
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={index}
                className={`min-h-[80px] p-2 border rounded ${
                  isCurrentMonth ? 'bg-background' : 'bg-muted/30'
                } ${isCurrentDay ? 'border-primary border-2' : 'border-border'}`}
              >
                <div className={`text-xs mb-1 ${isCurrentDay ? 'text-primary font-bold' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {format(day, 'd', { locale })}
                </div>
                <div className="space-y-0.5">
                  {dayAttendance.slice(0, 2).map(record => {
                    const statusInfo = getStatusBadge(record.status);
                    const StatusIcon = statusInfo.icon;

                    return (
                      <Link
                        key={record.id}
                        href={`/courses/${record.course_id}`}
                        className="block"
                      >
                        <div className={`rounded px-1 py-0.5 text-[10px] cursor-pointer transition-colors ${statusInfo.color}`}>
                          <div className="flex items-center gap-0.5">
                            <StatusIcon className="h-2.5 w-2.5" />
                            <span className="line-clamp-1">
                              {record.lesson_title || record.course_name}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  {dayAttendance.length > 2 && (
                    <div className="text-[10px] text-muted-foreground text-center">
                      +{dayAttendance.length - 2} {t('user.dashboard.calendar.moreEvents', 'more')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
