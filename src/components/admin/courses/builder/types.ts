/** The course builder's module and lesson, as the modules API returns them. */

export interface BuilderLesson {
  id: string;
  module_id: string | null;
  course_id: string;
  title: string;
  description: string | null;
  order: number;
  duration: number | null;
  start_time?: string | null;
  timezone?: string;
  is_published: boolean;
  zoom_meeting_id?: string | null;
  lesson_topics?: { id: string; title?: string; content_type?: string }[];
  zoom_session?: {
    id: string;
    meeting_id: string;
    join_url: string;
    start_url: string;
    has_recording: boolean;
    platform?: 'zoom' | 'daily';
    daily_room_name?: string;
    daily_room_url?: string;
  } | null;
}

export interface BuilderModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order: number;
  is_published: boolean;
  is_optional: boolean;
  duration_minutes: number | null;
  lessons?: BuilderLesson[];
  isExpanded?: boolean;
}

export type Translate = (key: string, fallback: string) => string;

/** Which video meeting a lesson has, if any. */
export function meetingOf(lesson: BuilderLesson): 'zoom' | 'daily' | null {
  if (lesson.zoom_session?.platform === 'daily' || (!lesson.zoom_meeting_id && lesson.zoom_session?.daily_room_name)) return 'daily';
  if (lesson.zoom_meeting_id) return 'zoom';
  return null;
}

/** "8 hours", "1.5 hours", "45 min": a length the admin reads at a glance. */
export function lengthText(minutes: number, t: Translate): string {
  if (minutes < 60) return t('admin.courses.builder.minutes', '{n} min').replace('{n}', String(minutes));
  const hours = Math.round((minutes / 60) * 10) / 10;
  return hours === 1
    ? t('admin.courses.builder.oneHour', '1 hour')
    : t('admin.courses.builder.hours', '{n} hours').replace('{n}', String(hours));
}
