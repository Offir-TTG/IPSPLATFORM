import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loadClubSpace } from '@/lib/portal/spaces';
import { ClubSpaceView } from '@/components/user/portal/ClubSpaceView';

export const dynamic = 'force-dynamic';

/** A club's own space. The id is the club's course id. */
export default async function ClubSpacePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const space = await loadClubSpace(user.id, params.id);
  if (!space) notFound();
  return <ClubSpaceView space={space} serverNow={Date.now()} />;
}
