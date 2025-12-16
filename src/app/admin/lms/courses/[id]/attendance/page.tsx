'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdminLanguage } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Download,
  Save,
  Search,
  UserCheck,
  UserMinus,
  UserX,
  XCircle,
} from 'lucide-react';
import { Attendance, AttendanceStatus, Course } from '@/types/lms';
import { format } from 'date-fns';

interface Student {
  id: string;
  full_name: string;
  email: string;
}

interface AttendanceRecord extends Attendance {
  student_name?: string;
  student_email?: string;
}

export default function CourseAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const { t, language } = useAdminLanguage();
  const isRtl = language === 'he';

  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Map<string, AttendanceStatus>>(new Map());
  const [notes, setNotes] = useState<Map<string, string>>(new Map());
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedLesson, setSelectedLesson] = useState<string>('all');
  const [lessons, setLessons] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    loadCourse();
    loadStudents();
    loadLessons();
  }, [courseId]);

  useEffect(() => {
    if (selectedDate) {
      loadAttendanceForDate();
    }
  }, [selectedDate, selectedLesson]);

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

  async function loadStudents() {
    try {
      const response = await fetch(`/api/admin/lms/courses/${courseId}/students`);
      if (!response.ok) throw new Error('Failed to load students');
      const result = await response.json();
      setStudents(result.data || []);
    } catch (error: any) {
      console.error('Error loading students:', error);
      toast.error(t('common.error', 'Error'), {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadLessons() {
    try {
      const response = await fetch(`/api/lms/lessons?courseId=${courseId}`);
      if (!response.ok) throw new Error('Failed to load lessons');
      const result = await response.json();
      setLessons(result.data || []);
    } catch (error: any) {
      console.error('Error loading lessons:', error);
    }
  }

  async function loadAttendanceForDate() {
    try {
      const url = new URL(`/api/admin/lms/courses/${courseId}/attendance`, window.location.origin);
      url.searchParams.set('date', selectedDate);
      if (selectedLesson && selectedLesson !== 'all') {
        url.searchParams.set('lesson_id', selectedLesson);
      }

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to load attendance');
      const result = await response.json();

      const records = result.data || [];
      setExistingRecords(records);

      // Populate attendance map with existing records
      const attendanceMap = new Map<string, AttendanceStatus>();
      const notesMap = new Map<string, string>();

      records.forEach((record: AttendanceRecord) => {
        attendanceMap.set(record.student_id, record.status);
        if (record.notes) {
          notesMap.set(record.student_id, record.notes);
        }
      });

      setAttendance(attendanceMap);
      setNotes(notesMap);
    } catch (error: any) {
      console.error('Error loading attendance:', error);
    }
  }

  function handleStatusChange(studentId: string, status: AttendanceStatus) {
    const newAttendance = new Map(attendance);
    newAttendance.set(studentId, status);
    setAttendance(newAttendance);
  }

  function handleNotesChange(studentId: string, value: string) {
    const newNotes = new Map(notes);
    newNotes.set(studentId, value);
    setNotes(newNotes);
  }

  function markAll(status: AttendanceStatus) {
    const newAttendance = new Map<string, AttendanceStatus>();
    filteredStudents.forEach((student) => {
      newAttendance.set(student.id, status);
    });
    setAttendance(newAttendance);
  }

  async function handleSave() {
    try {
      setSaving(true);

      const records = Array.from(attendance.entries()).map(([studentId, status]) => ({
        student_id: studentId,
        status,
        notes: notes.get(studentId) || null,
      }));

      const response = await fetch(`/api/admin/lms/courses/${courseId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          lesson_id: selectedLesson && selectedLesson !== 'all' ? selectedLesson : null,
          attendance_date: selectedDate,
          records,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save attendance');
      }

      toast.success(t('common.success', 'Success'), {
        description: t('admin.attendance.saved', 'Attendance saved successfully'),
      });

      loadAttendanceForDate();
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      toast.error(t('common.error', 'Error'), {
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    try {
      const url = new URL(`/api/admin/lms/courses/${courseId}/attendance/export`, window.location.origin);
      url.searchParams.set('format', 'csv');

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to export attendance');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `attendance-${course?.title}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(t('common.success', 'Success'), {
        description: t('admin.attendance.exported', 'Attendance exported successfully'),
      });
    } catch (error: any) {
      console.error('Error exporting attendance:', error);
      toast.error(t('common.error', 'Error'), {
        description: error.message,
      });
    }
  }

  const filteredStudents = students.filter((student) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      student.full_name.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower)
    );
  });

  function getStatusIcon(status: AttendanceStatus) {
    switch (status) {
      case 'present':
        return <UserCheck className="h-4 w-4" />;
      case 'absent':
        return <UserX className="h-4 w-4" />;
      case 'late':
        return <Clock className="h-4 w-4" />;
      case 'excused':
        return <UserMinus className="h-4 w-4" />;
      default:
        return null;
    }
  }

  function getStatusColor(status: AttendanceStatus) {
    switch (status) {
      case 'present':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'absent':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      case 'late':
        return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case 'excused':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      default:
        return '';
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
    <div className="container mx-auto py-6 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/lms/courses/${courseId}`)}
          >
            <ArrowLeft className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
            {t('common.back', 'Back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold" suppressHydrationWarning>
              {t('admin.attendance.title', 'Attendance')}
            </h1>
            <p className="text-muted-foreground" suppressHydrationWarning>
              {course?.title}
            </p>
          </div>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
          {t('admin.attendance.export', 'Export')}
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle suppressHydrationWarning>
            {t('admin.attendance.filters', 'Filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block" suppressHydrationWarning>
                {t('admin.attendance.date', 'Date')}
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" suppressHydrationWarning>
                {t('admin.attendance.lesson', 'Lesson (Optional)')}
              </label>
              <Select value={selectedLesson} onValueChange={setSelectedLesson}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.attendance.allLessons', 'All Lessons')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('admin.attendance.allLessons', 'All Lessons')}
                  </SelectItem>
                  {lessons.map((lesson) => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" suppressHydrationWarning>
                {t('admin.attendance.search', 'Search Students')}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('admin.attendance.searchPlaceholder', 'Search by name or email...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={isRtl ? 'pr-10' : 'pl-10'}
                />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAll('present')}
            >
              <UserCheck className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              {t('admin.attendance.markAllPresent', 'Mark All Present')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAll('absent')}
            >
              <UserX className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              {t('admin.attendance.markAllAbsent', 'Mark All Absent')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle suppressHydrationWarning>
              {t('admin.attendance.students', 'Students')} ({filteredStudents.length})
            </CardTitle>
            <CardDescription suppressHydrationWarning>
              {t('admin.attendance.markAttendance', 'Mark attendance for each student')}
            </CardDescription>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
            {saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredStudents.map((student) => {
              const studentStatus = attendance.get(student.id);
              const studentNotes = notes.get(student.id) || '';

              return (
                <div
                  key={student.id}
                  className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{student.full_name}</p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={studentStatus === 'present' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(student.id, 'present')}
                      className={studentStatus === 'present' ? '' : getStatusColor('present')}
                    >
                      {getStatusIcon('present')}
                      <span className={isRtl ? 'mr-2' : 'ml-2'} suppressHydrationWarning>
                        {t('admin.attendance.status.present', 'Present')}
                      </span>
                    </Button>

                    <Button
                      variant={studentStatus === 'late' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(student.id, 'late')}
                      className={studentStatus === 'late' ? '' : getStatusColor('late')}
                    >
                      {getStatusIcon('late')}
                      <span className={isRtl ? 'mr-2' : 'ml-2'} suppressHydrationWarning>
                        {t('admin.attendance.status.late', 'Late')}
                      </span>
                    </Button>

                    <Button
                      variant={studentStatus === 'absent' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(student.id, 'absent')}
                      className={studentStatus === 'absent' ? '' : getStatusColor('absent')}
                    >
                      {getStatusIcon('absent')}
                      <span className={isRtl ? 'mr-2' : 'ml-2'} suppressHydrationWarning>
                        {t('admin.attendance.status.absent', 'Absent')}
                      </span>
                    </Button>

                    <Button
                      variant={studentStatus === 'excused' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(student.id, 'excused')}
                      className={studentStatus === 'excused' ? '' : getStatusColor('excused')}
                    >
                      {getStatusIcon('excused')}
                      <span className={isRtl ? 'mr-2' : 'ml-2'} suppressHydrationWarning>
                        {t('admin.attendance.status.excused', 'Excused')}
                      </span>
                    </Button>
                  </div>

                  <Input
                    placeholder={t('admin.attendance.notes', 'Notes...')}
                    value={studentNotes}
                    onChange={(e) => handleNotesChange(student.id, e.target.value)}
                    className="md:w-64"
                  />
                </div>
              );
            })}

            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground" suppressHydrationWarning>
                {t('admin.attendance.noStudents', 'No students found')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
