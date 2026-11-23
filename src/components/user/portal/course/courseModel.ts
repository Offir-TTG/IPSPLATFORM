/**
 * The client course page's data (from GET /api/user/courses/[id]) and the
 * rules the page applies to it: meeting platform, the join window, and how
 * texts and files are shown.
 */

export interface LessonTopic {
  id: string;
  title: string;
  content_type: string;
  content: any;
  order: number;
  duration_minutes: number | null;
  is_required: boolean;
  is_published: boolean;
}

export interface Lesson {
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
  /** The Zoom video file's own player (from the saved recording files), when there is one. */
  recording_play_url?: string | null;
  /** The video file can play in the portal's own player. */
  recording_stream?: boolean;
  start_time: string | null;
  status: string | null;
  platform?: 'zoom' | 'daily' | null;
  daily_room_name: string | null;
  daily_room_url: string | null;
  daily_room_id: string | null;
  timezone?: string | null;
  lesson_topics: LessonTopic[];
}

export interface Module {
  id: string;
  title: string;
  description: string | null;
  order: number;
  is_published: boolean;
  is_optional: boolean;
  duration_minutes: number | null;
  lessons: Lesson[];
}

export interface Material {
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
}

export interface CoursePlaces {
  club: { title: string; href: string; color: string } | null;
  programs: {
    programId: string;
    title: string;
    href: string;
    color: string;
    index: number;
    total: number;
    required: boolean;
    prev: { id: string; title: string } | null;
    next: { id: string; title: string } | null;
  }[];
  color: string;
}

export interface CourseData {
  course: { id: string; title: string; description: string | null; image_url: string | null; instructor: string | null; instructor_avatar: string | null; instructor_bio?: string | null; features?: { grades: boolean; attendance: boolean } };
  enrollment: any;
  modules: Module[];
  progress: {
    overall_progress: number;
    completed_lessons: number;
    in_progress_lessons: number;
    total_lessons: number;
    lesson_progress: { lesson_id: string; status: string; progress_percentage: number; completed_at: string | null; last_accessed_at: string | null }[];
  };
  statistics: { total_modules: number; total_lessons: number; total_topics: number; total_study_time: number; enrolled_students: number; materials_count: number };
  materials: Material[];
  places: CoursePlaces | null;
}

export function lessonPlatform(lesson: Lesson): 'zoom' | 'daily' | null {
  if (lesson.platform) return lesson.platform;
  if (lesson.daily_room_name || lesson.daily_room_url) return 'daily';
  if (lesson.zoom_meeting_id || lesson.zoom_join_url) return 'zoom';
  return null;
}

export function hasLiveMeeting(lesson: Lesson): boolean {
  const platform = lessonPlatform(lesson);
  if (platform === 'zoom') return !!(lesson.zoom_meeting_id && lesson.zoom_join_url);
  if (platform === 'daily') return !!lesson.daily_room_url;
  return false;
}

