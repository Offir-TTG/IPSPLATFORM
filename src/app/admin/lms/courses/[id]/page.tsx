'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CourseSettingsForm } from '@/components/admin/courses/CourseSettingsForm';
import { AttendanceTab } from '@/components/admin/courses/attendance/AttendanceTab';
import { GradesTab } from '@/components/admin/courses/grades/GradesTab';
import { COURSE_TYPE_FALLBACK, courseStatus, dateRange, personName, type AdminCourse } from '@/components/admin/courses/types';
import { stripHtml } from '@/components/admin/programs/types';
import { StatusDot, kitButton } from '@/components/admin/notifications/kit';
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
  BookOpen,
  GraduationCap,
  Clock,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  ExternalLink,
  CheckCircle,
  Award,
  Link2,
  Copy,
  Layers,
  Upload,
  CalendarDays,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminLanguage, useTenant } from '@/context/AppContext';
import {
  wallTimeToUTC,
  utcToWallTime,
  nextRoundHourInTimezone,
} from '@/lib/datetime/timezone';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { LessonTopicsBuilder } from '@/components/lms/LessonTopicsBuilder';
import { SortableModule, type LessonActions } from '@/components/admin/courses/builder/ModuleCard';
import { LessonPanel, type LessonFormState } from '@/components/admin/courses/builder/LessonPanel';
import { ModuleDeleteDialog } from '@/components/admin/courses/builder/ModuleDeleteDialog';
import { AddModulesDialog, fillPattern } from '@/components/admin/courses/builder/AddModulesDialog';
import { SeriesWizard } from '@/components/admin/courses/builder/SeriesWizard';
import { lengthText, type BuilderLesson, type BuilderModule } from '@/components/admin/courses/builder/types';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { InlineConfirm, SidePanel, panelSecondary } from '@/components/admin/courses/builder/SidePanel';
import { Badge } from '@/components/ui/badge';

