import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loadProgramSpace } from '@/lib/portal/spaces';
import { ProgramSpaceView } from '@/components/user/portal/ProgramSpaceView';

export const dynamic = 'force-dynamic';

export default async function ProgramSpacePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const space = await loadProgramSpace(user.id, params.id);
  if (!space) notFound();
  return <ProgramSpaceView space={space} />;
}
