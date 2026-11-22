import { redirect } from 'next/navigation';
import { isUserTab } from '@/components/admin/users/userTabs';

export const dynamic = 'force-dynamic';

/**
 * The separate user page is gone: everything is in the drawer on the Users
 * list. Old links (and bookmarks) land on the list with that user's drawer
 * open on the same tab.
 */
export default function UserPageRedirect({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tab?: string | string[] };
}) {
  const raw = Array.isArray(searchParams.tab) ? searchParams.tab[0] : searchParams.tab;
  const qs = new URLSearchParams({ user: params.id });
  if (isUserTab(raw) && raw !== 'overview') qs.set('tab', raw);
  redirect(`/admin/settings/users?${qs.toString()}`);
}
