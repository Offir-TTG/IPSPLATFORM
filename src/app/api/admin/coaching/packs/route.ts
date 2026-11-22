import { adminCoachingRoute } from '@/lib/family/adminRoute';
import { listCoachingPacks } from '@/lib/family/adminCoaching';

export const dynamic = 'force-dynamic';

// GET /api/admin/coaching/packs — children in coaching.
// Opening a pack uses POST /api/admin/enrollments with coach_id, child or
// child_id, and coaching_request_id; then the usual send-link.
export const GET = adminCoachingRoute(({ tenantId }) => listCoachingPacks(tenantId));
