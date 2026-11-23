import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loadParentCoaching } from '@/lib/portal/parentCoaching';
import { ParentCoachingView } from '@/components/user/portal/ParentCoachingView';

export const dynamic = 'force-dynamic';

/** The client's own coaching (parent coaching). Only the client who enrolled can open it. */
export default async function CoachingPage({ params, searchParams }: { params: { id: string }; searchParams: { tab?: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const packs = await loadParentCoaching(user.id);
  const pack = packs.find((p) => p.id === params.id);
  if (!pack) notFound();
  const tab = (['overview', 'sessions', 'package', 'intake'] as const).find((t) => t === searchParams?.tab) ?? 'overview';
  return <ParentCoachingView pack={pack} initialTab={tab} />;
}
