import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';
import { lessonEnd, loadClientLearning } from './clientLearning';
import { loadMembershipView, money, type MembershipView } from './membership';
import { plainText } from '@/components/user/portal/course/courseModel';
import { ALL_FEATURES, loadCourseFeatures, type CourseFeatures } from '@/lib/lms/courseFeatures';

/**
 * The two kinds of "space" a client can step into from home: a program
 * (a collection of courses, like the Adler program) and a club (a course
 * sold as a membership, one live meeting a month with its recording).
 * Everything opens the existing course page for the actual content.
 */

const TZ = 'Asia/Jerusalem';
const DAY = 24 * 60 * 60 * 1000;
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('he-IL', { timeZone: TZ, ...o }).format(new Date(iso));
const time = (iso: string) => fmt(iso, { hour: '2-digit', minute: '2-digit', hour12: false });
const dayKey = (iso: string | Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(iso));
const whenLabel = (iso: string, now: Date) => {
  if (dayKey(iso) === dayKey(now)) return `${Number(fmt(iso, { hour: 'numeric', hour12: false })) >= 17 ? 'הערב' : 'היום'} · ${time(iso)}`;
  if (dayKey(iso) === dayKey(new Date(now.getTime() + DAY))) return `מחר · ${time(iso)}`;
  return `${fmt(iso, { weekday: 'short' })} ${fmt(iso, { day: 'numeric', month: 'numeric' })} · ${time(iso)}`;
};
const minutes = (l: any) => Number(l.duration) || null;

export type SpaceSession = { lessonId: string; courseId: string; title: string; when: string; sub: string; start: string; end: string; joinUrl: string | null };
/** Something new in a program's course; it opens that course (and lesson) inside the program page. */
export type SpaceNews = { key: string; title: string; sub: string; courseId: string; lessonId: string | null; part: 'lessons' | 'files' };

export type ProgramSpace = {
  programId: string;
  name: string;
  kicker: string;
  lead: string | null;
  /** The program's description (plain text) and picture, from the admin. */
  about: string | null;
  imageUrl: string | null;
  color: string;
  overall: number;
  doneLine: string;
  courses: { id: string; title: string; line: string; pct: number; state: 'done' | 'active' | 'todo'; action: string; required: boolean; n: number; features: CourseFeatures }[];
  next: SpaceSession | null;
  news: SpaceNews[];
  payment: { label: string; sum: string } | null;
};

export type ClubSpace = {
  courseId: string;
  title: string;
  kicker: string;
  tagline: string | null;
  color: string;
  next: SpaceSession | null;
  expert: { name: string; bio: string | null; avatarUrl: string | null } | null;
  recordings: { lessonId: string; title: string; meta: string }[];
  membership: MembershipView | null;
};

function nextSession(learning: Awaited<ReturnType<typeof loadClientLearning>>, courseIds: string[], now: Date): SpaceSession | null {
  let best: any = null;
  let bestCourse = '';
  for (const id of courseIds) {
    for (const l of learning.lessonsByCourse.get(id) ?? []) {
      if (!l.start_time || lessonEnd(l) < now) continue;
      if (!best || new Date(l.start_time) < new Date(best.start_time)) {
        best = l;
        bestCourse = id;
      }
    }
  }
  if (!best) return null;
  const ls = learning.lessonsByCourse.get(bestCourse) ?? [];
  const n = ls.findIndex((x) => x.id === best.id) + 1;
  const instructor = learning.instructorOfCourse.get(bestCourse);
  return {
    lessonId: best.id,
    courseId: bestCourse,
    title: best.title,
    when: whenLabel(best.start_time, now),
    sub: [learning.courseById.get(bestCourse)?.title, n ? `שיעור ${n}` : null, instructor ? `עם ${instructor}` : null, best.zoom_join_url ? 'בזום' : null]
      .filter(Boolean)
      .join(' · '),
    start: new Date(best.start_time).toISOString(),
    end: lessonEnd(best).toISOString(),
    joinUrl: best.zoom_join_url ?? null,
  };
}

