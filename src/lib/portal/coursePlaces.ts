import 'server-only';
import { loadClientLearning, SPACE_COLORS } from './clientLearning';

/**
 * Where a course sits for this client: the club it is (a membership's
 * course), and the programs it belongs to with its place in each. The
 * course page uses it for its header colour, the back link and, inside a
 * program, the previous and next course. Colours match home's.
 */

export type CourseClubPlace = { title: string; href: string; color: string };
export type CourseProgramPlace = {
  programId: string;
  title: string;
  href: string;
  color: string;
  index: number;
  total: number;
  required: boolean;
  prev: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
};
export type CoursePlaces = { club: CourseClubPlace | null; programs: CourseProgramPlace[]; color: string };

export async function loadCoursePlaces(userId: string, courseId: string): Promise<CoursePlaces> {
  const learning = await loadClientLearning(userId);
  const own = learning.sourceOfCourse.get(courseId);
  const course = learning.courseById.get(courseId);

  // Enrolled in the course itself: it opens as its own page, even if a club or program uses it too.
  const direct = learning.enrollments.some((e) => e.product.course_id === courseId && e.product.payment_model !== 'subscription' && !e.product.from_bundle && e.product.type !== 'program');
  if (direct) return { club: null, programs: [], color: own?.color ?? SPACE_COLORS[0] };

  const clubEnrollment = learning.enrollments.find((e) => e.product.payment_model === 'subscription' && e.product.course_id === courseId);
  const club: CourseClubPlace | null = clubEnrollment
    ? { title: clubEnrollment.product.club_name ?? course?.title ?? clubEnrollment.product.title, href: `/clubs/${courseId}`, color: learning.colorOf(`course:${courseId}`) }
    : null;

  const programIds = [
    ...new Set(
      learning.enrollments
        .filter((e) => e.product.type === 'program' && e.product.program_id)
        .map((e) => e.product.program_id as string),
    ),
  ];
  const programs: CourseProgramPlace[] = [];
  for (const programId of programIds) {
    const rows = learning.programCourses
      .filter((pc: any) => pc.program_id === programId)
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
    const i = rows.findIndex((pc: any) => pc.course_id === courseId);
    if (i < 0) continue;
    const titleOf = (id: string) => learning.courseById.get(id)?.title ?? '';
    const program = learning.programs.find((p: any) => p.id === programId);
    programs.push({
      programId,
      title: program?.name ?? '',
      href: `/programs/${programId}`,
      color: learning.colorOf(`program:${programId}`),
      index: i + 1,
      total: rows.length,
      required: rows[i].is_required !== false,
      prev: i > 0 ? { id: rows[i - 1].course_id, title: titleOf(rows[i - 1].course_id) } : null,
      next: i < rows.length - 1 ? { id: rows[i + 1].course_id, title: titleOf(rows[i + 1].course_id) } : null,
    });
  }

  return { club, programs, color: own?.color ?? club?.color ?? programs[0]?.color ?? SPACE_COLORS[0] };
}
