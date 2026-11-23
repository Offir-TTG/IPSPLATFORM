import { adminCoachingRoute } from '@/lib/family/adminRoute';
import { createOffer } from '@/lib/family/coachingPackages';

export const dynamic = 'force-dynamic';

// POST /api/admin/coaching/packages/[id]/offers  {sessions, session_amount, is_gift, message, request_id?}
// Offers more sessions for the client to approve (a gift is added at once).
export const POST = adminCoachingRoute<{ id: string }>(({ tenantId, adminId, params, body }) => createOffer(tenantId, adminId, params.id, body));
