'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamicImport from 'next/dynamic';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  ArrowLeft,
  Plus,
  Eye,
  EyeOff,
  PlusCircle,
  BookOpen,
  GraduationCap,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Video,
  VideoOff,
  Loader2,
  ExternalLink,
  CheckCircle,
  Award,
  Link2,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminLanguage } from '@/context/AppContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { CourseImageUploader } from '@/components/lms/CourseImageUploader';
import { LessonTopicsBuilder } from '@/components/lms/LessonTopicsBuilder';
import { Badge } from '@/components/ui/badge';

// Dynamically import RichTextEditor to avoid SSR issues
const RichTextEditor = dynamicImport(() => import('@/components/ui/rich-text-editor').then(mod => mod.RichTextEditor), { ssr: false });
import TokenInserter, { Token } from '@/components/ui/token-inserter';
import { CourseMaterials } from '@/components/lms/CourseMaterials';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface Course {
  id: string;
  title: string;
  description: string | null;
  program_id: string;
  is_active: boolean;
  instructor_id: string | null;
  image_url?: string | null;
  instructor?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order: number;
  is_published: boolean;
  is_optional: boolean;
  duration_minutes: number | null;
  lessons?: Lesson[];
  isExpanded?: boolean;
}

interface Lesson {
  id: string;
  module_id: string | null;
  course_id: string;
  title: string;
  description: string | null;
  order: number;
  duration: number | null;  // Changed from duration_minutes to match actual schema
  start_time?: string | null;
  timezone?: string;
  is_published: boolean;
  zoom_meeting_id?: string | null;
  topics?: Topic[];
  zoom_session?: {
    id: string;
    meeting_id: string;
    join_url: string;
    start_url: string;
    has_recording: boolean;
  } | null;
}

interface Topic {
  id: string;
  lesson_id: string;
  title: string;
  content_type: 'video' | 'text' | 'pdf' | 'quiz' | 'assignment' | 'link';
  order: number;
  duration_minutes: number;
  is_required: boolean;
}

