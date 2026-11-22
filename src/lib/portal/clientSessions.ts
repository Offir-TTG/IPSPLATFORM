import 'server-only';
import { lessonEnd, loadClientLearning, type LearningGroup } from './clientLearning';
import { loadFamilySessions } from './family';

export type ClientSession = {
  lessonId: string;
  courseId: string;
  /** Where the session opens: the course page, or the child's coaching page. */
  href: string;
  title: string;
  source: string;
  group: LearningGroup;
  color: string;
  instructor: string | null;
  start: string;
  end: string;
  joinUrl: string | null;
};

/** Every dated lesson the client can enter, and their children's coaching sessions, between two moments, earliest first. */
export async function loadClientSessions(userId: string, from: Date, to: Date): Promise<ClientSession[]> {
  const [learning, family] = await Promise.all([loadClientLearning(userId), loadFamilySessions(userId, from, to)]);
  const { lessonsByCourse, courseById, sourceOfCourse, instructorOfCourse } = learning;
  const out: ClientSession[] = family.map(({ child, coaching, session }) => ({
    lessonId: session.id,
    courseId: '',
    href: `/children/${child.id}?pack=${coaching.enrollmentId}`,
    title: `${child.firstName} · ${coaching.title}, ${session.title}`,
    source: `${child.firstName} · ${coaching.title}`,
    group: 'kids',
    color: child.color,
    instructor: coaching.coach?.name ?? null,
    start: session.start,
    end: session.end,
    joinUrl: session.joinUrl,
  }));
  for (const [courseId, lessons] of lessonsByCourse) {
    const src = sourceOfCourse.get(courseId);
    for (const l of lessons) {
      if (!l.start_time) continue;
      const start = new Date(l.start_time);
      const end = lessonEnd(l);
      if (end < from || start > to) continue;
      out.push({
        lessonId: l.id,
        courseId,
        href: `/courses/${courseId}`,
        title: l.title,
        source: src?.label ?? courseById.get(courseId)?.title ?? '',
        group: src?.group ?? 'me',
        color: src?.color ?? '#5b3a7e',
        instructor: instructorOfCourse.get(courseId) ?? null,
        start: start.toISOString(),
        end: end.toISOString(),
        joinUrl: l.zoom_join_url ?? null,
      });
    }
  }
  return out.sort((a, b) => +new Date(a.start) - +new Date(b.start));
}