/** A program the client is enrolled in, or null if they aren't. */
export async function loadProgramSpace(userId: string, programId: string): Promise<ProgramSpace | null> {
  const learning = await loadClientLearning(userId);
  const enrollment = learning.enrollments.find((e) => e.product.type === 'program' && e.product.program_id === programId);
  if (!enrollment) return null;
  const now = new Date();
  const admin = createAdminClient();
  const program: any = learning.programs.find((p: any) => p.id === programId);
  const pcs = learning.programCourses.filter((pc: any) => pc.program_id === programId).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  const courseIds = pcs.map((pc: any) => pc.course_id as string);
  // Whether each course shows grades / attendance (Course → Settings).
  const features = await loadCourseFeatures(admin, courseIds);

  const courses = pcs.map((pc: any, i: number) => {
    const c = learning.courseById.get(pc.course_id) ?? {};
    const ls = learning.lessonsByCourse.get(pc.course_id) ?? [];
    const done = ls.filter((l) => learning.doneLessons.has(l.id)).length;
    const pct = ls.length ? Math.round((done / ls.length) * 100) : 0;
    const state: 'done' | 'active' | 'todo' = ls.length && done === ls.length ? 'done' : done > 0 ? 'active' : 'todo';
    const upcoming = ls.find((l) => l.start_time && lessonEnd(l) > now);
    const opens = c.start_date && new Date(c.start_date) > now ? `נפתח ב${fmt(c.start_date, { month: 'long' })}` : null;
    const line =
      state === 'done'
        ? `${ls.length} שיעורים · הושלם`
        : state === 'active'
        ? `שיעור ${done + 1} מתוך ${ls.length}${upcoming ? ` · מפגש ${whenLabel(upcoming.start_time, now).split(' · ')[0]}` : ''}`
        : opens ?? (ls.length ? `${ls.length} שיעורים` : 'בקרוב');
    return {
      id: pc.course_id as string,
      title: c.title ?? '',
      line: pc.is_required === false ? `${line} · לא חובה לתעודה` : line,
      pct,
      state,
      action: state === 'done' ? 'לחזרה' : state === 'active' ? 'המשך' : 'לפרטים',
      required: pc.is_required !== false,
      n: i + 1,
      features: features.get(pc.course_id) ?? ALL_FEATURES,
    };
  });
  // Learning hours, as the old programs page showed them.
  let minutesTotal = 0;
  let minutesDone = 0;
  for (const id of courseIds) for (const l of learning.lessonsByCourse.get(id) ?? []) {
    minutesTotal += minutes(l) ?? 0;
    if (learning.doneLessons.has(l.id)) minutesDone += minutes(l) ?? 0;
  }
  const hours = minutesTotal ? ` · ${Math.round(minutesDone / 60)} מתוך ${Math.round(minutesTotal / 60)} שעות` : '';

  const required = courses.filter((c) => c.required);
  const doneCount = required.filter((c) => c.state === 'done').length;
  const overall = required.length ? Math.round(required.reduce((a, c) => a + c.pct, 0) / required.length) : 0;

  // Main instructor: whoever teaches most of the program's courses.
  const counts = new Map<string, number>();
  for (const id of courseIds) {
    const name = learning.instructorOfCourse.get(id);
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const lead = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // What's new: recordings and materials from the last two weeks.
  const news: SpaceNews[] = [];
  for (const id of courseIds) {
    for (const l of learning.lessonsByCourse.get(id) ?? []) {
      if (l.recording_url && l.start_time && now.getTime() - new Date(l.start_time).getTime() < 14 * DAY && new Date(l.start_time) < now) {
        news.push({ key: `r-${l.id}`, title: `הקלטה מוכנה: ${l.title}`, sub: [learning.courseById.get(id)?.title, minutes(l) ? `${minutes(l)} דק׳` : null].filter(Boolean).join(' · '), courseId: id, lessonId: l.id, part: 'lessons' });
      }
    }
  }
  const [{ data: materials }, { data: owed }] = await Promise.all([
    courseIds.length
      ? admin
          .from('course_materials')
          .select('id, course_id, title, created_at')
          .in('course_id', courseIds)
          .eq('is_published', true)
          .gte('created_at', new Date(now.getTime() - 14 * DAY).toISOString())
          .order('created_at', { ascending: false })
          .limit(4)
      : Promise.resolve({ data: [] as any[] }),
    admin
      .from('payment_schedules')
      .select('payment_number, amount, currency, scheduled_date, status, payment_type')
      .eq('enrollment_id', enrollment.id)
      .order('payment_number', { ascending: true }),
  ]);
  for (const m of materials ?? []) {
    news.push({ key: `m-${m.id}`, title: `חומר חדש: ${m.title}`, sub: `${learning.courseById.get(m.course_id)?.title ?? ''} · קבצי הקורס`, courseId: m.course_id, lessonId: null, part: 'files' });
  }

  const schedules = owed ?? [];
  const nextDue = schedules.find((s: any) => ['pending', 'failed', 'overdue', 'adjusted'].includes(s.status));
  const payment = nextDue
    ? {
        label: `${schedules.length > 1 ? `תשלום ${nextDue.payment_number} מתוך ${schedules.length} · ` : ''}${fmt(nextDue.scheduled_date, { day: '2-digit', month: '2-digit' })}`,
        sum: money(Number(nextDue.amount), nextDue.currency || 'USD'),
      }
    : null;

  return {
    programId,
    name: program?.name ?? enrollment.product.title,
    kicker: `תוכנית · ${courses.length} קורסים${hours}`,
    lead,
    about: plainText((program as any)?.description ?? null) || null,
    imageUrl: (program as any)?.image_url ?? null,
    color: learning.colorOf(`program:${programId}`),
    overall,
    doneLine: `${doneCount} מתוך ${required.length} קורסי חובה הושלמו`,
    courses,
    next: nextSession(learning, courseIds, now),
    news: news.slice(0, 4),
    payment,
  };
}

/** A club (membership course) the client belongs to, or null. */
export async function loadClubSpace(userId: string, courseId: string): Promise<ClubSpace | null> {
  const learning = await loadClientLearning(userId);
  const enrollment = learning.enrollments.find((e) => e.product.payment_model === 'subscription' && e.product.course_id === courseId);
  if (!enrollment) return null;
  const now = new Date();
  const course = learning.courseById.get(courseId) ?? {};
  const color = learning.colorOf(`course:${courseId}`);
  const recordings = (learning.lessonsByCourse.get(courseId) ?? [])
    .filter((l) => l.recording_url)
    .sort((a, b) => +new Date(b.start_time ?? 0) - +new Date(a.start_time ?? 0))
    .map((l) => ({
      lessonId: l.id,
      title: l.title,
      meta: [minutes(l) ? `${minutes(l)} דק׳` : null, l.start_time ? fmt(l.start_time, { day: 'numeric', month: 'numeric' }) : null].filter(Boolean).join(' · '),
    }));

  return {
    courseId,
    title: enrollment.product.club_name ?? course.title ?? enrollment.product.title,
    kicker: 'מועדון · מנוי',
    tagline: course.description ? String(course.description).replace(/<[^>]+>/g, '').slice(0, 140) : null,
    color,
    next: nextSession(learning, [courseId], now),
    expert: learning.instructorInfo.get(courseId) ?? null,
    recordings,
    membership: await loadMembershipView(userId, enrollment.id, enrollment.product.club_name ?? course.title ?? enrollment.product.title, color),
  };
}
