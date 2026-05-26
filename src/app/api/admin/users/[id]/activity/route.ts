import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/users/[id]/activity?page=1&per_page=20&category=DATA
//
// Paginated chronological audit feed for one user. Backed by audit_events
// with `user_id = X OR student_id = X` so we catch both admin-acting-on-user
// records and student-record events. Returns the page slice plus the total
// matching count so the consumer can render platform-standard pagination.
// Uses the service-role client to bypass per-row RLS — the admin gate is
// enforced at the top of the handler.
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
    const category = searchParams.get('category');

    const adminClient = createAdminClient();

    let query = adminClient
      .from('audit_events')
      .select('*', { count: 'exact' })
      .or(`user_id.eq.${params.id},student_id.eq.${params.id}`)
      .order('event_timestamp', { ascending: false })
      .range(from, to);

    if (category) {
      query = query.eq('event_category', category);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('audit_events query failed:', error);
      return NextResponse.json({ error: 'Failed to load activity' }, { status: 500 });
    }

    return NextResponse.json({
      events: data ?? [],
      total: count ?? 0,
      page,
      per_page: perPage,
    });
  } catch (error) {
    console.error(`Error in GET /api/admin/users/${params.id}/activity:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
