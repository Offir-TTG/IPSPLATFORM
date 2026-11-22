import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * No front page here: the marketing site is IParentingSchool. Signed-in
 * clients go to their portal (staff are sent on to the admin from there);
 * everyone else gets the login page.
 */
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  redirect(user ? '/dashboard' : '/login');
}
