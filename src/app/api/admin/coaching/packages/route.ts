import { adminCoachingRoute } from '@/lib/family/adminRoute';
import { listPackages } from '@/lib/family/coachingPackages';

export const dynamic = 'force-dynamic';

// GET /api/admin/coaching/packages: every coaching package (parent and child) with the counts on top.
export const GET = adminCoachingRoute(({ tenantId }) => listPackages(tenantId));
