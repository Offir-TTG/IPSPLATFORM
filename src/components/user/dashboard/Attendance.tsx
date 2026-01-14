'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CalendarDays, List, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import type { AttendanceRecord } from '@/hooks/useDashboard';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { useUserLanguage } from '@/context/AppContext';
import { AttendanceCalendar } from './AttendanceCalendar';

interface AttendanceProps {
  attendance: AttendanceRecord[];
}

export function Attendance({ attendance }: AttendanceProps) {
  const { t, direction, language } = useUserLanguage();
  const locale = language === 'he' ? he : undefined;
  const [viewMode, setViewMode] = useState<'list' | 'week' | 'month'>('list');

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

  if (attendance.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t('user.dashboard.attendance.title', 'Attendance')}</h2>
        </div>
        <Card className="p-12 text-center border-2 border-dashed">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6">
              <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('user.dashboard.attendance.noRecords', 'No attendance records')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('user.dashboard.attendance.checkLater', 'Your attendance will appear here once recorded')}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('user.dashboard.attendance.title', 'Attendance')}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {attendance.length} {attendance.length === 1 ? t('user.dashboard.attendance.record', 'record') : t('user.dashboard.attendance.records', 'records')}
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
          <Link href="/attendance">
            <Button variant="ghost" size="sm" className="gap-2">
              {t('user.dashboard.attendance.viewAll', 'View All Attendance')}
              <span className="text-lg">→</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Calendar View */}
      {(viewMode === 'week' || viewMode === 'month') && (
        <Card className="p-6">
          <AttendanceCalendar attendance={attendance} viewMode={viewMode as 'week' | 'month'} />
        </Card>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="grid gap-3">
          {attendance.slice(0, 5).map((record, index) => {
            const statusInfo = getStatusBadge(record.status);
            const StatusIcon = statusInfo.icon;
            const date = parseISO(record.attendance_date);

            return (
              <Card
                key={record.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-primary/20"
              >
                <Link href={`/courses/${record.course_id}`}>
                  <div className="flex items-center gap-3 p-4 cursor-pointer">
                    {/* Date Badge */}
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex flex-col items-center justify-center border border-primary/10">
                        <span className="text-lg font-bold text-primary">
                          {format(date, 'd', { locale })}
                        </span>
                        <span className="text-[9px] font-medium text-muted-foreground uppercase">
                          {format(date, 'MMM', { locale })}
                        </span>
                      </div>
                    </div>

                    {/* Attendance Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                        {record.lesson_title || record.course_name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {record.course_name}
                      </p>
                      {record.notes && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
                          {record.notes}
                        </p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      <Badge className={`flex items-center gap-1.5 ${statusInfo.color} border`}>
                        <StatusIcon className="h-3 w-3" />
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
    </div>
  );
}
