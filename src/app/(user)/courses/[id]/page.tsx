'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUserLanguage } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Download,
  PlayCircle,
  CheckCircle2,
  Square,
  Award,
  Calendar,
  FileText,
  Maximize2,
  Minimize2,
  X,
  AlertCircle,
  ExternalLink,
  Eye,
  ChevronDown,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import dynamicImport from 'next/dynamic';

// Dynamically import Zoom components to avoid SSR issues with window object
const ZoomMeetingSDK = dynamicImport(() => import('@/components/zoom/ZoomMeetingSDK'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-900 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white">Loading meeting...</p>
      </div>
    </div>
  ),
});

const ZoomRecordingPlayer = dynamicImport(() => import('@/components/zoom/ZoomRecordingPlayer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-900 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white">Loading recording...</p>
      </div>
    </div>
  ),
});

// Dynamically import Daily.co components
const DailyMeetingSDK = dynamicImport(() => import('@/components/daily/DailyMeetingSDK'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-900 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white">Loading meeting...</p>
      </div>
    </div>
  ),
});

const DailyRecordingPlayer = dynamicImport(() => import('@/components/daily/DailyRecordingPlayer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-900 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white">Loading recording...</p>
      </div>
    </div>
  ),
});

interface LessonTopic {
  id: string;
  title: string;
  content_type: string;
  content: any;
  order: number;
  duration_minutes: number | null;
  is_required: boolean;
  is_published: boolean;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  order: number;
  duration: string | null;
  is_published: boolean;
  zoom_meeting_id: string | null;
  zoom_join_url: string | null;
  zoom_passcode: string | null;
  recording_url: string | null;
  start_time: string | null;
  status: string | null;
  platform?: 'zoom' | 'daily' | null;
  daily_room_name: string | null;
  daily_room_url: string | null;
  daily_room_id: string | null;
  lesson_topics: LessonTopic[];
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  order: number;
  is_published: boolean;
  is_optional: boolean;
  duration_minutes: number | null;
  lessons: Lesson[];
}

