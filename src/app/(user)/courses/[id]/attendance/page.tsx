'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUserLanguage } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  X,
  UserCheck,
  UserMinus,
} from 'lucide-react';
import { Attendance, Course } from '@/types/lms';
import { format, parseISO } from 'date-fns';

interface AttendanceRecord extends Attendance {
  lesson_title?: string;
}

interface AttendanceStats {
  total_sessions: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  excused_count: number;
  attendance_percentage: number;
}

export default function StudentAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const { t, language } = useUserLanguage();
  const isRtl = language === 'he';

  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourse();
    loadAttendance();
    loadStats();
  }, [courseId]);

  async function loadCourse() {
    try {
      const response = await fetch(`/api/lms/courses/${courseId}`);
      if (!response.ok) throw new Error('Failed to load course');
      const result = await response.json();
      setCourse(result.data);
    } catch (error: any) {
      console.error('Error loading course:', error);
      toast.error(t('common.error', 'Error'), {
        description: error.message,
      });
    }
  }

  async function loadAttendance() {
    try {
      const response = await fetch(`/api/user/courses/${courseId}/attendance`);
      if (!response.ok) throw new Error('Failed to load attendance');
      const result = await response.json();
      setAttendance(result.data || []);
    } catch (error: any) {
      console.error('Error loading attendance:', error);
      toast.error(t('common.error', 'Error'), {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const response = await fetch(`/api/user/courses/${courseId}/attendance/stats`);
      if (!response.ok) throw new Error('Failed to load stats');
      const result = await response.json();
      setStats(result.data);
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'present':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'absent':
        return <X className="h-4 w-4 text-red-600" />;
      case 'excused':
        return <UserMinus className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'present':
        return (
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
            {t('user.attendance.status.present', 'Present')}
          </Badge>
        );
      case 'late':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">
            {t('user.attendance.status.late', 'Late')}
          </Badge>
        );
      case 'absent':
        return (
          <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">
            {t('user.attendance.status.absent', 'Absent')}
          </Badge>
        );
      case 'excused':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
            {t('user.attendance.status.excused', 'Excused')}
          </Badge>
        );
      default:
        return null;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/courses/${courseId}`)}
        >
          <ArrowLeft className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
          {t('common.back', 'Back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold" suppressHydrationWarning>
            {t('user.attendance.title', 'My Attendance')}
          </h1>
          <p className="text-muted-foreground" suppressHydrationWarning>
            {course?.title}
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('user.attendance.totalSessions', 'Total Sessions')}
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_sessions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('user.attendance.present', 'Present')}
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.present_count}</div>
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                {t('user.attendance.includingLate', 'Including {count} late').replace(
                  '{count}',
                  stats.late_count.toString()
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('user.attendance.absent', 'Absent')}
              </CardTitle>
              <X className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.absent_count}</div>
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                {t('user.attendance.excused', '{count} excused').replace(
                  '{count}',
                  stats.excused_count.toString()
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('user.attendance.attendanceRate', 'Attendance Rate')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.attendance_percentage.toFixed(1)}%
              </div>
              <Progress value={stats.attendance_percentage} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle suppressHydrationWarning>
            {t('user.attendance.records', 'Attendance Records')}
          </CardTitle>
          <CardDescription suppressHydrationWarning>
            {t('user.attendance.recordsDescription', 'Your attendance history for this course')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attendance.map((record) => (
              <div
                key={record.id}
                className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {format(parseISO(record.attendance_date), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                  {record.lesson_title && (
                    <p className="text-sm text-muted-foreground">{record.lesson_title}</p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(record.status)}
                    {getStatusBadge(record.status)}
                  </div>

                  {record.notes && (
                    <div className="text-sm text-muted-foreground max-w-xs">
                      <p className="italic">"{record.notes}"</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {attendance.length === 0 && (
              <div className="text-center py-8 text-muted-foreground" suppressHydrationWarning>
                {t('user.attendance.noRecords', 'No attendance records yet')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
