import { redirect } from 'next/navigation';

// Payments now live on one page.
export default function Page() {
  redirect('/billing');
}
