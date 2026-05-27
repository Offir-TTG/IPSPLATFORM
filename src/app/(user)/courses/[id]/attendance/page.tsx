import { redirect } from 'next/navigation';

/**
 * Per-course attendance view was consolidated into the combined
 * /attendance page (which now supports a `?course=<id>` filter).
 * Bookmarks land on the combined page with this course pre-selected.
 */
export default function CourseAttendanceRedirect({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/attendance?course=${params.id}`);
}