interface CourseData {
  course: {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    instructor: string | null;
  };
  enrollment: any;
  modules: Module[];
  progress: {
    overall_progress: number;
    completed_lessons: number;
    in_progress_lessons: number;
    total_lessons: number;
    lesson_progress: Array<{
      lesson_id: string;
      status: string;
      progress_percentage: number;
      completed_at: string | null;
      last_accessed_at: string | null;
    }>;
  };
  statistics: {
    total_modules: number;
    total_lessons: number;
    total_topics: number;
    total_study_time: number;
    enrolled_students: number;
    materials_count: number;
  };
  materials: Array<{
    id: string;
    title: string;
    description: string | null;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
    category: string | null;
    is_published: boolean;
    display_order: number;
    created_at: string;
  }>;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, direction, language } = useUserLanguage();
  const courseId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [expandedMedia, setExpandedMedia] = useState<{ type: 'zoom' | 'recording', url: string, lessonTitle: string } | null>(null);
  const [activeMeetings, setActiveMeetings] = useState<Set<string>>(new Set());
  const [viewingMaterial, setViewingMaterial] = useState<{
    title: string;
    file_url: string;
    file_type: string;
    file_name: string;
  } | null>(null);

  // Helper functions for platform detection
  function getLessonPlatform(lesson: Lesson): 'zoom' | 'daily' | null {
    if (lesson.platform) return lesson.platform;
    if (lesson.daily_room_name || lesson.daily_room_url) return 'daily';
    if (lesson.zoom_meeting_id || lesson.zoom_join_url) return 'zoom';
    return null;
  }

  function hasLiveMeeting(lesson: Lesson): boolean {
    const platform = getLessonPlatform(lesson);
    return platform === 'zoom'
      ? !!(lesson.zoom_meeting_id && lesson.zoom_join_url)
      : platform === 'daily'
        ? !!lesson.daily_room_url
        : false;
  }

  function hasRecording(lesson: Lesson): boolean {
    return !!lesson.recording_url;
  }

  // Helper to parse lesson duration to minutes
  function parseDurationToMinutes(duration: string | null): number {
    if (!duration || typeof duration !== 'string') return 60; // Default 1 hour

    try {
      const parts = duration.split(':');
      const hours = parseInt(parts[0] || '0', 10);
      const minutes = parseInt(parts[1] || '0', 10);
      return hours * 60 + minutes;
    } catch {
      return 60; // Default on error
    }
  }

  // Check if a lesson's session has ended (3 hours after scheduled end time)
  function hasSessionEnded(lesson: Lesson): boolean {
    if (!lesson.start_time) return false;

    const now = new Date();
    const sessionStart = new Date(lesson.start_time);
    const durationMinutes = parseDurationToMinutes(lesson.duration);

    // Session ends 3 hours after scheduled end time
    const sessionEnd = new Date(sessionStart.getTime() + (durationMinutes + 180) * 60 * 1000);

    return now > sessionEnd;
  }

  // Check if user can join the session (30 min before to 3 hours after)
  function canJoinSession(lesson: Lesson): boolean {
    if (!lesson.start_time) return true; // If no start time, allow joining

    const now = new Date();
    const sessionStart = new Date(lesson.start_time);
    const durationMinutes = parseDurationToMinutes(lesson.duration);

    // Can join 30 minutes before
    const earlyJoin = new Date(sessionStart.getTime() - 30 * 60 * 1000);
    // Session ends 3 hours after scheduled end
    const sessionEnd = new Date(sessionStart.getTime() + (durationMinutes + 180) * 60 * 1000);

    return now >= earlyJoin && now <= sessionEnd;
  }

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  async function loadCourse() {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/courses/${courseId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load course');
      }

      const result = await response.json();
      setCourseData(result.data);
    } catch (error: any) {
      console.error('Error loading course:', error);
      toast.error(t('common.error', 'Error'), {
        description: error.message || t('user.courses.error.load', 'Failed to load course'),
      });
    } finally {
      setLoading(false);
    }
  }

  function getLessonStatus(lessonId: string): 'completed' | 'not_completed' {
    if (!courseData) return 'not_completed';
    const progress = courseData.progress.lesson_progress.find(p => p.lesson_id === lessonId);
    if (!progress) return 'not_completed';
    return progress.status === 'completed' ? 'completed' : 'not_completed';
  }

  // Check if HTML content has meaningful text (not just empty tags)
  function hasHtmlContent(html: string | null | undefined): boolean {
    if (!html) return false;
    // Remove HTML tags and check if there's any text content
    const textContent = html.replace(/<[^>]*>/g, '').trim();
    return textContent.length > 0;
  }

  function getLessonIcon(lessonId: string) {
    const status = getLessonStatus(lessonId);
    return status === 'completed'
      ? <CheckCircle2 className="h-5 w-5 text-green-600" />
      : <Square className="h-5 w-5 text-gray-400" />;
  }

  // Format duration with proper time units using translations
  function formatDuration(duration: string | number | null): string {
    if (!duration) return '';

    // Convert to string if it's a number
    const durationStr = typeof duration === 'number' ? duration.toString() : duration;

    // If duration already has units (e.g., "90 min", "2 hours"), return as is
    if (durationStr.match(/[a-zA-Z]/)) {
      return durationStr;
    }

    // Parse numeric duration (assumed to be in minutes)
    const minutes = typeof duration === 'number' ? duration : parseInt(durationStr);
    if (isNaN(minutes)) return durationStr;

    const hoursShort = t('user.courses.duration.hoursShort', 'h');
    const minutesShort = t('user.courses.duration.minutesShort', 'm');

    if (minutes < 1) {
      const seconds = Math.round(minutes * 60);
      return `${seconds}s`;
    } else if (minutes < 60) {
      return `${minutes} ${minutesShort}`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0
        ? `${hours} ${hoursShort} ${remainingMinutes} ${minutesShort}`
        : `${hours} ${hoursShort}`;
    }
  }

  async function toggleLessonCompletion(lessonId: string) {
    if (!courseData) return;

    const currentStatus = getLessonStatus(lessonId);
    const newStatus = currentStatus === 'completed' ? 'not_started' : 'completed';
    const now = new Date().toISOString();

    // Optimistically update the UI immediately
    setCourseData(prevData => {
      if (!prevData) return prevData;

      // Find and update the progress entry
      const existingProgressIndex = prevData.progress.lesson_progress.findIndex(
        p => p.lesson_id === lessonId
      );

      let updatedLessonProgress;
      if (existingProgressIndex >= 0) {
        // Update existing progress
        updatedLessonProgress = [...prevData.progress.lesson_progress];
        updatedLessonProgress[existingProgressIndex] = {
          ...updatedLessonProgress[existingProgressIndex],
          status: newStatus,
          progress_percentage: newStatus === 'completed' ? 100 : 0,
          completed_at: newStatus === 'completed' ? now : null,
          last_accessed_at: now,
        };
      } else {
        // Add new progress entry
        updatedLessonProgress = [
          ...prevData.progress.lesson_progress,
          {
            lesson_id: lessonId,
            status: newStatus,
            progress_percentage: newStatus === 'completed' ? 100 : 0,
            completed_at: newStatus === 'completed' ? now : null,
            last_accessed_at: now,
          },
        ];
      }

      // Recalculate overall progress
      const completedLessons = updatedLessonProgress.filter(p => p.status === 'completed').length;
      const totalLessons = prevData.statistics.total_lessons;
      const overallProgress = totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

      return {
        ...prevData,
        progress: {
          ...prevData.progress,
          lesson_progress: updatedLessonProgress,
          completed_lessons: completedLessons,
          in_progress_lessons: 0, // No longer tracking in-progress
          overall_progress: overallProgress,
        },
      };
    });

    try {
      const response = await fetch(`/api/user/courses/${courseId}/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
          progress_percentage: newStatus === 'completed' ? 100 : 0,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update lesson progress');
      }

      toast.success(
        newStatus === 'completed'
          ? t('user.courses.markedComplete', 'Lesson marked as complete')
          : t('user.courses.markedIncomplete', 'Lesson marked as incomplete')
      );
    } catch (error: any) {
      console.error('Error updating lesson progress:', error);

      // Revert the optimistic update on error
      await loadCourse();

      toast.error(t('common.error', 'Error'), {
        description: error.message || t('user.courses.error.updateProgress', 'Failed to update progress'),
      });
    }
  }

  async function markAllLessonsComplete(complete: boolean) {
    if (!courseData) return;

    const allLessonIds = courseData.modules.flatMap(module =>
      module.lessons.map(lesson => lesson.id)
    );

    try {
      // Update all lessons in parallel
      const promises = allLessonIds.map(lessonId =>
        fetch(`/api/user/courses/${courseId}/lessons/${lessonId}/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            status: complete ? 'completed' : 'not_started',
            progress_percentage: complete ? 100 : 0,
          }),
        })
      );

      await Promise.all(promises);

      // Reload course data to get updated progress
      await loadCourse();

      toast.success(
        complete
          ? t('user.courses.allLessonsMarkedComplete', 'All lessons marked as complete')
          : t('user.courses.allLessonsMarkedIncomplete', 'All lessons marked as incomplete')
      );
    } catch (error: any) {
      console.error('Error updating all lessons:', error);
      toast.error(t('common.error', 'Error'), {
        description: error.message || t('user.courses.error.updateProgress', 'Failed to update progress'),
      });
    }
  }

  function getContentTypeIcon(contentType: string) {
    switch (contentType) {
      case 'video':
        return <PlayCircle className="h-4 w-4" />;
      case 'text':
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'quiz':
      case 'assignment':
        return <Award className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function handleLessonClick(lessonId: string) {
    // Navigate to lesson detail page (to be implemented)
    router.push(`/courses/${courseId}/lessons/${lessonId}`);
  }

  function handleViewMaterial(material: { title: string; file_url: string; file_type: string; file_name: string }) {
    setViewingMaterial(material);
  }

  function handleDownloadMaterial(fileUrl: string, fileName: string) {
    // Open file in new tab for download
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function canPreviewFile(fileType: string): boolean {
    const type = fileType.toLowerCase();
    return (
      type.includes('pdf') ||
      type.includes('image') ||
      type.includes('png') ||
      type.includes('jpg') ||
      type.includes('jpeg') ||
      type.includes('gif') ||
      type.includes('webp') ||
      type.includes('video') ||
      type.includes('mp4') ||
      type.includes('webm')
    );
  }

  function translateMaterialCategory(category: string | null): string {
    if (!category) return '';

    // Map common category values to translation keys
    const categoryMap: { [key: string]: string } = {
      'syllabus': 'user.courses.materials.category.syllabus',
      'lecture notes': 'user.courses.materials.category.lectureNotes',
      'lecture_notes': 'user.courses.materials.category.lectureNotes',
      'assignments': 'user.courses.materials.category.assignments',
      'assignment': 'user.courses.materials.category.assignment',
      'readings': 'user.courses.materials.category.readings',
      'reading': 'user.courses.materials.category.reading',
      'slides': 'user.courses.materials.category.slides',
      'slide': 'user.courses.materials.category.slide',
      'handouts': 'user.courses.materials.category.handouts',
      'handout': 'user.courses.materials.category.handout',
      'resources': 'user.courses.materials.category.resources',
      'resource': 'user.courses.materials.category.resource',
      'exercises': 'user.courses.materials.category.exercises',
      'exercise': 'user.courses.materials.category.exercise',
      'references': 'user.courses.materials.category.references',
      'reference': 'user.courses.materials.category.reference',
      'other': 'user.courses.materials.category.other',
    };

    const key = categoryMap[category.toLowerCase()];
    return key ? t(key, category) : category;
  }

  function getFileTypeIcon(fileType: string) {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (type.includes('word') || type.includes('doc')) return <FileText className="h-5 w-5 text-blue-500" />;
    if (type.includes('excel') || type.includes('sheet')) return <FileText className="h-5 w-5 text-green-500" />;
    if (type.includes('powerpoint') || type.includes('presentation')) return <FileText className="h-5 w-5 text-orange-500" />;
    if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg')) return <FileText className="h-5 w-5 text-purple-500" />;
    if (type.includes('video')) return <PlayCircle className="h-5 w-5 text-pink-500" />;
    return <FileText className="h-5 w-5 text-muted-foreground" />;
  }

  function handleJoinZoom(lessonId: string) {
    // Add this lesson to active meetings to show the embedded iframe
    setActiveMeetings(prev => new Set(prev).add(lessonId));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="container mx-auto py-6 px-4" dir={direction}>
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            {t('user.courses.error.notFound', 'Course not found')}
          </p>
          <Button onClick={() => router.push('/courses')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back', 'Back to Courses')}
          </Button>
        </div>
      </div>
    );
  }

  const { course, modules, progress, materials } = courseData;

  return (
    <div className="min-h-screen pb-12" dir={direction}>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/courses')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Header */}
              <Card>
                <CardContent className="p-6">
                  {course.image_url && (
                    <img
                      src={course.image_url}
                      alt={course.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
                  {course.description && (
                    <p className="text-muted-foreground mb-4">
                      {course.description.replace(/<[^>]*>/g, '')}
                    </p>
                  )}
                  {course.instructor && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span>{t('user.courses.instructor', 'Instructor')}: {course.instructor}</span>
                    </div>
                  )}
                </CardContent>
              </Card>


              {/* Course Content - Modules and Lessons */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{t('user.courses.content.title', 'תוכן הקורס')}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {modules.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t('user.courses.content.empty', 'אין תוכן זמין עדיין')}</p>
                    </div>
                  ) : (
                    <Accordion type="multiple" defaultValue={[]} className="space-y-4">
                      {modules.map((module, moduleIndex) => (
                        <AccordionItem key={module.id} value={module.id} className="border-2 rounded-lg">
                          <Card className="border-0">
                            <AccordionTrigger className="hover:no-underline px-6 pt-6 pb-4 [&>div]:w-full">
                              <div className="flex flex-col items-start w-full gap-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <h3 className="font-bold text-xl ltr:text-left rtl:text-right">
                                    {module.title}
                                  </h3>
                                  {(module.lessons.length > 0 || module.duration_minutes) && (
                                    <Badge variant="secondary" className="font-normal">
                                      {module.lessons.length > 0 && (
                                        <>
                                          {module.lessons.length}{' '}
                                          {module.lessons.length === 1
                                            ? t('user.courses.lesson', 'lesson')
                                            : t('user.courses.lessons', 'lessons')}
                                        </>
                                      )}
                                      {module.lessons.length > 0 && module.duration_minutes && (
                                        <span className="mx-1.5">|</span>
                                      )}
                                      {module.duration_minutes && (
                                        <>
                                          {module.duration_minutes} {t('common.min', 'min')}
                                        </>
                                      )}
                                    </Badge>
                                  )}
                                  {module.is_optional && (
                                    <Badge variant="secondary">
                                      {t('user.courses.optional', 'Optional')}
                                    </Badge>
                                  )}
                                </div>
                                {hasHtmlContent(module.description) && (
                                  <div
                                    className="text-sm text-muted-foreground ltr:text-left rtl:text-right prose prose-sm max-w-none dark:prose-invert"
                                    dangerouslySetInnerHTML={{ __html: module.description || '' }}
                                  />
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <CardContent className="pt-4">
                              <div className="space-y-2">
                                {module.lessons.length === 0 ? (
                                  <p className="text-sm text-muted-foreground py-4 text-center">
                                    {t('user.courses.content.noLessons', 'No lessons available')}
                                  </p>
                                ) : (
                                  <Accordion type="multiple" defaultValue={[]} className="space-y-2">
                                    {module.lessons.map((lesson, lessonIndex) => (
                                      <AccordionItem key={lesson.id} value={lesson.id} className="border-2 rounded-xl overflow-hidden bg-card">
                                        {/* Lesson Header - Collapsible Trigger */}
                                        <AccordionTrigger className="hover:no-underline p-5 bg-gradient-to-r from-primary/5 to-primary/10 [&[data-state=open]]:border-b">
                                          <div className="flex items-start justify-between gap-4 w-full">
                                            <div className="flex items-start gap-3 flex-1">
                                              <div className="flex items-center gap-2 flex-shrink-0 mt-1" onClick={(e) => e.stopPropagation()}>
                                                <Switch
                                                  id={`lesson-${lesson.id}`}
                                                  checked={getLessonStatus(lesson.id) === 'completed'}
                                                  onCheckedChange={() => toggleLessonCompletion(lesson.id)}
                                                />
                                                <Label
                                                  htmlFor={`lesson-${lesson.id}`}
                                                  className="text-xs font-medium cursor-pointer sr-only"
                                                >
                                                  {getLessonStatus(lesson.id) === 'completed'
                                                    ? t('user.courses.markIncomplete', 'Mark as incomplete')
                                                    : t('user.courses.markComplete', 'Mark as complete')}
                                                </Label>
                                              </div>
                                              <div className="flex-1 min-w-0 ltr:text-left rtl:text-right">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <h4 className="font-bold text-lg">{lesson.title}</h4>
                                                </div>
                                                {lesson.description && (
                                                  <p className="text-sm text-muted-foreground leading-relaxed ltr:text-left rtl:text-right">
                                                    {lesson.description}
                                                  </p>
                                                )}
                                                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                                {lesson.start_time && (
                                                  <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    <span className="font-medium">
                                                      {new Date(lesson.start_time).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                      })}
                                                    </span>
                                                  </div>
                                                )}
                                                {lesson.lesson_topics.length > 0 && (
                                                  <div className="flex items-center gap-1.5">
                                                    <BookOpen className="h-3.5 w-3.5" />
                                                    <span className="font-medium">
                                                      {lesson.lesson_topics.length}{' '}
                                                      {lesson.lesson_topics.length === 1
                                                        ? t('user.courses.topic', 'topic')
                                                        : t('user.courses.topics', 'topics')}
                                                    </span>
                                                  </div>
                                                )}
                                                {lesson.duration && (
                                                  <div className="flex items-center gap-1.5">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span className="font-medium">{formatDuration(lesson.duration)}</span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          </div>
                                        </AccordionTrigger>

                                        {/* Lesson Content - Collapsible */}
                                        <AccordionContent className="p-0">
                                          {/* Meeting & Recording Tabs - Supports both Zoom and Daily.co */}
                                      {hasLiveMeeting(lesson) && (
                                        <div className="p-5 border-b bg-muted/20">
                                          <Tabs defaultValue={hasSessionEnded(lesson) ? "recording" : "live"} className="w-full">
                                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                              <TabsTrigger
                                                value="live"
                                                className="gap-2"
                                                disabled={hasSessionEnded(lesson)}
                                              >
                                                <PlayCircle className="h-4 w-4" />
                                                {t('user.courses.liveMeeting', 'Live Meeting')}
                                              </TabsTrigger>
                                              <TabsTrigger value="recording" className="gap-2">
                                                <PlayCircle className="h-4 w-4" />
                                                {t('user.courses.recording', 'Recording')}
                                              </TabsTrigger>
                                            </TabsList>

                                            {/* Live Meeting Tab */}
                                            <TabsContent value="live" className="space-y-4">
                                              {getLessonPlatform(lesson) === 'zoom' && (
                                                !activeMeetings.has(lesson.id) ? (
                                                  <div className="space-y-3">
                                                    {/* Zoom Meeting Info Card */}
                                                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800">
                                                      <div className="flex items-start gap-3 mb-3">
                                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white flex-shrink-0">
                                                          <PlayCircle className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex-1">
                                                          <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                                            {t('user.courses.zoomMeeting', 'Zoom Meeting')}
                                                          </h5>
                                                          <p className="text-sm text-blue-700 dark:text-blue-300">
                                                            {t('user.courses.clickToJoin', 'Click the button below to join the live meeting')}
                                                          </p>
                                                        </div>
                                                      </div>
                                                      <div className="space-y-2 mb-4">
                                                        {lesson.start_time && (
                                                          <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                                                            <Calendar className="h-4 w-4" />
                                                            <span className="font-medium">
                                                              {new Date(lesson.start_time).toLocaleString()}
                                                            </span>
                                                          </div>
                                                        )}
                                                        {lesson.zoom_passcode && (
                                                          <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                                                            <span>{t('user.courses.passcode', 'Passcode')}:</span>
                                                            <span className="font-mono font-bold bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded">
                                                              {lesson.zoom_passcode}
                                                            </span>
                                                          </div>
                                                        )}
                                                      </div>
                                                      {!canJoinSession(lesson) ? (
                                                        <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
                                                          <AlertCircle className="h-5 w-5 text-amber-600" />
                                                          <AlertDescription className="text-amber-800 dark:text-amber-200">
                                                            {hasSessionEnded(lesson)
                                                              ? t('user.courses.sessionEnded', 'This session has ended. Please check the Recording tab.')
                                                              : t('user.courses.sessionNotStarted', 'This session is not available yet. You can join 30 minutes before the scheduled start time.')}
                                                          </AlertDescription>
                                                        </Alert>
                                                      ) : (
                                                        <Button
                                                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                                          size="lg"
                                                          onClick={() => handleJoinZoom(lesson.id)}
                                                        >
                                                          <ExternalLink className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                                                          {t('user.courses.joinMeeting', 'Join Meeting')}
                                                        </Button>
                                                      )}
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <div className="space-y-3">
                                                    <div className="w-full rounded-lg overflow-hidden bg-black border-2">
                                                      <ZoomMeetingSDK
                                                        meetingNumber={lesson.zoom_meeting_id!}
                                                        password={lesson.zoom_passcode || ''}
                                                        role={0}
                                                        onMeetingEnd={() => {
                                                          setActiveMeetings(prev => {
                                                            const updated = new Set(prev);
                                                            updated.delete(lesson.id);
                                                            return updated;
                                                          });
                                                          toast.success(t('user.courses.meetingEnded', 'Meeting has ended'));
                                                        }}
                                                        onError={(error) => {
                                                          toast.error(error.message);
                                                          setActiveMeetings(prev => {
                                                            const updated = new Set(prev);
                                                            updated.delete(lesson.id);
                                                            return updated;
                                                          });
                                                        }}
                                                      />
                                                    </div>
                                                  </div>
                                                )
                                              )}

                                              {getLessonPlatform(lesson) === 'daily' && (
                                                !activeMeetings.has(lesson.id) ? (
                                                  <div className="space-y-3">
                                                    {/* Daily.co Meeting Info Card */}
                                                    <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border-2 border-purple-200 dark:border-purple-800">
                                                      <div className="flex items-start gap-3 mb-3">
                                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-600 text-white flex-shrink-0">
                                                          <PlayCircle className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex-1">
                                                          <h5 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                                                            {t('user.courses.dailyMeeting', 'Daily.co Meeting')}
                                                          </h5>
                                                          <p className="text-sm text-purple-700 dark:text-purple-300">
                                                            {t('user.courses.dailyMeetingInfo', 'Click the button below to join the Daily.co meeting')}
                                                          </p>
                                                        </div>
                                                      </div>
                                                      <div className="space-y-2 mb-4">
                                                        {lesson.start_time && (
                                                          <div className="flex items-center gap-2 text-sm text-purple-800 dark:text-purple-200">
                                                            <Calendar className="h-4 w-4" />
                                                            <span className="font-medium">
                                                              {new Date(lesson.start_time).toLocaleString()}
                                                            </span>
                                                          </div>
                                                        )}
                                                      </div>
                                                      {!canJoinSession(lesson) ? (
                                                        <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
                                                          <AlertCircle className="h-5 w-5 text-amber-600" />
                                                          <AlertDescription className="text-amber-800 dark:text-amber-200">
                                                            {hasSessionEnded(lesson)
                                                              ? t('user.courses.sessionEnded', 'This session has ended. Please check the Recording tab.')
                                                              : t('user.courses.sessionNotStarted', 'This session is not available yet. You can join 30 minutes before the scheduled start time.')}
                                                          </AlertDescription>
                                                        </Alert>
                                                      ) : (
                                                        <Button
                                                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                                                          size="lg"
                                                          onClick={() => {
                                                            setActiveMeetings(prev => {
                                                              const updated = new Set(prev);
                                                              updated.add(lesson.id);
                                                              return updated;
                                                            });
                                                          }}
                                                        >
                                                          <ExternalLink className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                                                          {t('user.courses.joinDailyMeeting', 'Join Daily.co Meeting')}
                                                        </Button>
                                                      )}
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <div className="space-y-3">
                                                    {/* Daily.co Meeting */}
                                                    <div className="w-full rounded-lg overflow-hidden bg-black border-2">
                                                      <DailyMeetingSDK
                                                        lessonId={lesson.id}
                                                        onError={(error) => {
                                                          toast.error(error.message);
                                                          setActiveMeetings(prev => {
                                                            const updated = new Set(prev);
                                                            updated.delete(lesson.id);
                                                            return updated;
                                                          });
                                                        }}
                                                      />
                                                    </div>
                                                  </div>
                                                )
                                              )}
                                            </TabsContent>

                                            {/* Recording Tab */}
                                            <TabsContent value="recording" className="space-y-4">
                                              {hasRecording(lesson) ? (
                                                getLessonPlatform(lesson) === 'zoom' ? (
                                                  <ZoomRecordingPlayer
                                                    recordingUrl={lesson.recording_url!}
                                                    lessonTitle={lesson.title}
                                                    onError={(error) => toast.error(error.message)}
                                                  />
                                                ) : (
                                                  <DailyRecordingPlayer
                                                    recordingUrl={lesson.recording_url!}
                                                    lessonTitle={lesson.title}
                                                    onError={(error) => toast.error(error.message)}
                                                  />
                                                )
                                              ) : (
                                                <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
                                                  <AlertCircle className="h-5 w-5 text-amber-600" />
                                                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                                                    {t('user.courses.recordingNotReady', 'The recording for this session is not available yet. Please check back later after the session has ended.')}
                                                  </AlertDescription>
                                                </Alert>
                                              )}
                                            </TabsContent>
                                          </Tabs>
                                        </div>
                                      )}

                                      {/* Lesson Topics */}
                                      {lesson.lesson_topics.length > 0 && (
                                        <div className="p-5">
                                          <h5 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-4">
                                            {t('user.courses.content.topics', 'Topics')}
                                          </h5>
                                          <div className="space-y-4">
                                            {lesson.lesson_topics.map((topic, topicIndex) => (
                                              <div
                                                key={topic.id}
                                                className="border-2 rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
                                              >
                                                {/* Topic Header */}
                                                <div className="flex items-center gap-3 p-4 bg-muted/30">
                                                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-background border-2">
                                                    {getContentTypeIcon(topic.content_type)}
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-muted text-xs font-bold">
                                                        {moduleIndex + 1}.{lessonIndex + 1}.{topicIndex + 1}
                                                      </span>
                                                      <span className="text-sm font-semibold">{topic.title}</span>
                                                      {topic.is_required && (
                                                        <Badge variant="secondary" className="text-xs">
                                                          {t('user.courses.required', 'Required')}
                                                        </Badge>
                                                      )}
                                                    </div>
                                                    {topic.duration_minutes && (
                                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{topic.duration_minutes} min</span>
                                                      </div>
                                                    )}
                                                  </div>
                                                  <Badge variant="outline" className="text-xs font-semibold">
                                                    {topic.content_type}
                                                  </Badge>
                                                </div>

                                                {/* Topic Content */}
                                                {topic.content && (
                                                  <div className="p-5 bg-background">
                                                  {topic.content_type === 'text' && (
                                                    <div className="prose prose-sm max-w-none dark:prose-invert">
                                                      {typeof topic.content === 'object' && topic.content.html ? (
                                                        <div dangerouslySetInnerHTML={{ __html: topic.content.html }} />
                                                      ) : typeof topic.content === 'string' ? (
                                                        <div dangerouslySetInnerHTML={{ __html: topic.content }} />
                                                      ) : (
                                                        <div className="text-muted-foreground text-sm">
                                                          {JSON.stringify(topic.content)}
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}
                                                  {topic.content_type === 'video' && (
                                                    <div className="aspect-video">
                                                      {(() => {
                                                        let videoUrl = typeof topic.content === 'object' && topic.content.url
                                                          ? topic.content.url
                                                          : typeof topic.content === 'string'
                                                          ? topic.content
                                                          : null;

                                                        // Convert YouTube watch URL to embed URL
                                                        if (videoUrl && videoUrl.includes('youtube.com/watch')) {
                                                          const urlObj = new URL(videoUrl);
                                                          const videoId = urlObj.searchParams.get('v');
                                                          if (videoId) {
                                                            videoUrl = `https://www.youtube.com/embed/${videoId}`;
                                                          }
                                                        } else if (videoUrl && videoUrl.includes('youtu.be/')) {
                                                          const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
                                                          if (videoId) {
                                                            videoUrl = `https://www.youtube.com/embed/${videoId}`;
                                                          }
                                                        }

                                                        return videoUrl ? (
                                                          <iframe
                                                            src={videoUrl}
                                                            className="w-full h-full rounded border"
                                                            allowFullScreen
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                          />
                                                        ) : (
                                                          <div className="text-muted-foreground text-sm">
                                                            Invalid video content
                                                          </div>
                                                        );
                                                      })()}
                                                    </div>
                                                  )}
                                                  {topic.content_type === 'pdf' && (
                                                    <div>
                                                      <Button
                                                        size="sm"
                                                        onClick={() => {
                                                          const url = typeof topic.content === 'object' && (topic.content.file_url || topic.content.url)
                                                            ? (topic.content.file_url || topic.content.url)
                                                            : typeof topic.content === 'string'
                                                            ? topic.content
                                                            : null;
                                                          if (url) window.open(url, '_blank');
                                                        }}
                                                      >
                                                        <FileText className="h-4 w-4 mr-2" />
                                                        {typeof topic.content === 'object' && topic.content.filename
                                                          ? topic.content.filename
                                                          : t('user.courses.openPdf', 'Open PDF')}
                                                      </Button>
                                                    </div>
                                                  )}
                                                  {topic.content_type === 'embed' && (
                                                    <div className="aspect-video">
                                                      {typeof topic.content === 'object' && (topic.content.embed_code || topic.content.embedCode) ? (
                                                        <div dangerouslySetInnerHTML={{ __html: topic.content.embed_code || topic.content.embedCode }} />
                                                      ) : typeof topic.content === 'object' && topic.content.url ? (
                                                        <iframe
                                                          src={topic.content.url}
                                                          className="w-full h-full rounded border"
                                                          allowFullScreen
                                                        />
                                                      ) : (
                                                        <div className="text-muted-foreground text-sm">
                                                          Invalid embed content
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}
                                                  {topic.content_type === 'download' && (
                                                    <div>
                                                      <Button
                                                        size="sm"
                                                        onClick={() => {
                                                          const url = typeof topic.content === 'object' && (topic.content.file_url || topic.content.url)
                                                            ? (topic.content.file_url || topic.content.url)
                                                            : typeof topic.content === 'string'
                                                            ? topic.content
                                                            : null;
                                                          if (url) window.open(url, '_blank');
                                                        }}
                                                      >
                                                        <Download className="h-4 w-4 mr-2" />
                                                        {typeof topic.content === 'object' && (topic.content.filename || topic.content.fileName)
                                                          ? (topic.content.filename || topic.content.fileName)
                                                          : t('user.courses.download', 'Download File')}
                                                      </Button>
                                                    </div>
                                                  )}
                                                  {topic.content_type === 'whiteboard' && (
                                                    <div className="p-4 bg-muted rounded-lg">
                                                      <div className="flex items-center gap-2 mb-2">
                                                        <FileText className="h-4 w-4" />
                                                        <span className="font-medium text-sm">
                                                          {t('user.courses.whiteboard', 'Whiteboard Content')}
                                                        </span>
                                                      </div>
                                                      {typeof topic.content === 'object' && topic.content.url ? (
                                                        <Button
                                                          size="sm"
                                                          onClick={() => window.open(topic.content.url, '_blank')}
                                                        >
                                                          {t('user.courses.openWhiteboard', 'Open Whiteboard')}
                                                        </Button>
                                                      ) : (
                                                        <div className="text-muted-foreground text-sm">
                                                          {t('user.courses.whiteboardNotAvailable', 'Whiteboard content will be available during the live session')}
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                        </AccordionContent>
                                      </AccordionItem>
                                    ))}
                                  </Accordion>
                                )}
                              </div>
                            </CardContent>
                            </AccordionContent>
                          </Card>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>

              {/* Course Materials */}
              {materials.length > 0 && (
                <Card>
                  <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-background border-b">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-500/20">
                        <Download className="h-5 w-5 text-indigo-600" />
                      </div>
                      <CardTitle className="text-xl">{t('user.courses.materials.title', 'Course Materials')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-6">
                    {materials.map(material => (
                      <div
                        key={material.id}
                        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        {getFileTypeIcon(material.file_type)}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm mb-1">{material.title}</h4>
                          {material.description && (
                            <p className="text-xs text-muted-foreground mb-2">
                              {material.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {material.category && (
                              <Badge variant="secondary" className="text-xs">
                                {translateMaterialCategory(material.category)}
                              </Badge>
                            )}
                            <span>{formatFileSize(material.file_size)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {canPreviewFile(material.file_type) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewMaterial({
                                title: material.title,
                                file_url: material.file_url,
                                file_type: material.file_type,
                                file_name: material.file_name
                              })}
                              title={t('user.courses.materials.view', 'View')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadMaterial(material.file_url, material.file_name)}
                            title={t('user.courses.materials.download', 'Download')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Your Progress - Redesigned with Circular Progress */}
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 border-b">
                  <h3 className="font-bold text-lg">{t('user.courses.progress.title', 'Your Progress')}</h3>
                </div>
                <CardContent className="p-6">
                  {/* Circular Progress Visualization */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative w-40 h-40 mb-4">
                      {/* Background circle */}
                      <svg className="transform -rotate-90 w-40 h-40">
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="transparent"
                          className="text-muted"
                        />
                        {/* Progress circle */}
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke="url(#progressGradient)"
                          strokeWidth="12"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 70}`}
                          strokeDashoffset={`${2 * Math.PI * 70 * (1 - progress.overall_progress / 100)}`}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                        <defs>
                          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0.6 }} />
                          </linearGradient>
                        </defs>
                      </svg>
                      {/* Center percentage */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-primary">{progress.overall_progress}%</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">
                          {t('user.courses.progress.complete', 'Complete')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Stats in Compact Grid */}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                    {/* Completed */}
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-950/30 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="text-2xl font-bold text-green-600">{progress.completed_lessons}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {t('user.courses.progress.completed', 'Completed')}
                      </div>
                    </div>

                    {/* In Progress */}
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-950/30 mb-2">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="text-2xl font-bold text-yellow-600">{progress.in_progress_lessons || 0}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {t('user.courses.progress.inProgress', 'In Progress')}
                      </div>
                    </div>

                    {/* Remaining */}
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-950/30 mb-2">
                        <Square className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-600">
                        {progress.total_lessons - progress.completed_lessons - (progress.in_progress_lessons || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {t('user.courses.progress.remaining', 'Remaining')}
                      </div>
                    </div>
                  </div>

                  {/* Mark All Complete Toggle */}
                  <div className="pt-4 border-t">
                    <div className={`flex items-center justify-between p-3 rounded-lg ${
                      progress.total_lessons === 0
                        ? 'bg-muted/30 opacity-50'
                        : 'bg-primary/5'
                    }`}>
                      <div className="flex flex-col">
                        <Label
                          htmlFor="mark-all-complete"
                          className={`font-medium ${
                            progress.total_lessons === 0
                              ? 'cursor-not-allowed'
                              : 'cursor-pointer'
                          }`}
                        >
                          {t('user.courses.markAllComplete', 'Mark All Complete')}
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          {t('user.courses.markAllCompleteDesc', 'Toggle all lessons at once')}
                        </span>
                      </div>
                      <Switch
                        id="mark-all-complete"
                        checked={progress.completed_lessons === progress.total_lessons && progress.total_lessons > 0}
                        onCheckedChange={(checked) => markAllLessonsComplete(checked)}
                        disabled={progress.total_lessons === 0}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Course Overview */}
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 border-b">
                  <h3 className="font-bold text-lg">{t('user.courses.statistics.title', 'Course Overview')}</h3>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Enrolled Students */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/10 ltr:border-l-4 rtl:border-r-4 border-blue-500">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-600 text-white">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          {t('user.courses.statistics.students', 'Students')}
                        </span>
                      </div>
                      <span className="text-xl font-bold text-blue-600">
                        {courseData?.statistics?.enrolled_students || 0}
                      </span>
                    </div>

                    {/* Total Modules */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/10 ltr:border-l-4 rtl:border-r-4 border-purple-500">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-600 text-white">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                          {t('user.courses.statistics.modules', 'Modules')}
                        </span>
                      </div>
                      <span className="text-xl font-bold text-purple-600">
                        {courseData?.statistics?.total_modules || 0}
                      </span>
                    </div>

                    {/* Total Lessons */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/10 ltr:border-l-4 rtl:border-r-4 border-green-500">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-600 text-white">
                          <PlayCircle className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-green-900 dark:text-green-100">
                          {t('user.courses.statistics.lessons', 'Lessons')}
                        </span>
                      </div>
                      <span className="text-xl font-bold text-green-600">
                        {courseData?.statistics?.total_lessons || 0}
                      </span>
                    </div>

                    {/* Total Topics */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/10 ltr:border-l-4 rtl:border-r-4 border-orange-500">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-600 text-white">
                          <FileText className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
                          {t('user.courses.statistics.topics', 'Topics')}
                        </span>
                      </div>
                      <span className="text-xl font-bold text-orange-600">
                        {courseData?.statistics?.total_topics || 0}
                      </span>
                    </div>

                    {/* Study Time */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-pink-50 to-pink-100/50 dark:from-pink-950/30 dark:to-pink-900/10 ltr:border-l-4 rtl:border-r-4 border-pink-500">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-pink-600 text-white">
                          <Clock className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-pink-900 dark:text-pink-100">
                          {t('user.courses.statistics.studyTime', 'Study Time')}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xl font-bold text-pink-600">
                          {Math.round((courseData?.statistics?.total_study_time || 0) / 60)}
                          {' '}{t('user.courses.statistics.hours', 'h')}
                        </span>
                        <span className="text-xs text-pink-600/70">
                          {Math.round((courseData?.statistics?.total_study_time || 0) / 45)}
                          {' '}{t('user.courses.statistics.academicHours', 'academic hrs')}
                        </span>
                      </div>
                    </div>

                    {/* Materials */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/10 ltr:border-l-4 rtl:border-r-4 border-indigo-500">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-600 text-white">
                          <Download className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                          {t('user.courses.statistics.materials', 'Materials')}
                        </span>
                      </div>
                      <span className="text-xl font-bold text-indigo-600">
                        {courseData?.statistics?.materials_count || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('user.courses.quickActions', 'Quick Actions')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => router.push(`/courses/${courseId}/grades`)}
                  >
                    <Award className="h-4 w-4 mr-2" />
                    {t('user.courses.viewGrades', 'View Grades')}
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => router.push(`/courses/${courseId}/attendance`)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {t('user.courses.viewAttendance', 'View Attendance')}
                  </Button>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Media Modal */}
      {expandedMedia && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-7xl mx-auto flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 text-white">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${expandedMedia.type === 'zoom' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                  <PlayCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {expandedMedia.type === 'zoom'
                      ? t('user.courses.zoomMeeting', 'Zoom Meeting')
                      : t('user.courses.recording', 'Recording')
                    }
                  </h3>
                  <p className="text-sm text-white/70">{expandedMedia.lessonTitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  onClick={() => setExpandedMedia(null)}
                >
                  <Minimize2 className="h-4 w-4 mr-2" />
                  {t('user.courses.minimize', 'Minimize')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  onClick={() => setExpandedMedia(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Video Container */}
            <div className="flex-1 relative rounded-lg overflow-hidden bg-black">
              <iframe
                src={expandedMedia.url}
                className="absolute top-0 left-0 w-full h-full"
                allow={expandedMedia.type === 'zoom'
                  ? "microphone; camera; fullscreen"
                  : "autoplay; fullscreen"
                }
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Material Viewer Modal */}
      {viewingMaterial && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" dir={direction}>
          <div className="relative w-full h-full max-w-7xl mx-auto flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary">
                  {getFileTypeIcon(viewingMaterial.file_type)}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{viewingMaterial.title}</h3>
                  <p className="text-sm text-white/70">{viewingMaterial.file_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  onClick={() => handleDownloadMaterial(viewingMaterial.file_url, viewingMaterial.file_name)}
                >
                  <Download className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('user.courses.materials.download', 'Download')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  onClick={() => setViewingMaterial(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 relative rounded-lg overflow-hidden bg-black">
              {viewingMaterial.file_type.toLowerCase().includes('pdf') ? (
                <iframe
                  src={viewingMaterial.file_url}
                  className="absolute top-0 left-0 w-full h-full"
                  title={viewingMaterial.title}
                />
              ) : viewingMaterial.file_type.toLowerCase().includes('image') ||
                   viewingMaterial.file_type.toLowerCase().includes('png') ||
                   viewingMaterial.file_type.toLowerCase().includes('jpg') ||
                   viewingMaterial.file_type.toLowerCase().includes('jpeg') ||
                   viewingMaterial.file_type.toLowerCase().includes('gif') ||
                   viewingMaterial.file_type.toLowerCase().includes('webp') ? (
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center p-4">
                  <img
                    src={viewingMaterial.file_url}
                    alt={viewingMaterial.title}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : viewingMaterial.file_type.toLowerCase().includes('video') ||
                   viewingMaterial.file_type.toLowerCase().includes('mp4') ||
                   viewingMaterial.file_type.toLowerCase().includes('webm') ? (
                <video
                  src={viewingMaterial.file_url}
                  className="absolute top-0 left-0 w-full h-full"
                  controls
                  autoPlay
                >
                  {t('user.courses.materials.videoNotSupported', 'Your browser does not support the video tag.')}
                </video>
              ) : (
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">{t('user.courses.materials.previewNotAvailable', 'Preview not available for this file type')}</p>
                    <Button
                      onClick={() => handleDownloadMaterial(viewingMaterial.file_url, viewingMaterial.file_name)}
                      className="mt-4"
                    >
                      <Download className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                      {t('user.courses.materials.download', 'Download')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
