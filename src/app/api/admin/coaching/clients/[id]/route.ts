import { adminCoachingRoute } from '@/lib/family/adminRoute';
import { clientCoaching } from '@/lib/family/coachingPackages';

export const dynamic = 'force-dynamic';

// GET /api/admin/coaching/clients/[id]: the client's children and the coaching they already have.
export const GET = adminCoachingRoute<{ id: string }>(({ tenantId, params }) => clientCoaching(tenantId, params.id));
