import { adminCoachingRoute } from '@/lib/family/adminRoute';
import { packageIntake } from '@/lib/family/coachingPackages';

export const dynamic = 'force-dynamic';

// GET /api/admin/coaching/packages/[id]/intake: the client's intake answers.
export const GET = adminCoachingRoute<{ id: string }>(({ tenantId, params }) => packageIntake(tenantId, params.id));
