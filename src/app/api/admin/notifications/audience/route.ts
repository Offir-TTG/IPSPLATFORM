import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { countAudience } from '@/lib/notifications/audience';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/admin/notifications/audience?scope=course|program&ids=a,b
 *
 * How many people a course or program notification would reach, so the
 * New notification page can warn before sending to nobody. Counts people
 * with an active enrollment, the same rule the portal uses to show
 * notifications (get_user_notifications):
 *   program: a product linked to the program
 *   course:  a product linked to the course, or to a program containing it
 *            (through courses.program_id or program_courses)
 * Read-only. Returns { counts: { [id]: number }, total: number } where
 * total counts each person once.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase.from('users').select('role, tenant_id').eq('id', user.id).single();
  if (!me || !['admin', 'super_admin'].includes(me.role)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const scope = request.nextUrl.searchParams.get('scope');
  const ids = (request.nextUrl.searchParams.get('ids') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => UUID_RE.test(s))
    .slice(0, 200);
  if ((scope !== 'course' && scope !== 'program') || ids.length === 0) {
    return NextResponse.json({ counts: {}, total: 0 });
  }

  const db = createAdminClient();
  try {
    return NextResponse.json(await countAudience(db, me.tenant_id, scope, ids));
  } catch (error) {
    console.error('[admin/notifications/audience] count failed:', error);
    return NextResponse.json({ error: 'Could not count the audience' }, { status: 500 });
  }
}
