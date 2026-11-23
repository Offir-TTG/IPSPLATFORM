import { redirect } from 'next/navigation';

/**
 * Grades live inside each course (a tab of the course, club or program page).
 * Old links (?course=<id>) open that course on its grades tab; without one, home.
 */
export default function Page({ searchParams }: { searchParams: { course?: string } }) {
  redirect(searchParams.course ? `/courses/${searchParams.course}?part=grades` : '/dashboard');
}