/** A lesson's length in minutes: "HH:MM", a number of minutes, or null. */
function minutesOf(duration: unknown): number | null {
  if (typeof duration === 'number') return duration > 0 ? duration : null;
  if (typeof duration !== 'string' || !duration.trim()) return null;
  if (duration.includes(':')) {
    const [h, m] = duration.split(':');
    const total = parseInt(h || '0', 10) * 60 + parseInt(m || '0', 10);
    return Number.isFinite(total) && total > 0 ? total : null;
  }
  const n = Number(duration);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** For the join window: the lesson's minutes, or an hour when unknown. */
export const durationMinutes = (duration: unknown): number => minutesOf(duration) ?? 60;

/** "45 דק׳", "1 שע׳ 30 דק׳", or the text as written ("90 min"). */
export function durationLabel(duration: unknown): string | null {
  const m = minutesOf(duration);
  if (m === null) return typeof duration === 'string' && /[a-zA-Z֐-׿]/.test(duration) ? duration : null;
  if (m < 60) return `${Math.round(m)} דק׳`;
  const h = Math.floor(m / 60);
  const rest = Math.round(m % 60);
  return rest ? `${h} שע׳ ${rest} דק׳` : `${h} שע׳`;
}

/** The meeting is over three hours after its scheduled end. */
export function sessionEnded(lesson: Lesson, now = Date.now()): boolean {
  if (!lesson.start_time) return false;
  return now > new Date(lesson.start_time).getTime() + (durationMinutes(lesson.duration) + 180) * 60_000;
}

/** Joining opens 30 minutes before the start and stays open until it has ended. */
export function canJoin(lesson: Lesson, now = Date.now()): boolean {
  if (!lesson.start_time) return true;
  return now >= new Date(lesson.start_time).getTime() - 30 * 60_000 && !sessionEnded(lesson, now);
}

/** Description HTML as plain paragraphs. */
export function plainText(html: string | null): string {
  if (!html) return '';
  return html
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/([.,:!?])([֐-׿A-Za-z])/g, '$1 $2')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export const hasHtmlText = (html: string | null | undefined) => !!html && html.replace(/<[^>]*>/g, '').trim().length > 0;

/** YouTube watch and short links become embeds; anything else as given. */
export function videoEmbedUrl(content: any): string | null {
  let url: string | null = typeof content === 'object' && content?.url ? content.url : typeof content === 'string' ? content : null;
  if (!url) return null;
  try {
    if (url.includes('youtube.com/watch')) {
      const id = new URL(url).searchParams.get('v');
      if (id) url = `https://www.youtube.com/embed/${id}`;
    } else if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      if (id) url = `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    /* keep the link as it is */
  }
  return url;
}

export const fileUrlOf = (content: any): string | null =>
  typeof content === 'object' && (content?.file_url || content?.url) ? content.file_url || content.url : typeof content === 'string' ? content : null;

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const IMAGE = ['image', 'png', 'jpg', 'jpeg', 'gif', 'webp'];
const VIDEO = ['video', 'mp4', 'webm'];
export const fileKind = (fileType: string): 'pdf' | 'image' | 'video' | 'other' => {
  const t = (fileType || '').toLowerCase();
  if (t.includes('pdf')) return 'pdf';
  if (IMAGE.some((x) => t.includes(x))) return 'image';
  if (VIDEO.some((x) => t.includes(x))) return 'video';
  return 'other';
};

/** A short label for a file's type: PDF, DOCX, MP4… */
export function fileExt(m: Material): string {
  const fromName = m.file_name?.split('.').pop();
  if (fromName && fromName.length <= 5 && fromName !== m.file_name) return fromName.toUpperCase();
  return (m.file_type?.split('/').pop() || 'FILE').slice(0, 5).toUpperCase();
}

const CATEGORY_HE: Record<string, string> = {
  syllabus: 'סילבוס',
  'lecture notes': 'סיכומי שיעור',
  lecture_notes: 'סיכומי שיעור',
  assignments: 'מטלות',
  assignment: 'מטלה',
  readings: 'קריאה',
  reading: 'קריאה',
  slides: 'מצגות',
  slide: 'מצגת',
  handouts: 'דפי עבודה',
  handout: 'דף עבודה',
  resources: 'משאבים',
  resource: 'משאב',
  exercises: 'תרגילים',
  exercise: 'תרגיל',
  references: 'מקורות',
  reference: 'מקור',
  other: 'אחר',
};
export const categoryLabel = (c: string | null) => (c ? CATEGORY_HE[c.toLowerCase()] ?? c : '');

export const TOPIC_LABEL: Record<string, string> = {
  text: 'טקסט',
  video: 'סרטון',
  pdf: 'PDF',
  download: 'קובץ',
  embed: 'תוכן',
  whiteboard: 'לוח',
  quiz: 'בוחן',
  assignment: 'מטלה',
};
