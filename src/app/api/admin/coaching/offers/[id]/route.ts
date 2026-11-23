import { adminCoachingRoute } from '@/lib/family/adminRoute';
import { cancelOffer } from '@/lib/family/coachingPackages';

export const dynamic = 'force-dynamic';

// DELETE /api/admin/coaching/offers/[id]: cancel an offer still waiting for the client.
export const DELETE = adminCoachingRoute<{ id: string }>(({ tenantId, adminId, params }) => cancelOffer(tenantId, adminId, params.id));
