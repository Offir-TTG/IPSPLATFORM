import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** Access is now a tab in the user drawer on the Users list. */
export default function UserAccessRedirect({ params }: { params: { id: string } }) {
  redirect(`/admin/settings/users?user=${encodeURIComponent(params.id)}&tab=access`);
}
