'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdminLanguage } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Download,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { AttendanceStats, Course } from '@/types/lms';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StudentAttendanceReport extends AttendanceStats {
  student_name: string;
  student_email: string;
}

export default function AttendanceReportsPage() {
  const params = useParams();
  const router = useRouter();
  const { t, language } = useAdminLanguage();
  const isRtl = language === 'he';

  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [reports, setReports] = useState<StudentAttendanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'percentage'>('percentage');
  const [filterStatus, setFilterStatus] = useState<'all' | 'good' | 'warning' | 'poor'>('all');

  useEffect(() => {
    loadCourse();
    loadReports();
  }, [courseId]);

  async function loadCourse() {
    try {
      const response = await fetch(`/api/admin/lms/courses/${courseId}`);
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

  async function loadReports() {
    try {
      const response = await fetch(`/api/admin/lms/courses/${courseId}/attendance/reports`);
      if (!response.ok) throw new Error('Failed to load reports');
      const result = await response.json();
      setReports(result.data || []);
    } catch (error: any) {
      console.error('Error loading reports:', error);
      toast.error(t('common.error', 'Error'), {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    try {
      const response = await fetch(`/api/admin/lms/courses/${courseId}/attendance/reports/export`);
      if (!response.ok) throw new Error('Failed to export report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report-${course?.title}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(t('common.success', 'Success'), {
        description: t('admin.attendance.reports.exported', 'Report exported successfully'),
      });
    } catch (error: any) {
      console.error('Error exporting report:', error);
      toast.error(t('common.error', 'Error'), {
        description: error.message,
      });
    }
  }

  function getAttendanceStatus(percentage: number): {
    label: string;
    color: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  } {
    if (percentage >= 90)
      return {
        label: t('admin.attendance.reports.excellent', 'Excellent'),
        color: 'text-green-600',
        variant: 'default',
      };
    if (percentage >= 75)
      return {
        label: t('admin.attendance.reports.good', 'Good'),
        color: 'text-blue-600',
        variant: 'secondary',
      };
    if (percentage >= 60)
      return {
        label: t('admin.attendance.reports.warning', 'Warning'),
        color: 'text-yellow-600',
        variant: 'outline',
      };
    return {
      label: t('admin.attendance.reports.poor', 'Poor'),
      color: 'text-red-600',
      variant: 'destructive',
    };
  }

  const filteredReports = reports
    .filter((report) => {
      if (filterStatus === 'all') return true;
      const percentage = report.attendance_percentage;
      if (filterStatus === 'good') return percentage >= 90;
      if (filterStatus === 'warning') return percentage >= 60 && percentage < 90;
      if (filterStatus === 'poor') return percentage < 60;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.student_name.localeCompare(b.student_name);
      }
      return b.attendance_percentage - a.attendance_percentage;
    });

  const averageAttendance =
    reports.length > 0
      ? reports.reduce((sum, r) => sum + r.attendance_percentage, 0) / reports.length
      : 0;

  const excellentCount = reports.filter((r) => r.attendance_percentage >= 90).length;
  const poorCount = reports.filter((r) => r.attendance_percentage < 60).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/lms/courses/${courseId}/attendance`)}
          >
            <ArrowLeft className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
            {t('common.back', 'Back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold" suppressHydrationWarning>
              {t('admin.attendance.reports.title', 'Attendance Reports')}
            </h1>
            <p className="text-muted-foreground" suppressHydrationWarning>
              {course?.title}
            </p>
          </div>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
          {t('admin.attendance.reports.export', 'Export')}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" suppressHydrationWarning>
              {t('admin.attendance.reports.totalStudents', 'Total Students')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" suppressHydrationWarning>
              {t('admin.attendance.reports.avgAttendance', 'Average Attendance')}
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageAttendance.toFixed(1)}%</div>
            <Progress value={averageAttendance} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" suppressHydrationWarning>
              {t('admin.attendance.reports.excellent', 'Excellent (90%+)')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{excellentCount}</div>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {reports.length > 0 ? ((excellentCount / reports.length) * 100).toFixed(0) : 0}%{' '}
              {t('admin.attendance.reports.ofTotal', 'of total')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" suppressHydrationWarning>
              {t('admin.attendance.reports.poor', 'Poor (<60%)')}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{poorCount}</div>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {reports.length > 0 ? ((poorCount / reports.length) * 100).toFixed(0) : 0}%{' '}
              {t('admin.attendance.reports.ofTotal', 'of total')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle suppressHydrationWarning>
            {t('admin.attendance.reports.filters', 'Filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block" suppressHydrationWarning>
                {t('admin.attendance.reports.sortBy', 'Sort By')}
              </label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">
                    {t('admin.attendance.reports.byPercentage', 'Attendance Percentage')}
                  </SelectItem>
                  <SelectItem value="name">
                    {t('admin.attendance.reports.byName', 'Student Name')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block" suppressHydrationWarning>
                {t('admin.attendance.reports.filterBy', 'Filter By')}
              </label>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('admin.attendance.reports.all', 'All Students')}
                  </SelectItem>
                  <SelectItem value="good">
                    {t('admin.attendance.reports.excellent', 'Excellent (90%+)')}
                  </SelectItem>
                  <SelectItem value="warning">
                    {t('admin.attendance.reports.needsAttention', 'Needs Attention (60-90%)')}
                  </SelectItem>
                  <SelectItem value="poor">
                    {t('admin.attendance.reports.poor', 'Poor (<60%)')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Reports */}
      <Card>
        <CardHeader>
          <CardTitle suppressHydrationWarning>
            {t('admin.attendance.reports.studentReports', 'Student Reports')} (
            {filteredReports.length})
          </CardTitle>
          <CardDescription suppressHydrationWarning>
            {t(
              'admin.attendance.reports.detailedBreakdown',
              'Detailed attendance breakdown for each student'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const status = getAttendanceStatus(report.attendance_percentage);

              return (
                <div
                  key={report.student_id}
                  className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{report.student_name}</p>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{report.student_email}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                        {t('admin.attendance.reports.present', 'Present')}
                      </p>
                      <p className="text-lg font-semibold text-green-600">
                        {report.present_count}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                        {t('admin.attendance.reports.late', 'Late')}
                      </p>
                      <p className="text-lg font-semibold text-yellow-600">{report.late_count}</p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                        {t('admin.attendance.reports.absent', 'Absent')}
                      </p>
                      <p className="text-lg font-semibold text-red-600">{report.absent_count}</p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                        {t('admin.attendance.reports.excused', 'Excused')}
                      </p>
                      <p className="text-lg font-semibold text-blue-600">
                        {report.excused_count}
                      </p>
                    </div>
                  </div>

                  <div className="md:w-48">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground" suppressHydrationWarning>
                        {t('admin.attendance.reports.attendance', 'Attendance')}
                      </span>
                      <span className={`text-sm font-semibold ${status.color}`}>
                        {report.attendance_percentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={report.attendance_percentage} />
                    <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                      {report.total_sessions}{' '}
                      {t('admin.attendance.reports.sessions', 'sessions total')}
                    </p>
                  </div>
                </div>
              );
            })}

            {filteredReports.length === 0 && (
              <div className="text-center py-8 text-muted-foreground" suppressHydrationWarning>
                {t('admin.attendance.reports.noData', 'No attendance data available')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
