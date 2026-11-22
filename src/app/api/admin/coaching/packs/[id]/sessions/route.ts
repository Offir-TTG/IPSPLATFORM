import { adminCoachingRoute } from '@/lib/family/adminRoute';
import { staffPlaceSession } from '@/lib/family/adminCoaching';

export const dynamic = 'force-dynamic';

// POST /api/admin/coaching/packs/[id]/sessions  {starts_at} — book on the parent's behalf
export const POST = adminCoachingRoute<{ id: string }>(({ tenantId, adminId, params, body }) =>
  staffPlaceSession(tenantId, adminId, { enrollment_id: params.id, starts_at: body.starts_at }),
);
