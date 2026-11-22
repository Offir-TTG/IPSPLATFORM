import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loadFamily } from '@/lib/portal/family';
import { ChildSpaceView } from '@/components/user/portal/ChildSpaceView';
import { ChildStartView } from '@/components/user/portal/ChildStartView';

export const dynamic = 'force-dynamic';

/** A child's coaching. Only the parent who owns the child can open it. */
export default async function ChildPage({ params, searchParams }: { params: { id: string }; searchParams: { pack?: string; enrollment?: string; enroll?: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const kids = await loadFamily(user.id);
  const child = kids.find((k) => k.id === params.id);
  if (!child) notFound();
  // No coaching yet: the child's page offers the request, or shows its status.
  if (!child.coaching.length) return <ChildStartView child={child} />;

  // The current pack: the one asked for, else one waiting for the parent to enroll,
  // else the one with a session coming, else the newest.
  const coaching =
    child.coaching.find((c) => c.enrollmentId === searchParams?.pack) ??
    child.coaching.find((c) => c.awaitingEnrollment) ??
    child.coaching.find((c) => c.next) ??
    child.coaching[child.coaching.length - 1];

  return <ChildSpaceView child={child} coaching={coaching} serverNow={Date.now()} justEnrolled={searchParams?.enrollment === 'complete'} continueEnroll={searchParams?.enroll === 'continue'} />;
}
