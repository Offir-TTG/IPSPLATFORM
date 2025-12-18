'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdminLanguage } from '@/context/AppContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ArrowLeft,
  Clock,
  Download,
  Save,
  Search,
  UserCheck,
  UserMinus,
  UserX,
  XCircle,
  Filter,
  Calendar,
  Users,
  BookOpen,
  ChevronDown,
  Check,
} from 'lucide-react';
import { AttendanceStatus, Course } from '@/types/lms';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface Student {
  id: string;
  full_name: string;
  email: string;
}

interface Lesson {
  id: string;
  title: string;
  lesson_date: string;
  order_index: number;
}

interface Program {
  id: string;
  name: string;
}

interface AttendanceRecord {
  id?: string;
  student_id: string;
  lesson_id: string;
  status: AttendanceStatus;
  notes?: string;
  attendance_date: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function CourseAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const { t, language, direction } = useAdminLanguage();
  const { toast } = useToast();
  const isRtl = direction === 'rtl';

  const courseId = params.id as string;

  // State
  const [course, setCourse] = useState<Course | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [attendance, setAttendance] = useState<Map<string, AttendanceStatus>>(new Map());
  const [originalAttendance, setOriginalAttendance] = useState<Map<string, AttendanceStatus>>(new Map());
  const [notes, setNotes] = useState<Map<string, string>>(new Map());
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Filters
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>(courseId); // Start with current course from URL
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedLesson, setSelectedLesson] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [courseId]);

  useEffect(() => {
    if (selectedCourse && selectedCourse !== courseId && selectedCourse !== 'all') {
      router.push(`/admin/lms/courses/${selectedCourse}/attendance`);
    }
  }, [selectedCourse, courseId, router]);

  useEffect(() => {
    if (selectedDate && selectedCourse && selectedCourse !== 'all') {
      loadStudents();
      loadLessons();
    } else if (selectedCourse === 'all') {
      // Clear data when "All Courses" is selected
      setStudents([]);
      setLessons([]);
      setAttendance(new Map());
    }
  }, [selectedDate, selectedCourse]);

  useEffect(() => {
    if (students.length > 0 && lessons.length > 0 && selectedLesson) {
      loadAttendance();
    }
  }, [students, lessons, selectedLesson, selectedDate]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  async function loadInitialData() {
    try {
      setLoading(true);
      // Load course and programs first (in parallel)
      const [, loadedPrograms] = await Promise.all([
        loadCourse(),
        loadPrograms(),
      ]);
      // Then load all courses (pass loaded programs directly)
      await loadAllCourses(loadedPrograms || []);
    } finally {
      setLoading(false);
    }
  }

  async function loadCourse() {
    try {
      const response = await fetch(`/api/lms/courses/${courseId}`);
      if (!response.ok) throw new Error('Failed to load course');
      const result = await response.json();
      console.log('Loaded current course:', result.data);
      console.log('Current course program_id:', result.data?.program_id);
      setCourse(result.data);
      // Don't auto-select program - let user choose or keep "All Programs"
    } catch (error: any) {
      console.error('Error loading course:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  async function loadPrograms() {
    try {
      const response = await fetch('/api/admin/programs');
      if (!response.ok) return [];
      const result = await response.json();
      // API returns array directly, not wrapped in { data: ... }
      const programsArray = Array.isArray(result) ? result : [];
      console.log('Loaded programs:', programsArray.length, programsArray.map(p => ({ id: p.id, name: p.name })));
      setPrograms(programsArray);
      return programsArray; // Return the loaded programs
    } catch (error: any) {
      console.error('Error loading programs:', error);
      return [];
    }
  }

  async function loadAllCourses(programsToUse?: any[]) {
    try {
      const programsList = programsToUse || programs;
      console.log('loadAllCourses starting, programs.length:', programsList.length);

      // Load all courses
      const response = await fetch('/api/lms/courses');
      if (!response.ok) throw new Error('Failed to load courses');
      const result = await response.json();
      let coursesArray = result.data || [];
      console.log('Loaded base courses:', coursesArray.length);

      // Load program-course links for each program
      if (programsList.length > 0) {
        console.log('Loading program-course links for programs:', programsList);
        const programCourseMaps = await Promise.all(
          programsList.map(async (program) => {
            try {
              console.log(`Fetching courses for program ${program.id}...`);
              const res = await fetch(`/api/admin/lms/programs/${program.id}/courses`);
              console.log(`Response status for program ${program.id}:`, res.status);
              if (res.ok) {
                const data = await res.json();
                console.log(`Courses in program ${program.id}:`, data.data);
                return { programId: program.id, courseIds: data.data.map((c: any) => c.id) };
              }
            } catch (e) {
              console.error(`Error loading courses for program ${program.id}:`, e);
            }
            return { programId: program.id, courseIds: [] };
          })
        );

        console.log('Program course maps:', programCourseMaps);

        // Create a map of course_id -> [program_ids]
        const courseToProgramsMap = new Map();
        programCourseMaps.forEach(({ programId, courseIds }) => {
          courseIds.forEach((courseId: string) => {
            if (!courseToProgramsMap.has(courseId)) {
              courseToProgramsMap.set(courseId, []);
            }
            courseToProgramsMap.get(courseId).push(programId);
          });
        });

        console.log('Course to programs map:', Array.from(courseToProgramsMap.entries()));

        // Enhance courses with programIds array
        coursesArray = coursesArray.map((course: any) => ({
          ...course,
          programIds: courseToProgramsMap.get(course.id) || [],
        }));

        console.log('Courses with program links:', coursesArray.map((c: any) => ({
          title: c.title,
          program_id: c.program_id,
          programIds: c.programIds
        })));
      } else {
        console.log('No programs loaded, skipping program-course linking');
      }

      setAllCourses(coursesArray);
    } catch (error: any) {
      console.error('Error loading courses:', error);
    }
  }

  async function loadStudents() {
    try {
      const response = await fetch(`/api/admin/lms/courses/${selectedCourse}/students`);
      if (!response.ok) throw new Error('Failed to load students');
      const result = await response.json();
      setStudents(result.data || []);
    } catch (error: any) {
      console.error('Error loading students:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  async function loadLessons() {
    try {
      const response = await fetch(`/api/lms/lessons?course_id=${selectedCourse}`);
      if (!response.ok) throw new Error('Failed to load lessons');
      const result = await response.json();
      const sortedLessons = (result.data || []).sort((a: Lesson, b: Lesson) =>
        a.order_index - b.order_index
      );
      setLessons(sortedLessons);
    } catch (error: any) {
      console.error('Error loading lessons:', error);
    }
  }

  async function loadAttendance() {
    try {
      setLoadingError(null);
      const url = new URL(`/api/admin/lms/courses/${selectedCourse}/attendance`, window.location.origin);

      // Only filter by date when viewing a specific lesson (not in grid view)
      if (selectedLesson && selectedLesson !== 'all') {
        url.searchParams.set('date', selectedDate);
        url.searchParams.set('lesson_id', selectedLesson);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load attendance');
      }
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load attendance');
      }

      const records = result.data || [];

      const attendanceMap = new Map<string, AttendanceStatus>();
      const notesMap = new Map<string, string>();

      records.forEach((record: any) => {
        const key = selectedLesson === 'all'
          ? `${record.student_id}___${record.lesson_id}`
          : record.student_id;
        attendanceMap.set(key, record.status);
        if (record.notes) {
          notesMap.set(key, record.notes);
        }
      });

      setAttendance(attendanceMap);
      setOriginalAttendance(new Map(attendanceMap));
      setNotes(notesMap);
      setIsRetrying(false);
    } catch (error: any) {
      console.error('Error loading attendance:', error);
      setLoadingError(error.message || 'Failed to load attendance');
      toast({
        title: t('common.error', 'Error'),
        description: error.message || 'Failed to load attendance',
        variant: 'destructive',
      });
    }
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  function handleStatusChange(studentId: string, lessonId: string, status: AttendanceStatus) {
    const key = selectedLesson === 'all' ? `${studentId}___${lessonId}` : studentId;
    const newAttendance = new Map(attendance);
    newAttendance.set(key, status);
    setAttendance(newAttendance);
  }

  function handleNotesChange(studentId: string, lessonId: string, value: string) {
    const key = selectedLesson === 'all' ? `${studentId}___${lessonId}` : studentId;
    const newNotes = new Map(notes);
    newNotes.set(key, value);
    setNotes(newNotes);
  }

  function markAllForLesson(lessonId: string, status: AttendanceStatus) {
    const newAttendance = new Map(attendance);
    filteredStudents.forEach((student) => {
      const key = `${student.id}___${lessonId}`;
      newAttendance.set(key, status);
    });
    setAttendance(newAttendance);
  }

  function markAll(status: AttendanceStatus) {
    const newAttendance = new Map<string, AttendanceStatus>();
    filteredStudents.forEach((student) => {
      if (selectedLesson === 'all') {
        lessons.forEach((lesson) => {
          const key = `${student.id}___${lesson.id}`;
          newAttendance.set(key, status);
        });
      } else {
        newAttendance.set(student.id, status);
      }
    });
    setAttendance(newAttendance);
  }

  function clearAll() {
    setAttendance(new Map(originalAttendance));
    setNotes(new Map());
  }

  function handleProgramChange(value: string) {
    console.log('Program changed from', selectedProgram, 'to', value);
    setSelectedProgram(value);
    // Reset course and lesson when program changes
    setSelectedCourse('all');
    setSelectedLesson('all');
  }

  function handleCourseChange(value: string) {
    setSelectedCourse(value);
    // Reset lesson when course changes
    if (value !== selectedCourse) {
      setSelectedLesson('all');
    }
  }

  async function handleSave() {
    console.log('🚀 handleSave called');
    try {
      setSaving(true);

      // Build records array from attendance map
      const records = Array.from(attendance.entries()).map(([key, status]) => {
        const [studentId, lessonId] = selectedLesson === 'all'
          ? key.split('___')
          : [key, selectedLesson];

        return {
          student_id: studentId,
          lesson_id: lessonId,
          status,
          notes: notes.get(key) || null,
        };
      });

      console.log('📦 Built records:', {
        recordsCount: records.length,
        attendanceMapSize: attendance.size,
        selectedCourse,
        selectedDate,
        records
      });

      if (records.length === 0) {
        console.log('⚠️ No records to save');
        toast({
          title: t('common.info', 'Info'),
          description: t('admin.attendance.noDataToSave', 'No attendance data to save'),
        });
        setSaving(false);
        return;
      }

      console.log('📡 Sending POST request...');
      const response = await fetch(`/api/admin/lms/courses/${selectedCourse}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: selectedCourse,
          lesson_id: selectedLesson !== 'all' ? selectedLesson : null,
          attendance_date: selectedDate,
          records,
        }),
      });

      console.log('📨 Response status:', response.status);
      const result = await response.json();
      console.log('📨 Response data:', result);

      if (!response.ok) {
        console.log('❌ Response not OK');
        const errorMessage = result.details || result.error || 'Failed to save attendance';
        throw new Error(errorMessage);
      }

      if (!result.success) {
        console.log('❌ Result success=false');
        throw new Error(result.error || 'Failed to save attendance');
      }

      console.log('✅ Save successful, showing toast');
      toast({
        title: t('common.success', 'Success'),
        description: t('admin.attendance.saved', 'Attendance saved successfully'),
      });

      // Reload attendance to show updated data
      console.log('🔄 Reloading attendance...');
      await loadAttendance();

      // Update original attendance to reflect saved state
      setOriginalAttendance(new Map(attendance));
      console.log('✅ handleSave completed');
    } catch (error: any) {
      console.error('❌ Error in handleSave:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('admin.attendance.saveFailed', 'Failed to save attendance'),
        variant: 'destructive',
      });
    } finally {
      console.log('🏁 handleSave finally block');
      setSaving(false);
    }
  }

  async function handleRetry() {
    setIsRetrying(true);
    await loadAttendance();
  }

  async function handleExport() {
    try {
      const url = new URL(`/api/admin/lms/courses/${courseId}/attendance/export`, window.location.origin);
      url.searchParams.set('format', 'csv');
      url.searchParams.set('date', selectedDate);

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to export attendance');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `attendance-${course?.title}-${selectedDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: t('common.success', 'Success'),
        description: t('admin.attendance.exported', 'Attendance exported successfully'),
      });
    } catch (error: any) {
      console.error('Error exporting attendance:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const filteredCourses = useMemo(() => {
    if (selectedProgram === 'all') {
      return allCourses;
    }
    // Filter courses by program_id (for courses directly assigned to program)
    // OR by checking programIds array (for courses linked via program_courses)
    const filtered = allCourses.filter(c => {
      // Direct program_id match
      if (c.program_id === selectedProgram) return true;
      // Check if course is linked to program via program_courses (programIds array)
      if (c.programIds && Array.isArray(c.programIds)) {
        return c.programIds.includes(selectedProgram);
      }
      return false;
    });
    console.log(`Filtered ${filtered.length} courses for program ${selectedProgram}`);
    return filtered;
  }, [allCourses, selectedProgram]);

  const filteredLessons = useMemo(() => {
    if (selectedLesson === 'all') return lessons;
    return lessons.filter(l => l.id === selectedLesson);
  }, [lessons, selectedLesson]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        student.full_name.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower)
      );
    });
  }, [students, searchTerm]);


  const statusOptions: AttendanceStatus[] = ['present', 'late', 'absent', 'excused'];

  function getStatusIcon(status: AttendanceStatus) {
    switch (status) {
      case 'present':
        return <UserCheck className="h-4 w-4" />;
      case 'late':
        return <Clock className="h-4 w-4" />;
      case 'absent':
        return <UserX className="h-4 w-4" />;
      case 'excused':
        return <UserMinus className="h-4 w-4" />;
      default:
        return null;
    }
  }

  function getStatusColor(status: AttendanceStatus) {
    switch (status) {
      case 'present':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20 border-green-500/50';
      case 'late':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20 border-yellow-500/50';
      case 'absent':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20 border-red-500/50';
      case 'excused':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 border-blue-500/50';
      default:
        return 'bg-gray-100 hover:bg-gray-200 border-gray-300';
    }
  }

  function getStatusBadgeVariant(status: AttendanceStatus): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
      case 'present':
        return 'default';
      case 'late':
        return 'secondary';
      case 'absent':
        return 'destructive';
      case 'excused':
        return 'outline';
      default:
        return 'outline';
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  const hasData = filteredStudents.length > 0;
  const isGridView = selectedLesson === 'all' && lessons.length > 0;

  return (
    <AdminLayout>
      <TooltipProvider>
      <div className="max-w-6xl p-6 space-y-6" dir={direction}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/admin/lms/courses/${courseId}`)}
                  >
                    <ArrowLeft className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                    <span suppressHydrationWarning>{t('common.back', 'Back')}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p suppressHydrationWarning>{t('admin.attendance.tooltip.back', 'Return to course details')}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <h1 suppressHydrationWarning style={{
              fontSize: 'var(--font-size-3xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))',
              marginTop: '0.5rem'
            }}>
              <span suppressHydrationWarning>{t('admin.attendance.title', 'Attendance')}</span>
            </h1>
            <p suppressHydrationWarning style={{
              color: 'hsl(var(--muted-foreground))',
              fontSize: 'var(--font-size-sm)',
              marginTop: '0.25rem'
            }}>
              {course?.title}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', width: isMobile ? '100%' : 'auto' }}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleExport} variant="outline" style={{ width: isMobile ? '100%' : 'auto' }}>
                  <Download className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  <span suppressHydrationWarning>{t('admin.attendance.export', 'Export')}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p suppressHydrationWarning>{t('admin.attendance.tooltip.export', 'Export attendance data to CSV file')}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleSave} disabled={saving} style={{ width: isMobile ? '100%' : 'auto' }}>
                  <Save className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  <span suppressHydrationWarning>{saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p suppressHydrationWarning>{t('admin.attendance.tooltip.save', 'Save all attendance changes')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            {/* First Row: Program, Course, Lesson */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
                {/* Program Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block" suppressHydrationWarning>
                    {t('admin.attendance.program', 'Program')}
                  </label>
                  <Combobox
                    value={selectedProgram}
                    onValueChange={handleProgramChange}
                    options={[
                      { value: 'all', label: t('admin.attendance.allPrograms', 'All Programs') },
                      ...programs.map(p => ({ value: p.id, label: p.name || 'Unnamed Program' }))
                    ]}
                    placeholder={t('admin.attendance.selectProgram', 'Select program...')}
                    searchPlaceholder={t('common.search', 'Search...')}
                    emptyText={t('admin.attendance.noProgramsFound', 'No programs found')}
                  />
                </div>

                {/* Course Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block" suppressHydrationWarning>
                    {t('admin.attendance.course', 'Course')}
                  </label>
                  <Combobox
                    key={`course-${selectedProgram}`}
                    value={selectedCourse}
                    onValueChange={handleCourseChange}
                    options={[
                      { value: 'all', label: t('admin.attendance.allCourses', 'All Courses') },
                      ...filteredCourses.map(c => ({ value: c.id, label: c.title }))
                    ]}
                    placeholder={t('admin.attendance.selectCourse', 'Select course...')}
                    searchPlaceholder={t('common.search', 'Search...')}
                    emptyText={t('admin.attendance.noCoursesFound', 'No courses found')}
                  />
                </div>

                {/* Lesson Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block" suppressHydrationWarning>
                    {t('admin.attendance.lesson', 'Lesson')}
                  </label>
                  <Combobox
                    value={selectedLesson}
                    onValueChange={setSelectedLesson}
                    options={[
                      { value: 'all', label: t('admin.attendance.allLessons', 'All Lessons') },
                      ...lessons.map(l => ({ value: l.id, label: l.title }))
                    ]}
                    placeholder={t('admin.attendance.selectLesson', 'Select lesson...')}
                    searchPlaceholder={t('common.search', 'Search...')}
                    emptyText={t('admin.attendance.noLessonsFound', 'No lessons found')}
                  />
                </div>
              </div>

              {/* Second Row: Student Search and Date */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
                gap: '1rem'
              }}>
                {/* Search */}
                <div>
                  <label className="text-sm font-medium mb-2 block" suppressHydrationWarning>
                    {t('admin.attendance.search', 'Search Students')}
                  </label>
                  <div className="relative">
                    <Search className={cn(
                      "absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground",
                      isRtl ? "right-3" : "left-3"
                    )} />
                    <Input
                      placeholder={t('admin.attendance.searchPlaceholder', 'Search by name or email...')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={isRtl ? "pr-10" : "pl-10"}
                    />
                  </div>
                </div>

                {/* Date Filter */}
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
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => markAll('present')}>
                      <UserCheck className={cn("h-4 w-4", isRtl ? "ml-2" : "mr-2")} />
                      {t('admin.attendance.markAllPresent', 'Mark All Present')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p suppressHydrationWarning>{t('admin.attendance.tooltip.markAllPresent', 'Mark all students as present')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => markAll('absent')}>
                      <UserX className={cn("h-4 w-4", isRtl ? "ml-2" : "mr-2")} />
                      {t('admin.attendance.markAllAbsent', 'Mark All Absent')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p suppressHydrationWarning>{t('admin.attendance.tooltip.markAllAbsent', 'Mark all students as absent')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={clearAll}>
                      <XCircle className={cn("h-4 w-4", isRtl ? "ml-2" : "mr-2")} />
                      {t('admin.attendance.clearAll', 'Clear All')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p suppressHydrationWarning>{t('admin.attendance.tooltip.clearAll', 'Clear all attendance markings')}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
          </CardContent>
        </Card>

        {/* Attendance Grid/List */}
        {!hasData ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground" suppressHydrationWarning>
                  {t('admin.attendance.noStudents', 'No students found')}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : isGridView && !isMobile ? (
          /* Desktop Grid View - Multiple Lessons */
          <Card>
            <CardHeader>
              <CardTitle suppressHydrationWarning>
                {t('admin.attendance.grid', 'Attendance Grid')}
              </CardTitle>
              <CardDescription suppressHydrationWarning>
                {filteredStudents.length} {t('admin.attendance.students', 'students')} × {filteredLessons.length} {t('admin.attendance.lessons', 'lessons')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className={cn(
                        "sticky z-20 bg-background p-3 min-w-[200px] border-r",
                        isRtl ? "right-0 text-right" : "left-0 text-left"
                      )} suppressHydrationWarning>
                        {t('admin.attendance.studentName', 'Student Name')}
                      </th>
                      {filteredLessons.map((lesson) => (
                        <th key={lesson.id} className="p-3 min-w-[150px] text-center border-r bg-muted">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium">{lesson.title}</span>
                            {lesson.lesson_date && (
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(lesson.lesson_date), 'MMM d')}
                              </span>
                            )}
                            <div className="flex gap-1 justify-center mt-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-1"
                                onClick={() => markAllForLesson(lesson.id, 'present')}
                              >
                                <UserCheck className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-1"
                                onClick={() => markAllForLesson(lesson.id, 'absent')}
                              >
                                <UserX className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => {
                      console.log('👤 Rendering student:', {
                        id: student.id,
                        name: student.full_name,
                        attendanceMapSize: attendance.size
                      });
                      return (
                      <tr key={student.id} className="border-b hover:bg-muted/50">
                        <td className={cn(
                          "sticky z-10 bg-background p-3 font-medium border-r",
                          isRtl ? "right-0" : "left-0"
                        )}>
                          <div className="flex flex-col" dir={direction}>
                            <span>{student.full_name}</span>
                            <span className="text-xs text-muted-foreground">{student.email}</span>
                          </div>
                        </td>
                        {filteredLessons.map((lesson) => {
                          const key = `${student.id}___${lesson.id}`;
                          const status = attendance.get(key);
                          return (
                            <td key={lesson.id} className="p-2 text-center border-r">
                              <div className="flex flex-wrap gap-1 justify-center">
                                {statusOptions.map((statusOption) => (
                                  <Tooltip key={statusOption}>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className={cn(
                                          'h-7 w-7 p-0',
                                          status === statusOption && getStatusColor(statusOption)
                                        )}
                                        onClick={() => handleStatusChange(student.id, lesson.id, statusOption)}
                                      >
                                        {getStatusIcon(statusOption)}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p suppressHydrationWarning>{t(`admin.attendance.tooltip.${statusOption}`, statusOption)}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Mobile & Single Lesson View - Card List */
          <Card>
            <CardHeader>
              <CardTitle suppressHydrationWarning>
                {t('admin.attendance.students', 'Students')} ({filteredStudents.length})
              </CardTitle>
              <CardDescription suppressHydrationWarning>
                {selectedLesson !== 'all'
                  ? lessons.find(l => l.id === selectedLesson)?.title
                  : t('admin.attendance.markAttendance', 'Mark attendance for each student')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredStudents.map((student) => {
                  const key = selectedLesson === 'all'
                    ? `${student.id}___${lessons[0]?.id}`
                    : student.id;
                  const studentStatus = attendance.get(key);
                  const studentNotes = notes.get(key) || '';

                  return (
                    <div key={student.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex flex-col gap-1">
                        <p className="font-medium" dir={direction}>{student.full_name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                        {studentStatus && (
                          <Badge variant={getStatusBadgeVariant(studentStatus)} className="w-fit">
                            {getStatusIcon(studentStatus)}
                            <span className={cn(isRtl ? "mr-1" : "ml-1")}>
                              {t(`admin.attendance.status.${studentStatus}`, studentStatus)}
                            </span>
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {statusOptions.map((statusOption) => (
                          <Tooltip key={statusOption}>
                            <TooltipTrigger asChild>
                              <Button
                                variant={studentStatus === statusOption ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleStatusChange(student.id, selectedLesson !== 'all' ? selectedLesson : lessons[0]?.id, statusOption)}
                                className={cn(
                                  studentStatus !== statusOption && getStatusColor(statusOption)
                                )}
                              >
                                {getStatusIcon(statusOption)}
                                <span className={cn(isRtl ? "mr-2" : "ml-2")} suppressHydrationWarning>
                                  {t(`admin.attendance.status.${statusOption}`, statusOption)}
                                </span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p suppressHydrationWarning>{t(`admin.attendance.tooltip.${statusOption}`, statusOption)}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>

                      <Input
                        placeholder={t('admin.attendance.notes', 'Notes...')}
                        value={studentNotes}
                        onChange={(e) => handleNotesChange(student.id, selectedLesson !== 'all' ? selectedLesson : lessons[0]?.id, e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      </TooltipProvider>
    </AdminLayout>
  );
}
