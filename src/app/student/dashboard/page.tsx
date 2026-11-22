import { redirect } from 'next/navigation';

// Old student pages now live in the client portal.
export default function Page() {
  redirect('/dashboard');
}
