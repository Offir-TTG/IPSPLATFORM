import { adminCoachingRoute } from '@/lib/family/adminRoute';
import { getCoachingPackForAdmin, setPackCoach } from '@/lib/family/adminCoaching';

export const dynamic = 'force-dynamic';

// GET /api/admin/coaching/packs/[id] — one child's coaching (sessions, intake, payments)
export const GET = adminCoachingRoute<{ id: string }>(({ tenantId, params }) => getCoachingPackForAdmin(tenantId, params.id));

// PATCH /api/admin/coaching/packs/[id]  {coach_id}
export const PATCH = adminCoachingRoute<{ id: string }>(({ tenantId, params, body }) => setPackCoach(tenantId, params.id, body.coach_id));
