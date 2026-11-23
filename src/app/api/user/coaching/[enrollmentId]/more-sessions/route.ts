import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
const ROLES = ['student', 'instructor', 'admin', 'super_admin'] as const;
type Ctx = { params: Promise<{ enrollmentId: string }> | { enrollmentId: string } };

/**
 * POST /api/user/coaching/[enrollmentId]/more-sessions  { sessions?, note? }
 * The client asks for more sessions on their package. It reaches the team's
 * coaching requests; the team answers with an offer to approve here.
 */
export const POST = withAuth(
  async (request: NextRequest, user: any, context: Ctx) => {
    const { enrollmentId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const sessions = body?.sessions == null || body.sessions === '' ? null : Number(body.sessions);
    if (sessions !== null && (!Number.isInteger(sessions) || sessions < 1 || sessions > 100)) {
      return NextResponse.json({ error: 'מספר המפגשים צריך להיות בין 1 ל-100' }, { status: 400 });
    }
    const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 1000) || null : null;
    const db = createAdminClient();
    const { data: e } = await db.from('enrollments').select('id, user_id, tenant_id, child_id, status').eq('id', enrollmentId).maybeSingle();
    if (!e || e.user_id !== user.id) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 });
    if (!['active', 'suspended', 'completed'].includes(e.status)) return NextResponse.json({ error: 'אפשר לבקש מפגשים אחרי שההרשמה הושלמה' }, { status: 409 });
    const { data: open } = await db.from('coaching_requests').select('id').eq('enrollment_id', e.id).in('status', ['new', 'in_progress']).limit(1);
    if ((open ?? []).length) return NextResponse.json({ error: 'כבר נשלחה בקשה. הצוות יחזור אליך.' }, { status: 409 });
    const { error } = await db.from('coaching_requests').insert({
      tenant_id: e.tenant_id,
      parent_user_id: user.id,
      child_id: e.child_id ?? null,
      kind: 'more_sessions',
      enrollment_id: e.id,
      sessions_requested: sessions,
      note,
    });
    if (error) return NextResponse.json({ error: 'הבקשה לא נשלחה. נסו שוב מאוחר יותר.' }, { status: 500 });
    return NextResponse.json({ ok: true });
  },
  [...ROLES]
);
