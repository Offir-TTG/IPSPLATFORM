export const COURSE_TYPES = ['course', 'lecture', 'workshop', 'webinar', 'session', 'session_pack', 'bundle', 'custom'] as const;
export type CourseType = (typeof COURSE_TYPES)[number];

export const COURSE_TYPE_FALLBACK: Record<CourseType, string> = {
  course: 'Course',
  lecture: 'Lecture',
  workshop: 'Workshop',
  webinar: 'Webinar',
  session: 'Session',
  session_pack: 'Session Pack',
  bundle: 'Bundle',
  custom: 'Custom',
};

export interface AdminCourse {
  id: string;
  tenant_id?: string;
  program_id: string | null;
  instructor_id: string | null;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  is_standalone: boolean;
  is_published: boolean;
  /** Clients see grades / attendance for it (undefined until the columns exist = on). */
  uses_grades?: boolean;
  uses_attendance?: boolean;
  course_type: CourseType | string | null;
  image_url: string | null;
  created_at?: string;
  program?: { id: string; name: string; is_active?: boolean } | null;
  instructor?: { id: string; first_name: string | null; last_name: string | null; email: string } | null;
}

export interface Option {
  id: string;
  label: string;
}

/** "2026-01-05" from a date or timestamp value. */
export const dayOf = (v: string | null | undefined) => (v ? v.slice(0, 10) : '');

export const personName = (u?: { first_name: string | null; last_name: string | null; email?: string } | null) =>
  u ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || '' : '';

/** The course's status in one word: published, draft or inactive. */
export function courseStatus(c: Pick<AdminCourse, 'is_active' | 'is_published'>): 'published' | 'draft' | 'inactive' {
  if (!c.is_active) return 'inactive';
  return c.is_published ? 'published' : 'draft';
}

/** Short dates in the interface language: "5 Jan – 30 Mar 2026". */
export function dateRange(start: string | null, end: string | null, locale: string) {
  if (!start) return '';
  const s = new Date(dayOf(start) + 'T12:00:00');
  const fmt = (d: Date, withYear: boolean) => d.toLocaleDateString(locale, { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) });
  if (!end || dayOf(end) === dayOf(start)) return fmt(s, true);
  const e = new Date(dayOf(end) + 'T12:00:00');
  return `${fmt(s, s.getFullYear() !== e.getFullYear())} – ${fmt(e, true)}`;
}

/** Programs and instructors for the course form, loaded once. */
export async function loadCourseOptions(): Promise<{ programs: Option[]; instructors: Option[] }> {
  const [programs, instructors] = await Promise.all([
    fetch('/api/programs')
      .then((r) => r.json())
      .then((res) => (res.success ? (res.data || []).map((p: any) => ({ id: p.id, label: p.name })) : []))
      .catch(() => []),
    fetch('/api/admin/tenant/users?limit=1000&role=instructor')
      .then((r) => r.json())
      .then((res) =>
        res.success && Array.isArray(res.data?.users)
          ? res.data.users.filter((tu: any) => tu.users).map((tu: any) => ({ id: tu.users.id, label: personName(tu.users) }))
          : [],
      )
      .catch(() => []),
  ]);
  return { programs, instructors };
}
