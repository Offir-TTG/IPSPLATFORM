import { adminCoachingRoute } from '@/lib/family/adminRoute';
import { coachingChoices } from '@/lib/family/adminCoaching';

export const dynamic = 'force-dynamic';

// GET /api/admin/coaching/choices — session-pack products and coaches (with weekly hours)
export const GET = adminCoachingRoute(({ tenantId }) => coachingChoices(tenantId));
