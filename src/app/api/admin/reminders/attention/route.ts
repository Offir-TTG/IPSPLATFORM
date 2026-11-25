import { adminCoachingRoute as adminRoute } from '@/lib/family/adminRoute';
import { needsAttention } from '@/lib/messaging/admin';

export const dynamic = 'force-dynamic';

// GET — clients stuck in the middle: a payment that failed, an enrollment or contract not finished, an email that doesn't arrive
export const GET = adminRoute(({ tenantId }) => needsAttention(tenantId));
