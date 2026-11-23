import { useEffect, useState } from 'react';
import type { AttendanceStatus } from '@/types/lms';
import { formatInTimezone, resolveDisplayTimezone } from '@/lib/datetime/timezone';

export type Translate = (key: string, fallback: string) => string;

export interface Client {
  id: string;
  full_name: string;
  email: string;
}

export interface Meeting {
  id: string;
  title: string;
  start_time: string;
  timezone?: string | null;
  order: number;
  /** 1-based place in the course, by date. */
  number: number;
}

/** One client in one meeting. */
export interface Mark {
  id?: string;
  status?: AttendanceStatus;
  notes: string;
}

export const STATUSES: AttendanceStatus[] = ['present', 'late', 'absent', 'excused'];

export const keyOf = (clientId: string, meetingId: string) => `${clientId}___${meetingId}`;

export function statusLabel(s: AttendanceStatus, t: Translate) {
  return {
    present: t('admin.attendanceTab.status.present', 'Present'),
    late: t('admin.attendanceTab.status.late', 'Late'),
    absent: t('admin.attendanceTab.status.absent', 'Absent'),
    excused: t('admin.attendanceTab.status.excused', 'Excused'),
  }[s];
}

/** Colour of each status: the dot, the chosen look, and the count's text. */
export const STATUS_TONE: Record<AttendanceStatus, { dot: string; on: string; text: string }> = {
  present: {
    dot: 'bg-green-600',
    on: 'bg-green-50 font-bold text-green-800 dark:bg-green-950/50 dark:text-green-300',
    text: 'text-green-700 dark:text-green-400',
  },
  late: {
    dot: 'bg-amber-500',
    on: 'bg-amber-50 font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
    text: 'text-amber-700 dark:text-amber-400',
  },
  absent: {
    dot: 'bg-red-600',
    on: 'bg-red-50 font-bold text-red-800 dark:bg-red-950/50 dark:text-red-300',
    text: 'text-red-700 dark:text-red-400',
  },
  excused: {
    dot: 'bg-blue-600',
    on: 'bg-blue-50 font-bold text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
    text: 'text-blue-700 dark:text-blue-400',
  },
};

export type Level = 'excellent' | 'good' | 'fair' | 'low';
export const LEVELS: Level[] = ['excellent', 'good', 'fair', 'low'];

/** The same four levels for the badges and the filter: 90+, 75–89, 60–74, under 60. */
export function levelOf(pct: number): Level {
  if (pct >= 90) return 'excellent';
  if (pct >= 75) return 'good';
  if (pct >= 60) return 'fair';
  return 'low';
}

export function levelLabel(l: Level, t: Translate) {
  return {
    excellent: t('admin.attendanceTab.level.excellent', 'Excellent'),
    good: t('admin.attendanceTab.level.good', 'Good'),
    fair: t('admin.attendanceTab.level.fair', 'Fair'),
    low: t('admin.attendanceTab.level.low', 'Low'),
  }[l];
}

export const LEVEL_TONE: Record<Level, { badge: string; bar: string }> = {
  excellent: { badge: 'bg-green-50 text-green-800 dark:bg-green-950/50 dark:text-green-300', bar: 'bg-green-600' },
  good: { badge: 'bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300', bar: 'bg-blue-600' },
  fair: { badge: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300', bar: 'bg-amber-500' },
  low: { badge: 'bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300', bar: 'bg-red-600' },
};

/** Attendance % = (present + late) / (present + late + absent). Excused is left out. */
export function attendancePct(present: number, late: number, absent: number): number | null {
  const held = present + late + absent;
  return held > 0 ? Math.round(((present + late) / held) * 100) : null;
}

/** "Meeting 3 · Title · Mon 12.1 · 19:00" */
export function meetingLabel(m: Meeting, t: Translate, rtl: boolean) {
  return [
    t('admin.attendanceTab.meetingNumber', 'Meeting {n}').replace('{n}', String(m.number)),
    m.title,
    meetingWhen(m, rtl),
  ]
    .filter(Boolean)
    .join(' · ');
}

export function meetingWhen(m: Meeting, rtl: boolean) {
  if (!m.start_time) return '';
  const tz = resolveDisplayTimezone({ lessonTz: m.timezone });
  const locale = rtl ? 'he-IL' : 'en-US';
  const day = formatInTimezone(m.start_time, tz, { weekday: 'short' }, locale);
  const date = formatInTimezone(m.start_time, tz, { day: 'numeric', month: 'numeric' }, locale);
  const time = formatInTimezone(m.start_time, tz, { hour: '2-digit', minute: '2-digit', hour12: false }, locale);
  return `${day} ${date} · ${time}`;
}

/** The meeting to open on: today's or the next one, else the latest past one. */
export function nearestMeetingId(meetings: Meeting[]): string | null {
  if (meetings.length === 0) return null;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const next = meetings.find((m) => new Date(m.start_time).getTime() >= startOfToday.getTime());
  return (next ?? meetings[meetings.length - 1]).id;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/** True on a phone-width screen. */
export function useIsNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return narrow;
}

/** Downloads a CSV from an admin route, keeping the file name the server gives. */
export async function downloadCsv(url: string, fallbackName: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const header = res.headers.get('Content-Disposition') || '';
  const name = /filename="?([^";]+)"?/.exec(header)?.[1] || fallbackName;
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

export const searchBox =
  'h-11 w-full min-w-0 rounded-lg border border-border bg-card px-3.5 text-base outline-none placeholder:text-muted-foreground focus:border-primary';
