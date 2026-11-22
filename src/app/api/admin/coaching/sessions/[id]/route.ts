import { createAdminClient } from '@/lib/supabase/server';
import { adminCoachingRoute } from '@/lib/family/adminRoute';
import { markSession, staffCancelSession, staffPlaceSession } from '@/lib/family/adminCoaching';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/coaching/sessions/[id]
//   {action:'done'|'no_show'}              took place / didn't come
//   {action:'move', starts_at}             move (no 24h rule for staff)
export const PATCH = adminCoachingRoute<{ id: string }>(async ({ tenantId, adminId, params, body }) => {
  if (body.action === 'done' || body.action === 'no_show') return markSession(tenantId, params.id, body.action);
  if (body.action === 'move') {
    const { data: s } = await createAdminClient().from('coaching_sessions').select('enrollment_id').eq('id', params.id).eq('tenant_id', tenantId).maybeSingle();
    if (!s) return { ok: false, status: 404, error: 'Session not found' };
    return staffPlaceSession(tenantId, adminId, { enrollment_id: s.enrollment_id, starts_at: body.starts_at, session_id: params.id });
  }
  return { ok: false, status: 400, error: 'Unknown action' };
});

// DELETE /api/admin/coaching/sessions/[id]?counted=1 — cancel (counted = uses up a session)
export const DELETE = adminCoachingRoute<{ id: string }>(({ request, tenantId, adminId, params }) =>
  staffCancelSession(tenantId, adminId, params.id, request.nextUrl.searchParams.get('counted') === '1'),
);
