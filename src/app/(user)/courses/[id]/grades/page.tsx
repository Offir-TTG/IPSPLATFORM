import { redirect } from 'next/navigation';

/**
 * Per-course grades view was consolidated into the combined /grades
 * page (which now supports a `?course=<id>` filter). Bookmarks land on
 * the combined page with this course pre-selected.
 */
export default function CourseGradesRedirect({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/grades?course=${params.id}`);
}