// Sortable Module Component
function SortableModule({
  module,
  onToggleExpand,
  onAddLesson,
  onBulkAddLessons,
  onEdit,
  onDelete,
  onEditLesson,
  onDeleteLesson,
  onEditLessonContent,
  onOpenZoomMeeting,
  onCreateZoomMeeting,
  creatingZoomFor,
  t,
  direction,
  isRtl
}: {
  module: Module;
  onToggleExpand: () => void;
  onAddLesson: () => void;
  onBulkAddLessons: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onEditLessonContent: (lessonId: string, lessonTitle: string) => void;
  onOpenZoomMeeting: (lessonId: string) => void;
  onCreateZoomMeeting: (lessonId: string, platform?: 'zoom' | 'daily') => void;
  creatingZoomFor: string | null;
  t: (key: string, fallback: string) => string;
  direction: 'ltr' | 'rtl';
  isRtl: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg bg-card ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="p-3">
        <div className="flex items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-grab">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto"
            onClick={onToggleExpand}
          >
            {module.isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 font-medium">{module.title}</span>
          <div className="flex items-center gap-2">
            {!module.is_published && (
              <Badge variant="outline" className="text-xs">
                {t('lms.builder.draft', 'Draft')}
              </Badge>
            )}
            {module.is_optional && (
              <Badge variant="secondary" className="text-xs">
                {t('lms.builder.optional', 'Optional')}
              </Badge>
            )}
            {module.duration_minutes && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {module.duration_minutes}m
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onAddLesson}>
                  <Plus className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                  {t('lms.builder.add_lesson', 'Add Lesson')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onBulkAddLessons}>
                  <PlusCircle className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                  {t('lms.builder.bulk_add_lessons', 'Bulk Add Lessons')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                  {t('lms.builder.edit_module', 'Edit Module')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                  {t('lms.builder.delete_module', 'Delete Module')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {module.isExpanded && (
          <div className="ml-10 mt-3 space-y-2 border-l-2 border-muted pl-4">
            {module.lessons && module.lessons.length > 0 ? (
              <SortableContext
                items={module.lessons.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                {module.lessons.map((lesson) => (
                  <SortableLesson
                    key={lesson.id}
                    lesson={lesson}
                    moduleId={module.id}
                    onEdit={onEditLesson}
                    onDelete={onDeleteLesson}
                    onEditContent={onEditLessonContent}
                    onOpenZoomMeeting={onOpenZoomMeeting}
                    onCreateZoomMeeting={onCreateZoomMeeting}
                    creatingZoomFor={creatingZoomFor}
                    t={t}
                    direction={direction}
                    isRtl={isRtl}
                  />
                ))}
              </SortableContext>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <GraduationCap className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">{t('lms.builder.no_lessons', 'No lessons yet')}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => onAddLesson()}
                >
                  <Plus className={isRtl ? 'ml-1 h-3 w-3' : 'mr-1 h-3 w-3'} />
                  {t('lms.builder.add_first_lesson', 'Add First Lesson')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Sortable Lesson Component
function SortableLesson({
  lesson,
  moduleId,
  onEdit,
  onDelete,
  onEditContent,
  onOpenZoomMeeting,
  onCreateZoomMeeting,
  creatingZoomFor,
  t,
  direction,
  isRtl
}: {
  lesson: Lesson;
  moduleId: string;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lessonId: string) => void;
  onEditContent: (lessonId: string, lessonTitle: string) => void;
  onOpenZoomMeeting: (lessonId: string) => void;
  onCreateZoomMeeting: (lessonId: string) => void;
  creatingZoomFor: string | null;
  t: (key: string, fallback: string) => string;
  direction: 'ltr' | 'rtl';
  isRtl: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
    >
      {/* Drag Handle - Positioned on the left edge */}
      <div
        {...attributes}
        {...listeners}
        className={`absolute ${isRtl ? 'right-0' : 'left-0'} top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none opacity-0 group-hover:opacity-100 transition-opacity`}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Main content with left/right padding for drag handle */}
      <div className={`flex items-start gap-4 ${isRtl ? 'pr-8' : 'pl-8'}`}>
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <div className="h-8 w-8 rounded-md bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
            <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Title Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium leading-tight">{lesson.title}</h4>
              {lesson.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{lesson.description}</p>
              )}
            </div>

            {/* Status Badge */}
            <div className="flex-shrink-0">
              {lesson.is_published ? (
                <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                  {t('lms.builder.published', 'Published')}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  {t('lms.builder.draft', 'Draft')}
                </Badge>
              )}
            </div>
          </div>

          {/* Meta Info Row - Date, Duration, Topics, Zoom */}
          <div className="flex items-center gap-3 flex-wrap text-xs">
            {/* Date and Time - Most Important */}
            {lesson.start_time && (
              <div className="flex items-center gap-1 font-medium text-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {new Date(lesson.start_time).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                  {' • '}
                  {new Date(lesson.start_time).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}

            {/* Duration */}
            {lesson.duration && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <span>({lesson.duration}m)</span>
              </div>
            )}

            {/* Topics */}
            {((lesson as any).lesson_topics?.length > 0) && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <BookOpen className="h-3 w-3" />
                <span>{(lesson as any).lesson_topics.length} {t('lms.builder.topics', 'Topics')}</span>
              </div>
            )}

            {/* Video Meeting Status */}
            {(lesson.zoom_meeting_id || lesson.zoom_session?.daily_room_name) && (
              <div className="flex items-center gap-1.5">
                <Video className={`h-3 w-3 ${lesson.zoom_session?.platform === 'daily' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`} />
                <span className={lesson.zoom_session?.platform === 'daily' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}>
                  {lesson.zoom_session?.platform === 'daily' ? 'Daily.co' : 'Zoom'}
                </span>
                {lesson.zoom_session?.has_recording && (
                  <span className="text-muted-foreground">• {t('lms.builder.recorded', 'Recorded')}</span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons Row - Always Visible */}
          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            {/* Video Meeting Actions */}
            {(lesson.zoom_meeting_id || lesson.zoom_session?.daily_room_name) ? (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onOpenZoomMeeting(lesson.id)}
              >
                <ExternalLink className={isRtl ? 'h-3 w-3 ml-1.5' : 'h-3 w-3 mr-1.5'} />
                {lesson.zoom_session?.platform === 'daily'
                  ? t('lms.builder.open_daily', 'Open Daily.co')
                  : t('lms.builder.open_zoom', 'Open Zoom')}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onCreateZoomMeeting(lesson.id, 'daily')}
                disabled={creatingZoomFor === lesson.id}
              >
                {creatingZoomFor === lesson.id ? (
                  <Loader2 className={isRtl ? 'h-3 w-3 ml-1.5 animate-spin' : 'h-3 w-3 mr-1.5 animate-spin'} />
                ) : (
                  <VideoOff className={isRtl ? 'h-3 w-3 ml-1.5' : 'h-3 w-3 mr-1.5'} />
                )}
                {t('lms.builder.add_daily', 'Add Daily.co')}
              </Button>
            )}

            {/* Edit Content Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onEditContent(lesson.id, lesson.title)}
            >
              <BookOpen className={isRtl ? 'h-3 w-3 ml-1.5' : 'h-3 w-3 mr-1.5'} />
              {t('lms.topics.edit_content', 'Content')}
            </Button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Edit & Delete Buttons */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onEdit(lesson)}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(lesson.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CourseBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [creatingZoomFor, setCreatingZoomFor] = useState<string | null>(null);

  // Enrollment statistics
  const [enrollmentStats, setEnrollmentStats] = useState({
    totalEnrollments: 0,
    lifetimeSales: 0,
    completedCount: 0,
    completedPercent: 0,
    inProgressCount: 0,
    inProgressPercent: 0,
    notStartedCount: 0,
    notStartedPercent: 0,
  });

  // Course image URL
  const [courseImageUrl, setCourseImageUrl] = useState<string | null>(null);

  // Dialog states
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [showBulkModuleDialog, setShowBulkModuleDialog] = useState(false);
  const [showBulkLessonDialog, setShowBulkLessonDialog] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showDeleteModuleDialog, setShowDeleteModuleDialog] = useState(false);
  const [showDeleteLessonDialog, setShowDeleteLessonDialog] = useState(false);
  const [showLessonContentDialog, setShowLessonContentDialog] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<{ lessonId: string; moduleId: string } | null>(null);
  const [selectedLessonForContent, setSelectedLessonForContent] = useState<{ lessonId: string; lessonTitle: string } | null>(null);

  // Message states
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Helper to show status messages
  const showMessage = (type: 'success' | 'error' | 'warning', text: string, duration = 3000) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), duration);
  };

  // Form states
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    is_published: true,
    is_optional: false,
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    start_time: new Date().toISOString().slice(0, 16),
    duration_minutes: '60',
    timezone: 'Asia/Jerusalem', // Default timezone
    is_published: true,
    // Video meeting settings
    create_meeting: false,
    meeting_platform: 'daily' as 'zoom' | 'daily', // Platform selection
    create_zoom: false, // Keep for backward compatibility
    zoom_topic: '', // Custom Zoom meeting topic
    zoom_agenda: '',
    daily_room_name: '', // Custom Daily.co room name
  });

  const [bulkModuleForm, setBulkModuleForm] = useState({
    count: '5',
    titlePattern: 'Module {n}',
    startingOrder: 1,
    is_published: true,
    is_optional: false,
  });

  const [bulkLessonForm, setBulkLessonForm] = useState({
    // Lesson series settings
    series_name: '', // e.g., "Introduction to Parenting"
    count: '5',
    titlePattern: 'Session {n}', // Pattern for lesson titles

    // Schedule settings
    is_recurring: true, // Weekly recurring or one-time bulk
    recurrence_pattern: 'weekly', // weekly, daily, custom
    start_date: new Date().toISOString().slice(0, 10), // First lesson date
    start_time: '18:00', // Time of day
    duration_minutes: '60',
    timezone: 'Asia/Jerusalem', // Default timezone

    // For weekly: which days of the week
    weekly_days: [0], // 0=Sunday, 1=Monday, etc. Default to Sunday

    // End condition
    end_type: 'count', // 'count' or 'date'
    end_count: '5', // Number of occurrences
    end_date: '', // Or end by specific date

    // Video meeting settings
    create_meeting: true, // Create video meetings
    meeting_platform: 'zoom' as 'zoom' | 'daily', // Platform selection

    // Zoom settings
    create_zoom: true,
    zoom_topic_pattern: '{series_name} - Session {n}', // Pattern for Zoom meeting names
    zoom_agenda: '',
    zoom_recurring: true, // Create as Zoom recurring meeting

    // Daily.co settings
    create_daily: false,
    daily_room_pattern: '{series_name}-session-{n}', // Pattern for Daily.co room names

    // Zoom Security Settings
    zoom_passcode: '', // Meeting passcode (optional)
    zoom_waiting_room: true, // Enable waiting room
    zoom_join_before_host: false, // Allow participants to join before host
    zoom_mute_upon_entry: false, // Mute participants upon entry
    zoom_require_authentication: false, // Require authentication to join

    // Zoom Video/Audio Settings
    zoom_host_video: true, // Start video when host joins
    zoom_participant_video: true, // Start video when participants join
    zoom_audio: 'both', // Audio options: 'both', 'telephony', 'voip'

    // Zoom Recording Settings
    zoom_auto_recording: 'none', // Auto recording: 'none', 'local', 'cloud'

    // Publish settings
    is_published: false, // Publish lessons immediately
    zoom_record_speaker_view: false, // Record active speaker with shared screen
    zoom_recording_disclaimer: false, // Show recording disclaimer
  });

  // Bridge link state
  const [bridgeLink, setBridgeLink] = useState<any>(null);
  const [loadingBridge, setLoadingBridge] = useState(false);
  const [creatingBridge, setCreatingBridge] = useState(false);
  const [showBridgeDialog, setShowBridgeDialog] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Define available tokens for title and Zoom patterns
  const lessonTokens: Token[] = [
    { key: '{n}', label: 'Number', labelKey: 'lms.lesson.token_n', description: 'Lesson number', descriptionKey: 'lms.lesson.token_n_desc', category: 'basic' },
    { key: '{series_name}', label: 'Series Name', labelKey: 'lms.lesson.token_series_name', description: 'Name of the lesson series', descriptionKey: 'lms.lesson.token_series_name_desc', category: 'basic' },
    { key: '{date}', label: 'Date', labelKey: 'lms.lesson.token_date', description: 'Lesson date (YYYY-MM-DD)', descriptionKey: 'lms.lesson.token_date_desc', category: 'date' },
    { key: '{date_short}', label: 'Short Date', labelKey: 'lms.lesson.token_date_short', description: 'Short date format (DD/MM)', descriptionKey: 'lms.lesson.token_date_short_desc', category: 'date' },
    { key: '{date_long}', label: 'Long Date', labelKey: 'lms.lesson.token_date_long', description: 'Full date with day name', descriptionKey: 'lms.lesson.token_date_long_desc', category: 'date' },
    { key: '{dd}', label: 'Day', labelKey: 'lms.lesson.token_dd', description: 'Day of month (01-31)', descriptionKey: 'lms.lesson.token_dd_desc', category: 'date' },
    { key: '{mm}', label: 'Month #', labelKey: 'lms.lesson.token_mm', description: 'Month number (01-12)', descriptionKey: 'lms.lesson.token_mm_desc', category: 'date' },
    { key: '{time}', label: 'Time', labelKey: 'lms.lesson.token_time', description: 'Lesson time (HH:MM)', descriptionKey: 'lms.lesson.token_time_desc', category: 'time' },
    { key: '{time_12h}', label: '12h Time', labelKey: 'lms.lesson.token_time_12h', description: 'Time in 12-hour format', descriptionKey: 'lms.lesson.token_time_12h_desc', category: 'time' },
    { key: '{day}', label: 'Day Name', labelKey: 'lms.lesson.token_day', description: 'Day of week name', descriptionKey: 'lms.lesson.token_day_desc', category: 'date' },
    { key: '{month}', label: 'Month', labelKey: 'lms.lesson.token_month', description: 'Month name', descriptionKey: 'lms.lesson.token_month_desc', category: 'date' },
    { key: '{year}', label: 'Year', labelKey: 'lms.lesson.token_year', description: 'Year (YYYY)', descriptionKey: 'lms.lesson.token_year_desc', category: 'date' },
  ];

  const zoomTokens: Token[] = [
    ...lessonTokens,
    { key: '{duration}', label: 'Duration', labelKey: 'lms.lesson.token_duration', description: 'Meeting duration in minutes', descriptionKey: 'lms.lesson.token_duration_desc', category: 'zoom' },
    { key: '{timezone}', label: 'Timezone', labelKey: 'lms.lesson.token_timezone', description: 'Meeting timezone', descriptionKey: 'lms.lesson.token_timezone_desc', category: 'zoom' },
    { key: '{instructor}', label: 'Instructor', labelKey: 'lms.lesson.token_instructor', description: 'Instructor name', descriptionKey: 'lms.lesson.token_instructor_desc', category: 'zoom' },
    { key: '{course_name}', label: 'Course Name', labelKey: 'lms.lesson.token_course_name', description: 'Name of the course', descriptionKey: 'lms.lesson.token_course_name_desc', category: 'zoom' },
  ];

  // Helper function to insert token at cursor position
  const insertToken = (
    currentValue: string,
    token: string,
    setFormValue: (value: string) => void
  ) => {
    setFormValue(currentValue + (currentValue && !currentValue.endsWith(' ') ? ' ' : '') + token);
  };

  // Helper function to replace tokens in a pattern
  const replaceTokens = (pattern: string, lessonNumber: number, lessonDate: Date | null) => {
    let result = pattern;

    // Replace {n} with lesson number
    result = result.replace(/\{n\}/g, lessonNumber.toString());

    // Replace {series_name} with course name
    result = result.replace(/\{series_name\}/g, course?.title || 'lesson');
    result = result.replace(/\{course_name\}/g, course?.title || 'lesson');

    if (lessonDate) {
      // Format date tokens
      const year = lessonDate.getFullYear();
      const month = String(lessonDate.getMonth() + 1).padStart(2, '0');
      const day = String(lessonDate.getDate()).padStart(2, '0');
      const hours = String(lessonDate.getHours()).padStart(2, '0');
      const minutes = String(lessonDate.getMinutes()).padStart(2, '0');

      // {date} - YYYY-MM-DD
      result = result.replace(/\{date\}/g, `${year}-${month}-${day}`);

      // {date_short} - DD/MM
      result = result.replace(/\{date_short\}/g, `${day}/${month}`);

      // {date_long} - Full date with day name
      const dayName = lessonDate.toLocaleDateString('en-US', { weekday: 'long' });
      const monthName = lessonDate.toLocaleDateString('en-US', { month: 'long' });
      result = result.replace(/\{date_long\}/g, `${dayName}, ${monthName} ${day}, ${year}`);

      // {time} - HH:MM
      result = result.replace(/\{time\}/g, `${hours}:${minutes}`);

      // {time_12h} - 12-hour format
      const hours12 = lessonDate.getHours() % 12 || 12;
      const ampm = lessonDate.getHours() >= 12 ? 'PM' : 'AM';
      result = result.replace(/\{time_12h\}/g, `${hours12}:${minutes} ${ampm}`);

      // {day} - Day of week
      result = result.replace(/\{day\}/g, dayName);

      // {month} - Month name
      result = result.replace(/\{month\}/g, monthName);

      // {year} - Year
      result = result.replace(/\{year\}/g, year.toString());
    }

    return result;
  };

  useEffect(() => {
    loadCourse();
  }, [params.id]);

  // Load bridge link when dialog opens
  useEffect(() => {
    if (showBridgeDialog && course?.id) {
      loadBridgeLink();
    }
  }, [showBridgeDialog, course?.id]);

  const loadCourse = async () => {
    try {
      setLoading(true);

      // Load course data
      const courseResponse = await fetch(`/api/lms/courses/${params.id}`);
      const courseData = await courseResponse.json();

      if (courseData.success) {
        setCourse(courseData.data);
        // Set course image URL
        setCourseImageUrl(courseData.data.image_url || null);
      } else {
        // Fallback to mock data if API fails
        setCourse({
          id: params.id as string,
          title: 'Course',
          description: 'Course description',
          program_id: '',
          is_active: true,
        });
      }

      // Load modules for this course (with cache busting)
      console.log('[loadCourse] Fetching modules for course:', params.id);
      const timestamp = Date.now();
      const modulesResponse = await fetch(`/api/lms/modules?course_id=${params.id}&include_lessons=true&_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const modulesData = await modulesResponse.json();
      console.log('[loadCourse] Modules fetched:', {
        success: modulesData.success,
        count: modulesData.data?.length,
        moduleIds: modulesData.data?.map((m: any) => m.id),
      });

      if (modulesData.success && modulesData.data) {
        // Map zoom_sessions to zoom_session object
        // NOTE: Supabase returns zoom_sessions as an object (not array) for one-to-one relationships
        const mappedModules = modulesData.data.map((m: any) => ({
          ...m,
          isExpanded: true, // Open modules by default
          lessons: m.lessons?.map((lesson: any) => {
            // Handle both object and array cases
            const sessionData = Array.isArray(lesson.zoom_sessions)
              ? lesson.zoom_sessions[0]
              : lesson.zoom_sessions;

            const zoomSession = sessionData ? {
              id: sessionData.id,
              meeting_id: sessionData.zoom_meeting_id,
              join_url: sessionData.join_url,
              start_url: sessionData.start_url,
              has_recording: sessionData.recording_status === 'ready',
              // Daily.co fields
              daily_room_name: sessionData.daily_room_name,
              daily_room_url: sessionData.daily_room_url,
              platform: sessionData.platform,
            } : null;

            // Debug logging for lessons with zoom_sessions
            if (sessionData) {
              console.log('[loadCourse] Lesson with session:', {
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                platform: sessionData.platform,
                daily_room_name: sessionData.daily_room_name,
                zoom_meeting_id: sessionData.zoom_meeting_id,
              });
            }

            return {
              ...lesson,
              zoom_session: zoomSession,
            };
          }) || [],
        }));
        setModules(mappedModules);
      } else {
        setModules([]);
      }

      // Load enrollment statistics
      loadEnrollmentStats();
    } catch (error) {
      console.error('Failed to load course:', error);
      showMessage('error', t('lms.builder.load_failed', 'Failed to load course data'), 5000);
    } finally {
      setLoading(false);
    }
  };

  const loadEnrollmentStats = async () => {
    try {
      // Use the students API which properly handles both program and standalone enrollments
      const studentsResponse = await fetch(`/api/admin/lms/courses/${params.id}/students`);
      const studentsData = await studentsResponse.json();

      if (studentsData.success && studentsData.data) {
        const students = studentsData.data;
        const total = students.length;

        // For now, set basic stats
        // TODO: Enhance to get actual progress/completion data from user_progress table
        setEnrollmentStats({
          totalEnrollments: total,
          lifetimeSales: 0, // TODO: Calculate from enrollments/payments
          completedCount: 0, // TODO: Get from user_progress
          completedPercent: 0,
          inProgressCount: total, // Assume all are in progress for now
          inProgressPercent: 100,
          notStartedCount: 0,
          notStartedPercent: 0,
        });
      }
    } catch (error) {
      console.error('Failed to load enrollment stats:', error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    // Check if we're dragging a module
    const activeModuleIndex = modules.findIndex((m) => m.id === active.id);
    const overModuleIndex = modules.findIndex((m) => m.id === over.id);

    if (activeModuleIndex !== -1 && overModuleIndex !== -1) {
      // Module drag & drop
      const newModules = arrayMove(modules, activeModuleIndex, overModuleIndex).map(
        (module, index) => ({ ...module, order: index })
      );
      setModules(newModules);

      // Save the new order to the API
      try {
        const response = await fetch('/api/lms/modules', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reorder',
            items: newModules.map(m => ({ id: m.id, order: m.order })),
          }),
        });

        const result = await response.json();

        if (result.success) {
          showMessage('success', t('lms.builder.module_order_updated', 'Module order updated'));
        }
      } catch (error) {
        console.error('Failed to save module order:', error);
        showMessage('warning', t('lms.builder.order_local_only', 'Order updated locally only'));
      }
    } else {
      // Check if we're dragging a lesson
      // Find which module the active lesson belongs to
      let sourceModule = null;
      let activeLesson = null;
      let activeLessonIndex = -1;

      for (const module of modules) {
        if (!module.lessons) continue;
        const index = module.lessons.findIndex((l) => l.id === active.id);
        if (index !== -1) {
          sourceModule = module;
          activeLesson = module.lessons[index];
          activeLessonIndex = index;
          break;
        }
      }

      if (!sourceModule || !activeLesson) {
        setActiveId(null);
        return;
      }

      // Find which module the over item belongs to
      let targetModule = null;
      let overLessonIndex = -1;

      for (const module of modules) {
        if (!module.lessons) continue;
        const index = module.lessons.findIndex((l) => l.id === over.id);
        if (index !== -1) {
          targetModule = module;
          overLessonIndex = index;
          break;
        }
      }

      // If no target lesson found, check if dropping on a module
      if (!targetModule) {
        const moduleIndex = modules.findIndex((m) => m.id === over.id);
        if (moduleIndex !== -1) {
          targetModule = modules[moduleIndex];
          overLessonIndex = 0; // Add to beginning of module
        }
      }

      if (!targetModule) {
        setActiveId(null);
        return;
      }

      // Handle the move
      if (sourceModule.id === targetModule.id) {
        // Same module - just reorder
        const newLessons = arrayMove(sourceModule.lessons!, activeLessonIndex, overLessonIndex).map(
          (lesson, index) => ({ ...lesson, order: index })
        );

        setModules(modules.map(m =>
          m.id === sourceModule!.id
            ? { ...m, lessons: newLessons }
            : m
        ));

        // Save the new order to the API
        try {
          const response = await fetch('/api/lms/lessons/reorder', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              module_id: sourceModule.id,
              lessons: newLessons.map(l => ({ id: l.id, order: l.order })),
            }),
          });

          const result = await response.json();

          if (result.success) {
            showMessage('success', t('lms.builder.lesson_order_updated', 'Lesson order updated'));
          }
        } catch (error) {
          console.error('Failed to save lesson order:', error);
          showMessage('warning', t('lms.builder.order_local_only', 'Order updated locally only'));
        }
      } else {
        // Cross-module move
        // Remove from source module
        const newSourceLessons = sourceModule.lessons!
          .filter((l) => l.id !== activeLesson.id)
          .map((lesson, index) => ({ ...lesson, order: index }));

        // Add to target module at the specified position
        const newTargetLessons = [...(targetModule.lessons || [])];
        newTargetLessons.splice(overLessonIndex, 0, { ...activeLesson, module_id: targetModule.id });
        const reorderedTargetLessons = newTargetLessons.map((lesson, index) => ({ ...lesson, order: index }));

        // Update local state
        setModules(modules.map(m => {
          if (m.id === sourceModule!.id) {
            return { ...m, lessons: newSourceLessons };
          } else if (m.id === targetModule!.id) {
            return { ...m, lessons: reorderedTargetLessons };
          }
          return m;
        }));

        // Save to API - move lesson to new module
        try {
          const response = await fetch(`/api/lms/lessons/${activeLesson.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              module_id: targetModule.id,
              order: overLessonIndex,
            }),
          });

          const result = await response.json();

          if (result.success) {
            // Reorder lessons in both modules
            const reorderPromises = [];

            if (newSourceLessons.length > 0) {
              reorderPromises.push(
                fetch('/api/lms/lessons/reorder', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    module_id: sourceModule.id,
                    lessons: newSourceLessons.map(l => ({ id: l.id, order: l.order })),
                  }),
                })
              );
            }

            reorderPromises.push(
              fetch('/api/lms/lessons/reorder', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  module_id: targetModule.id,
                  lessons: reorderedTargetLessons.map(l => ({ id: l.id, order: l.order })),
                }),
              })
            );

            await Promise.all(reorderPromises);

            showMessage('success', t('lms.builder.lesson_moved', 'Lesson moved to new module'));
          }
        } catch (error) {
          console.error('Failed to move lesson:', error);
          showMessage('error', t('lms.builder.move_failed', 'Failed to move lesson'));
        }
      }
    }

    setActiveId(null);
  };

  const toggleModuleExpansion = (moduleId: string) => {
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? { ...module, isExpanded: !module.isExpanded }
          : module
      )
    );
  };

  const handleCreateModule = async () => {
    if (!moduleForm.title.trim()) {
      showMessage('error', t('lms.builder.title_required', 'Title is required'));
      return;
    }

    try {
      setSaving(true);
      setStatusMessage(null);

      const isEditing = !!editingModule;
      const url = isEditing ? `/api/lms/modules/${editingModule.id}` : '/api/lms/modules';
      const method = isEditing ? 'PATCH' : 'POST';

      // Calculate next available order (get max order + 1, or 0 if no modules)
      const nextOrder = isEditing
        ? editingModule.order
        : modules.length > 0
          ? Math.max(...modules.map(m => m.order)) + 1
          : 0;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: params.id,
          title: moduleForm.title,
          description: moduleForm.description || null,
          order: nextOrder,
          is_published: moduleForm.is_published,
          is_optional: moduleForm.is_optional,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        if (isEditing) {
          // Update existing module
          setModules(modules.map(m =>
            m.id === editingModule.id
              ? { ...m, ...result.data, lessons: m.lessons }
              : m
          ));
          showMessage('success', t('lms.builder.module_updated', 'Module updated successfully'));
        } else {
          // Add new module
          const newModule = {
            ...result.data,
            lessons: [],
            isExpanded: false,
          };
          setModules([...modules, newModule]);
          showMessage('success', t('lms.builder.module_created', 'Module created successfully'));
        }

        setShowModuleDialog(false);
        setEditingModule(null);
        setModuleForm({
          title: '',
          description: '',
          is_published: true,
          is_optional: false,
        });
      } else {
        showMessage('error', result.error || `Failed to ${isEditing ? 'update' : 'create'} module`, 5000);
      }
    } catch (error) {
      console.error(`Failed to ${editingModule ? 'update' : 'create'} module:`, error);
      showMessage('error', `Failed to ${editingModule ? 'update' : 'create'} module. Please try again.`, 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    setModuleToDelete(moduleId);
    setShowDeleteModuleDialog(true);
  };

  const confirmDeleteModule = async () => {
    if (!moduleToDelete) return;

    try {
      console.log('[confirmDeleteModule] Deleting module:', moduleToDelete);
      const response = await fetch(`/api/lms/modules/${moduleToDelete}`, {
        method: 'DELETE',
      });

      console.log('[confirmDeleteModule] Response status:', response.status);
      const result = await response.json();
      console.log('[confirmDeleteModule] Response result:', result);

      if (result.success) {
        console.log('[confirmDeleteModule] Delete successful, waiting for DB commit...');
        // Wait a moment for database transaction to fully commit
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('[confirmDeleteModule] Reloading course data...');
        // Reload data from server to ensure consistency
        await loadCourse();
        console.log('[confirmDeleteModule] Course data reloaded');
        showMessage('success', t('lms.module.deleted_success', 'Module deleted successfully'));
      } else {
        console.error('[confirmDeleteModule] Delete failed:', result.error);
        showMessage('error', result.error || t('lms.module.delete_failed', 'Failed to delete module'), 5000);
      }
    } catch (error) {
      console.error('[confirmDeleteModule] Exception:', error);
      showMessage('error', t('lms.module.delete_failed', 'Failed to delete module'), 5000);
    } finally {
      setShowDeleteModuleDialog(false);
      setModuleToDelete(null);
    }
  };

  const handleCreateLesson = async () => {
    if (!lessonForm.title.trim() || !selectedModule) {
      showMessage('error', t('lms.builder.title_required', 'Title is required'));
      return;
    }

    if (lessonForm.create_meeting) {
      if (lessonForm.meeting_platform === 'zoom' && !lessonForm.zoom_topic.trim()) {
        showMessage('error', t('lms.builder.zoom_topic_required', 'Zoom meeting topic is required when creating Zoom meeting'));
        return;
      }
      if (lessonForm.meeting_platform === 'daily' && !lessonForm.daily_room_name.trim()) {
        showMessage('error', t('lms.builder.daily_room_name_required', 'Daily.co room name is required when creating Daily.co room'));
        return;
      }
    }

    try {
      setSaving(true);

      // Determine if we're editing or creating
      const isEditing = !!editingLesson;
      const url = isEditing ? `/api/lms/lessons/${editingLesson.id}` : '/api/lms/lessons';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: params.id,
          module_id: selectedModule.id,
          title: lessonForm.title,
          description: lessonForm.description || null,
          duration: lessonForm.duration_minutes ? parseInt(lessonForm.duration_minutes) : null,
          is_published: lessonForm.is_published,
          start_time: lessonForm.start_time,
          timezone: lessonForm.timezone,
          order: isEditing ? editingLesson.order : (selectedModule.lessons?.length || 0),
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const lessonData = result.data;

        // Create video meeting if requested (only for new lessons)
        let meetingCreated = false;
        if (!isEditing && lessonForm.create_meeting) {
          try {
            if (lessonForm.meeting_platform === 'daily') {
              // Replace tokens in Daily.co room name
              const lessonDate = lessonForm.start_time ? new Date(lessonForm.start_time) : null;
              const lessonNumber = (selectedModule.lessons?.length || 0) + 1;
              const roomNameWithTokens = replaceTokens(lessonForm.daily_room_name.trim(), lessonNumber, lessonDate);

              // Create Daily.co room
              const dailyResponse = await fetch('/api/daily/create-room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  lessonId: lessonData.id,
                  customRoomName: roomNameWithTokens,
                }),
              });

              const dailyResult = await dailyResponse.json();
              if (!dailyResult.success && !dailyResult.roomName) {
                showMessage('warning', t('lms.builder.lesson_created_daily_failed', 'Lesson created but Daily.co room creation failed'), 5000);
              } else {
                meetingCreated = true;
              }
            } else {
              // Replace tokens in Zoom topic
              const lessonDate = lessonForm.start_time ? new Date(lessonForm.start_time) : null;
              const lessonNumber = (selectedModule.lessons?.length || 0) + 1;
              const zoomTopicWithTokens = replaceTokens(lessonForm.zoom_topic, lessonNumber, lessonDate);

              // Create Zoom meeting
              const zoomResponse = await fetch('/api/lms/zoom/meetings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  lesson_id: lessonData.id,
                  topic: zoomTopicWithTokens,
                  agenda: lessonForm.zoom_agenda || null,
                  start_time: lessonForm.start_time,
                  duration: parseInt(lessonForm.duration_minutes),
                }),
              });

              const zoomResult = await zoomResponse.json();
              if (!zoomResult.success) {
                showMessage('warning', t('lms.builder.lesson_created_zoom_failed', `Lesson created but Zoom meeting failed: ${zoomResult.error}`), 5000);
              } else {
                meetingCreated = true;
              }
            }
          } catch (error) {
            console.error('Failed to create meeting:', error);
            const errorMsg = lessonForm.meeting_platform === 'daily'
              ? t('lms.builder.lesson_created_daily_error', 'Lesson created but Daily.co room creation failed')
              : t('lms.builder.lesson_created_zoom_error', 'Lesson created but Zoom meeting creation failed');
            showMessage('warning', errorMsg, 5000);
          }
        }

        // Update Zoom meeting if lesson is being edited and has a Zoom meeting
        if (isEditing && editingLesson.zoom_meeting_id) {
          try {
            // Format start_time with seconds for Zoom API (YYYY-MM-DDTHH:mm:ss)
            const formattedStartTime = lessonForm.start_time.length === 16
              ? `${lessonForm.start_time}:00`
              : lessonForm.start_time;

            const zoomResponse = await fetch(`/api/lms/lessons/${lessonData.id}/zoom-session`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                topic: lessonForm.title,
                agenda: lessonForm.description || null,
                start_time: formattedStartTime,
                duration: parseInt(lessonForm.duration_minutes),
                timezone: lessonForm.timezone,
              }),
            });

            const zoomResult = await zoomResponse.json();
            if (!zoomResult.success) {
              showMessage('warning', t('lms.builder.lesson_updated_zoom_failed', `Lesson updated but Zoom meeting update failed: ${zoomResult.error}`), 5000);
            } else {
              showMessage('success', t('lms.builder.lesson_zoom_updated', 'Lesson and Zoom meeting updated successfully'));
            }
          } catch (zoomError) {
            console.error('Failed to update Zoom meeting:', zoomError);
            showMessage('warning', t('lms.builder.lesson_updated_zoom_error', 'Lesson updated but Zoom meeting update failed'), 5000);
          }
        }

        // If a meeting was created, reload the course to get the updated session data
        if (meetingCreated) {
          await loadCourse();
        } else {
          // Update modules state only if we didn't reload
          setModules(modules.map(m => {
            if (m.id === selectedModule.id) {
              if (isEditing) {
                // Update existing lesson
                return {
                  ...m,
                  lessons: (m.lessons || []).map(l => l.id === editingLesson.id ? lessonData : l),
                };
              } else {
                // Add new lesson
                return {
                  ...m,
                  lessons: [...(m.lessons || []), lessonData],
                };
              }
            }
            return m;
          }));
        }

        setShowLessonDialog(false);
        setEditingLesson(null);
        setLessonForm({
          title: '',
          description: '',
          start_time: new Date().toISOString().slice(0, 16),
          duration_minutes: '60',
          timezone: 'Asia/Jerusalem',
          is_published: true,
          create_meeting: false,
          meeting_platform: 'daily',
          create_zoom: false,
          zoom_topic: '',
          zoom_agenda: '',
          daily_room_name: '',
        });

        const successMsg = isEditing
          ? t('lms.builder.lesson_updated', 'Lesson updated successfully')
          : (lessonForm.create_meeting
              ? (lessonForm.meeting_platform === 'daily'
                  ? t('lms.builder.lesson_daily_created', 'Lesson and Daily.co room created successfully')
                  : t('lms.builder.lesson_zoom_created', 'Lesson and Zoom meeting created successfully'))
              : t('lms.builder.lesson_created', 'Lesson created successfully'));

        showMessage('success', successMsg);
      } else {
        showMessage('error', result.error || t('lms.builder.lesson_save_failed', 'Failed to save lesson'), 5000);
      }
    } catch (error) {
      console.error('Failed to save lesson:', error);
      showMessage('error', t('lms.builder.lesson_save_failed', 'Failed to save lesson'), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string, moduleId: string) => {
    setLessonToDelete({ lessonId, moduleId });
    setShowDeleteLessonDialog(true);
  };

  const confirmDeleteLesson = async () => {
    console.log('[confirmDeleteLesson] Function called');
    if (!lessonToDelete) {
      console.log('[confirmDeleteLesson] No lesson to delete');
      return;
    }

    console.log('[confirmDeleteLesson] Deleting lesson:', lessonToDelete.lessonId);
    try {
      const response = await fetch(`/api/lms/lessons/${lessonToDelete.lessonId}`, {
        method: 'DELETE',
      });

      console.log('[confirmDeleteLesson] Response status:', response.status);
      const result = await response.json();
      console.log('[confirmDeleteLesson] Response body:', result);

      if (result.success) {
        console.log('[confirmDeleteLesson] Success! Updating modules state...');
        console.log('[confirmDeleteLesson] Current modules:', modules);
        console.log('[confirmDeleteLesson] Module ID to update:', lessonToDelete.moduleId);
        console.log('[confirmDeleteLesson] Lesson ID to remove:', lessonToDelete.lessonId);

        const updatedModules = modules.map(m => {
          if (m.id === lessonToDelete.moduleId) {
            const filteredLessons = m.lessons?.filter(l => l.id !== lessonToDelete.lessonId) || [];
            console.log('[confirmDeleteLesson] Filtering lessons. Before:', m.lessons?.length, 'After:', filteredLessons.length);
            return {
              ...m,
              lessons: filteredLessons,
            };
          }
          return m;
        });

        console.log('[confirmDeleteLesson] Updated modules:', updatedModules);
        setModules(updatedModules);

        showMessage('success', t('lms.builder.lesson_deleted', 'Lesson deleted successfully'));

        // Reload course data to ensure UI is in sync with database
        await loadCourse();
      } else {
        showMessage('error', result.error || t('lms.builder.lesson_delete_failed', 'Failed to delete lesson'), 5000);
      }
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      showMessage('error', t('lms.builder.lesson_delete_failed', 'Failed to delete lesson'), 5000);
    } finally {
      setShowDeleteLessonDialog(false);
      setLessonToDelete(null);
    }
  };

  const handleEditLesson = (lesson: Lesson, moduleId: string) => {
    // Find the module containing this lesson
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    // Set the editing lesson and module
    setEditingLesson(lesson);
    setSelectedModule(module);

    // Format start_time for datetime-local input (YYYY-MM-DDTHH:MM)
    let formattedStartTime = new Date().toISOString().slice(0, 16);
    if (lesson.start_time) {
      try {
        const startDate = new Date(lesson.start_time);
        // datetime-local input expects format: YYYY-MM-DDTHH:MM
        formattedStartTime = startDate.toISOString().slice(0, 16);
      } catch (e) {
        console.error('Error parsing lesson start_time:', e);
      }
    }

    // Populate the form with lesson data
    const duration = lesson.duration || 60;

    setLessonForm({
      title: lesson.title,
      description: lesson.description || '',
      start_time: formattedStartTime,
      duration_minutes: duration.toString(),
      timezone: lesson.timezone || 'Asia/Jerusalem',
      is_published: lesson.is_published,
      create_meeting: false, // Don't show meeting creation option in edit mode
      meeting_platform: 'daily',
      create_zoom: false,
      zoom_topic: '',
      zoom_agenda: '',
      daily_room_name: '',
    });

    // Open the dialog
    setShowLessonDialog(true);
  };

  const handleOpenZoomMeeting = async (lessonId: string) => {
    try {
      // Find the lesson to check platform
      let lesson: any = null;
      for (const module of modules) {
        const found = module.lessons?.find(l => l.id === lessonId);
        if (found) {
          lesson = found;
          break;
        }
      }

      // If Daily.co room, open room URL directly
      if (lesson?.zoom_session?.platform === 'daily' && lesson.zoom_session?.daily_room_url) {
        window.open(lesson.zoom_session.daily_room_url, '_blank');
        return;
      }

      // Otherwise, fetch Zoom session data
      const response = await fetch(`/api/lms/lessons/${lessonId}/zoom-session`);
      const result = await response.json();

      if (result.success && result.data?.start_url) {
        window.open(result.data.start_url, '_blank');
      } else {
        showMessage('error', t('lms.builder.zoom_url_not_found', 'Meeting URL not found'), 3000);
      }
    } catch (error) {
      console.error('Error opening meeting:', error);
      showMessage('error', t('lms.builder.zoom_open_failed', 'Failed to open meeting'), 3000);
    }
  };

  const handleCreateZoomMeeting = async (lessonId: string, platform: 'zoom' | 'daily' = 'zoom') => {
    try {
      setCreatingZoomFor(lessonId);

      const endpoint = platform === 'daily'
        ? `/api/daily/create-room`
        : `/api/admin/lessons/${lessonId}/zoom/create`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: platform === 'daily' ? JSON.stringify({ lessonId }) : undefined,
      });

      const result = await response.json();

      if (result.success || result.roomName) {
        console.log(`[${platform}] Meeting created, reloading course data...`, result);

        // Small delay to ensure database write is complete
        await new Promise(resolve => setTimeout(resolve, 500));

        // Reload course to get updated session data from database
        await loadCourse();

        if (platform === 'daily') {
          showMessage('success', t('lms.builder.daily_created', 'Daily.co room created successfully'));
        } else {
          showMessage('success', t('lms.builder.zoom_created', 'Zoom meeting created successfully'));
        }
      } else {
        const errorMsg = platform === 'daily'
          ? t('lms.builder.daily_create_failed', 'Failed to create Daily.co room')
          : t('lms.builder.zoom_create_failed', 'Failed to create Zoom meeting');
        showMessage('error', result.error || errorMsg, 5000);
      }
    } catch (error) {
      console.error(`Failed to create ${platform} meeting:`, error);
      const errorMsg = platform === 'daily'
        ? t('lms.builder.daily_create_failed', 'Failed to create Daily.co room')
        : t('lms.builder.zoom_create_failed', 'Failed to create Zoom meeting');
      showMessage('error', errorMsg, 5000);
    } finally {
      setCreatingZoomFor(null);
    }
  };

  const handleBulkCreateModules = async () => {
    const count = parseInt(bulkModuleForm.count);
    if (count < 1 || count > 20) {
      showMessage('error', t('lms.builder.invalid_count', 'Please enter a number between 1 and 20'));
      return;
    }

    try {
      setSaving(true);

      const createdModules: Module[] = [];

      // Calculate starting order (get max order + 1, or 0 if no modules)
      const startingOrder = modules.length > 0
        ? Math.max(...modules.map(m => m.order)) + 1
        : 0;

      // Create each module in the database
      for (let i = 1; i <= count; i++) {
        const response = await fetch('/api/lms/modules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            course_id: params.id,
            title: bulkModuleForm.titlePattern.replace('{n}', i.toString()),
            description: null,
            order: startingOrder + i - 1,
            is_published: bulkModuleForm.is_published,
            is_optional: bulkModuleForm.is_optional,
          }),
        });

        const result = await response.json();

        if (result.success && result.data) {
          createdModules.push({
            ...result.data,
            lessons: [],
            isExpanded: false,
          });
        } else {
          showMessage('error', result.error || `Failed to create module ${i}`, 5000);
          break;
        }
      }

      if (createdModules.length > 0) {
        setModules([...modules, ...createdModules]);
        setShowBulkModuleDialog(false);
        setBulkModuleForm({
          count: '5',
          titlePattern: 'Module {n}',
          startingOrder: 1,
          is_published: true,
          is_optional: false,
        });
        showMessage('success', t('lms.builder.modules_created', `${createdModules.length} modules created successfully`));
      }
    } catch (error) {
      console.error('Failed to create modules:', error);
      showMessage('error', 'Failed to create modules. Please try again.', 5000);
    } finally {
      setSaving(false);
    }
  };

  const handlePublishCourse = async () => {
    if (!course) return;

    try {
      setSaving(true);

      const newPublishedState = !course.is_published;

      // Update course published status
      const courseResponse = await fetch(`/api/lms/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_published: newPublishedState,
        }),
      });

      const courseResult = await courseResponse.json();

      if (!courseResult.success) {
        showMessage('error', courseResult.error || 'Failed to update course', 5000);
        return;
      }

      // Update all modules
      const modulePromises = modules.map(module =>
        fetch(`/api/lms/modules/${module.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            is_published: newPublishedState,
          }),
        })
      );

      await Promise.all(modulePromises);

      // Update all lessons across all modules
      const lessonPromises: Promise<Response>[] = [];
      const topicPromises: Promise<Response>[] = [];

      modules.forEach(module => {
        if (module.lessons && module.lessons.length > 0) {
          module.lessons.forEach(lesson => {
            lessonPromises.push(
              fetch(`/api/lms/lessons/${lesson.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  is_published: newPublishedState,
                }),
              })
            );

            // Update lesson topics if they exist
            if (lesson.topics && lesson.topics.length > 0) {
              lesson.topics.forEach((topic: any) => {
                topicPromises.push(
                  fetch(`/api/lms/lesson-topics/${topic.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      is_published: newPublishedState,
                    }),
                  })
                );
              });
            }
          });
        }
      });

      await Promise.all([...lessonPromises, ...topicPromises]);

      // Update all course materials
      try {
        const materialsResponse = await fetch(`/api/lms/materials?course_id=${course.id}`);
        const materialsData = await materialsResponse.json();

        if (materialsData.success && materialsData.data.length > 0) {
          const materialPromises = materialsData.data.map((material: any) =>
            fetch(`/api/lms/materials/${material.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                is_published: newPublishedState,
              }),
            })
          );

          await Promise.all(materialPromises);
        }
      } catch (error) {
        console.error('Failed to update materials publish status:', error);
        // Don't fail the whole operation if materials update fails
      }

      // Update local state
      setCourse({ ...course, is_published: newPublishedState });
      setModules(modules.map(m => ({
        ...m,
        is_published: newPublishedState,
        lessons: m.lessons?.map(l => ({
          ...l,
          is_published: newPublishedState,
          topics: l.topics?.map((t: any) => ({ ...t, is_published: newPublishedState }))
        })),
      })));

      showMessage(
        'success',
        newPublishedState
          ? t('lms.builder.course_published', 'Course and all content published successfully')
          : t('lms.builder.course_unpublished', 'Course and all content unpublished successfully')
      );
    } catch (error) {
      console.error('Failed to publish/unpublish course:', error);
      showMessage('error', 'Failed to update course. Please try again.', 5000);
    } finally {
      setSaving(false);
    }
  };

  // Bridge link functions
  const loadBridgeLink = async () => {
    if (!course?.id) return;

    setLoadingBridge(true);
    try {
      const res = await fetch(`/api/admin/lms/courses/${course.id}/bridge`);
      const data = await res.json();

      if (data.success && data.data) {
        setBridgeLink(data.data);
      } else {
        setBridgeLink(null);
      }
    } catch (error) {
      console.error('Error loading bridge link:', error);
      setBridgeLink(null);
    } finally {
      setLoadingBridge(false);
    }
  };

  const handleCreateBridgeLink = async () => {
    if (!course?.id) return;

    setCreatingBridge(true);
    try {
      const res = await fetch(`/api/admin/lms/courses/${course.id}/bridge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      console.log('[Bridge Link] API Response:', data);

      if (data.success && data.data) {
        setBridgeLink(data.data);
        showMessage('success', t('lms.course_detail.bridge_created', 'Instructor bridge link created successfully'));
      } else {
        console.error('[Bridge Link] Error:', data.error);
        showMessage('error', data.error || t('lms.course_detail.bridge_error', 'Failed to create bridge link'));
      }
    } catch (error) {
      console.error('Error creating bridge link:', error);
      showMessage('error', t('lms.course_detail.bridge_error', 'Failed to create bridge link'));
    } finally {
      setCreatingBridge(false);
    }
  };

  const copyBridgeLink = () => {
    if (bridgeLink?.bridge_url) {
      navigator.clipboard.writeText(bridgeLink.bridge_url);
      showMessage('success', t('lms.course_detail.bridge_copied', 'Bridge link copied to clipboard!'));
    }
  };

  const handleBulkCreateLessons = async () => {
    if (!selectedModule) {
      showMessage('error', t('lms.builder.select_module_first', 'Please select a module first'));
      return;
    }

    // Validation
    if (!bulkLessonForm.series_name.trim()) {
      showMessage('error', t('lms.builder.series_name_required', 'Series name is required'));
      return;
    }

    const count = bulkLessonForm.end_type === 'count'
      ? parseInt(bulkLessonForm.end_count)
      : parseInt(bulkLessonForm.count);

    if (count < 1 || count > 50) {
      showMessage('error', t('lms.builder.lessons_count_range', 'Please enter a number between 1 and 50'));
      return;
    }

    if (bulkLessonForm.create_zoom && !bulkLessonForm.zoom_topic_pattern.trim()) {
      showMessage('error', t('lms.builder.zoom_topic_pattern_required', 'Zoom topic pattern is required when creating Zoom meetings'));
      return;
    }

    if (bulkLessonForm.create_daily && !bulkLessonForm.daily_room_pattern.trim()) {
      showMessage('error', t('lms.builder.daily_room_pattern_required', 'Daily.co room pattern is required when creating Daily.co rooms'));
      return;
    }

    try {
      setSaving(true);

      // Calculate lesson dates based on recurrence pattern
      // We'll send date/time strings and let the backend handle timezone conversion
      const lessonDateStrings: string[] = [];

      if (bulkLessonForm.is_recurring && bulkLessonForm.recurrence_pattern === 'weekly') {
        // Weekly recurring lessons
        const startDate = new Date(bulkLessonForm.start_date);

        // Use the start_date as the first lesson date (don't adjust to different day)
        // This ensures the first lesson happens on the date the user selected
        for (let i = 0; i < count; i++) {
          const lessonDate = new Date(startDate);
          lessonDate.setDate(lessonDate.getDate() + (i * 7)); // Add weeks

          // Format as YYYY-MM-DD for the date part
          const dateStr = lessonDate.toISOString().slice(0, 10);
          // Combine with time: YYYY-MM-DDTHH:MM (no timezone, backend will handle it)
          lessonDateStrings.push(`${dateStr}T${bulkLessonForm.start_time}:00`);
        }
      } else {
        // Daily or custom interval
        const startDate = new Date(bulkLessonForm.start_date);

        for (let i = 0; i < count; i++) {
          const lessonDate = new Date(startDate);
          lessonDate.setDate(lessonDate.getDate() + i); // Add days

          // Format as YYYY-MM-DD for the date part
          const dateStr = lessonDate.toISOString().slice(0, 10);
          // Combine with time: YYYY-MM-DDTHH:MM (no timezone, backend will handle it)
          lessonDateStrings.push(`${dateStr}T${bulkLessonForm.start_time}:00`);
        }
      }

      // Create lessons with proper Zoom integration
      const response = await fetch('/api/lms/lessons/bulk-smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: params.id,
          module_id: selectedModule.id,
          series_name: bulkLessonForm.series_name,
          lesson_dates: lessonDateStrings,
          title_pattern: bulkLessonForm.titlePattern,
          duration_minutes: parseInt(bulkLessonForm.duration_minutes),
          timezone: bulkLessonForm.timezone,
          starting_order: selectedModule.lessons?.length || 0,

          // Video meeting settings
          meeting_platform: bulkLessonForm.meeting_platform,

          // Daily.co settings
          create_daily_rooms: bulkLessonForm.create_daily,
          daily_room_pattern: bulkLessonForm.daily_room_pattern,

          // Zoom basic settings
          create_zoom_meetings: bulkLessonForm.create_zoom,
          zoom_topic_pattern: bulkLessonForm.zoom_topic_pattern,
          zoom_agenda: bulkLessonForm.zoom_agenda || null,
          zoom_recurring: bulkLessonForm.zoom_recurring && bulkLessonForm.is_recurring,
          recurrence_type: bulkLessonForm.recurrence_pattern, // weekly, daily, etc.

          // Zoom security settings
          zoom_passcode: bulkLessonForm.zoom_passcode || null,
          zoom_waiting_room: bulkLessonForm.zoom_waiting_room,
          zoom_join_before_host: bulkLessonForm.zoom_join_before_host,
          zoom_mute_upon_entry: bulkLessonForm.zoom_mute_upon_entry,
          zoom_require_authentication: bulkLessonForm.zoom_require_authentication,

          // Zoom video/audio settings
          zoom_host_video: bulkLessonForm.zoom_host_video,
          zoom_participant_video: bulkLessonForm.zoom_participant_video,
          zoom_audio: bulkLessonForm.zoom_audio,

          // Zoom recording settings
          zoom_auto_recording: bulkLessonForm.zoom_auto_recording,
          zoom_record_speaker_view: bulkLessonForm.zoom_record_speaker_view,
          zoom_recording_disclaimer: bulkLessonForm.zoom_recording_disclaimer,

          // Publish settings
          is_published: bulkLessonForm.is_published,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Reload course to get fresh data including zoom_sessions
        await loadCourse();

        setShowBulkLessonDialog(false);
        setBulkLessonForm({
          series_name: '',
          count: '5',
          titlePattern: 'Session {n}',
          is_recurring: true,
          recurrence_pattern: 'weekly',
          start_date: new Date().toISOString().slice(0, 10),
          start_time: '18:00',
          duration_minutes: '60',
          timezone: 'Asia/Jerusalem',
          weekly_days: [0],
          end_type: 'count',
          end_count: '5',
          end_date: '',
          create_zoom: true,
          zoom_topic_pattern: '{series_name} - Session {n}',
          zoom_agenda: '',
          zoom_recurring: true,
          // Reset Zoom security settings
          zoom_passcode: '',
          zoom_waiting_room: true,
          zoom_join_before_host: false,
          zoom_mute_upon_entry: false,
          zoom_require_authentication: false,
          // Reset Zoom video/audio settings
          zoom_host_video: true,
          zoom_participant_video: true,
          zoom_audio: 'both',
          // Reset Zoom recording settings
          zoom_auto_recording: 'none',
          zoom_record_speaker_view: false,
          zoom_recording_disclaimer: false,
          // Reset publish settings
          is_published: false,
          create_meeting: true,
          meeting_platform: 'zoom',
          create_daily: false,
          daily_room_pattern: '{series_name}-session-{n}',
        });

        const zoomMsg = bulkLessonForm.create_zoom ? ' with Zoom meetings' : '';
        showMessage('success', result.message || `${result.data.length} lessons created successfully${zoomMsg}`);
      } else {
        showMessage('error', result.error || t('lms.builder.lessons_create_failed', 'Failed to create lessons'), 5000);
      }
    } catch (error) {
      console.error('Failed to create lessons:', error);
      showMessage('error', t('lms.builder.lessons_create_failed', 'Failed to create lessons'), 5000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-6" dir={direction}>
        {/* Header */}
        <div className="border-b pb-4" dir={direction}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Left Section - Back Button & Title */}
            <div className="flex items-start gap-2 md:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/lms/courses')}
                className="shrink-0"
              >
                <ArrowLeft className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                <span className="hidden sm:inline">{t('lms.builder.back', 'Back')}</span>
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-bold truncate">{course?.title}</h1>
                  {course?.is_published ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 flex items-center gap-1.5 shrink-0">
                      <CheckCircle className="h-3 w-3" />
                      <span className="hidden sm:inline">{t('lms.builder.published', 'Published')}</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground shrink-0">
                      <span className="hidden sm:inline">{t('lms.builder.draft', 'Draft')}</span>
                    </Badge>
                  )}
                </div>
                <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                  {t('lms.builder.title', 'Course Builder')} - {t('lms.builder.subtitle', 'Drag & Drop Canvas')}
                </p>
              </div>
            </div>

            {/* Right Section - Action Buttons */}
            <div className={`flex gap-2 ${isRtl ? 'flex-row-reverse' : ''} w-full md:w-auto`}>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 md:flex-none"
                onClick={() => router.push(`/admin/lms/courses/${params.id}/grading/categories`)}
              >
                <Award className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                <span className="hidden sm:inline">{t('lms.builder.grading', 'Grading')}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 md:flex-none"
                onClick={() => setShowBridgeDialog(true)}
              >
                <Link2 className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                <span className="hidden sm:inline">{t('lms.course_detail.instructor_access_title', 'Instructor Access')}</span>
              </Button>
              <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                <Eye className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                <span className="hidden sm:inline">{t('lms.builder.preview', 'Preview')}</span>
              </Button>
              <Button
                size="sm"
                onClick={handlePublishCourse}
                disabled={saving}
                variant={course?.is_published ? 'outline' : 'default'}
                className="flex-1 md:flex-none"
              >
                {saving ? (
                  <>
                    <Loader2 className={`${isRtl ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
                    <span className="hidden sm:inline">{t('common.saving', 'Saving...')}</span>
                  </>
                ) : course?.is_published ? (
                  <>
                    <EyeOff className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                    <span className="hidden sm:inline">{t('lms.builder.unpublish_course', 'Unpublish')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                    <span className="hidden sm:inline">{t('lms.builder.publish_course', 'Publish')}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
            {/* Course Cover Image */}
            <CourseImageUploader
              courseId={params.id as string}
              currentImageUrl={courseImageUrl}
              onImageChange={setCourseImageUrl}
              t={t}
              isRtl={isRtl}
              direction={direction}
            />

            {/* Course Description */}
            {course?.description && (
              <Card>
                <CardHeader>
                  <CardTitle className={isRtl ? 'text-right' : ''}>
                    {t('lms.builder.course_description', 'Course Description')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-muted-foreground prose prose-sm max-w-none dark:prose-invert ${isRtl ? 'text-right' : 'text-left'}`}
                    dangerouslySetInnerHTML={{ __html: course.description }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Instructor Information */}
            {course?.instructor && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="h-4 w-4" />
                    <span>{t('user.courses.instructor', 'Instructor')}: {course.instructor.first_name} {course.instructor.last_name}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course Structure Section */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Module Builder with Drag & Drop */}
                <div className="flex-1 order-2 lg:order-1">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
                    <CardTitle className={isRtl ? 'text-right' : ''}>
                      {t('lms.builder.course_structure', 'Course Structure')}
                    </CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowBulkModuleDialog(true)}
                        className="flex-1 sm:flex-none"
                      >
                        <PlusCircle className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                        <span className="hidden sm:inline">{t('lms.builder.bulk_add_modules', 'Bulk Add')}</span>
                        <span className="sm:hidden">{t('lms.builder.bulk', 'Bulk')}</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingModule(null);
                          setModuleForm({
                            title: '',
                            description: '',
                            is_published: true,
                            is_optional: false,
                          });
                          setShowModuleDialog(true);
                        }}
                        className="flex-1 sm:flex-none"
                      >
                        <Plus className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                        <span className="hidden sm:inline">{t('lms.builder.add_module', 'Add Module')}</span>
                        <span className="sm:hidden">{t('lms.builder.add', 'Add')}</span>
                      </Button>
                    </div>
                  </div>
                  {/* Status Message */}
                  {statusMessage && (
                    <div className={`mt-3 p-3 rounded-md text-sm ${
                      statusMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                      statusMessage.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                      'bg-yellow-50 text-yellow-800 border border-yellow-200'
                    }`}>
                      {statusMessage.text}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="overflow-y-auto">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={modules.map((m) => m.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {modules.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium mb-2">
                              {t('lms.builder.no_modules', 'No modules yet')}
                            </p>
                            <p className="text-sm mb-4">
                              {t('lms.builder.start_building', 'Start building your course by adding modules')}
                            </p>
                            <Button onClick={() => {
                              setEditingModule(null);
                              setModuleForm({
                                title: '',
                                description: '',
                                is_published: true,
                                is_optional: false,
                              });
                              setShowModuleDialog(true);
                            }}>
                              <Plus className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                              {t('lms.builder.create_first_module', 'Create Your First Module')}
                            </Button>
                          </div>
                        ) : (
                          modules.map((module) => (
                            <SortableModule
                              key={module.id}
                              module={module}
                              onToggleExpand={() => toggleModuleExpansion(module.id)}
                              onAddLesson={() => {
                                setSelectedModule(module);
                                setEditingLesson(null);  // Clear any editing state
                                setLessonForm({          // Reset form to defaults
                                  title: '',
                                  description: '',
                                  start_time: new Date().toISOString().slice(0, 16),
                                  duration_minutes: '60',
                                  timezone: 'Asia/Jerusalem',
                                  is_published: true,
                                  create_meeting: false,
                                  meeting_platform: 'daily',
                                  create_zoom: false,
                                  zoom_topic: '',
                                  zoom_agenda: '',
                                  daily_room_name: '',
                                });
                                setShowLessonDialog(true);
                              }}
                              onBulkAddLessons={() => {
                                setSelectedModule(module);
                                // Initialize bulk form with date/time from single lesson form if available
                                if (lessonForm.start_time) {
                                  const datetime = new Date(lessonForm.start_time);
                                  const date = datetime.toISOString().slice(0, 10);
                                  const time = datetime.toTimeString().slice(0, 5);
                                  setBulkLessonForm({
                                    ...bulkLessonForm,
                                    start_date: date,
                                    start_time: time,
                                    duration_minutes: lessonForm.duration_minutes || '60',
                                    timezone: lessonForm.timezone || 'Asia/Jerusalem',
                                  });
                                }
                                setShowBulkLessonDialog(true);
                              }}
                              onEdit={() => {
                                setEditingModule(module);
                                setModuleForm({
                                  title: module.title,
                                  description: module.description || '',
                                  is_published: module.is_published,
                                  is_optional: module.is_optional,
                                });
                                setShowModuleDialog(true);
                              }}
                              onDelete={() => handleDeleteModule(module.id)}
                              onEditLesson={(lesson) => handleEditLesson(lesson, module.id)}
                              onDeleteLesson={(lessonId) => handleDeleteLesson(lessonId, module.id)}
                              onEditLessonContent={(lessonId, lessonTitle) => {
                                setSelectedLessonForContent({ lessonId, lessonTitle });
                                setShowLessonContentDialog(true);
                              }}
                              onOpenZoomMeeting={handleOpenZoomMeeting}
                              onCreateZoomMeeting={handleCreateZoomMeeting}
                              creatingZoomFor={creatingZoomFor}
                              t={t}
                              direction={direction}
                              isRtl={isRtl}
                            />
                          ))
                        )}
                      </div>
                    </SortableContext>
                    <DragOverlay>
                      {activeId ? (
                        <div className="bg-card border rounded-lg p-3 shadow-lg opacity-90">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            {modules.find((m) => m.id === activeId)?.title}
                          </div>
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </CardContent>
              </Card>
            </div>

            {/* Course Stats */}
            <div className="w-full lg:w-80 order-1 lg:order-2">
              <Card>
                <CardHeader>
                  <CardTitle className={isRtl ? 'text-right' : ''}>
                    {t('lms.builder.course_overview', 'Course Overview')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={isRtl ? 'text-right' : ''}>
                    <div className="text-2xl font-bold">{modules.length}</div>
                    <p className="text-sm text-muted-foreground">
                      {t('lms.builder.total_modules', 'Total Modules')}
                    </p>
                  </div>
                  <div className={isRtl ? 'text-right' : ''}>
                    <div className="text-2xl font-bold">
                      {modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('lms.builder.total_lessons', 'Total Lessons')}
                    </p>
                  </div>
                  <div className={isRtl ? 'text-right' : ''}>
                    <div className="text-2xl font-bold">
                      {modules.reduce((acc, m) => {
                        const moduleLessonsDuration = m.lessons?.reduce((lessonAcc, lesson) => lessonAcc + (lesson.duration || 0), 0) || 0;
                        return acc + moduleLessonsDuration;
                      }, 0)} {t('lms.builder.minutes_abbr', 'min')}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('lms.builder.total_duration', 'Total Duration')}
                    </p>
                  </div>
                  <div className={isRtl ? 'text-right' : ''}>
                    <div className="text-2xl font-bold">
                      {(() => {
                        const totalMinutes = modules.reduce((acc, m) => {
                          const moduleLessonsDuration = m.lessons?.reduce((lessonAcc, lesson) => lessonAcc + (lesson.duration || 0), 0) || 0;
                          return acc + moduleLessonsDuration;
                        }, 0);
                        const academicHours = Math.round((totalMinutes / 45) * 10) / 10;
                        return academicHours;
                      })()}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('lms.builder.academic_hours', 'Academic Hours')}
                    </p>
                  </div>
                  <div className={isRtl ? 'text-right' : ''}>
                    <div className="text-2xl font-bold">
                      {modules.filter((m) => m.is_published).length}/{modules.length}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('lms.builder.published_modules', 'Published Modules')}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="border-t pt-4 mt-4">
                    <h3 className={`font-semibold mb-3 ${isRtl ? 'text-right' : ''}`}>
                      {t('lms.builder.enrollment_stats', 'Enrollment Statistics')}
                    </h3>

                    {/* Total Enrollments */}
                    <div className={`mb-4 ${isRtl ? 'text-right' : ''}`}>
                      <div className="text-2xl font-bold">{enrollmentStats.totalEnrollments}</div>
                      <p className="text-sm text-muted-foreground">
                        {t('lms.builder.total_enrollments', 'Total Enrollments')}
                      </p>
                    </div>

                    {/* Lifetime Sales */}
                    <div className={`mb-4 ${isRtl ? 'text-right' : ''}`}>
                      <div className="text-2xl font-bold">
                        ₪{enrollmentStats.lifetimeSales.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t('lms.builder.lifetime_sales', 'Lifetime Sales')}
                      </p>
                    </div>

                    {/* Progress Stats */}
                    <div className="space-y-3">
                      <div className={isRtl ? 'text-right' : ''}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">
                            {t('lms.builder.completed', 'Completed')}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {enrollmentStats.completedCount} {t('lms.builder.students', 'students')}
                            </span>
                            <span className="text-sm font-semibold text-green-600">
                              {enrollmentStats.completedPercent}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${enrollmentStats.completedPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className={isRtl ? 'text-right' : ''}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">
                            {t('lms.builder.in_progress', 'In Progress')}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {enrollmentStats.inProgressCount} {t('lms.builder.students', 'students')}
                            </span>
                            <span className="text-sm font-semibold text-blue-600">
                              {enrollmentStats.inProgressPercent}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${enrollmentStats.inProgressPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className={isRtl ? 'text-right' : ''}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">
                            {t('lms.builder.not_started', 'Not Started')}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {enrollmentStats.notStartedCount} {t('lms.builder.students', 'students')}
                            </span>
                            <span className="text-sm font-semibold text-gray-600">
                              {enrollmentStats.notStartedPercent}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gray-600 h-2 rounded-full transition-all"
                            style={{ width: `${enrollmentStats.notStartedPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Course Materials Section */}
          <div className="w-full">
            <Card>
              <CardHeader>
                <CardTitle className={isRtl ? 'text-right' : ''}>
                  {t('lms.materials.tab_title', 'Course Materials')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CourseMaterials
                  courseId={params.id as string}
                  courseIsPublished={course?.is_active ?? false}
                  t={t}
                  isRtl={isRtl}
                  direction={direction}
                  onStatusMessage={(message) => showMessage(message.type, message.text)}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Module Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={(open) => {
        setShowModuleDialog(open);
        if (!open) {
          setEditingModule(null);
          setModuleForm({
            title: '',
            description: '',
            is_published: true,
            is_optional: false,
          });
        }
      }}>
        <DialogContent className="max-w-2xl" dir={direction}>
          <DialogHeader>
            <DialogTitle className={isRtl ? 'text-right' : ''}>
              {editingModule
                ? t('lms.builder.edit_module', 'Edit Module')
                : t('lms.builder.dialog_create_module', 'Create Module')
              }
            </DialogTitle>
            <DialogDescription className={isRtl ? 'text-right' : ''}>
              {editingModule
                ? t('lms.builder.dialog_edit_module_description', 'Update the module details')
                : t('lms.builder.dialog_module_description', 'Add a new module to organize your course content')
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className={`${isRtl ? 'text-right block' : ''} font-medium`}>
                {t('lms.builder.module_title', 'Module Title')} <span className="text-destructive">*</span>
              </Label>
              <Input
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                placeholder={t('lms.builder.module_title_placeholder', 'e.g., Introduction to HTML')}
                className={isRtl ? 'text-right' : ''}
                dir={direction}
              />
            </div>
            <div className="space-y-2">
              <Label className={`${isRtl ? 'text-right block' : ''} font-medium`}>
                {t('lms.builder.module_description', 'Description')}
              </Label>
              <RichTextEditor
                value={moduleForm.description}
                onChange={(value) => setModuleForm({ ...moduleForm, description: value })}
                placeholder={t('lms.builder.module_description_placeholder', 'Brief description of the module...')}
                dir={direction}
              />
            </div>
            <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
              <div className={`flex items-center justify-between gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-1 space-y-0.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <Label htmlFor="module-published" className="text-base font-medium cursor-pointer">
                    {t('lms.builder.published', 'Published')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('lms.builder.published_description', 'Make this module visible to students')}
                  </p>
                </div>
                <Switch
                  id="module-published"
                  checked={moduleForm.is_published}
                  onCheckedChange={(checked) =>
                    setModuleForm({ ...moduleForm, is_published: checked })
                  }
                />
              </div>
              <div className={`flex items-center justify-between gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-1 space-y-0.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <Label htmlFor="module-optional" className="text-base font-medium cursor-pointer">
                    {t('lms.builder.optional', 'Optional')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('lms.builder.optional_description', 'Students can skip this module')}
                  </p>
                </div>
                <Switch
                  id="module-optional"
                  checked={moduleForm.is_optional}
                  onCheckedChange={(checked) =>
                    setModuleForm({ ...moduleForm, is_optional: checked })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter className={`gap-3 flex-col-reverse sm:flex-row ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
            <Button variant="outline" onClick={() => setShowModuleDialog(false)} className="w-full sm:w-auto">
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleCreateModule} disabled={saving} className="w-full sm:w-auto">
              {saving
                ? t('common.saving', 'Saving...')
                : editingModule
                  ? t('lms.builder.update_module', 'Update Module')
                  : t('lms.builder.add_module', 'Add Module')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={direction}>
          <DialogHeader>
            <DialogTitle className={isRtl ? 'text-right' : 'text-left'}>
              {editingLesson
                ? t('lms.lesson.edit_title', 'Edit Lesson')
                : t('lms.lesson.add_to_module', 'Add Lesson to {module}').replace('{module}', selectedModule?.title || '')
              }
            </DialogTitle>
            <DialogDescription className={isRtl ? 'text-right' : 'text-left'}>
              {editingLesson
                ? t('lms.lesson.edit_description', 'Update lesson details')
                : t('lms.lesson.create_description', 'Create a new lesson within this module')
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Lesson Details */}
            <div className="space-y-4">
              <h3 className={`text-sm font-semibold ${isRtl ? 'text-right' : 'text-left'}`}>
                {t('lms.lesson.details_title', 'Lesson Details')}
              </h3>
              <div className="space-y-2">
                <Label className={`block font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t('lms.lesson.title_label', 'Lesson Title')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder={t('lms.lesson.title_placeholder', 'e.g., Introduction to Parenting')}
                  className={isRtl ? 'text-right' : 'text-left'}
                  dir={direction}
                />
              </div>
              <div className="space-y-2">
                <Label className={`block font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t('lms.lesson.description_label', 'Description')}
                </Label>
                <Textarea
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  rows={3}
                  placeholder={t('lms.lesson.description_placeholder', 'What will students learn in this lesson?')}
                  className={isRtl ? 'text-right' : 'text-left'}
                  dir={direction}
                />
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={`block font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t('lms.lesson.start_datetime_label', 'Start Date & Time')} <span className="text-destructive">*</span>
                      {editingLesson && editingLesson.zoom_meeting_id && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-normal mr-2">
                          ({t('lms.lesson.syncs_to_zoom', 'Syncs to Zoom')})
                        </span>
                      )}
                    </Label>
                    <Input
                      type="datetime-local"
                      value={lessonForm.start_time}
                      onChange={(e) => setLessonForm({ ...lessonForm, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={`block font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t('lms.lesson.duration_label', 'Duration (minutes)')}
                      {editingLesson && editingLesson.zoom_meeting_id && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-normal mr-2">
                          ({t('lms.lesson.syncs_to_zoom', 'Syncs to Zoom')})
                        </span>
                      )}
                    </Label>
                    <Input
                      type="number"
                      value={lessonForm.duration_minutes}
                      onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: e.target.value })}
                      placeholder="60"
                      className={isRtl ? 'text-right' : 'text-left'}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className={`block font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t('lms.lesson.timezone_label', 'Timezone')} <span className="text-destructive">*</span>
                    {editingLesson && editingLesson.zoom_meeting_id && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-normal mr-2">
                        ({t('lms.lesson.syncs_to_zoom', 'Syncs to Zoom')})
                      </span>
                    )}
                  </Label>
                  <select
                    value={lessonForm.timezone}
                    onChange={(e) => setLessonForm({ ...lessonForm, timezone: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="America/New_York">America/New York (EST/EDT)</option>
                    <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                    <option value="America/Denver">America/Denver (MST/MDT)</option>
                    <option value="America/Los_Angeles">America/Los Angeles (PST/PDT)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
                    <option value="Asia/Jerusalem">Asia/Jerusalem (IST)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                    <option value="Australia/Sydney">Australia/Sydney (AEDT/AEST)</option>
                    <option value="Pacific/Auckland">Pacific/Auckland (NZDT/NZST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isRtl ? (
                  <>
                    <Label className="cursor-pointer">{t('lms.lesson.publish_immediately', 'Publish Immediately')}</Label>
                    <Switch
                      checked={lessonForm.is_published}
                      onCheckedChange={(checked) =>
                        setLessonForm({ ...lessonForm, is_published: checked })
                      }
                    />
                  </>
                ) : (
                  <>
                    <Switch
                      checked={lessonForm.is_published}
                      onCheckedChange={(checked) =>
                        setLessonForm({ ...lessonForm, is_published: checked })
                      }
                    />
                    <Label className="cursor-pointer">{t('lms.lesson.publish_immediately', 'Publish Immediately')}</Label>
                  </>
                )}
              </div>
            </div>

            {/* Video Meeting Integration */}
            {!editingLesson && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className={`space-y-1 flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <h3 className="text-sm font-semibold">
                      {t('lms.lesson.meeting_integration_title', 'Video Meeting Integration')}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t('lms.lesson.meeting_integration_desc', 'Create a video meeting automatically for this lesson')}
                    </p>
                  </div>
                  <Switch
                    checked={lessonForm.create_meeting}
                    onCheckedChange={(checked) =>
                      setLessonForm({
                        ...lessonForm,
                        create_meeting: checked,
                        create_zoom: checked && lessonForm.meeting_platform === 'zoom',
                        zoom_topic: checked && lessonForm.meeting_platform === 'zoom' && !lessonForm.zoom_topic ? lessonForm.title : lessonForm.zoom_topic,
                        daily_room_name: checked && lessonForm.meeting_platform === 'daily' && !lessonForm.daily_room_name ? lessonForm.title : lessonForm.daily_room_name,
                      })
                    }
                  />
                </div>

              {lessonForm.create_meeting && (
                <>
                  {/* Platform Selection */}
                  <div className="space-y-2">
                    <Label className={`block font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t('lms.lesson.meeting_platform_label', 'Meeting Platform')} <span className="text-destructive">*</span>
                    </Label>
                    <select
                      value={lessonForm.meeting_platform}
                      onChange={(e) => setLessonForm({
                        ...lessonForm,
                        meeting_platform: e.target.value as 'zoom' | 'daily',
                        create_zoom: e.target.value === 'zoom',
                        daily_room_name: e.target.value === 'daily' && !lessonForm.daily_room_name ? lessonForm.title : lessonForm.daily_room_name,
                        zoom_topic: e.target.value === 'zoom' && !lessonForm.zoom_topic ? lessonForm.title : lessonForm.zoom_topic,
                      })}
                      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${isRtl ? 'text-right' : 'text-left'}`}
                      dir={direction}
                    >
                      <option value="daily">{t('lms.lesson.platform_daily', 'Daily.co')}</option>
                      <option value="zoom">{t('lms.lesson.platform_zoom', 'Zoom')}</option>
                    </select>
                  </div>

                  {/* Platform-specific settings */}
                  {lessonForm.meeting_platform === 'daily' && (
                    <div className={`space-y-4 p-4 rounded-lg bg-muted/30 ${isRtl ? 'border-r-2 border-primary/30' : 'border-l-2 border-primary/30'}`}>
                      <div className="space-y-2">
                        <Label className={`block font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                          {t('lms.lesson.daily_room_name_label', 'Daily.co Room Name')} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={lessonForm.daily_room_name}
                          onChange={(e) => setLessonForm({ ...lessonForm, daily_room_name: e.target.value })}
                          placeholder={t('lms.lesson.daily_room_name_placeholder', 'e.g., Introduction to Parenting - Session 1')}
                          className={isRtl ? 'text-right' : 'text-left'}
                          dir={direction}
                        />
                        <TokenInserter
                          tokens={lessonTokens}
                          onInsertToken={(token) =>
                            insertToken(lessonForm.daily_room_name, token, (value) =>
                              setLessonForm({ ...lessonForm, daily_room_name: value })
                            )
                          }
                          direction={direction}
                          isRtl={isRtl}
                          t={t}
                        />
                        <p className={`text-xs text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`}>
                          {t('lms.lesson.daily_room_name_help', 'This will be used to identify the room (only Latin characters, numbers, and hyphens)')}
                        </p>
                      </div>
                    </div>
                  )}

                  {lessonForm.meeting_platform === 'zoom' && (
                    <div className={`space-y-4 p-4 rounded-lg bg-muted/30 ${isRtl ? 'border-r-2 border-primary/30' : 'border-l-2 border-primary/30'}`}>
                      <div className="space-y-2">
                        <Label className={`block font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                          {t('lms.lesson.zoom_topic_label', 'Zoom Meeting Topic')} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={lessonForm.zoom_topic}
                          onChange={(e) => setLessonForm({ ...lessonForm, zoom_topic: e.target.value })}
                          placeholder={t('lms.lesson.zoom_topic_placeholder', 'e.g., Introduction to Parenting - Session 1')}
                          className={isRtl ? 'text-right' : 'text-left'}
                          dir={direction}
                        />
                        <TokenInserter
                          tokens={zoomTokens}
                          onInsertToken={(token) =>
                            insertToken(lessonForm.zoom_topic, token, (value) =>
                              setLessonForm({ ...lessonForm, zoom_topic: value })
                            )
                          }
                          direction={direction}
                          isRtl={isRtl}
                          t={t}
                        />
                        <p className={`text-xs text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`}>
                          {t('lms.lesson.zoom_topic_help', 'This will be the visible meeting name in Zoom')}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className={`block font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                          {t('lms.lesson.zoom_agenda_label', 'Zoom Meeting Agenda (Optional)')}
                        </Label>
                        <Textarea
                          value={lessonForm.zoom_agenda}
                          onChange={(e) => setLessonForm({ ...lessonForm, zoom_agenda: e.target.value })}
                          rows={2}
                          placeholder={t('lms.lesson.zoom_agenda_placeholder', 'e.g., Today we will cover basic parenting techniques...')}
                          className={isRtl ? 'text-right' : 'text-left'}
                          dir={direction}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
              </div>
            )}

            {/* Zoom editing when lesson has existing Zoom meeting */}
            {editingLesson && editingLesson.zoom_meeting_id && (
              <div className="space-y-3 border-t pt-4">
                <div className={`p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <div className="flex items-start gap-3">
                    <Video className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {t('lms.lesson.zoom_connected', 'Connected to Zoom')}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {t('lms.lesson.zoom_auto_sync', 'Changes to date, time and duration will automatically sync to the Zoom meeting')}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                          {t('lms.lesson.zoom_meeting_id', 'Meeting ID')}: {editingLesson.zoom_meeting_id}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
                          onClick={() => handleOpenZoomMeeting(editingLesson.id)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {t('lms.lesson.open_zoom', 'Open in Zoom')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className={`flex gap-3 flex-col-reverse sm:flex-row ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
            <Button variant="outline" onClick={() => setShowLessonDialog(false)} className="w-full sm:w-auto">
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleCreateLesson} disabled={saving} className="w-full sm:w-auto">
              {saving
                ? (editingLesson ? t('lms.lesson.updating', 'Updating...') : t('lms.lesson.creating', 'Creating...'))
                : (editingLesson ? t('lms.lesson.update_lesson', 'Update Lesson') : t('lms.lesson.add_lesson', 'Add Lesson'))
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Module Dialog */}
      <Dialog open={showBulkModuleDialog} onOpenChange={setShowBulkModuleDialog}>
        <DialogContent className="max-w-2xl" dir={direction}>
          <DialogHeader>
            <DialogTitle className={isRtl ? 'text-right' : ''}>
              {t('lms.builder.dialog_bulk_create', 'Bulk Create Modules')}
            </DialogTitle>
            <DialogDescription className={isRtl ? 'text-right' : ''}>
              {t('lms.builder.dialog_bulk_description', 'Create multiple modules at once to quickly structure your course')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className={`${isRtl ? 'text-right block' : ''} font-medium`}>
                {t('lms.builder.number_of_modules', 'Number of Modules')} <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={bulkModuleForm.count}
                onChange={(e) => setBulkModuleForm({ ...bulkModuleForm, count: e.target.value })}
                className={isRtl ? 'text-right' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label className={`${isRtl ? 'text-right block' : ''} font-medium`}>
                {t('lms.builder.title_pattern', 'Title Pattern')} <span className="text-destructive">*</span>
              </Label>
              <Input
                value={bulkModuleForm.titlePattern}
                onChange={(e) =>
                  setBulkModuleForm({ ...bulkModuleForm, titlePattern: e.target.value })
                }
                placeholder="Module {n}"
                className={isRtl ? 'text-right' : ''}
              />
              <p className={`text-sm text-muted-foreground mt-1 ${isRtl ? 'text-right' : ''}`}>
                {t('lms.builder.use_n_for_number', 'Use {n} for the module number')}
              </p>
            </div>
            <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
              <div className={`flex items-center justify-between gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-1 space-y-0.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <Label htmlFor="bulk-module-published" className="text-base font-medium cursor-pointer">
                    {t('lms.builder.published', 'Published')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('lms.builder.published_description', 'Make this module visible to students')}
                  </p>
                </div>
                <Switch
                  id="bulk-module-published"
                  checked={bulkModuleForm.is_published}
                  onCheckedChange={(checked) =>
                    setBulkModuleForm({ ...bulkModuleForm, is_published: checked })
                  }
                />
              </div>
              <div className={`flex items-center justify-between gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-1 space-y-0.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <Label htmlFor="bulk-module-optional" className="text-base font-medium cursor-pointer">
                    {t('lms.builder.optional', 'Optional')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('lms.builder.optional_description', 'Students can skip this module')}
                  </p>
                </div>
                <Switch
                  id="bulk-module-optional"
                  checked={bulkModuleForm.is_optional}
                  onCheckedChange={(checked) =>
                    setBulkModuleForm({ ...bulkModuleForm, is_optional: checked })
                  }
                />
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <p className={`text-sm font-semibold ${isRtl ? 'text-right' : ''}`}>
                {t('lms.builder.preview', 'Preview')}:
              </p>
              <div className={`text-sm space-y-1.5 ${isRtl ? 'text-right' : ''}`}>
                {Array.from({ length: Math.min(3, parseInt(bulkModuleForm.count) || 0) }).map(
                  (_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{bulkModuleForm.titlePattern.replace('{n}', (i + 1).toString())}</span>
                    </div>
                  )
                )}
                {parseInt(bulkModuleForm.count) > 3 && (
                  <div className="text-muted-foreground italic">
                    {t('lms.builder.and_more', '...and more')}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className={`gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Button variant="outline" onClick={() => setShowBulkModuleDialog(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleBulkCreateModules}>
              {t('lms.builder.dialog_create_count_modules', 'Create {count} Modules').replace('{count}', bulkModuleForm.count)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Lesson Dialog - Smart Scheduling */}
      <Dialog open={showBulkLessonDialog} onOpenChange={setShowBulkLessonDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={direction}>
          <DialogHeader>
            <DialogTitle className={isRtl ? 'text-right' : 'text-left'}>
              {t('lms.lesson.bulk_create_title', 'Create Series of Lessons for {module}').replace('{module}', selectedModule?.title || '')}
            </DialogTitle>
            <DialogDescription className={isRtl ? 'text-right' : 'text-left'}>
              {t('lms.lesson.bulk_create_description', 'Set up a recurring series of lessons with smart scheduling and optional Zoom integration')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Series Information */}
            <div className="space-y-4">
              <h3 className={`text-sm font-semibold ${isRtl ? 'text-right' : 'text-left'}`}>
                {t('lms.lesson.series_info_title', 'Series Information')}
              </h3>
              <div className="space-y-2">
                <Label className={`block font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t('lms.lesson.series_name_label', 'Series Name')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={bulkLessonForm.series_name}
                  onChange={(e) => setBulkLessonForm({ ...bulkLessonForm, series_name: e.target.value })}
                  placeholder={t('lms.lesson.series_name_placeholder', 'e.g., Introduction to Parenting')}
                  className={isRtl ? 'text-right' : 'text-left'}
                  dir={direction}
                />
                <p className={`text-xs text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t('lms.lesson.series_name_help', 'This will be used to name lessons and Zoom meetings')}
                </p>
              </div>
              <div className="space-y-2">
                <Label className={`block font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t('lms.lesson.title_pattern_label', 'Lesson Title Pattern')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={bulkLessonForm.titlePattern}
                  onChange={(e) => setBulkLessonForm({ ...bulkLessonForm, titlePattern: e.target.value })}
                  placeholder={t('lms.lesson.title_pattern_placeholder', 'Session {n}')}
                  className={isRtl ? 'text-right' : 'text-left'}
                  dir={direction}
                />
                <TokenInserter
                  tokens={lessonTokens}
                  onInsertToken={(token) =>
                    insertToken(bulkLessonForm.titlePattern, token, (value) =>
                      setBulkLessonForm({ ...bulkLessonForm, titlePattern: value })
                    )
                  }
                  direction={direction}
                  isRtl={isRtl}
                  t={t}
                />
              </div>
            </div>

            {/* Schedule Settings */}
            <div className="space-y-4 border-t pt-4">
              <h3 className={`text-sm font-semibold ${isRtl ? 'text-right' : 'text-left'}`}>
                {t('lms.lesson.schedule_settings_title', 'Schedule Settings')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={`block font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t('lms.lesson.start_date_label', 'Start Date')}
                  </Label>
                  <Input
                    type="date"
                    value={bulkLessonForm.start_date}
                    onChange={(e) => setBulkLessonForm({ ...bulkLessonForm, start_date: e.target.value })}
                    className={isRtl ? 'text-right' : 'text-left'}
                    dir={direction}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={`block font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t('lms.lesson.time_of_day_label', 'Time of Day')}
                  </Label>
                  <Input
                    type="time"
                    value={bulkLessonForm.start_time}
                    onChange={(e) => setBulkLessonForm({ ...bulkLessonForm, start_time: e.target.value })}
                    className={isRtl ? 'text-right' : 'text-left'}
                    dir={direction}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={`block font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t('lms.lesson.duration_minutes_label', 'Duration (minutes)')}
                  </Label>
                  <Input
                    type="number"
                    value={bulkLessonForm.duration_minutes}
                    onChange={(e) => setBulkLessonForm({ ...bulkLessonForm, duration_minutes: e.target.value })}
                    placeholder="60"
                    className={isRtl ? 'text-right' : 'text-left'}
                    dir={direction}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={`block font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t('lms.lesson.timezone_label', 'Timezone')}
                  </Label>
                  <select
                    value={bulkLessonForm.timezone}
                    onChange={(e) => setBulkLessonForm({ ...bulkLessonForm, timezone: e.target.value })}
                    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${isRtl ? 'text-right' : 'text-left'}`}
                    dir={direction}
                  >
                    <optgroup label={t('lms.lesson.timezone_group_common', 'Common')}>
                      <option value="Asia/Jerusalem">{t('lms.lesson.timezone_jerusalem', 'Jerusalem (GMT+2/+3)')}</option>
                      <option value="America/New_York">{t('lms.lesson.timezone_newyork', 'New York (GMT-5/-4)')}</option>
                      <option value="America/Los_Angeles">{t('lms.lesson.timezone_losangeles', 'Los Angeles (GMT-8/-7)')}</option>
                      <option value="Europe/London">{t('lms.lesson.timezone_london', 'London (GMT+0/+1)')}</option>
                    </optgroup>
                    <optgroup label={t('lms.lesson.timezone_group_americas', 'Americas')}>
                      <option value="America/New_York">New York (EST/EDT GMT-5/-4)</option>
                      <option value="America/Chicago">Chicago (CST/CDT GMT-6/-5)</option>
                      <option value="America/Denver">Denver (MST/MDT GMT-7/-6)</option>
                      <option value="America/Los_Angeles">Los Angeles (PST/PDT GMT-8/-7)</option>
                      <option value="America/Toronto">Toronto (EST/EDT GMT-5/-4)</option>
                      <option value="America/Mexico_City">Mexico City (CST GMT-6)</option>
                      <option value="America/Sao_Paulo">São Paulo (BRT GMT-3)</option>
                      <option value="America/Buenos_Aires">Buenos Aires (ART GMT-3)</option>
                    </optgroup>
                    <optgroup label={t('lms.lesson.timezone_group_europe', 'Europe')}>
                      <option value="Europe/London">London (GMT/BST GMT+0/+1)</option>
                      <option value="Europe/Paris">Paris (CET/CEST GMT+1/+2)</option>
                      <option value="Europe/Berlin">Berlin (CET/CEST GMT+1/+2)</option>
                      <option value="Europe/Rome">Rome (CET/CEST GMT+1/+2)</option>
                      <option value="Europe/Madrid">Madrid (CET/CEST GMT+1/+2)</option>
                      <option value="Europe/Amsterdam">Amsterdam (CET/CEST GMT+1/+2)</option>
                      <option value="Europe/Brussels">Brussels (CET/CEST GMT+1/+2)</option>
                      <option value="Europe/Zurich">Zurich (CET/CEST GMT+1/+2)</option>
                      <option value="Europe/Vienna">Vienna (CET/CEST GMT+1/+2)</option>
                      <option value="Europe/Athens">Athens (EET/EEST GMT+2/+3)</option>
                      <option value="Europe/Moscow">Moscow (MSK GMT+3)</option>
                    </optgroup>
                    <optgroup label={t('lms.lesson.timezone_group_asia', 'Asia')}>
                      <option value="Asia/Jerusalem">Jerusalem (IST GMT+2/+3)</option>
                      <option value="Asia/Dubai">Dubai (GST GMT+4)</option>
                      <option value="Asia/Kolkata">Mumbai/Kolkata (IST GMT+5:30)</option>
                      <option value="Asia/Bangkok">Bangkok (ICT GMT+7)</option>
                      <option value="Asia/Singapore">Singapore (SGT GMT+8)</option>
                      <option value="Asia/Hong_Kong">Hong Kong (HKT GMT+8)</option>
                      <option value="Asia/Shanghai">Shanghai (CST GMT+8)</option>
                      <option value="Asia/Tokyo">Tokyo (JST GMT+9)</option>
                      <option value="Asia/Seoul">Seoul (KST GMT+9)</option>
                    </optgroup>
                    <optgroup label={t('lms.lesson.timezone_group_pacific', 'Pacific')}>
                      <option value="Australia/Sydney">Sydney (AEDT/AEST GMT+10/+11)</option>
                      <option value="Australia/Melbourne">Melbourne (AEDT/AEST GMT+10/+11)</option>
                      <option value="Australia/Perth">Perth (AWST GMT+8)</option>
                      <option value="Pacific/Auckland">Auckland (NZDT/NZST GMT+12/+13)</option>
                    </optgroup>
                    <optgroup label={t('lms.lesson.timezone_group_africa', 'Africa')}>
                      <option value="Africa/Cairo">Cairo (EET GMT+2)</option>
                      <option value="Africa/Johannesburg">Johannesburg (SAST GMT+2)</option>
                      <option value="Africa/Lagos">Lagos (WAT GMT+1)</option>
                    </optgroup>
                    <optgroup label={t('lms.lesson.timezone_group_other', 'Other')}>
                      <option value="UTC">UTC (GMT+0)</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className={`block font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t('lms.lesson.recurrence_pattern_label', 'Recurrence Pattern')}
                </Label>
                <select
                  value={bulkLessonForm.recurrence_pattern}
                  onChange={(e) => setBulkLessonForm({ ...bulkLessonForm, recurrence_pattern: e.target.value as any })}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${isRtl ? 'text-right' : 'text-left'}`}
                  dir={direction}
                >
                  <option value="weekly">{t('lms.lesson.recurrence_weekly', 'Weekly')}</option>
                  <option value="daily">{t('lms.lesson.recurrence_daily', 'Daily')}</option>
                </select>
              </div>

              {bulkLessonForm.recurrence_pattern === 'weekly' && (
                <div className="space-y-2">
                  <Label className={`block font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t('lms.lesson.day_of_week_label', 'Day of Week')}
                  </Label>
                  <select
                    value={bulkLessonForm.weekly_days[0]}
                    onChange={(e) => setBulkLessonForm({ ...bulkLessonForm, weekly_days: [parseInt(e.target.value)] })}
                    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${isRtl ? 'text-right' : 'text-left'}`}
                    dir={direction}
                  >
                    <option value="0">{t('lms.lesson.day_sunday', 'Sunday')}</option>
                    <option value="1">{t('lms.lesson.day_monday', 'Monday')}</option>
                    <option value="2">{t('lms.lesson.day_tuesday', 'Tuesday')}</option>
                    <option value="3">{t('lms.lesson.day_wednesday', 'Wednesday')}</option>
                    <option value="4">{t('lms.lesson.day_thursday', 'Thursday')}</option>
                    <option value="5">{t('lms.lesson.day_friday', 'Friday')}</option>
                    <option value="6">{t('lms.lesson.day_saturday', 'Saturday')}</option>
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label className={`block font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t('lms.lesson.number_of_sessions_label', 'Number of Sessions')}
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={bulkLessonForm.end_count}
                  onChange={(e) => setBulkLessonForm({ ...bulkLessonForm, end_count: e.target.value })}
                  className={isRtl ? 'text-right' : 'text-left'}
                  dir={direction}
                />
              </div>
            </div>

            {/* Video Meeting Integration */}
            <div className="space-y-4 border-t pt-4" dir={direction}>
              <div className={`flex items-start gap-4 ${isRtl ? 'flex-row-reverse justify-start' : 'justify-between'}`} dir={direction}>
                <div className={`space-y-1 flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <h3 className="text-sm font-semibold">
                    {t('lms.lesson.bulk_meeting_title', 'Video Meeting Integration')}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t('lms.lesson.bulk_meeting_desc', 'Automatically create video meetings for each lesson')}
                  </p>
                </div>
                <Switch
                  checked={bulkLessonForm.create_meeting}
                  onCheckedChange={(checked) =>
                    setBulkLessonForm({
                      ...bulkLessonForm,
                      create_meeting: checked,
                      create_zoom: checked && bulkLessonForm.meeting_platform === 'zoom',
                      create_daily: checked && bulkLessonForm.meeting_platform === 'daily',
                      zoom_topic_pattern: checked && bulkLessonForm.meeting_platform === 'zoom' && !bulkLessonForm.zoom_topic_pattern
                        ? '{series_name} - Session {n}'
                        : bulkLessonForm.zoom_topic_pattern,
                      daily_room_pattern: checked && bulkLessonForm.meeting_platform === 'daily' && !bulkLessonForm.daily_room_pattern
                        ? '{series_name}-session-{n}'
                        : bulkLessonForm.daily_room_pattern,
                    })
                  }
                />
              </div>

              {bulkLessonForm.create_meeting && (
                <>
                  {/* Platform Selection */}
                  <div className="space-y-2">
                    <Label className={`block font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t('lms.lesson.meeting_platform_label', 'Meeting Platform')} <span className="text-destructive">*</span>
                    </Label>
                    <select
                      value={bulkLessonForm.meeting_platform}
                      onChange={(e) => setBulkLessonForm({
                        ...bulkLessonForm,
                        meeting_platform: e.target.value as 'zoom' | 'daily',
                        create_zoom: e.target.value === 'zoom',
                        create_daily: e.target.value === 'daily',
                      })}
                      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${isRtl ? 'text-right' : 'text-left'}`}
                      dir={direction}
                    >
                      <option value="zoom">{t('lms.lesson.platform_zoom', 'Zoom')}</option>
                      <option value="daily">{t('lms.lesson.platform_daily', 'Daily.co')}</option>
                    </select>
                  </div>

                  {/* Daily.co Settings */}
                  {bulkLessonForm.meeting_platform === 'daily' && (
                    <div className={`space-y-4 p-4 rounded-lg bg-muted/30 ${isRtl ? 'border-r-2 border-primary/30' : 'border-l-2 border-primary/30'}`} dir={direction}>
                      <div className="space-y-2">
                        <Label className={`block font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                          {t('lms.lesson.daily_room_pattern_label', 'Daily.co Room Name Pattern')} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={bulkLessonForm.daily_room_pattern}
                          onChange={(e) => setBulkLessonForm({ ...bulkLessonForm, daily_room_pattern: e.target.value })}
                          placeholder={t('lms.lesson.daily_room_pattern_placeholder', '{series_name}-session-{n}')}
                          className={isRtl ? 'text-right' : 'text-left'}
                          dir={direction}
                        />
                        <TokenInserter
                          tokens={lessonTokens}
                          onInsertToken={(token) =>
                            insertToken(bulkLessonForm.daily_room_pattern, token, (value) =>
                              setBulkLessonForm({ ...bulkLessonForm, daily_room_pattern: value })
                            )
                          }
                          direction={direction}
                          isRtl={isRtl}
                          t={t}
                        />
                        <p className={`text-xs text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`}>
                          {t('lms.lesson.daily_room_pattern_help', 'Use tokens to create unique room names. Only Latin characters, numbers, and hyphens allowed.')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Zoom Settings */}
                  {bulkLessonForm.meeting_platform === 'zoom' && (
                <div className={`space-y-4 p-4 rounded-lg bg-muted/30 ${isRtl ? 'border-r-2 border-primary/30' : 'border-l-2 border-primary/30'}`} dir={direction}>
                  <div className="space-y-2">
                    <Label className={`block font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t('lms.lesson.zoom_name_pattern_label', 'Zoom Meeting Name Pattern')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={bulkLessonForm.zoom_topic_pattern}
                      onChange={(e) => setBulkLessonForm({ ...bulkLessonForm, zoom_topic_pattern: e.target.value })}
                      placeholder={t('lms.lesson.zoom_name_pattern_placeholder', '{series_name} - Session {n}')}
                      className={isRtl ? 'text-right' : 'text-left'}
                      dir={direction}
                    />
                    <TokenInserter
                      tokens={zoomTokens}
                      onInsertToken={(token) =>
                        insertToken(bulkLessonForm.zoom_topic_pattern, token, (value) =>
                          setBulkLessonForm({ ...bulkLessonForm, zoom_topic_pattern: value })
                        )
                      }
                      direction={direction}
                      isRtl={isRtl}
                      t={t}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={`block font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t('lms.lesson.zoom_agenda_common_label', 'Zoom Meeting Agenda (Optional)')}
                    </Label>
                    <Textarea
                      value={bulkLessonForm.zoom_agenda}
                      onChange={(e) => setBulkLessonForm({ ...bulkLessonForm, zoom_agenda: e.target.value })}
                      rows={2}
                      placeholder={t('lms.lesson.zoom_agenda_common_placeholder', 'Common agenda for all sessions...')}
                      className={isRtl ? 'text-right' : 'text-left'}
                      dir={direction}
                    />
                  </div>
                  <div className={`flex items-center ${isRtl ? 'gap-2 flex-row-reverse' : 'gap-2'}`} dir={direction}>
                    <Switch
                      checked={bulkLessonForm.zoom_recurring}
                      onCheckedChange={(checked) =>
                        setBulkLessonForm({ ...bulkLessonForm, zoom_recurring: checked })
                      }
                    />
                    <Label className={`cursor-pointer text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t('lms.lesson.zoom_recurring_option', 'Create as recurring Zoom meeting (all sessions linked)')}
                    </Label>
                  </div>

                  {/* Security Settings */}
                  <div className="space-y-3 pt-3 border-t border-border/50" dir={direction}>
                    <h4 className={`text-sm font-semibold text-foreground ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t('lms.zoom.security_settings_title', 'Security Settings')}
                    </h4>

                    <div className="space-y-2">
                      <Label className={`block text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
                        {t('lms.zoom.passcode_label', 'Meeting Passcode (Optional)')}
                      </Label>
                      <Input
                        type="text"
                        value={bulkLessonForm.zoom_passcode}
                        onChange={(e) => setBulkLessonForm({ ...bulkLessonForm, zoom_passcode: e.target.value })}
                        placeholder={t('lms.zoom.passcode_placeholder', 'Enter passcode...')}
                        className={isRtl ? 'text-right' : 'text-left'}
                        dir={direction}
                        maxLength={10}
                      />
                      <p className={`text-xs text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`}>
                        {t('lms.zoom.passcode_help', 'Passcode to prevent unauthorized access (6-10 characters)')}
                      </p>
                    </div>

                    <div className={`flex items-center ${isRtl ? 'gap-2 flex-row-reverse' : 'gap-2'}`} dir={direction}>
                      <Switch
                        checked={bulkLessonForm.zoom_waiting_room}
                        onCheckedChange={(checked) =>
                          setBulkLessonForm({ ...bulkLessonForm, zoom_waiting_room: checked })
                        }
                      />
                      <Label className={`cursor-pointer text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
                        {t('lms.zoom.waiting_room_label', 'Waiting Room')}
                      </Label>
                    </div>

                    <div className={`flex items-center ${isRtl ? 'gap-2 flex-row-reverse' : 'gap-2'}`} dir={direction}>
                      <Switch
                        checked={bulkLessonForm.zoom_join_before_host}
                        onCheckedChange={(checked) =>
                          setBulkLessonForm({ ...bulkLessonForm, zoom_join_before_host: checked })
                        }
                      />
                      <Label className={`cursor-pointer text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
                        {t('lms.zoom.join_before_host_label', 'Allow participants to join before host')}
                      </Label>
                    </div>

                    <div className={`flex items-center ${isRtl ? 'gap-2 flex-row-reverse' : 'gap-2'}`} dir={direction}>
                      <Switch
                        checked={bulkLessonForm.zoom_mute_upon_entry}
                        onCheckedChange={(checked) =>
                          setBulkLessonForm({ ...bulkLessonForm, zoom_mute_upon_entry: checked })
                        }
                      />
                      <Label className={`cursor-pointer text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
                        {t('lms.zoom.mute_upon_entry_label', 'Mute participants upon entry')}
                      </Label>
                    </div>

                    <div className={`flex items-center ${isRtl ? 'gap-2 flex-row-reverse' : 'gap-2'}`} dir={direction}>
                      <Switch
                        checked={bulkLessonForm.zoom_require_authentication}
                        onCheckedChange={(checked) =>
                          setBulkLessonForm({ ...bulkLessonForm, zoom_require_authentication: checked })
                        }
                      />
                      <Label className={`cursor-pointer text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
                        {t('lms.zoom.require_authentication_label', 'Require authentication to join')}
                      </Label>
                    </div>
                  </div>

                  {/* Video/Audio Settings */}
                  <div className="space-y-3 pt-3 border-t border-border/50" dir={direction}>
                    <h4 className={`text-sm font-semibold text-foreground ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t('lms.zoom.video_audio_settings_title', 'Video & Audio Settings')}
                    </h4>

                    <div className={`flex items-center ${isRtl ? 'gap-2 flex-row-reverse' : 'gap-2'}`} dir={direction}>
                      <Switch
                        checked={bulkLessonForm.zoom_host_video}
                        onCheckedChange={(checked) =>
                          setBulkLessonForm({ ...bulkLessonForm, zoom_host_video: checked })
                        }
                      />
                      <Label className={`cursor-pointer text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
                        {t('lms.zoom.host_video_label', 'Start host video on entry')}
                      </Label>
                    </div>

                    <div className={`flex items-center ${isRtl ? 'gap-2 flex-row-reverse' : 'gap-2'}`} dir={direction}>
                      <Switch
                        checked={bulkLessonForm.zoom_participant_video}
                        onCheckedChange={(checked) =>
                          setBulkLessonForm({ ...bulkLessonForm, zoom_participant_video: checked })
                        }
                      />
                      <Label className={`cursor-pointer text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
                        {t('lms.zoom.participant_video_label', 'Start participant video on entry')}
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label className={`block text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
                        {t('lms.zoom.audio_options_label', 'Audio Options')}
                      </Label>
                      <select
                        value={bulkLessonForm.zoom_audio}
                        onChange={(e) => setBulkLessonForm({ ...bulkLessonForm, zoom_audio: e.target.value as 'both' | 'telephony' | 'voip' })}
                        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${isRtl ? 'text-right' : 'text-left'}`}
                        dir={direction}
                      >
                        <option value="both">{t('lms.zoom.audio_both', 'Phone and Computer')}</option>
                        <option value="telephony">{t('lms.zoom.audio_telephony', 'Phone Only')}</option>
                        <option value="voip">{t('lms.zoom.audio_voip', 'Computer Only')}</option>
                      </select>
                    </div>
                  </div>

                  {/* Recording Settings */}
                  <div className="space-y-3 pt-3 border-t border-border/50" dir={direction}>
                    <h4 className={`text-sm font-semibold text-foreground ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t('lms.zoom.recording_settings_title', 'Recording Settings')}
                    </h4>

                    <div className="space-y-2">
                      <Label className={`block text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
                        {t('lms.zoom.auto_recording_label', 'Automatic Recording')}
                      </Label>
                      <select
                        value={bulkLessonForm.zoom_auto_recording}
                        onChange={(e) => setBulkLessonForm({ ...bulkLessonForm, zoom_auto_recording: e.target.value as 'none' | 'local' | 'cloud' })}
                        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${isRtl ? 'text-right' : 'text-left'}`}
                        dir={direction}
                      >
                        <option value="none">{t('lms.zoom.recording_none', 'No Recording')}</option>
                        <option value="local">{t('lms.zoom.recording_local', 'Local Recording')}</option>
                        <option value="cloud">{t('lms.zoom.recording_cloud', 'Cloud Recording')}</option>
                      </select>
                    </div>

                    <div className={`flex items-center ${isRtl ? 'gap-2 flex-row-reverse' : 'gap-2'}`} dir={direction}>
                      <Switch
                        checked={bulkLessonForm.zoom_record_speaker_view}
                        onCheckedChange={(checked) =>
                          setBulkLessonForm({ ...bulkLessonForm, zoom_record_speaker_view: checked })
                        }
                      />
                      <Label className={`cursor-pointer text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
                        {t('lms.zoom.record_speaker_view_label', 'Record active speaker with screen share')}
                      </Label>
                    </div>

                    <div className={`flex items-center ${isRtl ? 'gap-2 flex-row-reverse' : 'gap-2'}`} dir={direction}>
                      <Switch
                        checked={bulkLessonForm.zoom_recording_disclaimer}
                        onCheckedChange={(checked) =>
                          setBulkLessonForm({ ...bulkLessonForm, zoom_recording_disclaimer: checked })
                        }
                      />
                      <Label className={`cursor-pointer text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
                        {t('lms.zoom.recording_disclaimer_label', 'Show recording disclaimer')}
                      </Label>
                    </div>
                  </div>
                </div>
                  )}
                </>
              )}
            </div>

            {/* Publish Settings */}
            <div className="space-y-4 border-t pt-4" dir={direction}>
              <div className={`flex items-start gap-4 ${isRtl ? 'flex-row-reverse justify-start' : 'justify-between'}`} dir={direction}>
                <div className={`space-y-1 flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <h3 className="text-sm font-semibold">
                    {t('lms.lesson.publish_title', 'Publish Lessons')}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t('lms.lesson.publish_desc', 'Make lessons visible to students immediately')}
                  </p>
                </div>
                <Switch
                  checked={bulkLessonForm.is_published}
                  onCheckedChange={(checked) =>
                    setBulkLessonForm({ ...bulkLessonForm, is_published: checked })
                  }
                />
              </div>
            </div>

            {/* Preview */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className={`text-sm font-semibold ${isRtl ? 'text-right' : 'text-left'}`}>
                {t('lms.lesson.preview_title', 'Preview')}
              </h4>
              <p className={`text-xs text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`}>
                {t('lms.lesson.preview_text', 'This will create {count} lessons {pattern} starting from {date} at {time}{meeting}')
                  .replace('{count}', bulkLessonForm.end_count)
                  .replace('{pattern}', bulkLessonForm.recurrence_pattern === 'weekly'
                    ? t('lms.lesson.preview_weekly', 'weekly')
                    : t('lms.lesson.preview_daily', 'daily'))
                  .replace('{date}', bulkLessonForm.start_date)
                  .replace('{time}', bulkLessonForm.start_time)
                  .replace('{meeting}', bulkLessonForm.create_meeting
                    ? (bulkLessonForm.meeting_platform === 'daily'
                        ? t('lms.lesson.preview_with_daily', ', each with a Daily.co room')
                        : t('lms.lesson.preview_with_zoom', ', each with a Zoom meeting'))
                    : '')}
              </p>
            </div>
          </div>

          <DialogFooter className={`gap-3 flex-col-reverse sm:flex-row ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
            <Button variant="outline" onClick={() => setShowBulkLessonDialog(false)} className="w-full sm:w-auto">
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleBulkCreateLessons} disabled={saving} className="w-full sm:w-auto">
              {saving ? t('lms.lesson.bulk_creating', 'Creating...') : t('lms.lesson.bulk_create_button', 'Create {count} Lessons').replace('{count}', bulkLessonForm.end_count)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Module Confirmation Dialog */}
      <Dialog open={showDeleteModuleDialog} onOpenChange={setShowDeleteModuleDialog}>
        <DialogContent dir={direction}>
          <DialogHeader>
            <DialogTitle className={isRtl ? 'text-right' : ''}>
              {t('lms.module.delete_title', 'Delete Module')}
            </DialogTitle>
            <DialogDescription className={isRtl ? 'text-right' : ''}>
              {t('lms.module.delete_confirmation', 'Are you sure you want to delete this module and all its lessons? This action cannot be undone.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className={`gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Button variant="outline" onClick={() => setShowDeleteModuleDialog(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDeleteModule}>
              {t('common.delete', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Content Editor Dialog */}
      <Dialog open={showLessonContentDialog} onOpenChange={setShowLessonContentDialog}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-5xl max-h-[90vh] overflow-y-auto" dir={direction}>
          <DialogHeader>
            <DialogTitle className={isRtl ? 'text-right' : ''}>
              {t('lms.topics.edit_content', 'Edit Content')}: {selectedLessonForContent?.lessonTitle}
            </DialogTitle>
            <DialogDescription className={isRtl ? 'text-right' : ''}>
              {t('lms.topics.edit_content_description', 'Add and organize content blocks for this lesson')}
            </DialogDescription>
          </DialogHeader>

          {selectedLessonForContent && (
            <LessonTopicsBuilder
              lessonId={selectedLessonForContent.lessonId}
              lessonTitle={selectedLessonForContent.lessonTitle}
              t={t}
              isRtl={isRtl}
              direction={direction}
              onClose={() => setShowLessonContentDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Lesson Confirmation Dialog */}
      <Dialog open={showDeleteLessonDialog} onOpenChange={setShowDeleteLessonDialog}>
        <DialogContent dir={direction}>
          <DialogHeader>
            <DialogTitle className={isRtl ? 'text-right' : ''}>
              {t('lms.lesson.delete_title', 'Delete Lesson')}
            </DialogTitle>
            <DialogDescription className={isRtl ? 'text-right' : ''}>
              {t('lms.lesson.delete_confirmation', 'Are you sure you want to delete this lesson? This action cannot be undone.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className={`gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Button variant="outline" onClick={() => setShowDeleteLessonDialog(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDeleteLesson}>
              {t('common.delete', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bridge Link Dialog */}
      <Dialog open={showBridgeDialog} onOpenChange={setShowBridgeDialog}>
        <DialogContent className="max-w-2xl" dir={direction}>
          <DialogHeader>
            <DialogTitle className={isRtl ? 'text-right' : ''}>
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                {t('lms.course_detail.instructor_access_title', 'Instructor Access')}
              </div>
            </DialogTitle>
            <DialogDescription className={isRtl ? 'text-right' : ''}>
              {t('lms.course_detail.instructor_access_description', 'Generate a permanent link for instructors to access their Zoom meetings')}
            </DialogDescription>
          </DialogHeader>

          {loadingBridge ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : bridgeLink ? (
            <div className="space-y-4 py-4">
              {/* Bridge Status Badge */}
              <div className="flex items-center gap-2">
                <Badge variant={bridgeLink.is_active ? 'default' : 'secondary'}>
                  {bridgeLink.is_active
                    ? t('lms.course_detail.bridge_active', 'Active')
                    : t('lms.course_detail.bridge_inactive', 'Inactive')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {t('lms.course_detail.bridge_slug', 'Slug')}: {bridgeLink.bridge_slug}
                </span>
              </div>

              {/* Bridge URL */}
              <div className="space-y-2">
                <Label className={isRtl ? 'text-right block' : ''}>
                  {t('lms.course_detail.bridge_url_label', 'Bridge URL')}
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={bridgeLink.bridge_url}
                    readOnly
                    className={`font-mono text-sm ${isRtl ? 'text-right' : ''}`}
                    dir={direction}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyBridgeLink}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(bridgeLink.bridge_url, '_blank')}
                    className="shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Instructor Info */}
              {bridgeLink.instructor && (
                <div className={`text-sm ${isRtl ? 'text-right' : ''}`}>
                  <span className="text-muted-foreground">
                    {t('lms.course_detail.bridge_instructor', 'Instructor')}:{' '}
                  </span>
                  <span className="font-medium">
                    {bridgeLink.instructor.first_name} {bridgeLink.instructor.last_name}
                  </span>
                </div>
              )}

              {/* Grace Period Info */}
              <div className={`flex gap-4 text-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className="text-muted-foreground">
                  {t('lms.course_detail.bridge_grace_before', 'Grace before')}:{' '}
                  <span className="font-medium">{bridgeLink.grace_before_minutes || 15}m</span>
                </span>
                <span className="text-muted-foreground">
                  {t('lms.course_detail.bridge_grace_after', 'Grace after')}:{' '}
                  <span className="font-medium">{bridgeLink.grace_after_minutes || 30}m</span>
                </span>
              </div>

              {/* How it works info */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 p-4">
                <p className={`text-sm font-medium mb-2 ${isRtl ? 'text-right' : ''}`}>
                  {t('lms.course_detail.bridge_how_it_works', 'How it works')}
                </p>
                <p className={`text-sm text-blue-900 dark:text-blue-100 ${isRtl ? 'text-right' : ''}`}>
                  {t('lms.course_detail.bridge_explanation', 'The instructor can use this permanent link to automatically join the correct Zoom meeting based on the current time. The system will redirect them to the meeting that is currently active or upcoming within the grace period.')}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Link2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground mb-4">
                {t('lms.course_detail.bridge_not_created', 'No instructor bridge link created yet')}
              </p>
              <Button onClick={handleCreateBridgeLink} disabled={creatingBridge}>
                {creatingBridge ? (
                  <>
                    <Loader2 className={`h-4 w-4 animate-spin ${isRtl ? 'ml-2' : 'mr-2'}`} />
                    {t('lms.course_detail.bridge_creating', 'Creating...')}
                  </>
                ) : (
                  <>
                    <Plus className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                    {t('lms.course_detail.bridge_create', 'Create Bridge Link')}
                  </>
                )}
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBridgeDialog(false)}>
              {t('common.close', 'Close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}