import { adminCoachingRoute as adminRoute } from '@/lib/family/adminRoute';
import { stopForClient } from '@/lib/messaging/admin';

export const dynamic = 'force-dynamic';

// POST — stop the reminder for this one client
export const POST = adminRoute<{ id: string }>(({ tenantId, params }) => stopForClient(tenantId, params.id));