import type { Token } from '@/components/ui/token-inserter';
import { CourseMaterials } from '@/components/lms/CourseMaterials';
import { Label } from '@/components/ui/label';
import {
  ZOOM_SETTINGS_DEFAULTS,
} from '@/components/admin/lms/ZoomSettingsPanel';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Course {
  id: string;
  title: string;
  description: string | null;
  program_id: string;
  is_active: boolean;
  is_published?: boolean;
  instructor_id: string | null;
  image_url?: string | null;
  instructor?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

type Module = BuilderModule;
type Lesson = BuilderLesson;

export default function CourseBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { t, direction } = useAdminLanguage();
  const { tenantId } = useTenant();
  const isRtl = direction === 'rtl';

  // Tenant currency + timezone, loaded once on mount. Drives:
  //  - The "Lifetime Sales" amount formatting (was hardcoded ₪)
  //  - The default timezone in the lesson form (was hardcoded
  //    'Asia/Jerusalem'), so creating a lesson defaults to the tenant's
  //    own timezone, not Israel.
  const [tenantCurrency, setTenantCurrency] = useState<string>('USD');
  const [tenantTimezone, setTenantTimezone] = useState<string>('Asia/Jerusalem');
  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      try {
        const res = await fetch('/api/admin/tenant');
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.currency) setTenantCurrency(json.data.currency);
          if (json.data.timezone) setTenantTimezone(json.data.timezone);
        }
      } catch (err) {
        console.error('Failed to load tenant currency/timezone:', err);
      }
    })();
  }, [tenantId]);

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [creatingZoomFor, setCreatingZoomFor] = useState<string | null>(null);
  // Tracks which lesson is currently being backfilled from Zoom's recording
  // API. Shows a spinner on the row's "Sync recording" button while in flight.
  const [syncingRecordingFor, setSyncingRecordingFor] = useState<string | null>(null);

  // Manually fetch a lesson's recording from Zoom and update the DB.
  // Use when the recording.completed webhook didn't fire (local dev with
  // no tunnel, prod outage, or app reconfigured). See
  // POST /api/admin/lessons/[id]/sync-recording.
  const handleSyncRecording = async (lessonId: string) => {
    try {
      setSyncingRecordingFor(lessonId);
      const response = await fetch(`/api/admin/lessons/${lessonId}/sync-recording`, {
        method: 'POST',
      });
      const result = await response.json();

      // 8s for warnings/errors so the admin has time to read the Hebrew
      // text before it disappears. Default showMessage timeout is 3s,
      // which is fine for the success toast but too short here.
      const LONG_TOAST = 8000;

      if (!response.ok || !result.success) {
        // Map known errorCode values to localized messages so the
        // admin sees friendly Hebrew text instead of Zoom's raw English
        // 404 body. Anything we don't recognise falls back to a generic
        // failure toast carrying the server-provided detail.
        const code: string | undefined = result.errorCode;
        if (code === 'no_recording') {
          showMessage(
            'warning',
            t(
              'lms.builder.recording_not_found_on_zoom',
              'No recording was found on Zoom for this lesson.'
            ),
            LONG_TOAST
          );
          return;
        }
        if (code === 'no_session' || code === 'no_meeting_id') {
          showMessage(
            'warning',
            t(
              'lms.builder.recording_no_meeting',
              'This lesson has no Zoom meeting attached.'
            ),
            LONG_TOAST
          );
          return;
        }
        throw new Error(result.error || 'Failed to sync recording');
      }

      if (result.data?.recordingUrl) {
        showMessage(
          'success',
          t('lms.builder.recording_synced', 'Recording synced successfully'),
          LONG_TOAST
        );
        await loadCourse();
      } else {
        showMessage(
          'warning',
          t(
            'lms.builder.recording_not_ready',
            'Recording is still processing on Zoom; try again in a few minutes.'
          ),
          LONG_TOAST
        );
      }
    } catch (error: any) {
      console.error('Failed to sync recording:', error);
      showMessage(
        'error',
        t('lms.builder.recording_sync_failed', 'Failed to sync recording'),
        8000
      );
    } finally {
      setSyncingRecordingFor(null);
    }
  };

  // How many students are enrolled (null until loaded).
  const [enrolledCount, setEnrolledCount] = useState<number | null>(null);
  const [courseMissing, setCourseMissing] = useState(false);

  // Which wizard step opens first (?step=structure after creating; old ?tab= links still work).
  const searchParams = useSearchParams();
  const initialStep =
    searchParams.get('step') ?? ({ structure: 'structure', materials: 'materials', settings: 'basics' } as Record<string, string>)[searchParams.get('tab') ?? ''] ?? 'structure';

  // Course-level actions in the header.
  const [duplicating, setDuplicating] = useState(false);
  const [showDeleteCourseDialog, setShowDeleteCourseDialog] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState(false);
  const [deleteBlockers, setDeleteBlockers] = useState<{ products: { id: string; title: string }[]; programs: { id: string; name: string }[] } | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);
  const settingsCourse = useMemo(() => course as unknown as AdminCourse | null, [course]);

  // Dialog states
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [showBulkLessonDialog, setShowBulkLessonDialog] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showDeleteLessonDialog, setShowDeleteLessonDialog] = useState(false);
  const [showLessonContentDialog, setShowLessonContentDialog] = useState(false);
  const [moduleDeleteTarget, setModuleDeleteTarget] = useState<{ id: string; title: string; prevId: string | null } | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<{ lessonId: string; moduleId: string } | null>(null);
  const [selectedLessonForContent, setSelectedLessonForContent] = useState<{ lessonId: string; lessonTitle: string } | null>(null);

  // Message states
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  // Dialog-scoped error so messages render inside the open dialog instead of
  // disappearing behind it on the parent page.
  const [lessonDialogError, setLessonDialogError] = useState<string | null>(null);

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
    // Default timezone is overridden by the tenant's configured timezone
    // once it loads (see effect below). Hardcoded fallback for the
    // initial render before the fetch resolves.
    timezone: 'Asia/Jerusalem',
    is_published: true,
    // Video meeting settings
    create_meeting: false,
    meeting_platform: 'zoom' as 'zoom' | 'daily', // Platform selection — default Zoom (matches bulk form + the rest of the UI which falls back to Zoom). Defaulting to Daily produced a footgun where admins toggled integration on, didn't notice the dropdown was Daily, and got a Daily room when they expected Zoom.
    create_zoom: false, // Keep for backward compatibility
    zoom_topic: '', // Custom Zoom meeting topic
    zoom_agenda: '',
    daily_room_name: '', // Custom Daily.co room name
    // Full Zoom settings — was only on the bulk form before. Single
    // lesson creation now sends these too so admins don't lose
    // security / recording config when creating one lesson at a time.
    ...ZOOM_SETTINGS_DEFAULTS,
  });

  const [bulkModuleForm, setBulkModuleForm] = useState({
    count: '5',
    titlePattern: t('admin.courses.builder.modulePattern', 'Module {n}'),
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

  // Note: previously had a useEffect here that synced lessonForm.timezone
  // to tenantTimezone on tenant-fetch. Removed because it could race with
  // `openEditLessonDialog` setting the form's timezone from the lesson —
  // when the tenant fetch resolved after the user opened the edit dialog,
  // the effect would overwrite the lesson's own timezone (e.g. switching
  // a NY lesson's form back to Asia/Jerusalem). If we ever want tenant
  // timezone as the default for *new* lessons, do it inside the
  // "Add Lesson" click handler instead.

  // Bridge link state
  const [bridgeLink, setBridgeLink] = useState<any>(null);
  // Bumped by the "Upload material" button on the Materials step's title row.
  const [materialUploadSignal, setMaterialUploadSignal] = useState(0);
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
    result = result.replace(/\{series_name\}/g, course?.title || '');
    result = result.replace(/\{course_name\}/g, course?.title || '');

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

      // {dd} / {mm} - day and month numbers
      result = result.replace(/\{dd\}/g, day);
      result = result.replace(/\{mm\}/g, month);

      // {date_long} - Full date with day name
      const tokenLocale = isRtl ? 'he-IL' : 'en-US';
      const dayName = lessonDate.toLocaleDateString(tokenLocale, { weekday: 'long' });
      const monthName = lessonDate.toLocaleDateString(tokenLocale, { month: 'long' });
      result = result.replace(/\{date_long\}/g, lessonDate.toLocaleDateString(tokenLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));

      // {time} - HH:MM
      result = result.replace(/\{time\}/g, `${hours}:${minutes}`);

      // {time_12h} - 12-hour format
      result = result.replace(/\{time_12h\}/g, lessonDate.toLocaleTimeString(tokenLocale, { hour: 'numeric', minute: '2-digit', hour12: true }));

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
        setCourseMissing(false);
      } else {
        // No made-up course: the page says it wasn't found.
        setCourse(null);
        setCourseMissing(true);
        return;
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

      // Only the real number: how many students are enrolled.
      if (studentsData.success && Array.isArray(studentsData.data)) {
        setEnrolledCount(studentsData.data.length);
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

    // If the server doesn't save the new order, the list goes back to it.
    const before = modules;
    const revert = () => {
      setModules(before);
      showMessage('error', t('admin.courses.builder.orderNotSaved', "The new order wasn't saved. Try again."), 5000);
    };

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
        } else {
          revert();
        }
      } catch (error) {
        console.error('Failed to save module order:', error);
        revert();
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
          } else {
            revert();
          }
        } catch (error) {
          console.error('Failed to save lesson order:', error);
          revert();
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

            const done = await Promise.all(reorderPromises);
            if (done.every((r) => r.ok)) {
              showMessage('success', t('lms.builder.lesson_moved', 'Lesson moved to new module'));
            } else {
              // The lesson moved, but an order didn't save: show what the server has.
              showMessage('warning', t('admin.courses.builder.orderNotSaved', "The new order wasn't saved. Try again."), 5000);
              void loadCourse();
            }
          } else {
            setModules(before);
            showMessage('error', t('lms.builder.move_failed', 'Failed to move lesson'), 5000);
          }
        } catch (error) {
          console.error('Failed to move lesson:', error);
          setModules(before);
          showMessage('error', t('lms.builder.move_failed', 'Failed to move lesson'), 5000);
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
        showMessage('error', isEditing ? t('admin.courses.builder.moduleUpdateFailed', 'The module was not saved. Try again.') : t('admin.courses.builder.moduleCreateFailed', 'The module was not added. Try again.'), 5000);
      }
    } catch (error) {
      console.error(`Failed to ${editingModule ? 'update' : 'create'} module:`, error);
      showMessage('error', editingModule ? t('admin.courses.builder.moduleUpdateFailed', 'The module was not saved. Try again.') : t('admin.courses.builder.moduleCreateFailed', 'The module was not added. Try again.'), 5000);
    } finally {
      setSaving(false);
    }
  };

  /** Opens the delete dialog, which checks the module's lessons and asks what to do with them. */
  const handleDeleteModule = (moduleId: string) => {
    const i = modules.findIndex((m) => m.id === moduleId);
    if (i < 0) return;
    setModuleDeleteTarget({ id: moduleId, title: modules[i].title, prevId: i > 0 ? modules[i - 1].id : null });
  };

  const handleCreateLesson = async () => {
    // Clear any previous in-dialog error.
    setLessonDialogError(null);

    if (!lessonForm.title.trim() || !selectedModule) {
      setLessonDialogError(t('lms.builder.title_required', 'Title is required'));
      return;
    }

    if (lessonForm.create_meeting) {
      if (lessonForm.meeting_platform === 'zoom' && !lessonForm.zoom_topic.trim()) {
        setLessonDialogError(t('lms.builder.zoom_topic_required', 'Zoom meeting topic is required when creating Zoom meeting'));
        return;
      }
      if (lessonForm.meeting_platform === 'daily' && !lessonForm.daily_room_name.trim()) {
        setLessonDialogError(t('lms.builder.daily_room_name_required', 'Daily.co room name is required when creating Daily.co room'));
        return;
      }
    }

    try {
      setSaving(true);

      // Convert the wall-clock datetime from the form into a UTC ISO string
      // for Postgres storage. Uses the shared `wallTimeToUTC` util — see
      // `src/lib/datetime/timezone.ts` for the canonical rules.
      const startTimeUTC = lessonForm.start_time
        ? wallTimeToUTC(lessonForm.start_time, lessonForm.timezone || tenantTimezone)
        : lessonForm.start_time;

      // Determine if we're editing or creating
      const isEditing = !!editingLesson;
      const url = isEditing ? `/api/lms/lessons/${editingLesson.id}` : '/api/lms/lessons';
      const method = isEditing ? 'PATCH' : 'POST';

      // Resolve {n}/{date}/etc. tokens in the lesson title — the Zoom topic
      // and Daily.co room name already get this treatment below, so the
      // title was the inconsistent one. Use lesson position-in-module for
      // {n} (1-based) on new lessons; preserve the existing order on edit.
      const lessonNumberForTitle = isEditing
        ? (editingLesson.order ?? 0) + 1
        : (selectedModule.lessons?.length || 0) + 1;
      const lessonDateForTitle = lessonForm.start_time ? new Date(lessonForm.start_time) : null;
      const resolvedTitle = replaceTokens(lessonForm.title, lessonNumberForTitle, lessonDateForTitle);

      // Forward the Zoom config so ZoomService can read it from the
      // lesson row when creating the meeting below. Only sent when the
      // admin opted into a Zoom meeting; for Daily or no-meeting flows
      // these stay at their defaults and don't affect anything.
      const zoomConfig = lessonForm.create_meeting && lessonForm.meeting_platform === 'zoom'
        ? {
            zoom_passcode: lessonForm.zoom_passcode || null,
            zoom_waiting_room: lessonForm.zoom_waiting_room,
            zoom_join_before_host: lessonForm.zoom_join_before_host,
            zoom_mute_upon_entry: lessonForm.zoom_mute_upon_entry,
            zoom_require_authentication: lessonForm.zoom_require_authentication,
            zoom_host_video: lessonForm.zoom_host_video,
            zoom_participant_video: lessonForm.zoom_participant_video,
            zoom_audio: lessonForm.zoom_audio,
            zoom_auto_recording: lessonForm.zoom_auto_recording,
            zoom_record_speaker_view: lessonForm.zoom_record_speaker_view,
            zoom_recording_disclaimer: lessonForm.zoom_recording_disclaimer,
          }
        : {};

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: params.id,
          module_id: selectedModule.id,
          title: resolvedTitle,
          description: lessonForm.description || null,
          duration: lessonForm.duration_minutes ? parseInt(lessonForm.duration_minutes) : null,
          is_published: lessonForm.is_published,
          // UTC-converted (see wallTimeToUTC above) so Postgres stores the
          // correct absolute moment regardless of admin's browser timezone.
          start_time: startTimeUTC,
          timezone: lessonForm.timezone,
          order: isEditing ? editingLesson.order : (selectedModule.lessons?.length || 0),
          ...zoomConfig,
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

              // Create Zoom meeting via the per-lesson endpoint. Sends
              // the same `topic / agenda / start_time / duration /
              // timezone / password / settings` payload the bulk-smart
              // endpoint uses so single + bulk produce identical Zoom
              // meetings (recording mode, waiting room, passcode, etc).
              const zoomResponse = await fetch(`/api/admin/lessons/${lessonData.id}/zoom/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  topic: zoomTopicWithTokens,
                  agenda: lessonForm.zoom_agenda || undefined,
                  start_time: startTimeUTC,
                  duration: parseInt(lessonForm.duration_minutes),
                  timezone: lessonForm.timezone || tenantTimezone,
                  password: lessonForm.zoom_passcode || undefined,
                  settings: {
                    host_video: lessonForm.zoom_host_video,
                    participant_video: lessonForm.zoom_participant_video,
                    join_before_host: lessonForm.zoom_join_before_host,
                    mute_upon_entry: lessonForm.zoom_mute_upon_entry,
                    waiting_room: lessonForm.zoom_waiting_room,
                    auto_recording: lessonForm.zoom_auto_recording,
                    audio: lessonForm.zoom_audio,
                    recording_play_on_active_speaker: lessonForm.zoom_record_speaker_view,
                    meeting_authentication: lessonForm.zoom_require_authentication,
                  },
                }),
              });

              const zoomResult = await zoomResponse.json();
              if (!zoomResult.success) {
                showMessage('warning', t('lms.builder.lesson_created_zoom_failed', 'The lesson was added, but the Zoom meeting was not created.'), 5000);
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

        // Update Zoom meeting if lesson is being edited and has a Zoom meeting.
        //
        // CRITICAL: this PATCH must send the SAME UTC ISO that the main
        // lesson PATCH sent (`startTimeUTC`). Previously this branch was
        // sending the *naive* form value (`lessonForm.start_time + ":00"`),
        // which the server's `zoomService.updateMeetingForLesson` then
        // wrote back to `lessons.start_time` via its compatibility update
        // path — overwriting the correctly-converted 21:00 UTC value with
        // the user's naive 17:00 wall-clock and producing the classic
        // "save shows 5pm, refresh shows 1pm" 4-hour drift.
        if (isEditing && editingLesson.zoom_meeting_id) {
          try {
            const zoomResponse = await fetch(`/api/lms/lessons/${lessonData.id}/zoom-session`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                topic: lessonForm.title,
                agenda: lessonForm.description || null,
                start_time: startTimeUTC,
                duration: parseInt(lessonForm.duration_minutes),
                timezone: lessonForm.timezone,
              }),
            });

            const zoomResult = await zoomResponse.json();
            if (!zoomResult.success) {
              showMessage('warning', t('lms.builder.lesson_updated_zoom_failed', 'The lesson was saved, but the Zoom meeting was not updated.'), 5000);
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
          // Default to next round hour in the tenant's tz, not UTC, so the
          // input shows a sensible wall-clock the admin can edit naturally.
          start_time: nextRoundHourInTimezone(tenantTimezone),
          duration_minutes: '60',
          timezone: tenantTimezone,
          is_published: true,
          create_meeting: false,
          // See lessonForm initial state — default is Zoom, not Daily.
          meeting_platform: 'zoom',
          create_zoom: false,
          zoom_topic: '',
          zoom_agenda: '',
          daily_room_name: '',
          ...ZOOM_SETTINGS_DEFAULTS,
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
        // Save error is shown INSIDE the dialog (which is still open) instead
        // of behind it via the page-level toast.
        setLessonDialogError(result.error || t('lms.builder.lesson_save_failed', 'Failed to save lesson'));
      }
    } catch (error) {
      console.error('Failed to save lesson:', error);
      setLessonDialogError(t('lms.builder.lesson_save_failed', 'Failed to save lesson'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string, moduleId: string) => {
    setLessonToDelete({ lessonId, moduleId });
    setShowDeleteLessonDialog(true);
  };

  const confirmDeleteLesson = async (target: { lessonId: string; moduleId: string } | null = lessonToDelete) => {
    // One delete at a time: a double click doesn't send it twice.
    const lessonToDelete = target;
    if (!lessonToDelete || deletingItem) return;
    setDeletingItem(true);
    try {
      const response = await fetch(`/api/lms/lessons/${lessonToDelete.lessonId}`, { method: 'DELETE' });
      const result = await response.json().catch(() => ({}));
      if (result.success) {
        setModules((prev) =>
          prev.map((m) => (m.id === lessonToDelete.moduleId ? { ...m, lessons: m.lessons?.filter((l) => l.id !== lessonToDelete.lessonId) || [] } : m)),
        );
        showMessage('success', t('lms.builder.lesson_deleted', 'Lesson deleted successfully'));
        await loadCourse();
      } else {
        showMessage('error', t('lms.builder.lesson_delete_failed', 'Failed to delete lesson'), 5000);
      }
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      showMessage('error', t('lms.builder.lesson_delete_failed', 'Failed to delete lesson'), 5000);
    } finally {
      setDeletingItem(false);
      setShowDeleteLessonDialog(false);
      setLessonToDelete(null);
    }
  };

  const handleEditLesson = (lesson: Lesson, moduleId: string) => {
    // Find the module containing this lesson
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    // Set the editing lesson and module
    setLessonDialogError(null);
    setEditingLesson(lesson);
    setSelectedModule(module);

    // Format start_time for the <input type="datetime-local"> field.
    // The input expects naive `YYYY-MM-DDTHH:MM` — we render the stored
    // UTC timestamp in the lesson's own timezone via the shared util.
    const lessonTimezone = lesson.timezone || tenantTimezone;
    let formattedStartTime = lesson.start_time
      ? utcToWallTime(lesson.start_time, lessonTimezone)
      : '';
    if (!formattedStartTime) {
      // No stored start_time → use next round hour in the lesson tz.
      formattedStartTime = nextRoundHourInTimezone(lessonTimezone);
    }

    // Populate the form with lesson data
    const duration = lesson.duration || 60;

    setLessonForm({
      title: lesson.title,
      description: lesson.description || '',
      start_time: formattedStartTime,
      duration_minutes: duration.toString(),
      timezone: lesson.timezone || tenantTimezone,
      is_published: lesson.is_published,
      create_meeting: false, // Don't show meeting creation option in edit mode
      meeting_platform: 'zoom',
      create_zoom: false,
      zoom_topic: '',
      zoom_agenda: '',
      daily_room_name: '',
      ...ZOOM_SETTINGS_DEFAULTS,
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
            title: fillPattern(bulkModuleForm.titlePattern, i),
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
          showMessage('error', t('admin.courses.builder.moduleNFailed', 'Module {n} was not added. The ones before it were.').replace('{n}', String(i)), 5000);
          break;
        }
      }

      if (createdModules.length > 0) {
        setModules([...modules, ...createdModules]);
        setShowModuleDialog(false);
        setBulkModuleForm({
          count: '5',
          titlePattern: t('admin.courses.builder.modulePattern', 'Module {n}'),
          startingOrder: 1,
          is_published: true,
          is_optional: false,
        });
        showMessage('success', t('admin.courses.builder.modulesCreated', '{n} modules were added').replace('{n}', String(createdModules.length)));
      }
    } catch (error) {
      console.error('Failed to create modules:', error);
      showMessage('error', t('admin.courses.builder.moduleCreateFailed', 'The module was not added. Try again.'), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handlePublishCourse = async () => {
    if (!course || saving) return;
    const publish = !course.is_published;
    const patch = (url: string) =>
      fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_published: publish }) })
        .then((r) => r.ok)
        .catch(() => false);

    try {
      setSaving(true);
      if (!(await patch(`/api/lms/courses/${course.id}`))) {
        showMessage('error', t('lms.courses.error.update_failed', 'Failed to update course'), 5000);
        return;
      }

      // Then every module, lesson and material (lesson content has no flag
      // of its own: it shows with its lesson).
      const urls: string[] = [];
      for (const m of modules) {
        urls.push(`/api/lms/modules/${m.id}`);
        for (const l of m.lessons || []) urls.push(`/api/lms/lessons/${l.id}`);
      }
      try {
        const res = await fetch(`/api/lms/materials?course_id=${course.id}`);
        const data = await res.json();
        for (const material of data.success ? data.data || [] : []) urls.push(`/api/lms/materials/${material.id}`);
      } catch {
        // Counted below as not updated.
        urls.push('');
      }
      const results = await Promise.all(urls.map((u) => (u ? patch(u) : Promise.resolve(false))));
      const failed = results.filter((ok) => !ok).length;

      setCourse({ ...course, is_published: publish });
      await loadCourse();
      if (failed > 0) {
        showMessage(
          'warning',
          t('admin.courses.builder.publishPartly', 'The course was updated, but {n} items were not. Try again.').replace('{n}', String(failed)),
          8000,
        );
      } else {
        showMessage(
          'success',
          publish
            ? t('lms.builder.course_published', 'Course and all content published successfully')
            : t('lms.builder.course_unpublished', 'Course and all content unpublished successfully'),
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // A full copy (modules, lessons, content) as a draft; it opens straight away.
  const handleDuplicateCourse = async () => {
    if (!course || duplicating) return;
    setDuplicating(true);
    try {
      const res = await fetch(`/api/lms/courses/${course.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newTitle: t('admin.courses.copyTitle', '{title} (copy)').replace('{title}', course.title) }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.success || !result.data?.id) throw new Error('duplicate failed');
      router.push(`/admin/lms/courses/${result.data.id}?tab=settings`);
    } catch {
      showMessage('error', t('admin.courses.duplicateError', "The course wasn't copied. Try again."), 5000);
      setDuplicating(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!course || deletingCourse) return;
    setDeletingCourse(true);
    try {
      const res = await fetch(`/api/lms/courses/${course.id}`, { method: 'DELETE' });
      const result = await res.json().catch(() => ({}));
      if (res.ok && result.success) {
        router.push('/admin/lms/courses');
        return;
      }
      setShowDeleteCourseDialog(false);
      if (result.dependencies) {
        setDeleteBlockers({ products: result.dependencies.products || [], programs: result.dependencies.programs || [] });
      } else {
        showMessage('error', t('lms.courses.error.delete_failed', 'Failed to delete course'), 5000);
      }
    } catch {
      showMessage('error', t('lms.courses.error.delete_failed', 'Failed to delete course'), 5000);
    } finally {
      setDeletingCourse(false);
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

      // Each date is converted from wall-clock-in-the-selected-timezone to
      // a UTC ISO string before being sent to the API. See `wallTimeToUTC`
      // in `src/lib/datetime/timezone.ts`.
      const bulkTimezone = bulkLessonForm.timezone || tenantTimezone;

      const lessonDateStrings: string[] = [];

      // Calendar days are counted in UTC on the plain date, so no timezone
      // can shift a lesson to the day before or after.
      const startDate = new Date(`${bulkLessonForm.start_date}T00:00:00Z`);
      const weekly = bulkLessonForm.is_recurring && bulkLessonForm.recurrence_pattern === 'weekly';
      if (weekly) {
        // The first lesson is on the chosen day of the week, on or after the start date.
        const wanted = bulkLessonForm.weekly_days[0] ?? startDate.getUTCDay();
        startDate.setUTCDate(startDate.getUTCDate() + ((wanted - startDate.getUTCDay() + 7) % 7));
      }
      for (let i = 0; i < count; i++) {
        const lessonDate = new Date(startDate);
        lessonDate.setUTCDate(lessonDate.getUTCDate() + i * (weekly ? 7 : 1));
        const dateStr = lessonDate.toISOString().slice(0, 10);
        // Wall-clock in `bulkTimezone` → UTC ISO before sending.
        lessonDateStrings.push(wallTimeToUTC(`${dateStr}T${bulkLessonForm.start_time}`, bulkTimezone));
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
          // Today's date in tenant tz (not UTC), so admin sees the right
          // local day even when saving late at night.
          start_date: nextRoundHourInTimezone(tenantTimezone).slice(0, 10),
          start_time: '18:00',
          duration_minutes: '60',
          timezone: tenantTimezone,
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

        showMessage('success', t('admin.courses.builder.lessonsCreated', '{n} lessons were added').replace('{n}', String(result.data.length)));
      } else {
        showMessage('error', t('lms.builder.lessons_create_failed', 'Failed to create lessons'), 5000);
      }
    } catch (error) {
      console.error('Failed to create lessons:', error);
      showMessage('error', t('lms.builder.lessons_create_failed', 'Failed to create lessons'), 5000);
    } finally {
      setSaving(false);
    }
  };

  const BackIcon = isRtl ? ChevronRight : ArrowLeft;
  const backLink = (
    <Link href="/admin/lms/courses" className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-primary hover:underline">
      <BackIcon className="h-4 w-4" aria-hidden />
      {t('admin.courses.back', 'Back to Courses')}
    </Link>
  );

  if (loading && !course) {
    return (
      <AdminLayout>
        <div className="max-w-6xl space-y-5 p-4 md:p-6" dir={direction} aria-busy="true">
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <span className="h-20 w-28 animate-pulse rounded-xl bg-muted" />
            <span className="flex flex-1 flex-col gap-2">
              <span className="h-3 w-40 animate-pulse rounded bg-muted" />
              <span className="h-6 w-2/3 animate-pulse rounded bg-muted" />
            </span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!course) {
    return (
      <AdminLayout>
        <div className="max-w-6xl space-y-5 p-4 md:p-6" dir={direction}>
          {backLink}
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground" aria-hidden />
            <h1 className="text-lg font-extrabold [font-family:inherit]">
              {courseMissing ? t('admin.courses.notFound', 'Course not found') : t('lms.builder.load_failed', 'Failed to load course data')}
            </h1>
            {!courseMissing && (
              <button type="button" onClick={() => void loadCourse()} className={kitButton.primary}>
                {t('admin.list.retry', 'Try again')}
              </button>
            )}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const full = course as unknown as AdminCourse;
  const status = courseStatus(full);
  const locale = isRtl ? 'he-IL' : 'en-US';
  const typeLabel = full.course_type
    ? t(`lms.course.type_${full.course_type}`, COURSE_TYPE_FALLBACK[full.course_type as keyof typeof COURSE_TYPE_FALLBACK] ?? String(full.course_type))
    : '';
  const meta = [
    status === 'published' ? t('lms.course.published', 'Published') : status === 'draft' ? t('lms.course.draft', 'Draft') : t('lms.courses.inactive', 'Inactive'),
    typeLabel,
    dateRange(full.start_date, full.end_date, locale),
  ]
    .filter(Boolean)
    .join(' · ');
  const subline = [
    full.program?.name || (full.is_standalone ? t('admin.courses.standaloneChip', 'Standalone') : ''),
    personName(full.instructor) ? `${t('lms.courses.instructor', 'Instructor')}: ${personName(full.instructor)}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const description = stripHtml(full.description);
  const totalMinutes = modules.reduce((acc, m) => acc + (m.lessons?.reduce((s, l) => s + (l.duration || 0), 0) || 0), 0);
  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
  const draggedLesson = activeId ? modules.flatMap((m) => m.lessons || []).find((l) => l.id === activeId) : undefined;

  const openNewModule = () => {
    setEditingModule(null);
    setBulkModuleForm((prev) => ({ ...prev, count: '4' }));
    setModuleForm({ title: '', description: '', is_published: true, is_optional: false });
    setShowModuleDialog(true);
  };

  const openMaterialUpload = () => setMaterialUploadSignal((n) => n + 1);
  const headerIcon =
    'grid h-11 w-11 place-items-center rounded-lg border border-border bg-card text-foreground/80 transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60';
  const academicHours = Math.round((totalMinutes / 45) * 10) / 10;
  const publishedModules = modules.filter((m) => m.is_published).length;
  const summaryTiles: { icon: typeof Award; tile: string; value: string; label: string }[] = [
    {
      icon: Layers,
      tile: 'bg-primary/10 text-primary',
      value: String(modules.length),
      label: t('admin.courses.summary.modules', 'Modules · {n} published').replace('{n}', String(publishedModules)),
    },
    {
      icon: CalendarDays,
      tile: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
      value: String(totalLessons),
      label: t('lms.builder.total_lessons', 'Total Lessons'),
    },
    {
      icon: Clock,
      tile: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
      value: lengthText(totalMinutes, t),
      label: t('admin.courses.summary.academic', '{n} academic hours').replace('{n}', String(academicHours)),
    },
    {
      icon: Users,
      tile: 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300',
      value: enrolledCount == null ? '—' : String(enrolledCount),
      label: t('lms.builder.total_enrollments', 'Total Enrollments'),
    },
  ];


  const moduleOfLesson = (lessonId: string) => modules.find((m) => m.lessons?.some((l) => l.id === lessonId)) ?? null;

  /** Add one lesson to a module: the lesson panel, with the defaults the old dialog used. */
  const openAddLesson = (module: Module) => {
    setSelectedModule(module);
    setEditingLesson(null);
    setLessonDialogError(null);
    setLessonForm({
      title: '',
      description: '',
      // Next round hour in tenant tz — see src/lib/datetime/timezone.ts
      start_time: nextRoundHourInTimezone(tenantTimezone),
      duration_minutes: '60',
      timezone: tenantTimezone,
      is_published: true,
      create_meeting: false,
      meeting_platform: 'zoom',
      create_zoom: false,
      zoom_topic: '',
      zoom_agenda: '',
      daily_room_name: '',
      ...ZOOM_SETTINGS_DEFAULTS,
    });
    setShowBulkLessonDialog(false);
    setShowLessonDialog(true);
  };

  /** Add a series of lessons to a module, starting from the single-lesson form's date and time. */
  const openSeries = (module: Module) => {
    setSelectedModule(module);
    if (lessonForm.start_time) {
      setBulkLessonForm((prev) => ({
        ...prev,
        start_date: lessonForm.start_time.slice(0, 10),
        start_time: lessonForm.start_time.slice(11, 16) || prev.start_time,
        duration_minutes: lessonForm.duration_minutes || '60',
        timezone: lessonForm.timezone || tenantTimezone,
      }));
    }
    setShowLessonDialog(false);
    setShowBulkLessonDialog(true);
  };

  const openLessonContent = (lesson: Lesson) => {
    setShowLessonDialog(false);
    setSelectedLessonForContent({ lessonId: lesson.id, lessonTitle: lesson.title });
    setShowLessonContentDialog(true);
  };

  /** Publish or unpublish one lesson from its menu. */
  const handleToggleLessonPublish = async (lesson: Lesson) => {
    const next = !lesson.is_published;
    try {
      const res = await fetch(`/api/lms/lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: next }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.success === false) throw new Error('update failed');
      setModules((prev) => prev.map((m) => ({ ...m, lessons: m.lessons?.map((l) => (l.id === lesson.id ? { ...l, is_published: next } : l)) })));
      showMessage(
        'success',
        next ? t('admin.courses.builder.lessonPublished', 'The lesson is published. Clients can see it.') : t('admin.courses.builder.lessonHidden', 'The lesson is now a draft. Clients cannot see it.'),
      );
    } catch {
      showMessage('error', t('admin.courses.builder.lessonPublishFailed', 'The change was not saved. Try again.'), 5000);
    }
  };

  const lessonActions: LessonActions = {
    onOpen: (lesson) => {
      const m = moduleOfLesson(lesson.id);
      if (m) handleEditLesson(lesson, m.id);
    },
    onEditContent: openLessonContent,
    onOpenMeeting: handleOpenZoomMeeting,
    onCreateMeeting: handleCreateZoomMeeting,
    onSyncRecording: handleSyncRecording,
    onTogglePublish: (lesson) => void handleToggleLessonPublish(lesson),
    onDelete: (lessonId) => {
      const m = moduleOfLesson(lessonId);
      if (m) handleDeleteLesson(lessonId, m.id);
    },
    creatingMeetingFor: creatingZoomFor,
    syncingRecordingFor,
    pendingDeleteLessonId: showDeleteLessonDialog ? lessonToDelete?.lessonId ?? null : null,
    onConfirmDelete: () => void confirmDeleteLesson(),
    onCancelDelete: () => {
      setShowDeleteLessonDialog(false);
      setLessonToDelete(null);
    },
    deleting: deletingItem,
  };

  // The instructor's entry link lives with the instructor, on the program step.
  const instructorAccess = (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary" aria-hidden>
          <Link2 className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-bold">{t('lms.course_detail.instructor_access_title', 'Instructor Access')}</div>
          <div className="text-[13px] text-muted-foreground">
            {t('admin.courses.instructorAccessHint', 'A personal link the instructor uses to open the live lessons.')}
          </div>
        </div>
      </div>
      <button type="button" onClick={() => setShowBridgeDialog(true)} className={kitButton.secondary}>
        {t('admin.courses.instructorAccessOpen', 'Open the link')}
      </button>
    </div>
  );

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-5 p-4 md:p-6" dir={direction}>
        {backLink}

        {/* Header */}
        <header className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="grid h-20 w-28 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary/10 text-primary">
            {full.image_url ? <img src={full.image_url} alt="" className="h-full w-full object-cover" /> : <BookOpen className="h-7 w-7" aria-hidden />}
          </span>
          <div className="min-w-0 flex-1 basis-56">
            <span className="text-[13px]">
              <StatusDot tone={status === 'published' ? 'green' : status === 'draft' ? 'orange' : 'grey'}>
                <span className="font-semibold">{meta}</span>
              </StatusDot>
            </span>
            <h1 className="mt-0.5 text-2xl font-extrabold leading-tight tracking-tight [font-family:inherit] [overflow-wrap:anywhere] sm:text-[26px]">{full.title}</h1>
            {subline && <p className="text-sm text-muted-foreground">{subline}</p>}
            {description && <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {/* Icons only; each name shows on hover and is read out by screen readers */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.open(`/courses/${course.id}?preview=1`, '_blank', 'noopener,noreferrer')}
              title={t('admin.courses.viewAsStudent', 'View as client')}
              aria-label={t('admin.courses.viewAsStudent', 'View as client')}
              className={headerIcon}
            >
              <Eye className="h-[18px] w-[18px]" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => void handlePublishCourse()}
              disabled={saving}
              title={course.is_published ? t('lms.builder.unpublish_course', 'Unpublish') : t('lms.builder.publish_course', 'Publish')}
              aria-label={course.is_published ? t('lms.builder.unpublish_course', 'Unpublish') : t('lms.builder.publish_course', 'Publish')}
              className={course.is_published ? headerIcon : `${headerIcon} border-primary bg-primary text-primary-foreground hover:bg-primary/90`}
            >
              {saving ? (
                <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden />
              ) : course.is_published ? (
                <EyeOff className="h-[18px] w-[18px]" aria-hidden />
              ) : (
                <CheckCircle className="h-[18px] w-[18px]" aria-hidden />
              )}
            </button>
            <button
              type="button"
              onClick={() => void handleDuplicateCourse()}
              disabled={duplicating}
              title={t('admin.courses.duplicate', 'Duplicate')}
              aria-label={t('admin.courses.duplicate', 'Duplicate')}
              className={headerIcon}
            >
              {duplicating ? <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden /> : <Copy className="h-[18px] w-[18px]" aria-hidden />}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteCourseDialog(true)}
              title={t('common.delete', 'Delete')}
              aria-label={t('common.delete', 'Delete')}
              className={`${headerIcon} border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40`}
            >
              <Trash2 className="h-[18px] w-[18px]" aria-hidden />
            </button>
          </div>
        </header>

        {/* Delete the course: asked here, under the header */}
        {showDeleteCourseDialog && (
          <InlineConfirm
            text={t('admin.courses.deleteConfirm', 'Delete "{title}" with all its modules, lessons and materials? This cannot be undone.').replace('{title}', full.title)}
            confirmLabel={deletingCourse ? t('common.deleting', 'Deleting...') : t('common.delete', 'Delete')}
            cancelLabel={t('common.cancel', 'Cancel')}
            onConfirm={() => void handleDeleteCourse()}
            onCancel={() => setShowDeleteCourseDialog(false)}
            busy={deletingCourse}
          />
        )}
        {deleteBlockers && (
          <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-900 dark:bg-amber-950/30">
            <p className="text-sm font-bold text-amber-950 dark:text-amber-100">{t('admin.courses.cannotDelete', "This course can't be deleted yet")}</p>
            <p className="mt-0.5 text-sm text-amber-900 dark:text-amber-200">
              {deleteBlockers.products.length
                ? t('admin.courses.cannotDeleteProducts', 'It is sold through these products. Remove it from them first:')
                : t('admin.courses.cannotDeletePrograms', 'It is part of these programs. Remove it from them first:')}
            </p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {deleteBlockers.products.map((p) => (
                <li key={p.id} className="rounded-lg bg-card px-3 py-2 font-medium">
                  {p.title}
                </li>
              ))}
              {deleteBlockers.programs.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/lms/programs/${p.id}`} className="block rounded-lg bg-card px-3 py-2 font-medium text-primary hover:underline">
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setDeleteBlockers(null)} className={`${kitButton.secondary} mt-2.5`}>
              {t('common.close', 'Close')}
            </button>
          </div>
        )}

        {/* The course at a glance */}
        <section aria-label={t('lms.builder.course_overview', 'Course Overview')} className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {summaryTiles.map(({ icon: Icon, tile, value, label }) => (
            <div key={label} className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tile}`} aria-hidden>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[22px] font-extrabold leading-tight tabular-nums">{value}</span>
                <span className="block truncate text-[13px] text-muted-foreground">{label}</span>
              </span>
            </div>
          ))}
        </section>


        <CourseSettingsForm
          course={settingsCourse}
          onSaved={(c) => setCourse((prev) => (prev ? ({ ...prev, ...c } as unknown as Course) : prev))}
          initialStep={initialStep}
          programExtra={instructorAccess}
          extra={{
            structure: {
              label: `${t('admin.courses.tab.structure', 'Structure')} (${modules.length})`,
              node: (

          <section className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">{t('admin.courses.builder.dragHint', 'Drag modules and lessons to change the order.')}</p>
              <button type="button" onClick={openNewModule} className={kitButton.primary}>
                <Plus className="h-4 w-4" aria-hidden />
                {t('admin.courses.builder.addModules', 'Add modules')}
              </button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {modules.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
                      <p className="mb-1 text-lg font-bold">{t('lms.builder.no_modules', 'No modules yet')}</p>
                      <p className="text-sm text-muted-foreground">{t('lms.builder.start_building', 'Start building your course by adding modules')}</p>
                    </div>
                  ) : (
                    modules.map((module) => (
                      <SortableModule
                        key={module.id}
                        module={module}
                        actions={lessonActions}
                        onToggleExpand={() => toggleModuleExpansion(module.id)}
                        onAddLessons={() => openAddLesson(module)}
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
                        confirmingDelete={false}
                        onConfirmDelete={() => undefined}
                        onCancelDelete={() => undefined}
                        deleting={deletingItem}
                        t={t}
                        isRtl={isRtl}
                        tenantTimezone={tenantTimezone}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeId ? (
                  <div className="rounded-xl border bg-card p-3 opacity-90 shadow-lg">
                    <div className="flex items-center gap-2">
                      {draggedLesson ? <GraduationCap className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                      {draggedLesson ? draggedLesson.title : modules.find((m) => m.id === activeId)?.title}
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
            {modules.length > 0 && (
              <button
                type="button"
                onClick={openNewModule}
                className="mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-primary/30 bg-card text-sm font-semibold text-primary hover:bg-primary/[0.04]"
              >
                <Plus className="h-4 w-4" aria-hidden />
                {t('admin.courses.builder.addModules', 'Add modules')}
              </button>
            )}
          </section>
              ),
            },
            materials: {
              label: t('lms.materials.tab_title', 'Course Materials'),
              action: (
                <button type="button" onClick={openMaterialUpload} className={kitButton.primary}>
                  <Upload className="h-4 w-4" aria-hidden />
                  {t('lms.materials.upload_button', 'Upload Material')}
                </button>
              ),
              node: (

          <section>
            <CourseMaterials
              courseId={course.id}
              courseIsPublished={course.is_published ?? false}
              uploadSignal={materialUploadSignal}
              t={t}
              isRtl={isRtl}
              direction={direction}
              onStatusMessage={(message) => showMessage(message.type, message.text)}
            />
          </section>
              ),
            },
            // Grades and attendance: steps of their own, only when the course uses them.
            ...((course as any).uses_grades !== false
              ? { grades: { label: t('admin.courses.tab.grades', 'Grades'), node: <GradesTab courseId={course.id} /> } }
              : {}),
            ...((course as any).uses_attendance !== false
              ? { attendance: { label: t('admin.courses.tab.attendance', 'Attendance'), node: <AttendanceTab courseId={course.id} /> } }
              : {}),
          }}
        />
      </div>

      {/* Messages float at the bottom so they're seen wherever you are */}
      {statusMessage && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4" role="status" aria-live="polite">
          <div
            className={`pointer-events-auto max-w-md rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
              statusMessage.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200'
                : statusMessage.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
                  : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200'
            }`}
          >
            {statusMessage.text}
          </div>
        </div>
      )}

      {/* Delete a module: what happens to its lessons */}
      <ModuleDeleteDialog
        module={moduleDeleteTarget}
        onClose={() => setModuleDeleteTarget(null)}
        onDeleted={(message) => {
          setModuleDeleteTarget(null);
          void loadCourse();
          showMessage('success', message);
        }}
        t={t}
        direction={isRtl ? 'rtl' : 'ltr'}
      />

      {/* Add modules (one or several), or edit one */}
      <AddModulesDialog
        open={showModuleDialog}
        onClose={() => {
          setShowModuleDialog(false);
          setEditingModule(null);
          setModuleForm({ title: '', description: '', is_published: true, is_optional: false });
        }}
        editing={!!editingModule}
        onAddLessons={() => {
          if (!editingModule) return;
          const m = editingModule;
          setShowModuleDialog(false);
          setEditingModule(null);
          openAddLesson(m);
        }}
        onDelete={() => {
          if (!editingModule) return;
          const id = editingModule.id;
          setShowModuleDialog(false);
          setEditingModule(null);
          handleDeleteModule(id);
        }}
        deleting={deletingItem}
        form={moduleForm}
        setForm={(patch) => setModuleForm((prev) => ({ ...prev, ...patch }))}
        bulk={bulkModuleForm}
        setBulk={(patch) => setBulkModuleForm((prev) => ({ ...prev, ...patch }))}
        saving={saving}
        onSaveOne={() => void handleCreateModule()}
        onSaveMany={() => void handleBulkCreateModules()}
        t={t}
        direction={direction}
      />

      {/* One lesson: add or edit, in a side panel */}
      <LessonPanel
        open={showLessonDialog}
        onClose={() => {
          setShowLessonDialog(false);
          setLessonDialogError(null);
        }}
        form={lessonForm as LessonFormState}
        setForm={(patch) => setLessonForm((prev) => ({ ...prev, ...patch }))}
        editingLesson={editingLesson ? modules.flatMap((m) => m.lessons || []).find((l) => l.id === editingLesson.id) ?? editingLesson : null}
        moduleTitle={selectedModule?.title ?? ''}
        error={lessonDialogError}
        saving={saving}
        onSave={() => void handleCreateLesson()}
        onDelete={(lessonId) => {
          const m = moduleOfLesson(lessonId);
          if (!m) return;
          setShowLessonDialog(false);
          void confirmDeleteLesson({ lessonId, moduleId: m.id });
        }}
        deleting={deletingItem}
        onOpenMeeting={handleOpenZoomMeeting}
        onSyncRecording={handleSyncRecording}
        onCreateMeeting={(lessonId, platform) => {
          setShowLessonDialog(false);
          void handleCreateZoomMeeting(lessonId, platform);
        }}
        creatingMeeting={!!editingLesson && creatingZoomFor === editingLesson.id}
        syncingRecording={!!editingLesson && syncingRecordingFor === editingLesson.id}
        onEditContent={openLessonContent}
        onSwitchToSeries={() => selectedModule && openSeries(selectedModule)}
        lessonTokens={lessonTokens}
        zoomTokens={zoomTokens}
        insertToken={insertToken}
        tenantTimezone={tenantTimezone}
        t={t}
        direction={direction}
      />

      {/* A series of lessons, in three steps */}
      <SeriesWizard
        open={showBulkLessonDialog}
        onClose={() => setShowBulkLessonDialog(false)}
        form={bulkLessonForm}
        setForm={(patch) => setBulkLessonForm((prev) => ({ ...prev, ...(patch as Partial<typeof prev>) }))}
        moduleTitle={selectedModule?.title ?? ''}
        saving={saving}
        onCreate={() => void handleBulkCreateLessons()}
        onSwitchToOne={() => selectedModule && openAddLesson(selectedModule)}
        lessonTokens={lessonTokens}
        zoomTokens={zoomTokens}
        insertToken={insertToken}
        tenantTimezone={tenantTimezone}
        t={t}
        direction={direction}
      />

      {/* The lesson's content, in a side panel */}
      <Sheet
        open={showLessonContentDialog}
        onOpenChange={(open) => {
          setShowLessonContentDialog(open);
          // The rows show how many content items each lesson has.
          if (!open) void loadCourse();
        }}
      >
        <SheetContent
          side={isRtl ? 'left' : 'right'}
          dir={direction}
          className="flex w-full flex-col gap-0 border-0 p-0 shadow-2xl outline-none sm:max-w-[560px] [&>button.absolute]:hidden"
        >
          <header className="relative shrink-0 border-b border-border bg-primary/[0.04] px-6 pb-4 pt-5">
            {(() => {
              const lesson = selectedLessonForContent ? modules.flatMap((m) => m.lessons || []).find((l) => l.id === selectedLessonForContent.lessonId) : undefined;
              return lesson ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowLessonContentDialog(false);
                    lessonActions.onOpen(lesson);
                  }}
                  className="inline-flex min-h-[32px] items-center gap-1 text-[13.5px] font-semibold text-primary hover:underline"
                >
                  <BackIcon className="h-4 w-4" aria-hidden />
                  {t('admin.courses.builder.backToLesson', 'Back to the lesson')}
                </button>
              ) : null;
            })()}
            <SheetTitle className="mt-1 pe-12 text-[22px] font-extrabold [font-family:inherit]">{t('lms.topics.lesson_content', 'Lesson Content')}</SheetTitle>
            <SheetDescription className="pe-12 text-sm text-muted-foreground">
              {t('admin.courses.builder.contentFor', '{title} · what clients see on the lesson page').replace('{title}', selectedLessonForContent?.lessonTitle ?? '')}
            </SheetDescription>
            <button
              type="button"
              onClick={() => {
                setShowLessonContentDialog(false);
                void loadCourse();
              }}
              aria-label={t('common.close', 'Close')}
              className="absolute end-3 top-3 grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-muted"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {selectedLessonForContent && (
              <LessonTopicsBuilder
                lessonId={selectedLessonForContent.lessonId}
                t={t}
                isRtl={isRtl}
                direction={direction}
                onTopicsChange={(items) => {
                  const id = selectedLessonForContent.lessonId;
                  setModules((prev) =>
                    prev.map((m) => ({ ...m, lessons: m.lessons?.map((l) => (l.id === id ? { ...l, lesson_topics: items } : l)) })),
                  );
                }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Instructor link, in a side panel */}
      <SidePanel
        open={showBridgeDialog}
        onClose={() => setShowBridgeDialog(false)}
        title={t('lms.course_detail.instructor_access_title', 'Instructor Access')}
        description={t('lms.course_detail.instructor_access_description', 'Generate a permanent link for instructors to access their Zoom meetings')}
        footer={
          <button type="button" onClick={() => setShowBridgeDialog(false)} className={panelSecondary}>
            {t('common.close', 'Close')}
          </button>
        }
      >
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
                    aria-label={t('admin.courses.copyLink', 'Copy the link')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(bridgeLink.bridge_url, '_blank')}
                    className="shrink-0"
                    aria-label={t('admin.courses.openLink', 'Open the link')}
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
                  <span className="font-medium">{t('admin.courses.builder.minutes', '{n} min').replace('{n}', String(bridgeLink.grace_before_minutes || 15))}</span>
                </span>
                <span className="text-muted-foreground">
                  {t('lms.course_detail.bridge_grace_after', 'Grace after')}:{' '}
                  <span className="font-medium">{t('admin.courses.builder.minutes', '{n} min').replace('{n}', String(bridgeLink.grace_after_minutes || 30))}</span>
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
      </SidePanel>
    </AdminLayout>
  );
}