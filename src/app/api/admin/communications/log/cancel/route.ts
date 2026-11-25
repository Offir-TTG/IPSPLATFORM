import { adminCoachingRoute as adminRoute } from '@/lib/family/adminRoute';
import { cancelQueued } from '@/lib/messaging/comms';

export const dynamic = 'force-dynamic';

// POST { ids: [queue ids] } — cancel emails that are still waiting (one or several)
export const POST = adminRoute(({ tenantId, body }) => cancelQueued(tenantId, body?.ids));
