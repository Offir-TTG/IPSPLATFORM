import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/users/[id]/notifications?page=1&per_page=20
// Paginated notifications targeted at this user (scope='individual')
// with their read state from notification_reads. Tenant-scoped
// broadcasts are excluded — this view is about messages this person
// specifically received.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: callerRow } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!callerRow || !['admin', 'super_admin'].includes(callerRow.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '20', 10)));
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const adminClient = createAdminClient();

    const { data, error, count } = await adminClient
      .from('notifications')
      .select('id, title, message, category, priority, action_url, created_at', { count: 'exact' })
      .eq('target_user_id', params.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('notifications query failed:', error);
      return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
    }

    const notifIds = (data ?? []).map((n: any) => n.id);
    let readMap = new Map<string, string>();
    if (notifIds.length > 0) {
      const { data: reads } = await adminClient
        .from('notification_reads')
        .select('notification_id, read_at')
        .eq('user_id', params.id)
        .in('notification_id', notifIds);
      readMap = new Map((reads ?? []).map((r: any) => [r.notification_id, r.read_at]));
    }

    const enriched = (data ?? []).map((n: any) => ({
      ...n,
      read_at: readMap.get(n.id) ?? null,
    }));

    return NextResponse.json({
      notifications: enriched,
      total: count ?? 0,
      page,
      per_page: perPage,
    });
  } catch (error) {
    console.error(`Error in GET /api/admin/users/${params.id}/notifications:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
