import { redirect } from 'next/navigation';

// Courses open from the home page, inside their club or program, or on their own page (/courses/[id]).
export default function Page() {
  redirect('/dashboard');
}
