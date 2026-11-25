import { adminCoachingRoute as adminRoute } from '@/lib/family/adminRoute';
import { sendTest } from '@/lib/messaging/admin';

export const dynamic = 'force-dynamic';

// POST { event_key, steps } — sends the steps to the signed-in admin, with sample details
export const POST = adminRoute(({ tenantId, adminId, body }) => sendTest(tenantId, adminId, body?.event_key, Array.isArray(body?.steps) ? body.steps : []));
