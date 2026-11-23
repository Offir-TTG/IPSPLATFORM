import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loadClubSpace } from '@/lib/portal/spaces';
import { loadClientLearning } from '@/lib/portal/clientLearning';
import { loadClubOffer } from '@/lib/portal/clubOffers';
import { ClubSpaceView } from '@/components/user/portal/ClubSpaceView';
import { ClubJoinView } from '@/components/user/portal/ClubJoinView';

export const dynamic = 'force-dynamic';

/** A club's own space. The id is the club's course id. Not a member yet: join it here. */
export default async function ClubSpacePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const space = await loadClubSpace(user.id, params.id);
  if (space) return <ClubSpaceView space={space} serverNow={Date.now()} />;

  const { courseIds } = await loadClientLearning(user.id);
  const offer = await loadClubOffer(user.id, params.id, courseIds);
  if (!offer) notFound();
  return <ClubJoinView offer={offer} />;
}
