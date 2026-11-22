import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { readCounts, recipientTotals, sendKey } from '@/lib/notifications/audience';

export const dynamic = 'force-dynamic';

/** How many rows are read to build the newest sends (one send can be many rows). */
const ROW_WINDOW = 2000;

type Row = {
  id: string;
  scope: string;
  created_at: string;
  title: string;
  message: string;
  priority?: string | null;
  category?: string | null;
  action_url?: string | null;
  display_style?: string | null;
  target_user_id?: string | null;
  target_course_id?: string | null;
  target_program_id?: string | null;
  [key: string]: unknown;
};

/**
 * GET /api/admin/notifications?limit=50&offset=0
 *
 * The tenant's sent notifications, newest first, one item per SEND:
 * choosing several students (or courses, or programs) saves one row each,
 * and they come back here as one item. Each item is its first row plus:
 *   read_count        people who read it
 *   total_recipients  people it was sent to (active enrollments for a
 *                     course or program, the rule the portal uses)
 *   recipient_details the person, course or program name (names joined
 *                     when several, so search finds them)
 *   group_size        how many rows the send saved (1 for a normal send)
 *   recipients        when group_size > 1: each person / course / program
 *                     with its own read numbers
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData, error: userError } = await supabase.from('users').select('role, tenant_id').eq('id', user.id).single();
    if (userError || !userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50') || 50, 1), 500);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0);

    const { data: rowData, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('created_at', { ascending: false })
      .range(0, ROW_WINDOW - 1);
    if (notificationsError) {
      console.error('[Admin Notifications API] Error fetching notifications:', notificationsError);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Rows → sends, newest first.
    const groups: Row[][] = [];
    const byKey = new Map<string, Row[]>();
    for (const row of (rowData ?? []) as Row[]) {
      const key = sendKey(row);
      let g = byKey.get(key);
      if (!g) {
        g = [];
        byKey.set(key, g);
        groups.push(g);
      }
      g.push(row);
    }
    const page = groups.slice(offset, offset + limit);
    const rows = page.flat();

    const db = createAdminClient();
    const ids = rows.map((r) => r.id);
    const userIds = [...new Set(rows.map((r) => r.target_user_id).filter((v): v is string => !!v))];
    const courseIds = [...new Set(rows.map((r) => r.target_course_id).filter((v): v is string => !!v))];
    const programIds = [...new Set(rows.map((r) => r.target_program_id).filter((v): v is string => !!v))];

    const inChunks = async <T,>(values: string[], load: (chunk: string[]) => PromiseLike<{ data: T[] | null }>) => {
      const out: T[] = [];
      for (let i = 0; i < values.length; i += 200) out.push(...((await load(values.slice(i, i + 200))).data ?? []));
      return out;
    };

    const [reads, audience, users, courses, programs] = await Promise.all([
      readCounts(db, ids).catch((error) => {
        console.error('[Admin Notifications API] Could not count reads:', error);
        return new Map<string, number>();
      }),
      recipientTotals(db, userData.tenant_id, rows).catch((error) => {
        console.error('[Admin Notifications API] Could not count audiences:', error);
        return new Map<string, number>();
      }),
      inChunks<{ id: string; first_name: string | null; last_name: string | null; email: string | null }>(userIds, (c) =>
        db.from('users').select('id, first_name, last_name, email').in('id', c),
      ),
      inChunks<{ id: string; title: string | null }>(courseIds, (c) => db.from('courses').select('id, title').in('id', c)),
      inChunks<{ id: string; title: string | null }>(programIds, (c) => db.from('programs').select('id, title').in('id', c)),
    ]);

    const userName = new Map(users.map((u) => [u.id, `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'User']));
    const courseName = new Map(courses.map((c) => [c.id, c.title || '']));
    const programName = new Map(programs.map((p) => [p.id, p.title || '']));

    const one = (r: Row) => {
      const readCount = reads.get(r.id) ?? 0;
      let total = 0;
      let name = '';
      if (r.scope === 'individual') {
        total = 1;
        name = r.target_user_id ? (userName.get(r.target_user_id) ?? 'User') : 'Unknown User';
      } else if (r.scope === 'course') {
        // Enrolled people now, and never fewer than those who read it (someone may have left since).
        total = Math.max(audience.get(r.id) ?? 0, readCount, 1);
        name = r.target_course_id ? (courseName.get(r.target_course_id) ?? '') : '';
      } else if (r.scope === 'program') {
        total = Math.max(audience.get(r.id) ?? 0, readCount, 1);
        name = r.target_program_id ? (programName.get(r.target_program_id) ?? '') : '';
      } else if (r.scope === 'tenant') {
        total = audience.get(r.id) ?? 0;
        name = 'All Users';
      }
      return { id: r.id, name, read_count: readCount, total };
    };

    const notifications = page.map((g) => {
      const parts = g.map(one);
      return {
        ...g[0],
        read_count: parts.reduce((s, p) => s + p.read_count, 0),
        total_recipients: parts.reduce((s, p) => s + p.total, 0),
        recipient_details: parts.map((p) => p.name).filter(Boolean).join(', '),
        group_size: g.length,
        ...(g.length > 1 ? { recipients: parts } : {}),
      };
    });

    return NextResponse.json({ notifications, total: notifications.length });
  } catch (error) {
    console.error('[Admin Notifications API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
