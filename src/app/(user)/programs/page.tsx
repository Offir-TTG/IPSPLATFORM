import { redirect } from 'next/navigation';

// Programs now open from the home page, each in its own space (/programs/[id]).
export default function Page() {
  redirect('/dashboard');
}
