import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * What a client is enrolled in and every published lesson behind it, read
 * once on the server for the portal pages (home, calendar).
 *
 * Reads use the admin client scoped to the verified user's own id, the same
 * pattern withAuth uses.
 */

// One calm purple family; each space takes the next shade, in enrollment order.
export const SPACE_COLORS = ['#4f3a9c', '#8a3f86', '#6b4bb5', '#3f4c9a', '#7a4a9a', '#5b3a7e'];

export type LearningGroup = 'adler' | 'clubs' | 'me' | 'lectures' | 'kids';
export type CourseSource = { group: LearningGroup; label: string; color: string };

const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);

export const lessonEnd = (l: { start_time: string; duration?: number | null }) =>
  new Date(new Date(l.start_time).getTime() + (Number(l.duration) || 60) * 60 * 1000);

export async function loadClientLearning(userId: string) {
  const admin = createAdminClient();

  const { data: enrollmentRows } = await admin
    .from('enrollments')
    .select('id, status, is_parent, product:products(id, type, title, payment_model, program_id, course_id)')
    .eq('user_id', userId)
    .in('status', ['active', 'completed']);

  // A "parent" enrollment only records the paying guardian; it is not something they learn.
  const enrollments = (enrollmentRows ?? [])
    .filter((e: any) => !e.is_parent)
    .map((e: any) => ({ id: e.id as string, product: one<any>(e.product) }))
    .filter((e) => e.product);

  const programIds = [...new Set(enrollments.map((e) => e.product.program_id).filter(Boolean))] as string[];
  const directCourseIds = enrollments.map((e) => e.product.course_id).filter(Boolean) as string[];

  const [{ data: programs }, { data: programCourses }] = programIds.length
    ? await Promise.all([
        admin.from('programs').select('id, name').in('id', programIds),
        admin.from('program_courses').select('program_id, course_id, order, is_required').in('program_id', programIds),
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }];

  const courseIds = [...new Set([...directCourseIds, ...(programCourses ?? []).map((pc: any) => pc.course_id as string)])];

  const [{ data: courses }, { data: modules }] = courseIds.length
    ? await Promise.all([
        admin.from('courses').select('id, title, description, course_type, instructor_id, start_date').in('id', courseIds),
        admin.from('modules').select('id, course_id, order').in('course_id', courseIds).eq('is_published', true),
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }];

  const moduleIds = (modules ?? []).map((m: any) => m.id);
  const moduleById = new Map((modules ?? []).map((m: any) => [m.id, m]));
  const { data: lessons } = moduleIds.length
    ? await admin
        .from('lessons')
        .select('id, title, module_id, order, start_time, duration, zoom_join_url, recording_url')
        .in('module_id', moduleIds)
        .eq('is_published', true)
    : { data: [] as any[] };

  const lessonIds = (lessons ?? []).map((l: any) => l.id);
  const { data: progressRows } = lessonIds.length
    ? await admin.from('user_progress').select('lesson_id, status').eq('user_id', userId).in('lesson_id', lessonIds)
    : { data: [] as any[] };
  const doneLessons = new Set<string>((progressRows ?? []).filter((p: any) => p.status === 'completed').map((p: any) => p.lesson_id));

  const courseById = new Map<string, any>((courses ?? []).map((c: any) => [c.id, c]));

  // Instructors: name beside sessions; bio and photo on a club's page.
  const instructorIds = [...new Set((courses ?? []).map((c: any) => c.instructor_id).filter(Boolean))] as string[];
  const { data: instructors } = instructorIds.length
    ? await admin.from('users').select('id, first_name, last_name, bio, avatar_url').in('id', instructorIds)
    : { data: [] as any[] };
  const instructorOfCourse = new Map<string, string>();
  const instructorInfo = new Map<string, { name: string; bio: string | null; avatarUrl: string | null }>();
  for (const c of courses ?? []) {
    const u: any = (instructors ?? []).find((x: any) => x.id === c.instructor_id);
    const name = u ? [u.first_name, u.last_name].filter(Boolean).join(' ') : '';
    if (name) {
      instructorOfCourse.set(c.id, name);
      instructorInfo.set(c.id, { name, bio: u.bio ?? null, avatarUrl: u.avatar_url ?? null });
    }
  }

  // Lessons per course, in module then lesson order.
  const lessonsByCourse = new Map<string, any[]>();
  for (const l of lessons ?? []) {
    const m: any = moduleById.get(l.module_id);
    if (!m) continue;
    const arr = lessonsByCourse.get(m.course_id) ?? [];
    arr.push({ ...l, moduleOrder: m.order ?? 0 });
    lessonsByCourse.set(m.course_id, arr);
  }
  for (const arr of lessonsByCourse.values()) arr.sort((a, b) => a.moduleOrder - b.moduleOrder || (a.order ?? 0) - (b.order ?? 0));

  // Each enrollment's colour and kind; a program's courses share the program's.
  const colorFor = new Map<string, string>();
  const colorOf = (key: string) => {
    if (!colorFor.has(key)) colorFor.set(key, SPACE_COLORS[colorFor.size % SPACE_COLORS.length]);
    return colorFor.get(key)!;
  };
  const sourceOfCourse = new Map<string, CourseSource>();
  for (const e of enrollments) {
    const p = e.product;
    if (p.type === 'program' && p.program_id) {
      const color = colorOf(`program:${p.program_id}`);
      const label = (programs ?? []).find((x: any) => x.id === p.program_id)?.name ?? p.title;
      for (const pc of programCourses ?? []) if (pc.program_id === p.program_id) sourceOfCourse.set(pc.course_id, { group: 'adler', label, color });
    } else if (p.course_id && courseById.has(p.course_id)) {
      const course = courseById.get(p.course_id);
      const color = colorOf(`course:${p.course_id}`);
      const group: LearningGroup =
        p.payment_model === 'subscription' ? 'clubs' : course.course_type === 'lecture' || p.type === 'lecture' ? 'lectures' : 'me';
      if (!sourceOfCourse.has(p.course_id)) sourceOfCourse.set(p.course_id, { group, label: course.title, color });
    }
  }

  return { enrollments, programs: programs ?? [], programCourses: programCourses ?? [], courseIds, courseById, lessonsByCourse, doneLessons, colorOf, sourceOfCourse, instructorOfCourse, instructorInfo };
}
