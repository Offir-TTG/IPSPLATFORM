import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AlertsList, type AlertItem } from '@/components/user/portal/AlertsList';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // The RPC takes the user id as a parameter; always pass the verified one.
  const { data } = await supabase.rpc('get_user_notifications', {
    p_user_id: user.id,
    p_limit: 100,
    p_offset: 0,
    p_category: null,
    p_priority: null,
    p_unread_only: false,
  });

  const items: AlertItem[] = ((data as any[]) ?? []).map((n) => ({
    id: n.id,
    category: n.category,
    priority: n.priority ?? 'medium',
    actionLabel: n.action_label || null,
    title: n.title,
    message: n.message ?? '',
    href: n.action_url || null,
    createdAt: n.created_at,
    isRead: !!n.is_read,
  }));

  return <AlertsList initial={items} serverNow={Date.now()} />;
}
