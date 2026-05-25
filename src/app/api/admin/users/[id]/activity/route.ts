import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/users/[id]/activity?limit=50&cursor=<iso>&category=DATA
//
// Paginated chronological audit feed for one user. Backed by audit_events
// with `user_id = X OR student_id = X` so we catch both admin-acting-on-user
// records and student-record events. Cursor is the event_timestamp of the
// last item on the previous page; we return events strictly older than it.
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
    const limitRaw = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Math.min(Math.max(limitRaw, 1), 200);
    const cursor = searchParams.get('cursor');
    const category = searchParams.get('category');

    const adminClient = createAdminClient();

    let query = adminClient
      .from('audit_events')
      .select('*')
      .or(`user_id.eq.${params.id},student_id.eq.${params.id}`)
      .order('event_timestamp', { ascending: false })
      .limit(limit + 1); // fetch one extra to know if there's a next page

    if (cursor) {
      query = query.lt('event_timestamp', cursor);
    }
    if (category) {
      query = query.eq('event_category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('audit_events query failed:', error);
      return NextResponse.json(
        { error: 'Failed to load activity' },
        { status: 500 }
      );
    }

    const rows = data ?? [];
    const hasMore = rows.length > limit;
    const events = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore
      ? events[events.length - 1].event_timestamp
      : null;

    return NextResponse.json({ events, nextCursor });
  } catch (error) {
    console.error(`Error in GET /api/admin/users/${params.id}/activity:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
